'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import type { BookingData, AppointmentResult } from '../page';

interface SuccessViewProps {
    appointment: AppointmentResult;
    bookingData: BookingData;
}

export default function SuccessView({ appointment, bookingData }: SuccessViewProps) {
    const dateTimeFormatted = useMemo(() => {
        const date = parseISO(appointment.startAt);
        return format(date, "EEEE, d. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de });
    }, [appointment.startAt]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
            {/* Success header */}
            <div className="bg-[var(--success)] text-white py-12 px-4 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-2xl font-bold">Anfrage eingegangen!</h1>
                <p className="mt-2 opacity-90">
                    Wir melden uns bald bei dir.
                </p>
            </div>

            {/* Appointment details card */}
            <div className="max-w-lg mx-auto px-4 -mt-8 w-full">
                <div className="card p-6 space-y-4">
                    <div className="text-center pb-4 border-b border-gray-100">
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                            Dein Termin
                        </p>
                        <p className="text-xl font-bold text-gray-800 mt-1 capitalize">
                            {dateTimeFormatted}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">👤</span>
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-medium">{bookingData.customerName}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <span className="text-xl">📱</span>
                            <div>
                                <p className="text-sm text-gray-500">Telefon</p>
                                <p className="font-medium">{bookingData.customerPhone}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <span className="text-xl">✂️</span>
                            <div>
                                <p className="text-sm text-gray-500">Leistungen</p>
                                <p className="font-medium">
                                    {(appointment.services as string[]).join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status badge */}
                    <div className="pt-4 border-t border-gray-100 text-center">
                        <span className="badge-pending text-sm px-4 py-1.5">
                            ⏳ Warte auf Bestätigung
                        </span>
                    </div>
                </div>
            </div>

            {/* Info section */}
            <div className="max-w-lg mx-auto px-4 mt-6 w-full space-y-4">
                <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-xl">📲</span>
                    <div>
                        <p className="font-medium text-gray-800">SMS Benachrichtigung</p>
                        <p className="text-sm text-gray-600">
                            Du erhältst eine SMS, sobald dein Termin bestätigt oder geändert wird.
                        </p>
                    </div>
                </div>

                <div className="bg-yellow-50 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                        <p className="font-medium text-gray-800">Wichtig</p>
                        <p className="text-sm text-gray-600">
                            Dein Termin ist erst nach Bestätigung durch uns verbindlich.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto p-6 text-center">
                <a
                    href="/booking"
                    className="text-[var(--secondary)] font-medium hover:underline"
                >
                    ← Zur Startseite
                </a>
            </div>
        </div>
    );
}
