'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import type { SlotData } from '../page';

interface TimeSlotPickerProps {
    slots: SlotData[];
    selectedDate: string;
    onSelect: (time: string) => void;
    onBack: () => void;
    selectedTime: string | null;
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

    const availableSlots = slots.filter((s) => s.available);
    const hasSlots = availableSlots.length > 0;

    return (
        <div className="space-y-6">
            {/* Header with back button */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
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
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Wähle eine Uhrzeit</h2>
                    <p className="text-[var(--secondary)] text-sm font-medium capitalize">
                        {dateFormatted}
                    </p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[var(--slot-free)]"></div>
                    <span>Frei</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[var(--slot-reserved)]"></div>
                    <span>Reserviert</span>
                </div>
            </div>

            {/* Time slots grid */}
            {hasSlots ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => {
                        const time = parseISO(slot.time);
                        const timeStr = format(time, 'HH:mm');
                        const isSelected = slot.time === selectedTime;

                        return (
                            <button
                                key={slot.time}
                                onClick={() => slot.available && onSelect(slot.time)}
                                disabled={!slot.available}
                                className={`
                  ${isSelected
                                        ? 'slot-free selected'
                                        : slot.status === 'free'
                                            ? 'slot-free'
                                            : slot.status === 'reserved'
                                                ? 'slot-reserved'
                                                : 'slot-blocked'
                                    }
                `}
                            >
                                {timeStr}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">😔</div>
                    <h3 className="text-lg font-semibold text-gray-700">
                        Keine freien Termine
                    </h3>
                    <p className="text-gray-500 mt-1">
                        An diesem Tag sind leider alle Termine vergeben.
                    </p>
                    <button onClick={onBack} className="btn-outline mt-4">
                        Anderen Tag wählen
                    </button>
                </div>
            )}

            {/* Selected time confirmation */}
            {selectedTime && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-bottom">
                    <div className="max-w-lg mx-auto">
                        <button
                            onClick={() => onSelect(selectedTime)}
                            className="btn-primary w-full text-lg"
                        >
                            Weiter mit {format(parseISO(selectedTime), 'HH:mm')} Uhr
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
