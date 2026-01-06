'use client';

import { useState } from 'react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Appointment {
    id: string;
    start_at: string;
    end_at: string;
    duration_minutes: number;
    buffer_minutes: number;
    services: string[];
    customer_name: string;
    customer_phone: string;
    status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
    created_at: string;
}

interface AppointmentCardProps {
    appointment: Appointment;
    onConfirm: () => void;
    onReject: () => void;
    onCancel: () => void;
    loading: boolean;
}

const statusConfig = {
    PENDING: { label: 'Offen', class: 'badge-pending', icon: '⏳' },
    CONFIRMED: { label: 'Bestätigt', class: 'badge-confirmed', icon: '✅' },
    REJECTED: { label: 'Abgelehnt', class: 'badge-rejected', icon: '❌' },
    CANCELLED: { label: 'Storniert', class: 'badge-cancelled', icon: '🚫' },
};

export default function AppointmentCard({
    appointment,
    onConfirm,
    onReject,
    onCancel,
    loading,
}: AppointmentCardProps) {
    const [showActions, setShowActions] = useState(false);

    const startDate = parseISO(appointment.start_at);
    const dateFormatted = format(startDate, 'd. MMM', { locale: de });
    const timeFormatted = format(startDate, 'HH:mm');
    const weekday = format(startDate, 'EEEE', { locale: de });

    const status = statusConfig[appointment.status];
    const isPending = appointment.status === 'PENDING';
    const isActive = ['PENDING', 'CONFIRMED'].includes(appointment.status);

    const getDateLabel = () => {
        if (isToday(startDate)) return 'Heute';
        if (isTomorrow(startDate)) return 'Morgen';
        return weekday;
    };

    return (
        <div className="card overflow-hidden">
            {/* Card header */}
            <div
                className={`px-4 py-3 flex items-center justify-between ${isPending ? 'bg-yellow-50' : 'bg-gray-50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase">{getDateLabel()}</p>
                        <p className="text-lg font-bold text-gray-800">{dateFormatted}</p>
                    </div>
                    <div className="w-px h-10 bg-gray-300"></div>
                    <div>
                        <p className="text-2xl font-bold text-[var(--primary)]">
                            {timeFormatted}
                        </p>
                        <p className="text-xs text-gray-500">
                            {appointment.duration_minutes} Min.
                        </p>
                    </div>
                </div>
                <span className={status.class}>
                    {status.icon} {status.label}
                </span>
            </div>

            {/* Card body */}
            <div className="p-4 space-y-3">
                {/* Customer info */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                        👤
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                            {appointment.customer_name}
                        </p>
                        <a
                            href={`tel:${appointment.customer_phone}`}
                            className="text-sm text-[var(--secondary)] hover:underline"
                        >
                            📞 {appointment.customer_phone}
                        </a>
                    </div>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-1.5">
                    {(appointment.services as string[]).map((service, index) => (
                        <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                        >
                            {service}
                        </span>
                    ))}
                </div>

                {/* Actions */}
                {isActive && (
                    <div className="pt-3 border-t border-gray-100">
                        {isPending ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className="btn-success flex-1 text-sm py-2"
                                >
                                    {loading ? '...' : '✓ Bestätigen'}
                                </button>
                                <button
                                    onClick={onReject}
                                    disabled={loading}
                                    className="btn-danger flex-1 text-sm py-2"
                                >
                                    {loading ? '...' : '✗ Ablehnen'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowActions(!showActions)}
                                className="text-sm text-gray-500 hover:text-gray-700 w-full text-center py-1"
                            >
                                {showActions ? 'Aktionen ausblenden' : 'Aktionen anzeigen'}
                            </button>
                        )}

                        {showActions && !isPending && (
                            <div className="mt-2">
                                <button
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="btn-warning w-full text-sm py-2"
                                >
                                    {loading ? '...' : '🚫 Stornieren'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Created at footer */}
            <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 text-right">
                Angefragt am {format(parseISO(appointment.created_at), 'd.M.yy HH:mm')}
            </div>
        </div>
    );
}
