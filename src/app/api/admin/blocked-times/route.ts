import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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

// GET - List blocked times
export async function GET(request: Request) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        let query = supabaseAdmin
            .from('blocked_times')
            .select('*')
            .order('start_at', { ascending: true });

        if (from) {
            query = query.gte('start_at', from);
        }
        if (to) {
            query = query.lte('end_at', to);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching blocked times:', error);
            return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
        }

        return NextResponse.json({ blockedTimes: data || [] });
    } catch (error) {
        console.error('Error in blocked times GET:', error);
        return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 });
    }
}

// POST - Create new blocked time
export async function POST(request: Request) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { startAt, endAt, reason } = body;

        if (!startAt || !endAt) {
            return NextResponse.json(
                { error: 'Start- und Endzeit erforderlich' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('blocked_times')
            .insert({
                start_at: startAt,
                end_at: endAt,
                reason: reason || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating blocked time:', error);
            return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
        }

        return NextResponse.json({ success: true, blockedTime: data }, { status: 201 });
    } catch (error) {
        console.error('Error in blocked times POST:', error);
        return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 });
    }
}

// DELETE - Remove blocked time
export async function DELETE(request: Request) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('blocked_times')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting blocked time:', error);
            return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in blocked times DELETE:', error);
        return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 });
    }
}
