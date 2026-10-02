import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ONESIGNAL_APP_ID = '7fa49903-57b0-495b-a7a9-dddc16332da4';
const ONESIGNAL_REST_API_KEY = '62dnq2xoxeg651c2j3ysvc2ad';

serve(async (req) => {
    try {
        const { player_id, title, message, data } = await req.json();

        console.log('Sending notification:', { player_id, title, message });

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                include_player_ids: [player_id],
                headings: { en: title },
                contents: { en: message },
                data: data || {},
                android_sound: 'default',
                priority: 10,
            }),
        });

        const result = await response.json();
        console.log('OneSignal response:', result);

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
            status: response.ok ? 200 : 500,
        });
    } catch (error) {
        console.error('Error sending notification:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
