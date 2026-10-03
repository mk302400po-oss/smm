import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkBinanceDeposit(txId: string): Promise<number | null> {
    const apiKey = process.env.BINANCE_API_KEY;
    const apiSecret = process.env.BINANCE_SECRET_KEY;
    
    if (!apiKey || !apiSecret) {
        console.error('Missing Binance API keys');
        return null;
    }
    
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
    
    const url = `https://api.binance.com/sapi/v1/capital/deposit/hisrec?${queryString}&signature=${signature}`;
    
    try {
        const res = await fetch(url, {
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        
        if (!res.ok) {
            console.error('Binance API error', await res.text());
            return null;
        }
        
        const data = await res.json();
        // txId in Binance can be lower/upper case depending on network, so we do case-insensitive match
        const deposit = data.find((d: any) => d.txId?.toLowerCase() === txId.toLowerCase() && d.status === 1); // 1 = Success
        
        if (deposit) {
            return parseFloat(deposit.amount);
        }
    } catch (err) {
        console.error('Binance network error', err);
    }
    return null;
}

async function checkBybitDeposit(txId: string): Promise<number | null> {
    const apiKey = process.env.BYBIT_API_KEY;
    const apiSecret = process.env.BYBIT_SECRET_KEY;
    
    if (!apiKey || !apiSecret) {
        console.error('Missing Bybit API keys');
        return null;
    }
    
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    
    const queryString = `txID=${txId}`;
    const signString = timestamp + apiKey + recvWindow + queryString;
    const signature = crypto.createHmac('sha256', apiSecret).update(signString).digest('hex');
    
    const url = `https://api.bybit.com/v5/asset/deposit/query-record?${queryString}`;
    
    try {
        const res = await fetch(url, {
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'X-BAPI-SIGN': signature
            }
        });
        
        if (!res.ok) {
            console.error('Bybit API error', await res.text());
            return null;
        }
        
        const data = await res.json();
        if (data.retCode === 0 && data.result?.rows?.length > 0) {
            const deposit = data.result.rows[0];
            // 3 = Success in Bybit V5
            if (deposit.status === 3 || deposit.status === '3' || deposit.status === 'Success') { 
                return parseFloat(deposit.amount);
            }
        }
    } catch (err) {
        console.error('Bybit network error', err);
    }
    return null;
}

export async function POST(req: Request) {
    try {
        const { txId, provider, userId } = await req.json();
        
        if (!txId || !provider || !userId) {
            return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 });
        }
        
        // 1. Check if txId already used
        const { data: existingTx } = await supabase
            .from('deposit_requests')
            .select('*')
            .eq('transaction_id', txId)
            .single();
            
        if (existingTx) {
            return NextResponse.json({ error: 'لقد تم استخدام رقم المعاملة (TxID) هذا من قبل!' }, { status: 400 });
        }
        
        // 2. Verify with Provider
        let actualAmount = null;
        if (provider === 'binance') {
            actualAmount = await checkBinanceDeposit(txId);
        } else if (provider === 'bybit') {
            actualAmount = await checkBybitDeposit(txId);
        } else {
            return NextResponse.json({ error: 'مزود الخدمة غير مدعوم' }, { status: 400 });
        }
        
        if (!actualAmount) {
            return NextResponse.json({ error: 'لم يتم العثور على المعاملة أو أنها قيد المعالجة. يرجى الانتظار دقيقة والمحاولة مرة أخرى.' }, { status: 404 });
        }
        
        // 3. Convert USD to EGP for UI logging
        const baseUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        let rate = 50.5;
        try {
            const resRates = await fetch(`${baseUrl}/api/rates`);
            const ratesData = await resRates.json();
            if (ratesData.egp) rate = ratesData.egp;
        } catch(e){
            console.error('Could not fetch rates in verify:', e);
        }
        
        const amountEGP = Math.round(actualAmount * rate * 100) / 100;

        // 4. Update user balance in USD
        const { error: balanceError } = await supabase.rpc('increment_balance', {
            user_id: userId,
            amount: actualAmount
        });
        
        if (balanceError) throw balanceError;

        // 5. Insert into deposit_requests as approved
        const { error: depositError } = await supabase
            .from('deposit_requests')
            .insert({
                user_id: userId,
                amount: amountEGP,
                payment_method: provider,
                transaction_id: txId,
                status: 'approved',
                admin_notes: `تحقق تلقائي عبر ${provider}. المبلغ المستلم: $${actualAmount}`
            });
            
        if (depositError) {
            console.error('Failed to log deposit request, but balance was added:', depositError);
        }
        
        // 6. Keep legacy systems working by adding to transactions table
        const { error: txError } = await supabase.from('transactions').insert({
            user_id: userId,
            amount: actualAmount,
            type: 'deposit',
            status: 'completed',
            description: `شحن رصيد تلقائي عبر ${provider}`
        });
        
        if (txError) {
            console.error('Failed to insert into transactions table:', txError);
        }
        
        return NextResponse.json({ success: true, amountUSD: actualAmount, amountEGP });
        
    } catch (error: any) {
        console.error('Crypto verify error:', error);
        return NextResponse.json({ error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
    }
}
