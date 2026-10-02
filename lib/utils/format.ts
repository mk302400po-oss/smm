// Currency conversion rates
export const EXCHANGE_RATES = {
    USD_TO_EGP: 50.5, // Default fallback, will be updated automatically
    EGP_TO_USD: 1 / 50.5,
}

let isRateUpdated = false;

export async function updateExchangeRate(): Promise<boolean> {
    if (isRateUpdated) return false;
    try {
        const res = await fetch('/api/rates');
        const data = await res.json();
        if (data && data.egp) {
            const egpRate = data.egp;
            EXCHANGE_RATES.USD_TO_EGP = egpRate;
            EXCHANGE_RATES.EGP_TO_USD = 1 / egpRate;
            isRateUpdated = true;
            return true;
        }
    } catch (e) {
        // Silently fail if blocked by adblockers, will use fallback 50.50 rate
    }
    return false;
}

/**
 * Format currency in USD
 */
export function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
}

/**
 * Format currency in EGP (primary display currency)
 */
export function formatEGP(egpAmount: number): string {
    return `${egpAmount.toFixed(2)} ج.م`
}

/**
 * Convert USD to EGP with proper rounding
 */
export function convertToEGP(usdAmount: number): number {
    // Round to 2 decimal places to avoid floating point errors
    return Math.round(usdAmount * EXCHANGE_RATES.USD_TO_EGP * 100) / 100
}

/**
 * Convert EGP to USD (for database storage) with higher precision
 * Uses 4 decimal places to preserve exact EGP amounts when converting back
 */
export function convertToUSD(egpAmount: number): number {
    // Round to 4 decimal places to preserve exact EGP amounts
    return Math.round(egpAmount * EXCHANGE_RATES.EGP_TO_USD * 10000) / 10000
}

/**
 * Display USD amount as EGP (main display function)
 */
export function displayAsEGP(usdAmount: number): string {
    return formatEGP(convertToEGP(usdAmount))
}

/**
 * Format currency with both USD and EGP
 */
export function formatDualCurrency(usdAmount: number): string {
    const egp = convertToEGP(usdAmount)
    return `$${usdAmount.toFixed(2)} (${egp.toFixed(2)} ج.م)`
}

/**
 * Format relative time (e.g., "منذ 5 دقائق")
 */
export function formatRelativeTime(date: string | Date): string {
    const now = new Date()
    const past = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

    if (diffInSeconds < 60) {
        return 'منذ لحظات'
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
        return `منذ ${diffInMinutes} ${diffInMinutes === 1 ? 'دقيقة' : 'دقائق'}`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
        return `منذ ${diffInHours} ${diffInHours === 1 ? 'ساعة' : 'ساعات'}`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
        return `منذ ${diffInDays} ${diffInDays === 1 ? 'يوم' : 'أيام'}`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
        return `منذ ${diffInMonths} ${diffInMonths === 1 ? 'شهر' : 'أشهر'}`
    }

    const diffInYears = Math.floor(diffInMonths / 12)
    return `منذ ${diffInYears} ${diffInYears === 1 ? 'سنة' : 'سنوات'}`
}
