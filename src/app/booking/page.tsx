'use client';

import { useState, useEffect } from 'react';
import DatePicker from './components/DatePicker';
import TimeSlotPicker from './components/TimeSlotPicker';
import BookingForm from './components/BookingForm';
import Stepper from './components/Stepper';
import SuccessView from './components/SuccessView';

export interface BookingData {
    date: string | null;
    time: string | null;
    customerName: string;
    customerPhone: string;
    services: string[];
}

export interface SlotData {
    time: string;
    available: boolean;
    status: 'free' | 'reserved' | 'blocked';
}

export interface AppointmentResult {
    id: string;
    startAt: string;
    endAt: string;
    services: string[];
    status: string;
}

export default function BookingPage() {
    const [step, setStep] = useState(1);
    const [bookingData, setBookingData] = useState<BookingData>({
        date: null,
        time: null,
        customerName: '',
        customerPhone: '',
        services: [],
    });
    const [slots, setSlots] = useState<Record<string, SlotData[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [appointment, setAppointment] = useState<AppointmentResult | null>(null);

    // Fetch available slots on mount
    useEffect(() => {
        async function fetchSlots() {
            try {
                setLoading(true);
                const response = await fetch('/api/slots');
                if (!response.ok) {
                    throw new Error('Fehler beim Laden der Termine');
                }
                const data = await response.json();
                setSlots(data.slots);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
            } finally {
                setLoading(false);
            }
        }
        fetchSlots();
    }, []);

    const handleDateSelect = (date: string) => {
        setBookingData((prev) => ({ ...prev, date, time: null }));
        setStep(2);
    };

    const handleTimeSelect = (time: string) => {
        setBookingData((prev) => ({ ...prev, time }));
        setStep(3);
    };

    const handleFormSubmit = async (formData: {
        customerName: string;
        customerPhone: string;
        services: string[];
    }) => {
        setBookingData((prev) => ({ ...prev, ...formData }));

        try {
            setLoading(true);
            const response = await fetch('/api/appointments/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startAt: bookingData.time,
                    customerName: formData.customerName,
                    customerPhone: formData.customerPhone,
                    services: formData.services,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Buchung fehlgeschlagen');
            }

            setAppointment(data.appointment);
            setStep(4);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Buchung fehlgeschlagen');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const slotsForSelectedDate = bookingData.date ? slots[bookingData.date] || [] : [];

    // Success state
    if (step === 4 && appointment) {
        return <SuccessView appointment={appointment} bookingData={bookingData} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="bg-[var(--primary)] text-white py-6 px-4">
                <div className="max-w-lg mx-auto">
                    <h1 className="text-2xl font-bold text-center">✂️ Termin buchen</h1>
                    <p className="text-center text-gray-300 mt-1 text-sm">
                        Schnell & einfach online buchen
                    </p>
                </div>
            </header>

            {/* Stepper */}
            <div className="max-w-lg mx-auto px-4 py-6">
                <Stepper currentStep={step} totalSteps={3} />
            </div>

            {/* Content */}
            <main className="max-w-lg mx-auto px-4 pb-32">
                {/* Error toast */}
                {error && (
                    <div className="toast-error mb-4" onClick={() => setError(null)}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Loading state */}
                {loading && step !== 3 && (
                    <div className="space-y-4">
                        <div className="skeleton h-12 w-full"></div>
                        <div className="grid grid-cols-3 gap-2">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="skeleton h-12"></div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 1: Date Selection */}
                {!loading && step === 1 && (
                    <DatePicker
                        slots={slots}
                        onSelect={handleDateSelect}
                        selectedDate={bookingData.date}
                    />
                )}

                {/* Step 2: Time Selection */}
                {!loading && step === 2 && bookingData.date && (
                    <TimeSlotPicker
                        slots={slotsForSelectedDate}
                        selectedDate={bookingData.date}
                        onSelect={handleTimeSelect}
                        onBack={handleBack}
                        selectedTime={bookingData.time}
                    />
                )}

                {/* Step 3: Form */}
                {step === 3 && bookingData.time && (
                    <BookingForm
                        bookingData={bookingData}
                        onSubmit={handleFormSubmit}
                        onBack={handleBack}
                        loading={loading}
                    />
                )}
            </main>
        </div>
    );
}
