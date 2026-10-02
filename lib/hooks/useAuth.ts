'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type UserWithRole = User & {
    role?: 'user' | 'admin'
    balance?: number
    full_name?: string
}

export function useAuth() {
    const [user, setUser] = useState<UserWithRole | null>(null)
    const [loading, setLoading] = useState(true)
    const [supabase] = useState(() => createClient())

    useEffect(() => {
        console.log('🔵 [useAuth] Init')

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log('🔄 [useAuth] Event:', event)

                if (session?.user) {
                    const authUser = session.user as UserWithRole

                    // Check if user is admin by email
                    if (session.user.email === 'mk302400po@gmail.com') {
                        authUser.role = 'admin'
                        console.log('✅ [useAuth] Admin user')
                    } else {
                        authUser.role = 'user'
                    }

                    authUser.balance = 0
                    authUser.full_name = session.user.user_metadata?.full_name || ''

                    console.log('✅ [useAuth] User:', authUser.email, 'Role:', authUser.role)
                    setUser(authUser)
                } else {
                    setUser(null)
                }
                setLoading(false)
            }
        )

        supabase.auth.refreshSession()

        return () => subscription.unsubscribe()
    }, [supabase])

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        return { data, error }
    }

    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
            }
        })
        return { data, error }
    }

    const signUp = async (email: string, password: string, fullName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        })
        return { data, error }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        return { error }
    }

    const resetPassword = async (email: string) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        return { data, error }
    }

    const updatePassword = async (newPassword: string) => {
        const { data, error } = await supabase.auth.updateUser({ password: newPassword })
        return { data, error }
    }

    return {
        user,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        isAdmin: user?.role === 'admin',
    }
}
