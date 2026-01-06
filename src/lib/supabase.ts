import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return !!(
        supabaseUrl &&
        supabaseUrl !== 'https://your-project.supabase.co' &&
        supabaseAnonKey &&
        supabaseAnonKey !== 'your-anon-key-here'
    );
}

// Create a mock client for when Supabase is not configured
const createMockClient = (): SupabaseClient => {
    const mockResponse = {
        data: null,
        error: { message: 'Supabase nicht konfiguriert', code: 'NOT_CONFIGURED' },
    };

    const chainableMock = new Proxy({} as any, {
        get: () => () => chainableMock,
    });

    // Override .single() and other terminal methods to return the mock response
    chainableMock.single = () => Promise.resolve(mockResponse);
    chainableMock.maybeSingle = () => Promise.resolve(mockResponse);
    chainableMock.then = (resolve: any) => Promise.resolve(mockResponse).then(resolve);

    return {
        from: () => chainableMock,
        auth: {} as any,
        storage: {} as any,
        functions: {} as any,
        realtime: {} as any,
        rest: {} as any,
        channel: () => ({} as any),
        getChannels: () => [],
        removeChannel: () => Promise.resolve('ok' as const),
        removeAllChannels: () => Promise.resolve([]),
    } as unknown as SupabaseClient;
};

// Browser client (for frontend)
export const supabase: SupabaseClient = isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMockClient();

// Server client with service role (for API routes - bypasses RLS)
export const supabaseAdmin: SupabaseClient = isSupabaseConfigured() && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : createMockClient();

// Appointment status enum
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

// Appointment type
export interface Appointment {
    id: string;
    start_at: string;
    end_at: string;
    duration_minutes: number;
    buffer_minutes: number;
    services: string[];
    customer_name: string;
    customer_phone: string;
    status: AppointmentStatus;
    created_at: string;
    updated_at: string;
}

// Blocked time type
export interface BlockedTime {
    id: string;
    start_at: string;
    end_at: string;
    reason: string | null;
}
