import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WEBHOOK_SECRET = process.env.SMS_WEBHOOK_SECRET || 'venom_secure_webhook_12345';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function POST(req: Request) {
    try {
        // Verify Secret to prevent fake requests
        const url = new URL(req.url);
        const secret = url.searchParams.get('secret');
        
        if (secret !== WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Parse the body coming from the SMS Forwarder App
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }
        
        // The SMS forwarder usually sends the message text in a field (e.g. 'message', 'text', 'body')
        const messageText = body.message || body.text || body.body || JSON.stringify(body);
        
        // Ensure it's a deposit message
        if (!messageText.includes('تم استلام') && !messageText.includes('إيداع') && !messageText.includes('استلمت') && !messageText.includes('استقبال') && !messageText.includes('تحويل')) {
            return NextResponse.json({ success: true, note: 'Not a deposit SMS, ignored.' });
        }

        // Extract Amount: e.g. "تم استلام مبلغ 500 ج.م" or "تم استلام 500.5"
        const amountMatch = messageText.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:ج\.م|جنيه|جنية)/) 
                         || messageText.match(/(?:مبلغ)\s*([0-9]+(?:\.[0-9]+)?)/)
                         || messageText.match(/(?:بمبلغ)\s*([0-9]+(?:\.[0-9]+)?)/);
                         
        // Extract Phone Number (starts with 01 and has 11 digits) or Instapay address (email format)
        const phoneMatch = messageText.match(/(01[0-9]{9})/) || messageText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/);
        
        if (!amountMatch || !phoneMatch) {
            console.error('Could not parse SMS:', messageText);
            return NextResponse.json({ error: 'Could not parse amount or sender identifier' }, { status: 400 });
        }
        
        const amountEGP = parseFloat(amountMatch[1]);
        const senderPhone = phoneMatch[1].toLowerCase();
        
        console.log(`[SMS Webhook] Received deposit: ${amountEGP} EGP from ${senderPhone}`);
        
        // Search for a pending deposit request matching this phone/IPA and amount
        const { data: pendingRequests, error: fetchError } = await supabase
            .from('deposit_requests')
            .select('*')
            .eq('status', 'pending');
            
        if (fetchError || !pendingRequests || pendingRequests.length === 0) {
            return NextResponse.json({ success: false, note: 'No matching pending request found for this phone.' });
        }

        // Filter the requests locally to do case-insensitive match on sender_phone
        const matchingPhoneRequests = pendingRequests.filter(req => req.sender_phone?.toLowerCase() === senderPhone);
            
        if (matchingPhoneRequests.length === 0) {
            return NextResponse.json({ success: false, note: 'No matching pending request found for this phone/IPA.' });
        }
        
        // Find the specific request that matches the amount
        const requestToApprove = matchingPhoneRequests.find(r => Math.abs(parseFloat(r.amount) - amountEGP) < 1);
        
        if (!requestToApprove) {
            return NextResponse.json({ success: false, note: 'Phone matched, but amount did not match any pending requests.' });
        }
        
        // Approve it!
        // First, convert EGP to USD using the current rate
        let rate = 50.5;
        try {
            const resRates = await fetch(`${url.origin}/api/rates`);
            const ratesData = await resRates.json();
            if (ratesData.egp) rate = ratesData.egp;
        } catch(e) {}
        
        const amountUSD = requestToApprove.amount / rate;
        
        // 1. Update status to approved
        await supabase
            .from('deposit_requests')
            .update({
                status: 'approved',
                admin_notes: `تم التحقق والإضافة تلقائياً عبر رسائل SMS (Webhook).`
            })
            .eq('id', requestToApprove.id);
            
        // 2. Add balance in USD
        await supabase.rpc('increment_balance', {
            user_id: requestToApprove.user_id,
            amount: amountUSD
        });
        
        // 3. Log transaction
        await supabase.from('transactions').insert({
            user_id: requestToApprove.user_id,
            amount: amountUSD,
            type: 'deposit',
            status: 'completed',
            description: `شحن رصيد تلقائي عبر (كاش/إنستاباي) - هاتف: ${senderPhone}`
        });

        return NextResponse.json({ success: true, message: 'Deposit auto-approved!' });

    } catch (error: any) {
        console.error('SMS Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
