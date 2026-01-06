import {
    addDays,
    addMinutes,
    startOfDay,
    setHours,
    setMinutes,
    format,
    isAfter,
    isBefore,
    parseISO,
    eachDayOfInterval,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { CONFIG } from './config';
import { supabaseAdmin } from './supabase';

// Get current time in Berlin timezone
export function getNowInBerlin(): Date {
    return toZonedTime(new Date(), CONFIG.TIMEZONE);
}

// Convert Berlin time to UTC
export function berlinToUtc(date: Date): Date {
    return fromZonedTime(date, CONFIG.TIMEZONE);
}

// Convert UTC to Berlin time
export function utcToBerlin(date: Date): Date {
    return toZonedTime(date, CONFIG.TIMEZONE);
}

// Check if a date is within the booking window (now to now + 21 days)
export function isWithinBookingWindow(date: Date): boolean {
    const now = getNowInBerlin();
    const maxDate = addDays(now, CONFIG.BOOKING_WINDOW_DAYS);
    return isAfter(date, now) && isBefore(date, maxDate);
}

// Calculate appointment duration based on service count
export function calculateDuration(serviceCount: number): {
    duration: number;
    buffer: number;
    total: number;
} {
    const duration =
        serviceCount > CONFIG.SERVICE_THRESHOLD
            ? CONFIG.EXTENDED_DURATION_MINUTES
            : CONFIG.DEFAULT_DURATION_MINUTES;
    const buffer = CONFIG.BUFFER_MINUTES;
    return { duration, buffer, total: duration + buffer };
}

// Calculate end time for an appointment (including buffer)
export function calculateEndTime(startTime: Date, serviceCount: number): Date {
    const { total } = calculateDuration(serviceCount);
    return addMinutes(startTime, total);
}

// Get opening hours for a specific day
export function getOpeningHours(dayOfWeek: number): { start: string; end: string } | null {
    return CONFIG.OPENING_HOURS[dayOfWeek] || null;
}

// Generate time slots for a specific day
export function generateDaySlots(date: Date): Date[] {
    const dayOfWeek = date.getDay();
    const hours = getOpeningHours(dayOfWeek);

    if (!hours) {
        return []; // Closed on this day
    }

    const slots: Date[] = [];
    const [startHour, startMin] = hours.start.split(':').map(Number);
    const [endHour, endMin] = hours.end.split(':').map(Number);

    const dayStart = startOfDay(date);
    let slotTime = setMinutes(setHours(dayStart, startHour), startMin);
    const dayEnd = setMinutes(setHours(dayStart, endHour), endMin);

    // Generate slots at intervals, stopping when we can't fit a minimum appointment
    const minAppointmentDuration = CONFIG.DEFAULT_DURATION_MINUTES + CONFIG.BUFFER_MINUTES;

    while (addMinutes(slotTime, minAppointmentDuration) <= dayEnd) {
        slots.push(slotTime);
        slotTime = addMinutes(slotTime, CONFIG.SLOT_INTERVAL_MINUTES);
    }

    return slots;
}

// Time slot with availability info
export interface TimeSlot {
    time: string; // ISO string
    available: boolean;
    status?: 'free' | 'reserved' | 'blocked';
}

// Appointment type for slot checking
interface AppointmentSlot {
    start_at: string;
    end_at: string;
}

// Blocked time type for slot checking
interface BlockedTimeSlot {
    start_at: string;
    end_at: string;
}

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
    return !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co' &&
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key-here'
    );
}

// Get available slots for a date range
export async function getAvailableSlots(
    fromDate: string,
    toDate: string,
    requestedDuration?: number
): Promise<Record<string, TimeSlot[]>> {
    const from = parseISO(fromDate);
    const to = parseISO(toDate);
    const now = getNowInBerlin();

    let appointments: AppointmentSlot[] = [];
    let blockedTimes: BlockedTimeSlot[] = [];

    // Only query Supabase if configured
    if (isSupabaseConfigured()) {
        try {
            // Fetch existing appointments
            const { data: appointmentsData } = await supabaseAdmin
                .from('appointments')
                .select('start_at, end_at')
                .in('status', ['PENDING', 'CONFIRMED'])
                .gte('start_at', fromDate)
                .lte('start_at', toDate);

            // Fetch blocked times
            const { data: blockedTimesData } = await supabaseAdmin
                .from('blocked_times')
                .select('start_at, end_at')
                .gte('start_at', fromDate)
                .lte('end_at', toDate);

            appointments = appointmentsData || [];
            blockedTimes = blockedTimesData || [];
        } catch (error) {
            console.warn('Supabase query failed, using empty data:', error);
        }
    }

    const days = eachDayOfInterval({ start: from, end: to });
    const result: Record<string, TimeSlot[]> = {};

    const duration = requestedDuration || CONFIG.DEFAULT_DURATION_MINUTES + CONFIG.BUFFER_MINUTES;

    for (const day of days) {
        const dateKey = format(day, 'yyyy-MM-dd');
        const daySlots = generateDaySlots(day);

        result[dateKey] = daySlots.map((slotTime) => {
            const slotEnd = addMinutes(slotTime, duration);

            // Check if slot is in the past
            if (isBefore(slotTime, now)) {
                return { time: slotTime.toISOString(), available: false, status: 'blocked' as const };
            }

            // Check if slot overlaps with any appointment
            const hasConflict = appointments.some((apt) => {
                const aptStart = parseISO(apt.start_at);
                const aptEnd = parseISO(apt.end_at);
                return isBefore(slotTime, aptEnd) && isAfter(slotEnd, aptStart);
            });

            if (hasConflict) {
                return { time: slotTime.toISOString(), available: false, status: 'reserved' as const };
            }

            // Check if slot overlaps with blocked time
            const isBlocked = blockedTimes.some((bt) => {
                const btStart = parseISO(bt.start_at);
                const btEnd = parseISO(bt.end_at);
                return isBefore(slotTime, btEnd) && isAfter(slotEnd, btStart);
            });

            if (isBlocked) {
                return { time: slotTime.toISOString(), available: false, status: 'blocked' as const };
            }

            return { time: slotTime.toISOString(), available: true, status: 'free' as const };
        });
    }

    return result;
}

// Format date for display (German locale)
export function formatDateDisplay(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd.MM.yyyy');
}

// Format time for display
export function formatTimeDisplay(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'HH:mm');
}

// Get German weekday name
export function getWeekdayName(date: Date): string {
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return weekdays[date.getDay()];
}
