import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
    try {
        // 1. Verify Authorization (Internal Secret or Admin)
        const secret = request.headers.get('x-internal-secret')
        let isAdmin = false;

        if (secret === process.env.SUPABASE_SERVICE_ROLE_KEY) {
            isAdmin = true;
        } else {
            const { createClient: createServerClient } = require('@/lib/supabase/server')
            const supabaseAuth = await createServerClient()
            const { data: { user } } = await supabaseAuth.auth.getUser()
            
            if (user) {
                const { data: userData } = await supabaseAuth
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single()
                if (userData?.role === 'admin') isAdmin = true;
            }
        }

        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Fetch external services from XFollowr
        const payload = {
            key: process.env.XFOLLOWR_API_KEY || '',
            action: 'services'
        }
        const formData = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
            formData.append(key, value as string)
        })

        const res = await fetch('https://xfollowr.com/api/v2', {
            method: 'POST',
            body: formData
        })
        const externalServices = await res.json()
        if (!Array.isArray(externalServices)) {
            throw new Error('Invalid response from external API')
        }

        // 3. Prepare Supabase Admin Client
        const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        )

        // 4. Fetch existing services to prevent duplicates
        const { data: existingServices } = await adminClient
            .from('services')
            .select('id, provider_service_id')

        const existingMap = new Map();
        (existingServices || []).forEach(s => {
            if (s.provider_service_id) {
                existingMap.set(String(s.provider_service_id), s.id)
            }
        })

        let updatedCount = 0;
        let insertedCount = 0;

        // 5. Process and Filter Services
        const forbiddenWords = ['احمد', 'شخص', 'ahmed', 'شخصي', 'private', 'خاص']
        
        for (const ext of externalServices) {
            const price = parseFloat(ext.rate)
            const name = ext.name.toLowerCase()

            // Filter out expensive/dummy services and personal services
            if (price >= 9999) continue;
            if (forbiddenWords.some(word => name.includes(word))) continue;

            const isPackage = ext.type === 'package' || ext.max <= 1 || ext.min === ext.max
            
            // Helper function logic duplicated from detectPlatform since we can't easily import frontend logic
            let platform = 'other'
            const n = name.toLowerCase()
            const cat = (ext.category || '').toLowerCase()
            if (n.includes('instagram') || cat.includes('instagram') || n.includes('ig') || cat.includes('ig')) platform = 'instagram'
            else if (n.includes('tiktok') || cat.includes('tiktok') || cat.includes('tik tok')) platform = 'tiktok'
            else if (n.includes('youtube') || cat.includes('youtube') || n.includes('yt') || cat.includes('yt')) platform = 'youtube'
            else if (n.includes('facebook') || cat.includes('facebook') || n.includes('fb') || cat.includes('fb')) platform = 'facebook'
            else if (n.includes('twitter') || cat.includes('twitter') || n.includes('x') || cat.includes('x.com')) platform = 'twitter'
            else if (n.includes('telegram') || cat.includes('telegram')) platform = 'telegram'
            else if (n.includes('snapchat') || cat.includes('snapchat')) platform = 'snapchat'

            const serviceData: any = {
                name: ext.name,
                platform: platform,
                category: ext.category || 'followers',
                min_quantity: ext.min,
                max_quantity: ext.max,
                status: 'active',
                provider_service_id: ext.service
            }

            if (isPackage) {
                serviceData.price = price
                serviceData.price_per_1000 = null
            } else {
                serviceData.price_per_1000 = price
                serviceData.price = null
            }

            const existingId = existingMap.get(String(ext.service))

            if (existingId) {
                // Update existing service
                await adminClient.from('services').update(serviceData).eq('id', existingId)
                updatedCount++;
            } else {
                // Insert new service
                await adminClient.from('services').insert([serviceData])
                insertedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Sync completed',
            updated: updatedCount,
            inserted: insertedCount 
        })
    } catch (error) {
        console.error('Sync Error:', error)
        return NextResponse.json({ error: 'Failed to sync services' }, { status: 500 })
    }
}
