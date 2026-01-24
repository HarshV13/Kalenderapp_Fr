'use client';

import { useMemo } from 'react';
import { format, parseISO, getHours } from 'date-fns';
import { de } from 'date-fns/locale';
import type { SlotData } from '../page';

interface TimeSlotPickerProps {
    slots: SlotData[];
    selectedDate: string;
    onSelect: (time: string) => void;
    onBack: () => void;
    selectedTime: string | null;
}

interface GroupedSlots {
    morning: SlotData[];
    afternoon: SlotData[];
}

export default function TimeSlotPicker({
    slots,
    selectedDate,
    onSelect,
    onBack,
    selectedTime,
}: TimeSlotPickerProps) {
    const dateFormatted = useMemo(() => {
        const date = parseISO(selectedDate);
        return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
    }, [selectedDate]);

    // Only show available slots
    const availableSlots = slots.filter((s) => s.available);
    const hasSlots = availableSlots.length > 0;

    // Group slots by time of day
    const groupedSlots = useMemo((): GroupedSlots => {
        const groups: GroupedSlots = {
            morning: [],
            afternoon: [],
        };

        availableSlots.forEach((slot) => {
            const hour = getHours(parseISO(slot.time));
            if (hour < 12) {
                groups.morning.push(slot);
            } else {
                groups.afternoon.push(slot);
            }
        });

        return groups;
    }, [availableSlots]);

    const renderSlotButton = (slot: SlotData) => {
        const time = parseISO(slot.time);
        const timeStr = format(time, 'HH:mm');
        const isSelected = slot.time === selectedTime;

        return (
            <button
                key={slot.time}
                onClick={() => onSelect(slot.time)}
                className={`
                    relative min-h-[52px] px-2 py-3 rounded-xl font-semibold text-base
                    transition-all duration-150 ease-out active:scale-95
                    ${isSelected
                        ? 'bg-gradient-to-r from-[var(--secondary)] to-[#ff6b7d] text-white shadow-lg shadow-[var(--secondary)]/30 scale-[1.02]'
                        : 'bg-white border-2 border-gray-100 text-gray-700 active:bg-gray-50'
                    }
                `}
            >
                <span className="relative z-10">{timeStr}</span>
                {isSelected && (
                    <span className="absolute inset-0 rounded-xl bg-white/20" />
                )}
            </button>
        );
    };

    const renderTimeGroup = (title: string, icon: React.ReactNode, slots: SlotData[], gradient: string) => {
        if (slots.length === 0) return null;

        return (
            <div className="space-y-2.5">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${gradient}`}>
                    {icon}
                    <span className="font-semibold text-sm">{title}</span>
                    <span className="ml-auto text-xs opacity-70">{slots.length} verfügbar</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {slots.map(renderSlotButton)}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4 pb-24">
            {/* Header with back button - mobile optimized */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="w-11 h-11 shrink-0 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                    <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-800 truncate">
                        Wähle eine Uhrzeit
                    </h2>
                    <p className="text-[var(--secondary)] text-sm font-medium capitalize flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{dateFormatted}</span>
                    </p>
                </div>
            </div>

            {/* Stats pill - compact for mobile */}
            <div className="flex justify-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-700">
                        {availableSlots.length} freie Termine
                    </span>
                </div>
            </div>

            {/* Time slots grouped by time of day */}
            {hasSlots ? (
                <div className="space-y-4">
                    {renderTimeGroup(
                        'Vormittag',
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>,
                        groupedSlots.morning,
                        'bg-amber-50/80 text-amber-800'
                    )}
                    {renderTimeGroup(
                        'Nachmittag',
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>,
                        groupedSlots.afternoon,
                        'bg-blue-50/80 text-blue-800'
                    )}
                </div>
            ) : (
                <div className="text-center py-10 px-4 rounded-2xl bg-gray-50">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-700">
                        Keine freien Termine
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 mb-5">
                        Alle Termine sind vergeben.
                    </p>
                    <button onClick={onBack} className="btn-outline text-sm py-2.5 px-5">
                        Anderen Tag wählen
                    </button>
                </div>
            )}

            {/* Selected time confirmation - mobile optimized */}
            {selectedTime && (
                <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white/95 backdrop-blur-lg border-t border-gray-100 safe-bottom shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
                    <button
                        onClick={() => onSelect(selectedTime)}
                        className="w-full py-3.5 px-5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-[var(--secondary)] to-[#ff6b7d] active:scale-[0.98] shadow-md shadow-[var(--secondary)]/25 transition-transform flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Weiter mit {format(parseISO(selectedTime), 'HH:mm')} Uhr
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
