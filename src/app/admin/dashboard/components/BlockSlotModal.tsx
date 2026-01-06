'use client';

import { useState } from 'react';
import { format, addMinutes, parseISO, setHours, setMinutes, startOfDay } from 'date-fns';

interface BlockSlotModalProps {
    onClose: () => void;
    onBlock: (startAt: string, endAt: string, reason: string) => void;
}

export default function BlockSlotModal({ onClose, onBlock }: BlockSlotModalProps) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [date, setDate] = useState(today);
    const [startTime, setStartTime] = useState('09:00');
    const [duration, setDuration] = useState(60); // minutes
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const [hours, mins] = startTime.split(':').map(Number);
            const startDate = setMinutes(setHours(parseISO(date), hours), mins);
            const endDate = addMinutes(startDate, duration);

            await onBlock(
                startDate.toISOString(),
                endDate.toISOString(),
                reason
            );
        } catch (error) {
            console.error('Error blocking slot:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate time options (every 15 min from 08:00 to 19:00)
    const timeOptions: string[] = [];
    for (let h = 8; h < 20; h++) {
        for (let m = 0; m < 60; m += 15) {
            timeOptions.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">🚫 Zeit blockieren</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date */}
                    <div>
                        <label className="label">Datum</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={today}
                            className="input"
                            required
                        />
                    </div>

                    {/* Start time */}
                    <div>
                        <label className="label">Startzeit</label>
                        <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="input"
                            required
                        >
                            {timeOptions.map((t) => (
                                <option key={t} value={t}>
                                    {t} Uhr
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="label">Dauer</label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="input"
                        >
                            <option value={15}>15 Minuten</option>
                            <option value={30}>30 Minuten</option>
                            <option value={60}>1 Stunde</option>
                            <option value={120}>2 Stunden</option>
                            <option value={240}>4 Stunden</option>
                            <option value={480}>Ganzer Tag (8h)</option>
                        </select>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="label">Grund (optional)</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="z.B. Pause, Urlaub, Termin"
                            className="input"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-[var(--secondary)] text-white font-medium hover:bg-opacity-90 disabled:opacity-50"
                        >
                            {loading ? '...' : 'Blockieren'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
