'use client';

import { useMemo } from 'react';
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import type { SlotData } from '../page';

interface DatePickerProps {
    slots: Record<string, SlotData[]>;
    onSelect: (date: string) => void;
    selectedDate: string | null;
}

const weekdayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export default function DatePicker({ slots, onSelect, selectedDate }: DatePickerProps) {
    // Generate dates for the next 21 days
    const dates = useMemo(() => {
        const today = startOfDay(new Date());
        return Array.from({ length: 21 }, (_, i) => {
            const date = addDays(today, i);
            const dateKey = format(date, 'yyyy-MM-dd');
            const daySlots = slots[dateKey] || [];
            const hasAvailable = daySlots.some((s) => s.available);

            return {
                date,
                dateKey,
                day: format(date, 'd'),
                weekday: weekdayNames[date.getDay()],
                month: format(date, 'MMM', { locale: de }),
                isToday: isToday(date),
                isTomorrow: isTomorrow(date),
                hasAvailable,
                isSelected: dateKey === selectedDate,
            };
        });
    }, [slots, selectedDate]);

    // Group dates by week
    const weeks = useMemo(() => {
        const result: (typeof dates)[] = [];
        for (let i = 0; i < dates.length; i += 7) {
            result.push(dates.slice(i, i + 7));
        }
        return result;
    }, [dates]);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">Wähle ein Datum</h2>
                <p className="text-gray-500 text-sm mt-1">
                    Termine sind bis zu 3 Wochen im Voraus verfügbar
                </p>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[var(--success)]"></div>
                    <span>Verfügbar</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <span>Ausgebucht</span>
                </div>
            </div>

            {/* Calendar grid */}
            <div className="space-y-4">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-2">
                        {week.map((d) => (
                            <button
                                key={d.dateKey}
                                onClick={() => d.hasAvailable && onSelect(d.dateKey)}
                                disabled={!d.hasAvailable}
                                className={`
                  flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200
                  min-h-[70px]
                  ${d.isSelected
                                        ? 'bg-[var(--secondary)] text-white ring-2 ring-[var(--secondary)] ring-offset-2'
                                        : d.hasAvailable
                                            ? 'bg-white border border-gray-200 hover:border-[var(--secondary)] hover:bg-pink-50'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }
                `}
                            >
                                <span className="text-[10px] uppercase font-medium opacity-70">
                                    {d.weekday}
                                </span>
                                <span className="text-lg font-bold">{d.day}</span>
                                {d.isToday && (
                                    <span className="text-[9px] font-medium text-[var(--secondary)]">
                                        Heute
                                    </span>
                                )}
                                {d.isTomorrow && !d.isToday && (
                                    <span className="text-[9px] font-medium text-gray-500">
                                        Morgen
                                    </span>
                                )}
                                {!d.isToday && !d.isTomorrow && (
                                    <span className="text-[9px] font-medium opacity-50">
                                        {d.month}
                                    </span>
                                )}
                                {d.hasAvailable && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] mt-0.5"></div>
                                )}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
