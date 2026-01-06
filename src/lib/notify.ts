import twilio from 'twilio';
import { formatDateDisplay, formatTimeDisplay } from './time';
import { CONFIG } from './config';

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const fromNumber = process.env.TWILIO_PHONE_NUMBER;

interface AppointmentDetails {
    customerName: string;
    startAt: string;
    services: string[];
}

// Send SMS notification
async function sendSms(to: string, body: string): Promise<boolean> {
    if (!fromNumber) {
        console.error('TWILIO_PHONE_NUMBER not configured');
        return false;
    }

    try {
        await twilioClient.messages.create({
            body,
            from: fromNumber,
            to,
        });
        console.log(`SMS sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Failed to send SMS:', error);
        return false;
    }
}

// Get service names from IDs
function getServiceNames(serviceIds: string[]): string[] {
    return serviceIds.map((id) => {
        const service = CONFIG.SERVICES.find((s) => s.id === id);
        return service?.name || id;
    });
}

// Send booking request confirmation
export async function sendBookingRequestNotification(
    phone: string,
    details: AppointmentDetails
): Promise<boolean> {
    const date = formatDateDisplay(details.startAt);
    const time = formatTimeDisplay(details.startAt);
    const services = getServiceNames(details.services).join(', ');

    const message = `Hallo ${details.customerName}! Deine Terminanfrage ist eingegangen:\n\n📅 ${date} um ${time} Uhr\n✂️ ${services}\n\nWir melden uns bald bei dir!`;

    return sendSms(phone, message);
}

// Send booking confirmation
export async function sendBookingConfirmation(
    phone: string,
    details: AppointmentDetails
): Promise<boolean> {
    const date = formatDateDisplay(details.startAt);
    const time = formatTimeDisplay(details.startAt);
    const services = getServiceNames(details.services).join(', ');

    const message = `✅ Termin bestätigt!\n\nHallo ${details.customerName}!\n\n📅 ${date} um ${time} Uhr\n✂️ ${services}\n\nWir freuen uns auf dich!`;

    return sendSms(phone, message);
}

// Send booking rejection
export async function sendBookingRejection(
    phone: string,
    details: AppointmentDetails,
    reason?: string
): Promise<boolean> {
    const date = formatDateDisplay(details.startAt);
    const time = formatTimeDisplay(details.startAt);

    let message = `Hallo ${details.customerName}, leider können wir deinen Termin am ${date} um ${time} Uhr nicht bestätigen.`;

    if (reason) {
        message += `\n\nGrund: ${reason}`;
    }

    message += '\n\nBitte buche einen anderen Termin.';

    return sendSms(phone, message);
}

// Send booking cancellation
export async function sendBookingCancellation(
    phone: string,
    details: AppointmentDetails,
    reason?: string
): Promise<boolean> {
    const date = formatDateDisplay(details.startAt);
    const time = formatTimeDisplay(details.startAt);

    let message = `⚠️ Termin storniert\n\nHallo ${details.customerName}, dein Termin am ${date} um ${time} Uhr wurde storniert.`;

    if (reason) {
        message += `\n\nGrund: ${reason}`;
    }

    message += '\n\nBitte buche einen neuen Termin.';

    return sendSms(phone, message);
}

// Check if notifications are configured
export function isNotificationConfigured(): boolean {
    return !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
    );
}
