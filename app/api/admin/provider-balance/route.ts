import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((userData as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const apiKey = process.env.XFOLLOWR_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 })
        }

        const formData = new FormData()
        formData.append('key', apiKey)
        formData.append('action', 'balance')

        const response = await fetch('https://xfollowr.com/api/v2', {
            method: 'POST',
            body: formData,
            // Revalidate every 60 seconds at most to prevent spamming
            next: { revalidate: 60 }
        })

        const data = await response.json()
        
        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
    }
}
