// Database types for Supabase
// This file should be regenerated when the schema changes

export interface Database {
    public: {
        Tables: {
            appointments: {
                Row: {
                    id: string;
                    start_at: string;
                    end_at: string;
                    duration_minutes: number;
                    buffer_minutes: number;
                    services: string[];
                    customer_name: string;
                    customer_phone: string;
                    status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    start_at: string;
                    end_at: string;
                    duration_minutes?: number;
                    buffer_minutes?: number;
                    services: string[];
                    customer_name: string;
                    customer_phone: string;
                    status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    start_at?: string;
                    end_at?: string;
                    duration_minutes?: number;
                    buffer_minutes?: number;
                    services?: string[];
                    customer_name?: string;
                    customer_phone?: string;
                    status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
                    created_at?: string;
                    updated_at?: string;
                };
            };
            blocked_times: {
                Row: {
                    id: string;
                    start_at: string;
                    end_at: string;
                    reason: string | null;
                };
                Insert: {
                    id?: string;
                    start_at: string;
                    end_at: string;
                    reason?: string | null;
                };
                Update: {
                    id?: string;
                    start_at?: string;
                    end_at?: string;
                    reason?: string | null;
                };
            };
        };
    };
}
