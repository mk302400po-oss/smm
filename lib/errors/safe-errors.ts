/**
 * Safe error handling for API routes
 * Prevents leaking sensitive information in error messages
 */

export class SafeError extends Error {
    constructor(
        message: string,
        public userMessage: string,
        public statusCode: number = 400
    ) {
        super(message)
        this.name = 'SafeError'
    }
}

/**
 * Sanitize error for client response
 * @param error - The error object
 * @returns Safe error message for client
 */
export function sanitizeError(error: unknown): { error: string, statusCode: number } {
    // If it's our SafeError, use the user message
    if (error instanceof SafeError) {
        return {
            error: error.userMessage,
            statusCode: error.statusCode
        }
    }

    // Log actual error for debugging (server-side only)
    console.error('API Error:', error)

    // Return generic message to client
    return {
        error: 'حدث خطأ، يرجى المحاولة مرة أخرى',
        statusCode: 500
    }
}

/**
 * Common safe error responses
 */
export const SafeErrors = {
    UNAUTHORIZED: new SafeError(
        'Unauthorized access',
        'يجب تسجيل الدخول للوصول لهذه الصفحة',
        401
    ),
    FORBIDDEN: new SafeError(
        'Forbidden access',
        'ليس لديك صلاحية للوصول لهذه الصفحة',
        403
    ),
    NOT_FOUND: new SafeError(
        'Resource not found',
        'العنصر المطلوب غير موجود',
        404
    ),
    RATE_LIMIT: new SafeError(
        'Rate limit exceeded',
        'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً',
        429
    ),
    VALIDATION_ERROR: new SafeError(
        'Validation failed',
        'البيانات المدخلة غير صحيحة',
        400
    ),
    INSUFFICIENT_BALANCE: new SafeError(
        'Insufficient balance',
        'رصيدك غير كافٍ لإتمام هذه العملية',
        400
    ),
    SERVICE_UNAVAILABLE: new SafeError(
        'Service temporarily unavailable',
        'الخدمة غير متاحة مؤقتاً، يرجى المحاولة لاحقاً',
        503
    ),
    BANNED_USER: new SafeError(
        'User is banned',
        'تم حظر حسابك، يرجى التواصل مع الدعم',
        403
    )
}

/**
 * Log error safely (for server-side monitoring)
 * @param error - Error to log
 * @param context - Additional context
 */
export function logError(error: unknown, context?: Record<string, any>) {
    const timestamp = new Date().toISOString()
    const errorInfo = {
        timestamp,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        ...context
    }

    // In production, this should send to monitoring service (e.g., Sentry)
    console.error('[ERROR]', JSON.stringify(errorInfo, null, 2))
}
