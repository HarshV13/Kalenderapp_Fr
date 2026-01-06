import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { adminFilterSchema } from '@/lib/validation';
import { headers } from 'next/headers';

// Simple admin auth check
async function isAuthenticated(): Promise<boolean> {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.substring(7);
    return token === process.env.ADMIN_PASSWORD;
}

export async function GET(request: Request) {
    // Check admin authentication
    if (!(await isAuthenticated())) {
        return NextResponse.json(
            { error: 'Nicht autorisiert' },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);

        const params = {
            date: searchParams.get('date') || undefined,
            status: searchParams.get('status') || undefined,
        };

        // Validate parameters
        const validation = adminFilterSchema.safeParse(params);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Ungültige Parameter', details: validation.error.issues },
                { status: 400 }
            );
        }

        // Build query
        let query = supabaseAdmin
            .from('appointments')
            .select('*')
            .order('start_at', { ascending: true });

        // Filter by date if specified
        if (validation.data.date) {
            const dateStart = `${validation.data.date}T00:00:00.000Z`;
            const dateEnd = `${validation.data.date}T23:59:59.999Z`;
            query = query.gte('start_at', dateStart).lte('start_at', dateEnd);
        }

        // Filter by status if specified
        if (validation.data.status) {
            query = query.eq('status', validation.data.status);
        }

        const { data: appointments, error } = await query;

        if (error) {
            console.error('Error fetching appointments:', error);
            return NextResponse.json(
                { error: 'Fehler beim Laden der Termine' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            appointments: appointments || [],
            count: appointments?.length || 0,
        });

    } catch (error) {
        console.error('Error in admin appointments:', error);
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten' },
            { status: 500 }
        );
    }
}
