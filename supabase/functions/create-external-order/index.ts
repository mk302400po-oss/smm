import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create authenticated Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Verify user is authenticated
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('User not authenticated')
        }

        // Get request body
        const { service, link, quantity } = await req.json()

        const API_URL = Deno.env.get('SMM_API_URL') ?? 'https://xfollowr.com/api/v2'
        const API_KEY = Deno.env.get('SMM_API_KEY') ?? ''

        if (!API_KEY) {
            throw new Error('API Key not configured')
        }

        console.log('User:', user.id)
        console.log('Calling XFOLLOWR:', { service, link, quantity })

        // Call XFOLLOWR API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: API_KEY,
                action: 'add',
                service: service,
                link: link,
                quantity: quantity,
            }),
        })

        const data = await response.json()
        console.log('XFOLLOWR Response:', data)

        if (data.error) {
            throw new Error(data.error)
        }

        return new Response(JSON.stringify({ order: data.order }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
