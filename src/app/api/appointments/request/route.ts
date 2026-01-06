import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { bookingRequestSchema } from '@/lib/validation';
import { calculateDuration, isWithinBookingWindow } from '@/lib/time';
import { sendBookingRequestNotification } from '@/lib/notify';
import { parseISO, addMinutes } from 'date-fns';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate request body
        const validation = bookingRequestSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Ungültige Daten', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { startAt, customerName, customerPhone, services } = validation.data;
        const startTime = parseISO(startAt);

        // Check if within booking window
        if (!isWithinBookingWindow(startTime)) {
            return NextResponse.json(
                { error: 'Dieser Termin liegt außerhalb des Buchungszeitraums (max. 3 Wochen im Voraus)' },
                { status: 400 }
            );
        }

        // Calculate duration based on services
        const { duration, buffer, total } = calculateDuration(services.length);
        const endTime = addMinutes(startTime, total);

        // Check if customer already has an active booking
        const { data: existingBooking, error: checkError } = await supabaseAdmin
            .from('appointments')
            .select('id, start_at')
            .eq('customer_phone', customerPhone)
            .in('status', ['PENDING', 'CONFIRMED'])
            .gt('start_at', new Date().toISOString())
            .limit(1)
            .single();

        if (existingBooking) {
            return NextResponse.json(
                {
                    error: 'Du hast bereits einen aktiven Termin',
                    existingAppointment: {
                        id: existingBooking.id,
                        startAt: existingBooking.start_at,
                    }
                },
                { status: 409 }
            );
        }

        // Check for time slot conflicts (should be handled by DB constraint too, but check here for better UX)
        const { data: conflictingAppointment } = await supabaseAdmin
            .from('appointments')
            .select('id')
            .in('status', ['PENDING', 'CONFIRMED'])
            .lt('start_at', endTime.toISOString())
            .gt('end_at', startTime.toISOString())
            .limit(1)
            .single();

        if (conflictingAppointment) {
            return NextResponse.json(
                { error: 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wähle einen anderen.' },
                { status: 409 }
            );
        }

        // Create the appointment
        const { data: appointment, error: insertError } = await supabaseAdmin
            .from('appointments')
            .insert({
                start_at: startTime.toISOString(),
                end_at: endTime.toISOString(),
                duration_minutes: duration,
                buffer_minutes: buffer,
                services: services,
                customer_name: customerName,
                customer_phone: customerPhone,
                status: 'PENDING',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating appointment:', insertError);

            // Handle specific database constraint errors
            if (insertError.message.includes('overlapping')) {
                return NextResponse.json(
                    { error: 'Dieser Termin ist leider nicht mehr verfügbar.' },
                    { status: 409 }
                );
            }
            if (insertError.message.includes('duplicate') || insertError.message.includes('active booking')) {
                return NextResponse.json(
                    { error: 'Du hast bereits einen aktiven Termin.' },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { error: 'Fehler beim Erstellen des Termins. Bitte versuche es erneut.' },
                { status: 500 }
            );
        }

        // Send SMS notification (don't fail the request if SMS fails)
        try {
            await sendBookingRequestNotification(customerPhone, {
                customerName,
                startAt,
                services,
            });
        } catch (smsError) {
            console.error('Failed to send SMS notification:', smsError);
        }

        return NextResponse.json({
            success: true,
            appointment: {
                id: appointment.id,
                startAt: appointment.start_at,
                endAt: appointment.end_at,
                services: appointment.services,
                status: appointment.status,
            },
            message: 'Deine Terminanfrage wurde erfolgreich eingereicht!',
        }, { status: 201 });

    } catch (error) {
        console.error('Error in appointment request:', error);
        return NextResponse.json(
            { error: 'Ein unerwarteter Fehler ist aufgetreten' },
            { status: 500 }
        );
    }
}
