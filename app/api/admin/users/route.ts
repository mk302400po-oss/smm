import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()

    // 1. Verify User is Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = (await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()) as any

    if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch Users using Admin Client to bypass RLS
    const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    try {
        const { data: usersData, error } = await adminClient
            .from('users')
            .select(`
                id,
                email,
                role,
                balance,
                created_at,
                full_name,
                is_banned
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Get order counts for each user
        const usersWithOrders = await Promise.all(
            (usersData || []).map(async (u) => {
                const { count } = await adminClient
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', u.id)

                return { ...u, orders_count: count || 0 }
            })
        )

        return NextResponse.json({ success: true, users: usersWithOrders })
    } catch (error) {
        console.error('Admin Fetch Users Error:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}
