// @ts-nocheck - Supabase types
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sanitizeError, SafeErrors } from '@/lib/errors/safe-errors'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const supabase = await createClient()
    const { orderId } = await params

    try {
        // 1. Verify user authentication
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            const error = sanitizeError(SafeErrors.UNAUTHORIZED)
            return NextResponse.json({ error: error.error }, { status: error.statusCode })
        }

        // 2. Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', user.id)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // 3. If order has no provider_order_id, return current status
        if (!order.provider_order_id) {
            return NextResponse.json({
                status: order.status,
                current_count: order.current_count,
                start_count: order.start_count,
                quantity: order.quantity
            })
        }

        // 4. Check status on external provider
        try {
            const statusRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/services/external`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-internal-secret': process.env.SUPABASE_SERVICE_ROLE_KEY || ''
                },
                body: JSON.stringify({
                    action: 'status',
                    order: order.provider_order_id
                })
            })

            // Check if response is JSON
            const contentType = statusRes.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Provider returned non-JSON response')
                // Return current local status if provider check fails
                return NextResponse.json({
                    status: order.status,
                    current_count: order.current_count,
                    start_count: order.start_count,
                    quantity: order.quantity
                })
            }

            const statusData = await statusRes.json()

            if (statusData.error) {
                // If provider check fails, return current local status
                return NextResponse.json({
                    status: order.status,
                    current_count: order.current_count,
                    start_count: order.start_count,
                    quantity: order.quantity
                })
            }

            // 5. Map provider status to our status
            const providerStatus = statusData.status?.toLowerCase()
            let mappedStatus = order.status

            if (providerStatus === 'completed') {
                mappedStatus = 'completed'
            } else if (providerStatus === 'canceled' || providerStatus === 'cancelled') {
                mappedStatus = 'canceled'
            } else if (providerStatus === 'in progress') {
                mappedStatus = 'in_progress'
            } else if (providerStatus === 'processing' || providerStatus === 'pending') {
                mappedStatus = 'processing'
            }

            // 6. Update local order if status changed
            const currentCount = statusData.remains !== undefined
                ? (order.start_count + (order.quantity - parseInt(statusData.remains)))
                : order.current_count

            if (mappedStatus !== order.status || currentCount !== order.current_count) {
                await supabase
                    .from('orders')
                    .update({
                        status: mappedStatus,
                        current_count: currentCount
                    })
                    .eq('id', orderId)
            }

            return NextResponse.json({
                status: mappedStatus,
                current_count: currentCount,
                start_count: statusData.start_count || order.start_count,
                quantity: order.quantity,
                provider_status: statusData.status,
                charge: statusData.charge
            })

        } catch (error) {
            console.error('Failed to check provider status:', error)
            // Return current local status if provider check fails
            return NextResponse.json({
                status: order.status,
                current_count: order.current_count,
                start_count: order.start_count,
                quantity: order.quantity
            })
        }

    } catch (error) {
        console.error('Get Order Status Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
