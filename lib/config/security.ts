/**
 * Security Configuration
 * Centralized security settings for the application
 */

export const SecurityConfig = {
    /**
     * Allowed origins for CORS
     * In production, replace with your actual domain
     */
    cors: {
        allowedOrigins: [
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            // Add production domains here:
            // 'https://yourdomain.com',
            // 'https://www.yourdomain.com'
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    },

    /**
     * Session Management
     */
    session: {
        // Inactivity timeout in milliseconds (30 minutes)
        inactivityTimeout: 30 * 60 * 1000,
        // Maximum session duration (24 hours)
        maxDuration: 24 * 60 * 60 * 1000,
        // Refresh token before expiry (5 minutes)
        refreshBeforeExpiry: 5 * 60 * 1000,
    },

    /**
     * Rate Limiting Configuration
     */
    rateLimit: {
        // Login attempts
        login: {
            limit: 5,
            window: 900, // 15 minutes in seconds
        },
        // Registration attempts
        register: {
            limit: 3,
            window: 3600, // 1 hour in seconds
        },
        // Order creation
        orders: {
            limit: 10,
            window: 60, // 1 minute in seconds
        },
        // General API
        api: {
            limit: 100,
            window: 3600, // 1 hour in seconds
        },
        // Admin endpoints
        admin: {
            limit: 200,
            window: 3600, // 1 hour in seconds
        },
    },

    /**
     * CSP Nonce generation
     * Used for inline scripts in production
     */
    csp: {
        nonceEnabled: process.env.NODE_ENV === 'production',
    },

    /**
     * Audit Logging
     */
    audit: {
        enabled: true,
        logIpAddress: true,
        logUserAgent: true,
        retentionDays: 90, // Keep logs for 90 days
    },
} as const

export type SecurityConfig = typeof SecurityConfig
