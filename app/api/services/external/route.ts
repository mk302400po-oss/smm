import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper to check if request is authorized
async function isAuthorized(request: Request) {
    // 1. Check for internal secret (used by other backend API routes)
    const secret = request.headers.get('x-internal-secret')
    if (secret === process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return true
    }

    // 2. Check if user is logged in and is an admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
        
    return userData?.role === 'admin'
}

export async function GET(request: Request) {
    try {
        if (!(await isAuthorized(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Default payload for GET request
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

        const data = await res.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('External API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch external API' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        if (!(await isAuthorized(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { action, ...params } = body

        // Add API key and action to the request
        const payload = {
            key: process.env.XFOLLOWR_API_KEY || '',
            action: action || 'services',
            ...params
        }

        const formData = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
            formData.append(key, value as string)
        })

        const res = await fetch('https://xfollowr.com/api/v2', {
            method: 'POST',
            body: formData
        })

        const data = await res.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('External API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch external API' }, { status: 500 })
    }
}
