// @ts-nocheck - Audit logs table types not yet generated
/**
 * Audit Logger
 * Logs admin actions for security and compliance
 */

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type AuditAction =
    | 'CREATE_SERVICE'
    | 'UPDATE_SERVICE'
    | 'DELETE_SERVICE'
    | 'UPDATE_USER'
    | 'BAN_USER'
    | 'UNBAN_USER'
    | 'UPDATE_ORDER'
    | 'UPDATE_DEPOSIT'
    | 'UPDATE_BALANCE'
    | 'DELETE_ORDER'
    | 'DELETE_USER'

export interface AuditLogEntry {
    action: AuditAction
    resource_type: string
    resource_id?: string
    details?: Record<string, any>
    ip_address?: string
    user_agent?: string
}

/**
 * Log an admin action to the audit_logs table
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
    try {
        const supabase = await createClient()
        const headersList = await headers()

        // Get current user
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            console.warn('Audit log: No user found')
            return
        }

        // Get IP and User Agent
        const ipAddress = headersList.get('x-forwarded-for') ||
            headersList.get('x-real-ip') ||
            'unknown'
        const userAgent = headersList.get('user-agent') || 'unknown'

        // Insert audit log
        const { error } = await supabase.from('audit_logs').insert({
            user_id: user.id,
            action: entry.action,
            resource_type: entry.resource_type,
            resource_id: entry.resource_id,
            details: entry.details,
            ip_address: ipAddress,
            user_agent: userAgent,
        })

        if (error) {
            console.error('Failed to log audit event:', error)
        }
    } catch (error) {
        // Don't throw - logging should not break the application
        console.error('Audit logging error:', error)
    }
}

/**
 * Helper function to log service actions
 */
export async function logServiceAction(
    action: AuditAction,
    serviceId: string,
    details?: Record<string, any>
) {
    await logAuditEvent({
        action,
        resource_type: 'service',
        resource_id: serviceId,
        details,
    })
}

/**
 * Helper function to log user actions
 */
export async function logUserAction(
    action: AuditAction,
    userId: string,
    details?: Record<string, any>
) {
    await logAuditEvent({
        action,
        resource_type: 'user',
        resource_id: userId,
        details,
    })
}

/**
 * Helper function to log order actions
 */
export async function logOrderAction(
    action: AuditAction,
    orderId: string,
    details?: Record<string, any>
) {
    await logAuditEvent({
        action,
        resource_type: 'order',
        resource_id: orderId,
        details,
    })
}
