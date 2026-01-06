import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export async function GET() {
    return NextResponse.json({
        services: CONFIG.SERVICES,
        openingHours: CONFIG.OPENING_HOURS,
        bookingWindowDays: CONFIG.BOOKING_WINDOW_DAYS,
        durations: {
            default: CONFIG.DEFAULT_DURATION_MINUTES,
            extended: CONFIG.EXTENDED_DURATION_MINUTES,
            buffer: CONFIG.BUFFER_MINUTES,
            serviceThreshold: CONFIG.SERVICE_THRESHOLD,
        },
        slotInterval: CONFIG.SLOT_INTERVAL_MINUTES,
    });
}
