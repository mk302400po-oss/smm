import { z } from 'zod'

/**
 * Order Creation Validation Schema
 */
export const OrderSchema = z.object({
    service_id: z.string().uuid('معرف الخدمة غير صحيح'),
    link: z.string()
        .min(1, 'الرابط أو البيانات مطلوبة'),
    quantity: z.number()
        .int('الكمية يجب أن تكون رقم صحيح')
        .min(1, 'الكمية يجب أن تكون 1 على الأقل')
})

export type OrderInput = z.infer<typeof OrderSchema>

/**
 * Login Validation Schema
 */
export const LoginSchema = z.object({
    email: z.string()
        .email('عنوان البريد الإلكتروني غير صحيح')
        .min(1, 'البريد الإلكتروني مطلوب'),
    password: z.string()
        .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
        .max(100, 'كلمة المرور طويلة جداً')
})

export type LoginInput = z.infer<typeof LoginSchema>

/**
 * Registration Validation Schema
 */
export const RegisterSchema = z.object({
    email: z.string()
        .email('عنوان البريد الإلكتروني غير صحيح')
        .min(1, 'البريد الإلكتروني مطلوب'),
    password: z.string()
        .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .max(100, 'كلمة المرور طويلة جداً')
        .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير')
        .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword']
})

export type RegisterInput = z.infer<typeof RegisterSchema>

/**
 * Service Creation/Update Validation Schema (Admin)
 */
export const ServiceSchema = z.object({
    name: z.string()
        .min(3, 'اسم الخدمة يجب أن يكون 3 أحرف على الأقل')
        .max(200, 'اسم الخدمة طويل جداً'),
    description: z.string()
        .max(1000, 'الوصف طويل جداً')
        .optional(),
    platform: z.string()
        .min(1, 'المنصة مطلوبة'),
    category: z.string()
        .min(1, 'الفئة مطلوبة'),
    price: z.number()
        .positive('السعر يجب أن يكون موجب')
        .max(10000, 'السعر مرتفع جداً'),
    min_quantity: z.number()
        .int('الكمية يجب أن تكون رقم صحيح')
        .positive('الكمية الدنيا يجب أن تكون موجبة')
        .max(1000000, 'الكمية الدنيا مرتفعة جداً'),
    max_quantity: z.number()
        .int('الكمية يجب أن تكون رقم صحيح')
        .positive('الكمية القصوى يجب أن تكون موجبة')
        .max(10000000, 'الكمية القصوى مرتفعة جداً'),
    provider_service_id: z.string().optional()
}).refine((data) => data.max_quantity >= data.min_quantity, {
    message: 'الكمية القصوى يجب أن تكون أكبر من أو تساوي الكمية الدنيا',
    path: ['max_quantity']
})

export type ServiceInput = z.infer<typeof ServiceSchema>

/**
 * User Update Validation Schema (Admin)
 */
export const UserUpdateSchema = z.object({
    balance: z.number()
        .nonnegative('الرصيد لا يمكن أن يكون سالب')
        .max(1000000, 'الرصيد مرتفع جداً')
        .optional(),
    role: z.enum(['user', 'admin'], {
        message: 'الدور يجب أن يكون user أو admin'
    }).optional(),
    is_banned: z.boolean().optional()
})

export type UserUpdateInput = z.infer<typeof UserUpdateSchema>

/**
 * Deposit Update Validation Schema (Admin)
 */
export const DepositStatusSchema = z.object({
    status: z.enum(['pending', 'completed', 'failed'], {
        message: 'الحالة غير صحيحة'
    })
})

export type DepositStatusInput = z.infer<typeof DepositStatusSchema>

/**
 * Order Status Update Validation Schema (Admin)
 */
export const OrderStatusSchema = z.object({
    status: z.enum(['pending', 'processing', 'in_progress', 'completed', 'canceled', 'refunded'], {
        message: 'الحالة غير صحيحة'
    })
})

export type OrderStatusInput = z.infer<typeof OrderStatusSchema>
