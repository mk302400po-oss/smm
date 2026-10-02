import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FIREBASE_PROJECT_ID = "smm-panel-app-bf044"

serve(async (req) => {
    try {
        const { notification_id, user_id, title, message } = await req.json()

        console.log('Received request:', { notification_id, user_id, title, message })

        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('Fetching FCM token for user:', user_id)

        // Get user's FCM token (get most recent if multiple exist)
        const { data: tokenData, error: tokenError } = await supabaseClient
            .from('fcm_tokens')
            .select('token')
            .eq('user_id', user_id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        console.log('Token query result:', { tokenData, tokenError })

        if (tokenError || !tokenData || !tokenData.token) {
            console.error('No FCM token found for user:', user_id, 'Error:', tokenError)
            return new Response(
                JSON.stringify({ error: 'No FCM token found', user_id, tokenError }),
                { status: 404 }
            )
        }

        const fcmToken = tokenData.token
        console.log('Found FCM token:', fcmToken.substring(0, 20) + '...')

        // Get Firebase Service Account credentials
        const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}'
        console.log('Service Account length:', serviceAccountStr.length)

        const serviceAccount = JSON.parse(serviceAccountStr)
        console.log('Service Account parsed:', {
            hasPrivateKey: !!serviceAccount.private_key,
            hasClientEmail: !!serviceAccount.client_email,
            projectId: serviceAccount.project_id
        })

        // Get OAuth2 access token
        console.log('Getting OAuth2 access token...')
        const accessToken = await getAccessToken(serviceAccount)
        console.log('Access token obtained:', !!accessToken)

        // Send FCM notification using v1 API
        const fcmResponse = await fetch(
            `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    message: {
                        token: fcmToken,
                        notification: {
                            title: title,
                            body: message,
                        },
                        android: {
                            priority: 'high',
                            notification: {
                                sound: 'default',
                            },
                        },
                        data: {
                            notification_id: notification_id.toString(),
                        },
                    },
                }),
            }
        )

        const fcmResult = await fcmResponse.json()

        if (!fcmResponse.ok) {
            console.error('FCM Error:', fcmResult)
            return new Response(
                JSON.stringify({ error: 'FCM send failed', details: fcmResult }),
                { status: 500 }
            )
        }

        console.log('✅ Notification sent successfully:', fcmResult)
        return new Response(
            JSON.stringify({ success: true, result: fcmResult }),
            { status: 200 }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        )
    }
})

// Get OAuth2 access token for Firebase
async function getAccessToken(serviceAccount: any): Promise<string> {
    const jwtHeader = {
        alg: 'RS256',
        typ: 'JWT',
    }

    const now = Math.floor(Date.now() / 1000)
    const jwtClaimSet = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    }

    const jwtHeaderBase64 = btoa(JSON.stringify(jwtHeader))
    const jwtClaimSetBase64 = btoa(JSON.stringify(jwtClaimSet))
    const unsignedJwt = `${jwtHeaderBase64}.${jwtClaimSetBase64}`

    // Import private key
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        pemToArrayBuffer(serviceAccount.private_key),
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256',
        },
        false,
        ['sign']
    )

    // Sign JWT
    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(unsignedJwt)
    )

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    const jwt = `${unsignedJwt}.${signatureBase64}`

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    })

    const tokenData = await tokenResponse.json()
    return tokenData.access_token
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
    const pemContents = pem
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '')

    const binaryString = atob(pemContents)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
}
