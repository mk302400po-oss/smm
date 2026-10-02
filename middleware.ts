import { createClient } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Create a Supabase client
    const { supabase, response } = await createClient(request)

    // Get user session
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Get user role and ban status if logged in
    let userRole: string | null = null
    let isBanned = false
    if (user) {
        const { data: userData } = await supabase
            .from('users')
            .select('role, is_banned')
            .eq('id', user.id)
            .single()
        userRole = (userData as any)?.role || null
        isBanned = (userData as any)?.is_banned || false
    }

    // Check if user is banned (redirect to banned page)
    if (user && isBanned && !pathname.startsWith('/banned')) {
        return NextResponse.redirect(new URL('/banned', request.url))
    }

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/orders') || pathname.startsWith('/transactions') || pathname.startsWith('/settings') || pathname.startsWith('/new-order') || pathname.startsWith('/add-funds')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // Protect admin routes
    if (pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Use app_metadata for role check (faster and safer than DB query)
        // But prioritize our manual override if set
        const role = userRole || user.app_metadata?.role

        if (role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Redirect authenticated users from auth pages
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        if (user) {
            if (userRole === 'admin') {
                return NextResponse.redirect(new URL('/admin', request.url))
            }
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/login',
        '/register',
        '/orders/:path*',
        '/transactions/:path*',
        '/settings/:path*',
        '/new-order/:path*',
        '/add-funds/:path*',
        '/banned',
    ],
}
