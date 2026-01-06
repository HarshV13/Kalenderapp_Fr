import { NextResponse } from 'next/server';
import { supabaseAdmin, type Appointment } from '@/lib/supabase';
import { sendBookingConfirmation } from '@/lib/notify';
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

        // Check if appointment can be confirmed
        if (appointment.status !== 'PENDING') {
            return NextResponse.json(
                { error: `Termin kann nicht bestätigt werden (Status: ${appointment.status})` },
                { status: 400 }
            );
        }

        // Update status to CONFIRMED
        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'CONFIRMED' })
            .eq('id', id);

        if (updateError) {
            console.error('Error confirming appointment:', updateError);
            return NextResponse.json(
                { error: 'Fehler beim Bestätigen des Termins' },
                { status: 500 }
            );
        }

        // Send confirmation SMS
        try {
            await sendBookingConfirmation(appointment.customer_phone, {
                customerName: appointment.customer_name,
                startAt: appointment.start_at,
                services: appointment.services,
            });
        } catch (smsError) {
            console.error('Failed to send confirmation SMS:', smsError);
        }

        return NextResponse.json({
            success: true,
            message: 'Termin wurde bestätigt',
            appointmentId: id,
        });

    } catch (error) {
        console.error('Error in confirm appointment:', error);
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten' },
            { status: 500 }
        );
    }
}
