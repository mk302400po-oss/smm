/**
 * Session Management Utility
 * Handles session timeout and refresh logic
 */

import { createClient } from '@/lib/supabase/client'
import { SecurityConfig } from '@/lib/config/security'

interface SessionState {
    lastActivity: number
    sessionStart: number
}

const SESSION_STORAGE_KEY = 'session_state'

/**
 * Get current session state from localStorage
 */
function getSessionState(): SessionState | null {
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return null

    try {
        return JSON.parse(stored)
    } catch {
        return null
    }
}

/**
 * Update session state in localStorage
 */
function updateSessionState(state: Partial<SessionState>) {
    if (typeof window === 'undefined') return

    const current = getSessionState() || {
        lastActivity: Date.now(),
        sessionStart: Date.now(),
    }

    const updated = { ...current, ...state }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated))
}

/**
 * Check if session has expired due to inactivity
 */
export function isSessionExpired(): boolean {
    const state = getSessionState()
    if (!state) return false

    const now = Date.now()
    const inactivityDuration = now - state.lastActivity
    const sessionDuration = now - state.sessionStart

    // Check inactivity timeout
    if (inactivityDuration > SecurityConfig.session.inactivityTimeout) {
        return true
    }

    // Check maximum session duration
    if (sessionDuration > SecurityConfig.session.maxDuration) {
        return true
    }

    return false
}

/**
 * Update last activity timestamp
 * Call this on user interactions
 */
export function updateActivity() {
    updateSessionState({ lastActivity: Date.now() })
}

/**
 * Initialize session state
 * Call this on login
 */
export function initializeSession() {
    const now = Date.now()
    updateSessionState({
        lastActivity: now,
        sessionStart: now,
    })
}

/**
 * Clear session state
 * Call this on logout
 */
export function clearSession() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(SESSION_STORAGE_KEY)
}

/**
 * Setup activity listeners
 * Call this in your app's root component
 */
export function setupActivityTracking() {
    if (typeof window === 'undefined') return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    // Throttle updates to avoid excessive localStorage writes
    let lastUpdate = 0
    const throttleMs = 60000 // Update once per minute

    const handleActivity = () => {
        const now = Date.now()
        if (now - lastUpdate > throttleMs) {
            updateActivity()
            lastUpdate = now
        }
    }

    events.forEach((event) => {
        window.addEventListener(event, handleActivity, { passive: true })
    })

    // Check for session expiry periodically
    const checkInterval = setInterval(async () => {
        if (isSessionExpired()) {
            clearInterval(checkInterval)
            // Sign out user
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = '/login?reason=session_expired'
        }
    }, 60000) // Check every minute

    // Cleanup function
    return () => {
        events.forEach((event) => {
            window.removeEventListener(event, handleActivity)
        })
        clearInterval(checkInterval)
    }
}

/**
 * Check if session should be refreshed
 */
export async function checkAndRefreshSession() {
    if (typeof window === 'undefined') return

    try {
        const supabase = createClient()
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession()

        // If there's an error getting session, user might be logged out
        if (sessionError) {
            console.debug('Session check error:', sessionError.message)
            return
        }

        if (!session) return

        // Calculate time until token expiry
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now

        // Refresh if expiring soon
        if (timeUntilExpiry < SecurityConfig.session.refreshBeforeExpiry) {
            const { error: refreshError } = await supabase.auth.refreshSession()

            if (refreshError) {
                console.debug('Session refresh error:', refreshError.message)
                // If refresh fails, session might be expired - user will be logged out
                // by the session expiry checker
            }
        }
    } catch (error) {
        // Silently handle errors - don't spam console
        console.debug('Session refresh check failed:', error)
    }
}
