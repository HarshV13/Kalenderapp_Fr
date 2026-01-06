import { z } from 'zod';

// Phone number validation (E.164 format or German format)
const phoneRegex = /^(\+49|0049|0)?[1-9]\d{6,14}$/;

// Booking request schema
export const bookingRequestSchema = z.object({
    startAt: z.string().datetime({ message: 'Ungültiges Datum' }),
    customerName: z
        .string()
        .min(2, 'Name muss mindestens 2 Zeichen haben')
        .max(100, 'Name darf maximal 100 Zeichen haben')
        .trim(),
    customerPhone: z
        .string()
        .regex(phoneRegex, 'Bitte gib eine gültige Telefonnummer ein')
        .transform((val) => {
            // Normalize to E.164 format for Germany
            let normalized = val.replace(/\s|-/g, '');
            if (normalized.startsWith('0049')) {
                normalized = '+49' + normalized.slice(4);
            } else if (normalized.startsWith('0')) {
                normalized = '+49' + normalized.slice(1);
            } else if (!normalized.startsWith('+')) {
                normalized = '+49' + normalized;
            }
            return normalized;
        }),
    services: z
        .array(z.string())
        .min(1, 'Bitte wähle mindestens eine Leistung')
        .max(10, 'Maximal 10 Leistungen möglich'),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

// Admin action schemas
export const appointmentIdSchema = z.object({
    id: z.string().uuid('Ungültige Termin-ID'),
});

export type AppointmentId = z.infer<typeof appointmentIdSchema>;

// Date range schema for slots query
export const dateRangeSchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat (YYYY-MM-DD)'),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat (YYYY-MM-DD)'),
});

export type DateRange = z.infer<typeof dateRangeSchema>;

// Admin filter schema
export const adminFilterSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED']).optional(),
});

export type AdminFilter = z.infer<typeof adminFilterSchema>;
