import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        const data = await res.json();
        if (data && data.rates && data.rates.EGP) {
            let egpRate = data.rates.EGP;
            
            // Apply markup percentage if configured in environment variables (e.g., 5 for 5%)
            const markupStr = process.env.EXCHANGE_RATE_MARKUP_PERCENTAGE || '0';
            const markupPercent = parseFloat(markupStr);
            
            if (!isNaN(markupPercent) && markupPercent > 0) {
                egpRate = egpRate * (1 + (markupPercent / 100));
            }
            
            return NextResponse.json({ egp: egpRate });
        }
    } catch (error) {
        console.error('Failed to fetch from exchangerate-api:', error);
    }
    
    // Fallback if the external API fails
    return NextResponse.json({ egp: 50.50 });
}
