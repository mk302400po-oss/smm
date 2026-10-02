import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Firebase Admin SDK V1 credentials from environment
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')!
const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')!
const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')!

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface NotificationRequest {
    type: 'admin' | 'user'
    user_id?: string
    event: string
    title: string
    body: string
    data?: Record<string, any>
}

// Get OAuth2 access token for Firebase
async function getAccessToken(): Promise<string> {
    const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))

    const now = Math.floor(Date.now() / 1000)
    const jwtClaimSet = btoa(JSON.stringify({
        iss: FIREBASE_CLIENT_EMAIL,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
    }))

    const signatureInput = `${jwtHeader}.${jwtClaimSet}`

    // Import private key
    const privateKeyPem = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    const pemContents = privateKeyPem
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '')

    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

    const key = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        key,
        new TextEncoder().encode(signatureInput)
    )

    const jwtSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    const jwt = `${jwtHeader}.${jwtClaimSet}.${jwtSignature}`

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    })

    const tokenData = await tokenResponse.json()
    return tokenData.access_token
}

// Send notification using FCM V1 API
async function sendNotification(token: string, title: string, body: string, data: Record<string, any>) {
    const accessToken = await getAccessToken()

    const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: {
                    token,
                    notification: { title, body },
                    data,
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            channel_id: 'default',
                        },
                    },
                },
            }),
        }
    )

    return response.ok
}

serve(async (req: Request) => {
    try {
        const payload: NotificationRequest = await req.json()
        const { type, user_id, event, title, body, data } = payload

        console.log('Notification request:', { type, event, user_id })

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        // Get FCM tokens
        let tokens: string[] = []

        if (type === 'admin') {
            const { data: admins, error: adminsError } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'admin')

            if (adminsError) {
                throw new Error(`Failed to get admins: ${adminsError.message}`)
            }

            if (admins && admins.length > 0) {
                const adminIds = admins.map((a: any) => a.id)
                const { data: fcmTokens, error: tokensError } = await supabase
                    .from('fcm_tokens')
                    .select('token')
                    .in('user_id', adminIds)

                if (tokensError) {
                    throw new Error(`Failed to get admin tokens: ${tokensError.message}`)
                }

                tokens = fcmTokens?.map((t: any) => t.token) || []
            }
        } else if (type === 'user' && user_id) {
            const { data: fcmTokens, error: tokensError } = await supabase
                .from('fcm_tokens')
                .select('token')
                .eq('user_id', user_id)

            if (tokensError) {
                throw new Error(`Failed to get user tokens: ${tokensError.message}`)
            }

            tokens = fcmTokens?.map((t: any) => t.token) || []
        }

        console.log(`Found ${tokens.length} tokens to send to`)

        if (tokens.length === 0) {
            return new Response(
                JSON.stringify({ success: true, sent: 0, message: 'No tokens found' }),
                { headers: { 'Content-Type': 'application/json' } }
            )
        }

        // Send notifications
        const results = await Promise.allSettled(
            tokens.map((token) => sendNotification(token, title, body, data || {}))
        )

        const successes = results.filter((r) => r.status === 'fulfilled' && r.value).length
        const failures = results.filter((r) => r.status === 'rejected' || !r.value).length

        console.log(`Sent ${successes} notifications, ${failures} failed`)

        return new Response(
            JSON.stringify({
                success: true,
                sent: successes,
                failed: failures,
                total: tokens.length,
            }),
            { headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('Notification error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})
