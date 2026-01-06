import { NextResponse } from 'next/server';
import { supabaseAdmin, type Appointment } from '@/lib/supabase';
import { sendBookingRejection } from '@/lib/notify';
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

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Check admin authentication
    if (!(await isAuthenticated())) {
        return NextResponse.json(
            { error: 'Nicht autorisiert' },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const reason = body.reason || undefined;

        // Get the appointment first
        const { data, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !data) {
            return NextResponse.json(
                { error: 'Termin nicht gefunden' },
                { status: 404 }
            );
        }

        const appointment = data as unknown as Appointment;

        // Check if appointment can be rejected
        if (appointment.status !== 'PENDING') {
            return NextResponse.json(
                { error: `Termin kann nicht abgelehnt werden (Status: ${appointment.status})` },
                { status: 400 }
            );
        }

        // Update status to REJECTED
        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'REJECTED' })
            .eq('id', id);

        if (updateError) {
            console.error('Error rejecting appointment:', updateError);
            return NextResponse.json(
                { error: 'Fehler beim Ablehnen des Termins' },
                { status: 500 }
            );
        }

        // Send rejection SMS
        try {
            await sendBookingRejection(
                appointment.customer_phone,
                {
                    customerName: appointment.customer_name,
                    startAt: appointment.start_at,
                    services: appointment.services,
                },
                reason
            );
        } catch (smsError) {
            console.error('Failed to send rejection SMS:', smsError);
        }

        return NextResponse.json({
            success: true,
            message: 'Termin wurde abgelehnt',
            appointmentId: id,
        });

    } catch (error) {
        console.error('Error in reject appointment:', error);
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten' },
            { status: 500 }
        );
    }
}
