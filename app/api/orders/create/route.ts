// @ts-nocheck - Supabase types not fully generated
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkOrderRateLimit } from '@/lib/ratelimit'
import { OrderSchema } from '@/lib/validation/schemas'
import { SafeErrors, sanitizeError } from '@/lib/errors/safe-errors'

export async function POST(request: Request) {
    const supabase = await createClient()

    // Rate Limit Check
    const isAllowed = await checkOrderRateLimit()
    if (!isAllowed) {
        const error = sanitizeError(SafeErrors.RATE_LIMIT)
        return NextResponse.json({ error: error.error }, { status: error.statusCode })
    }

    try {
        const body = await request.json()

        // Validate input
        const validation = OrderSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({
                error: validation.error?.errors?.[0]?.message || 'البيانات المدخلة غير صحيحة'
            }, { status: 400 })
        }

        const { service_id, link, quantity } = validation.data

        // 1. Get User
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            const error = sanitizeError(SafeErrors.UNAUTHORIZED)
            return NextResponse.json({ error: error.error }, { status: error.statusCode })
        }

        // 2. Get Service Details
        const { data: service, error: serviceError } = await supabase
            .from('services')
            .select('*')
            .eq('id', service_id)
            .single()

        if (serviceError || !service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        // Validate Quantity
        if (!Number.isInteger(quantity) || quantity < 1) {
            return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
        }

        // @ts-ignore - Supabase types not fully generated
        if (quantity < service.min_quantity || quantity > service.max_quantity) {
            return NextResponse.json({
                // @ts-ignore - Supabase types not fully generated
                error: `Quantity must be between ${service.min_quantity} and ${service.max_quantity}`
            }, { status: 400 })
        }

        // 3. Calculate Cost
        let cost = 0

        // Special case: If max_quantity is 1 OR min equals max, treat as a fixed price item
        // @ts-ignore - Supabase types not fully generated
        if (service.max_quantity <= 1 || service.min_quantity === service.max_quantity) {
            // @ts-ignore - Supabase types not fully generated
            cost = quantity * (service.price || service.price_per_1000 || 0)
        }
        // Standard cases
        // @ts-ignore - Supabase types not fully generated
        else if (service.price) {
            // @ts-ignore - Supabase types not fully generated
            cost = quantity * service.price
            // @ts-ignore - Supabase types not fully generated
        } else if (service.price_per_1000) {
            // @ts-ignore - Supabase types not fully generated
            cost = (quantity / 1000) * service.price_per_1000
        }

        // 4 & 5. Check and Deduct Balance Atomically (Prevent Race Conditions)
        const { data: isSuccess, error: deductError } = await supabase.rpc('secure_deduct_balance', {
            p_user_id: user.id,
            p_amount: cost
        })

        if (deductError) {
            console.error('Balance deduction error:', deductError)
            return NextResponse.json({ error: 'Failed to process balance' }, { status: 500 })
        }

        if (!isSuccess) {
            return NextResponse.json({ error: 'رصيدك غير كافٍ لإتمام هذا الطلب' }, { status: 400 })
        }

        // Helper to safely get admin client only when needed
        const getAdminClient = () => {
            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                return createAdminClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                )
            }
            return null
        }

        // 6. Call External API (if provider service)
        let providerOrderId = null
        // @ts-ignore - Supabase types not fully generated
        if (service.provider_service_id) {
            try {
                const payload = {
                    key: process.env.XFOLLOWR_API_KEY || '',
                    action: 'add',
                    // @ts-ignore - Supabase types not fully generated
                    service: service.provider_service_id,
                    link,
                    quantity
                }

                const formData = new FormData()
                Object.entries(payload).forEach(([k, v]) => {
                    formData.append(k, String(v))
                })

                const externalRes = await fetch('https://xfollowr.com/api/v2', {
                    method: 'POST',
                    body: formData
                })
                
                const externalData = await externalRes.json()

                if (externalData.order) {
                    providerOrderId = externalData.order.toString()
                } else if (externalData.error) {
                    // Refund if external API fails using admin privileges
                    const adminClient = getAdminClient()
                    if (adminClient) {
                        await adminClient.rpc('increment_balance', {
                            user_id: user.id,
                            amount: cost
                        })
                    }
                    // Instead of exposing provider error (like low balance), show a friendly message
                    return NextResponse.json({ error: 'عذراً، يوجد ضغط على هذه الخدمة حالياً أو تحت الصيانة. تم استرجاع رصيدك، يرجى المحاولة بعد قليل أو اختيار خدمة بديلة.' }, { status: 400 })
                }
            } catch (error) {
                // Refund if fetch fails using admin privileges
                const adminClient = getAdminClient()
                if (adminClient) {
                    await adminClient.rpc('increment_balance', {
                        user_id: user.id,
                        amount: cost
                    })
                }
                return NextResponse.json({ error: 'حدث خطأ في الاتصال بالشبكة. تم استرجاع رصيدك، يرجى المحاولة بعد قليل.' }, { status: 500 })
            }
        }

        // 7. Create Order in DB
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                service_id: service.id,
                link,
                quantity,
                total_price: cost,
                status: providerOrderId ? 'pending' : 'processing',
                provider_order_id: providerOrderId,
                start_count: 0,
                current_count: 0
            })
            .select()
            .single()

        if (orderError) {
            const adminClient = getAdminClient()
            if (adminClient) {
                await adminClient.rpc('increment_balance', {
                    user_id: user.id,
                    amount: cost
                })
            }
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
        }

        // 8. Create Transaction
        await supabase.from('transactions').insert({
            user_id: user.id,
            amount: -cost,
            type: 'order',
            status: 'completed',
            reference_id: order.id,
            description: `طلب: ${service.name}`,
        })

        // 9. Create Notification
        await supabase.from('notifications').insert({
            user_id: user.id,
            title: 'طلب جديد',
            message: `تم إنشاء طلبك بنجاح - ${service.name}`,
            type: 'info',
            read: false
        })

        // 10. Log Activity
        await supabase.from('activity_log').insert({
            user_id: user.id,
            action_type: 'order_created',
            description: `طلب جديد: ${service.name}`,
            metadata: {
                order_id: order.id,
                service_name: service.name,
                service_id: service.id,
                quantity: quantity,
                total_price: cost
            }
        })

        return NextResponse.json({ success: true, order })

    } catch (error) {
        console.error('Order Creation Error:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
