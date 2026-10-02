export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: 'user' | 'admin'
                    balance: number
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: 'user' | 'admin'
                    balance?: number
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: 'user' | 'admin'
                    balance?: number
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            services: {
                Row: {
                    id: string
                    platform: string
                    category: string
                    name: string
                    description: string | null
                    price_per_1000: number
                    min_quantity: number
                    max_quantity: number
                    status: 'active' | 'inactive'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    platform: string
                    category: string
                    name: string
                    description?: string | null
                    price_per_1000: number
                    min_quantity?: number
                    max_quantity?: number
                    status?: 'active' | 'inactive'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    platform?: string
                    category?: string
                    name?: string
                    description?: string | null
                    price_per_1000?: number
                    min_quantity?: number
                    max_quantity?: number
                    status?: 'active' | 'inactive'
                    created_at?: string
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    user_id: string
                    service_id: string | null
                    link: string
                    quantity: number
                    total_price: number
                    status: 'pending' | 'processing' | 'in_progress' | 'completed' | 'canceled' | 'refunded'
                    start_count: number
                    current_count: number
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    service_id?: string | null
                    link: string
                    quantity: number
                    total_price: number
                    status?: 'pending' | 'processing' | 'in_progress' | 'completed' | 'canceled' | 'refunded'
                    start_count?: number
                    current_count?: number
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    service_id?: string | null
                    link?: string
                    quantity?: number
                    total_price?: number
                    status?: 'pending' | 'processing' | 'in_progress' | 'completed' | 'canceled' | 'refunded'
                    start_count?: number
                    current_count?: number
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    user_id: string
                    amount: number
                    type: 'deposit' | 'withdrawal' | 'order' | 'refund'
                    status: 'pending' | 'completed' | 'failed'
                    reference_id: string | null
                    description: string | null
                    attachment_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    amount: number
                    type: 'deposit' | 'withdrawal' | 'order' | 'refund'
                    status?: 'pending' | 'completed' | 'failed'
                    reference_id?: string | null
                    description?: string | null
                    attachment_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    amount?: number
                    type?: 'deposit' | 'withdrawal' | 'order' | 'refund'
                    status?: 'pending' | 'completed' | 'failed'
                    reference_id?: string | null
                    description?: string | null
                    attachment_url?: string | null
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: 'info' | 'success' | 'warning' | 'error'
                    read: boolean
                    link: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type?: 'info' | 'success' | 'warning' | 'error'
                    read?: boolean
                    link?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: 'info' | 'success' | 'warning' | 'error'
                    read?: boolean
                    link?: string | null
                    created_at?: string
                }
            }
        }
    }
}
