'use client';

import { useMemo } from 'react';
import { format, parseISO, setHours, setMinutes, startOfDay, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';

interface Appointment {
    id: string;
    start_at: string;
    end_at: string;
    customer_name: string;
    customer_phone: string;
    services: string[];
    status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
}

interface BlockedTime {
    id: string;
    start_at: string;
    end_at: string;
    reason: string | null;
}

interface TodayTimelineProps {
    appointments: Appointment[];
    blockedTimes: BlockedTime[];
    onUnblock: (id: string) => void;
}

export default function TodayTimeline({
    appointments,
    blockedTimes,
    onUnblock,
}: TodayTimelineProps) {
    const today = startOfDay(new Date());

    // Generate hours from 8:00 to 19:00
    const hours = useMemo(() => {
        const result = [];
        for (let h = 8; h <= 19; h++) {
            result.push(h);
        }
        return result;
    }, []);

    // Calculate position and height for an event
    const getEventStyle = (startAt: string, endAt: string) => {
        const start = parseISO(startAt);
        const end = parseISO(endAt);
        const startMinutes = start.getHours() * 60 + start.getMinutes() - 8 * 60; // Offset from 8:00
        const duration = (end.getTime() - start.getTime()) / (1000 * 60);

        return {
            top: `${(startMinutes / 60) * 60}px`,
            height: `${(duration / 60) * 60}px`,
        };
    };

    const statusColors = {
        CONFIRMED: 'bg-green-500',
        PENDING: 'bg-yellow-500',
        REJECTED: 'bg-red-400',
        CANCELLED: 'bg-gray-400',
    };

    if (appointments.length === 0 && blockedTimes.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-lg font-semibold text-gray-700">Keine Termine heute</h3>
                <p className="text-gray-500 mt-1">Der Tag ist frei!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
                📅 Heute, {format(today, 'd. MMMM', { locale: de })}
            </h3>

            <p className="text-sm text-gray-500">
                {appointments.length} Termin{appointments.length !== 1 ? 'e' : ''}
                {blockedTimes.length > 0 && ` · ${blockedTimes.length} blockiert`}
            </p>

            {/* Timeline container */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex">
                    {/* Time labels */}
                    <div className="w-14 flex-shrink-0 bg-gray-50 border-r border-gray-200">
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="h-[60px] border-b border-gray-100 px-2 py-1 text-xs text-gray-500 font-medium"
                            >
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Events area */}
                    <div className="flex-1 relative" style={{ height: `${hours.length * 60}px` }}>
                        {/* Hour grid lines */}
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="absolute left-0 right-0 border-b border-gray-100"
                                style={{ top: `${(hour - 8) * 60}px`, height: '60px' }}
                            />
                        ))}

                        {/* Blocked times */}
                        {blockedTimes.map((bt) => {
                            const style = getEventStyle(bt.start_at, bt.end_at);
                            return (
                                <div
                                    key={bt.id}
                                    className="absolute left-1 right-1 bg-gray-200 rounded-lg px-2 py-1 overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors"
                                    style={style}
                                    onClick={() => onUnblock(bt.id)}
                                    title="Klicken zum Entsperren"
                                >
                                    <p className="text-xs font-medium text-gray-600 truncate">
                                        🚫 {bt.reason || 'Blockiert'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {format(parseISO(bt.start_at), 'HH:mm')} - {format(parseISO(bt.end_at), 'HH:mm')}
                                    </p>
                                </div>
                            );
                        })}

                        {/* Appointments */}
                        {appointments.map((apt) => {
                            const style = getEventStyle(apt.start_at, apt.end_at);
                            return (
                                <div
                                    key={apt.id}
                                    className={`absolute left-1 right-1 ${statusColors[apt.status]} text-white rounded-lg px-2 py-1 overflow-hidden shadow-sm`}
                                    style={style}
                                >
                                    <p className="text-xs font-bold truncate">{apt.customer_name}</p>
                                    <p className="text-xs opacity-90">
                                        {format(parseISO(apt.start_at), 'HH:mm')} - {format(parseISO(apt.end_at), 'HH:mm')}
                                    </p>
                                    <p className="text-xs opacity-75 truncate">{apt.services.join(', ')}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Quick list view */}
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600 mt-6">Schnellübersicht</h4>
                {appointments.map((apt) => (
                    <div
                        key={apt.id}
                        className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200"
                    >
                        <div className={`w-2 h-2 rounded-full ${statusColors[apt.status]}`} />
                        <span className="text-sm font-medium text-gray-800">
                            {format(parseISO(apt.start_at), 'HH:mm')}
                        </span>
                        <span className="text-sm text-gray-600 flex-1 truncate">{apt.customer_name}</span>
                        <a
                            href={`tel:${apt.customer_phone}`}
                            className="text-xs text-[var(--secondary)] hover:underline"
                        >
                            📞 Anrufen
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
