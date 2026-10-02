// Supabase Edge Function: send-user-notification
// Triggers when: Order status changed, deposit approved/rejected

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Notification {
    title: string
    body: string
    channelKey: string
    data?: Record<string, string>
}

serve(async (req) => {
    try {
        const { type, userId, data } = await req.json()

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get user's FCM token
        const { data: tokens, error } = await supabase
            .from('fcm_tokens')
            .select('token')
            .eq('user_id', userId)

        if (error) throw error
        if (!tokens || tokens.length === 0) {
            return new Response(JSON.stringify({ message: 'No user tokens found' }), {
                status: 200,
            })
        }

        // Prepare notification based on type
        let notification: Notification

        switch (type) {
            case 'order_status_changed':
                const statusText = getStatusText(data.status)
                notification = {
                    title: 'تحديث الطلب 📦',
                    body: `تم تحديث حالة طلبك إلى: ${statusText}`,
                    channelKey: 'orders',
                    data: { type: 'order', orderId: data.orderId },
                }
                break

            case 'deposit_approved':
                notification = {
                    title: 'تم قبول الإيداع ✅',
                    body: `تم إضافة $${data.amount} إلى رصيدك بنجاح`,
                    channelKey: 'deposits',
                    data: { type: 'deposit', depositId: data.depositId, approved: 'true' },
                }
                break

            case 'deposit_rejected':
                notification = {
                    title: 'تم رفض الإيداع ❌',
                    body: data.reason || 'تم رفض طلب الإيداع',
                    channelKey: 'deposits',
                    data: { type: 'deposit', depositId: data.depositId, approved: 'false' },
                }
                break

            default:
                throw new Error(`Unknown notification type: ${type}`)
        }

        // Send FCM notifications to all user tokens
        const fcmPromises = tokens.map((tokenObj: any) =>
            sendFCMNotification(tokenObj.token, notification)
        )

        await Promise.all(fcmPromises)

        return new Response(
            JSON.stringify({ success: true, sentTo: tokens.length }),
            { status: 200 }
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
        })
    }
})

async function sendFCMNotification(token: string, notification: Notification) {
    const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')!

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${FCM_SERVER_KEY}`,
        },
        body: JSON.stringify({
            to: token,
            notification: {
                title: notification.title,
                body: notification.body,
            },
            data: {
                channelKey: notification.channelKey,
                ...notification.data,
            },
        }),
    })

    return response.json()
}

function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        pending: 'قيد الانتظار',
        in_progress: 'قيد التنفيذ',
        completed: 'مكتمل',
        failed: 'فشل',
        cancelled: 'ملغي',
    }
    return statusMap[status] || status
}
