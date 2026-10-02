import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Read service account from file
const serviceAccount = JSON.parse(
    await Deno.readTextFile('./service-account.json')
)

// Function to get OAuth2 access token
async function getAccessToken(): Promise<string> {
    const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))

    const now = Math.floor(Date.now() / 1000)
    const jwtClaimSet = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    }
    const jwtClaimSetEncoded = btoa(JSON.stringify(jwtClaimSet))

    const signatureInput = `${jwtHeader}.${jwtClaimSetEncoded}`

    // Import private key
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        Uint8Array.from(atob(serviceAccount.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '')), c => c.charCodeAt(0)),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    )

    // Sign JWT
    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(signatureInput)
    )

    const jwtSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

    const jwt = `${jwtHeader}.${jwtClaimSetEncoded}.${jwtSignature}`

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    })

    const tokenData = await tokenResponse.json()
    return tokenData.access_token
}

serve(async (req) => {
    try {
        const { title, body, type, reference_id } = await req.json()

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Get all admin FCM tokens
        const { data: admins } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin')

        if (!admins || admins.length === 0) {
            return new Response(JSON.stringify({ error: 'No admins found' }), { status: 404 })
        }

        // Get FCM tokens for all admins
        const adminIds = admins.map(a => a.id)
        const { data: tokens } = await supabase
            .from('fcm_tokens')
            .select('token')
            .in('user_id', adminIds)

        if (!tokens || tokens.length === 0) {
            return new Response(JSON.stringify({ message: 'No FCM tokens found' }), { status: 200 })
        }

        // Get OAuth2 access token
        const accessToken = await getAccessToken()

        // Send FCM notification to each admin using HTTP v1 API
        const results = await Promise.all(
            tokens.map(async ({ token }) => {
                const response = await fetch(
                    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({
                            message: {
                                token,
                                notification: {
                                    title,
                                    body,
                                },
                                data: {
                                    type,
                                    reference_id,
                                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                },
                                android: {
                                    priority: 'high',
                                    notification: {
                                        sound: 'default',
                                        channel_id: 'admin_notifications',
                                    },
                                },
                                apns: {
                                    payload: {
                                        aps: {
                                            sound: 'default',
                                            badge: 1,
                                        },
                                    },
                                },
                            },
                        }),
                    }
                )

                return response.json()
            })
        )

        return new Response(
            JSON.stringify({ success: true, sent_count: results.length, results }),
            { headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('FCM Error:', error)
        return new Response(
            JSON.stringify({ error: error.message, stack: error.stack }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})
