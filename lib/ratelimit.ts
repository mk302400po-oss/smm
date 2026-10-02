// @ts-nocheck - Supabase RPC types not fully generated
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function checkRateLimit(endpoint: string, limit: number = 10, windowSeconds: number = 60): Promise<boolean> {
    try {
        const supabase = await createClient()
        const headersList = await headers()

        // Get IP address
        const ip = headersList.get('x-forwarded-for') || 'unknown'

        // Call RPC function
        const { data, error } = await supabase.rpc('check_rate_limit', {
            p_ip: ip,
            p_endpoint: endpoint,
            p_limit: limit,
            p_window_seconds: windowSeconds
        })

        if (error) {
            console.error('Rate Limit Error:', error)
            // Fail open (allow request) if DB error, to avoid blocking legit users during outages
            return true
        }

        return data as boolean
    } catch (error) {
        console.error('Rate Limit Exception:', error)
        return true
    }
}

/**
 * Rate limiting for authentication endpoints (strict)
 * Login: 5 attempts per 15 minutes
 * Register: 3 attempts per hour
 */
export async function checkAuthRateLimit(endpoint: 'login' | 'register'): Promise<boolean> {
    const limits = {
        login: { limit: 5, window: 900 },      // 5 per 15 min
        register: { limit: 3, window: 3600 }   // 3 per hour
    }

    const { limit, window } = limits[endpoint]
    return checkRateLimit(`/api/auth/${endpoint}`, limit, window)
}

/**
 * Rate limiting for general API endpoints
 * 100 requests per hour per IP
 */
export async function checkAPIRateLimit(endpoint: string): Promise<boolean> {
    return checkRateLimit(endpoint, 100, 3600)
}

/**
 * Rate limiting for admin endpoints (moderate)
 * 200 requests per hour
 */
export async function checkAdminRateLimit(endpoint: string): Promise<boolean> {
    return checkRateLimit(endpoint, 200, 3600)
}

/**
 * Rate limiting for order creation (existing)
 * 10 orders per minute
 */
export async function checkOrderRateLimit(): Promise<boolean> {
    return checkRateLimit('/api/orders/create', 10, 60)
}
