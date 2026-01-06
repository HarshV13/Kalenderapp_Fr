import { NextResponse } from 'next/server';
import { supabaseAdmin, type Appointment } from '@/lib/supabase';
import { sendBookingCancellation } from '@/lib/notify';
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

        // Check if appointment can be cancelled
        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
            return NextResponse.json(
                { error: `Termin kann nicht storniert werden (Status: ${appointment.status})` },
                { status: 400 }
            );
        }

        // Update status to CANCELLED
        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'CANCELLED' })
            .eq('id', id);

        if (updateError) {
            console.error('Error cancelling appointment:', updateError);
            return NextResponse.json(
                { error: 'Fehler beim Stornieren des Termins' },
                { status: 500 }
            );
        }

        // Send cancellation SMS
        try {
            await sendBookingCancellation(
                appointment.customer_phone,
                {
                    customerName: appointment.customer_name,
                    startAt: appointment.start_at,
                    services: appointment.services,
                },
                reason
            );
        } catch (smsError) {
            console.error('Failed to send cancellation SMS:', smsError);
        }

        return NextResponse.json({
            success: true,
            message: 'Termin wurde storniert',
            appointmentId: id,
        });

    } catch (error) {
        console.error('Error in cancel appointment:', error);
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten' },
            { status: 500 }
        );
    }
}
