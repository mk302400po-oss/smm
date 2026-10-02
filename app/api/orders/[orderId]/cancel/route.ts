// @ts-nocheck - Supabase types
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sanitizeError, SafeErrors } from '@/lib/errors/safe-errors'

export async function POST(
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

        // 3. Check if order can be canceled
        if (order.status === 'completed' || order.status === 'canceled' || order.status === 'refunded') {
            return NextResponse.json({ error: 'لا يمكن إلغاء هذا الطلب' }, { status: 400 })
        }

        // 4. Cancel order on external provider if it has provider_order_id
        if (order.provider_order_id) {
            try {
                const cancelRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/services/external`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-internal-secret': process.env.SUPABASE_SERVICE_ROLE_KEY || ''
                    },
                    body: JSON.stringify({
                        action: 'cancel',
                        order: order.provider_order_id
                    })
                })

                const cancelData = await cancelRes.json()

                // Check if cancellation was successful
                if (cancelData.error) {
                    console.error('Provider cancellation error:', cancelData.error)
                    // Continue with local cancellation even if provider fails
                }
            } catch (error) {
                console.error('Failed to cancel on provider:', error)
                // Continue with local cancellation
            }
        }

        // 5. Update order status to canceled FIRST (Atomic check to prevent double refunds)
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({ status: 'canceled' })
            .eq('id', orderId)
            .in('status', ['pending', 'processing', 'in_progress']) // Ensure it wasn't already canceled
            .select()
            .single()

        if (updateError || !updatedOrder) {
            return NextResponse.json({ error: 'Failed to cancel order or order already canceled' }, { status: 400 })
        }

        // 6. Refund user balance Atomically
        const refundAmount = order.total_price
        const { createClient: createAdminClient } = require('@supabase/supabase-js')
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        await adminSupabase.rpc('increment_balance', {
            user_id: user.id,
            amount: refundAmount
        })

        // 7. Create refund transaction
        await supabase.from('transactions').insert({
            user_id: user.id,
            amount: refundAmount,
            type: 'refund',
            status: 'completed',
            reference_id: order.id,
            description: `استرداد طلب ملغي`,
        })

        // 8. Create notification
        await supabase.from('notifications').insert({
            user_id: user.id,
            title: 'تم إلغاء الطلب',
            message: `تم إلغاء طلبك واسترداد ${refundAmount.toFixed(2)} ر.س`,
            type: 'info',
            read: false
        })

        return NextResponse.json({
            success: true,
            order: updatedOrder,
            refunded: refundAmount
        })

    } catch (error) {
        console.error('Cancel Order Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
