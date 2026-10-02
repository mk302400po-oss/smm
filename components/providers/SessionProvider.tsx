'use client'

import { useEffect, useState } from 'react'
import {
    setupActivityTracking,
    initializeSession,
    clearSession,
    checkAndRefreshSession,
} from '@/lib/session/session-manager'
import { createClient } from '@/lib/supabase/client'
import { updateExchangeRate } from '@/lib/utils/format'

/**
 * Session Provider Component
 * Add this to your root layout to enable session management
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [, setRateFetched] = useState(false)

    useEffect(() => {
        // Fetch exchange rate on app load
        updateExchangeRate().then((updated) => {
            if (updated) {
                setRateFetched(true)
            }
        })

        const supabase = createClient()

        // Initialize session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                initializeSession()
            }
        })

        // Setup activity tracking
        const cleanup = setupActivityTracking()

        // Setup auth state listener
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                initializeSession()
            } else if (event === 'SIGNED_OUT') {
                clearSession()
            }
        })

        // Setup periodic session refresh
        const refreshInterval = setInterval(async () => {
            try {
                await checkAndRefreshSession()
            } catch (error) {
                // Silently handle refresh errors (user will be logged out if session expired)
                console.debug('Session refresh check:', error)
            }
        }, 5 * 60 * 1000) // Check every 5 minutes

        // Cleanup
        return () => {
            cleanup?.()
            subscription.unsubscribe()
            clearInterval(refreshInterval)
        }
    }, [])

    return <>{children}</>
}
