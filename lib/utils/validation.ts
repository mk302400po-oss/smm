import { z } from 'zod'

// Email validation
export const emailSchema = z.string().email('البريد الإلكتروني غير صالح')

// Password validation
export const passwordSchema = z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل')

// URL validation for social media links
export const socialLinkSchema = z.string().url('الرابط غير صالح').refine(
    (url) => {
        const validDomains = [
            'instagram.com',
            'facebook.com',
            'twitter.com',
            'x.com',
            'tiktok.com',
            'youtube.com',
        ]
        try {
            const urlObj = new URL(url)
            return validDomains.some((domain) => urlObj.hostname.includes(domain))
        } catch {
            return false
        }
    },
    { message: 'يجب أن يكون الرابط من منصة تواصل اجتماعي مدعومة' }
)

// Order creation schema
export const createOrderSchema = z.object({
    service_id: z.string().uuid(),
    link: socialLinkSchema,
    quantity: z.number().int().positive(),
})

// User registration schema
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    full_name: z.string().min(2, 'الاسم قصير جداً'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
})

// Login schema
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

// Service creation/update schema
export const serviceSchema = z.object({
    platform: z.enum(['instagram', 'facebook', 'twitter', 'tiktok', 'youtube']),
    category: z.string().min(1),
    name: z.string().min(3, 'اسم الخدمة قصير جداً'),
    description: z.string().optional(),
    price_per_1000: z.number().positive(),
    min_quantity: z.number().int().positive(),
    max_quantity: z.number().int().positive(),
    status: z.enum(['active', 'inactive']).default('active'),
})

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
}

// Validate and sanitize object inputs
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = {} as T
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T]
        } else {
            sanitized[key as keyof T] = value
        }
    }
    return sanitized
}
