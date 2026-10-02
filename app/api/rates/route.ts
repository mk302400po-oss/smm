import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        const data = await res.json();
        if (data && data.rates && data.rates.EGP) {
            return NextResponse.json({ egp: data.rates.EGP });
        }
    } catch (error) {
        console.error('Failed to fetch from exchangerate-api:', error);
    }
    
    // Fallback if the external API fails
    return NextResponse.json({ egp: 50.50 });
}
