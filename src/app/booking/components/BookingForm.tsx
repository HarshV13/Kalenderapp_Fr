'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import type { BookingData } from '../page';
import ServiceSelector from './ServiceSelector';

interface Service {
    id: string;
    name: string;
    description: string;
}

interface BookingFormProps {
    bookingData: BookingData;
    onSubmit: (data: { customerName: string; customerPhone: string; services: string[] }) => void;
    onBack: () => void;
    loading: boolean;
}

export default function BookingForm({ bookingData, onSubmit, onBack, loading }: BookingFormProps) {
    const [name, setName] = useState(bookingData.customerName);
    const [phone, setPhone] = useState(bookingData.customerPhone);
    const [services, setServices] = useState<string[]>(bookingData.services);
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch available services
    useEffect(() => {
        async function fetchConfig() {
            try {
                const response = await fetch('/api/config');
                const data = await response.json();
                setAvailableServices(data.services);
            } catch (err) {
                console.error('Failed to fetch config:', err);
            }
        }
        fetchConfig();
    }, []);

    const dateTimeFormatted = bookingData.time
        ? format(parseISO(bookingData.time), "EEEE, d. MMMM 'um' HH:mm 'Uhr'", { locale: de })
        : '';

    // Calculate duration based on services
    const getDuration = () => {
        if (services.length > 3) {
            return { duration: 60, buffer: 5, text: '60 Min. (+5 Min. Puffer)' };
        }
        return { duration: 45, buffer: 5, text: '45 Min. (+5 Min. Puffer)' };
    };

    const duration = getDuration();

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim() || name.trim().length < 2) {
            newErrors.name = 'Bitte gib deinen Namen ein (min. 2 Zeichen)';
        }

        // Basic phone validation
        const phoneClean = phone.replace(/\s|-/g, '');
        if (!phoneClean || phoneClean.length < 7) {
            newErrors.phone = 'Bitte gib eine gültige Telefonnummer ein';
        }

        if (services.length === 0) {
            newErrors.services = 'Bitte wähle mindestens eine Leistung';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit({ customerName: name.trim(), customerPhone: phone, services });
        }
    };

    const toggleService = (serviceId: string) => {
        setServices((prev) =>
            prev.includes(serviceId)
                ? prev.filter((s) => s !== serviceId)
                : [...prev, serviceId]
        );
        // Clear services error when selecting
        if (errors.services) {
            setErrors((prev) => ({ ...prev, services: '' }));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with back button */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    disabled={loading}
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
                    <h2 className="text-xl font-bold text-gray-800">Deine Daten</h2>
                    <p className="text-[var(--secondary)] text-sm font-medium capitalize">
                        {dateTimeFormatted}
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name input */}
                <div>
                    <label htmlFor="name" className="label">
                        Dein Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        placeholder="Max Mustermann"
                        className={`input ${errors.name ? 'border-[var(--error)]' : ''}`}
                        disabled={loading}
                    />
                    {errors.name && (
                        <p className="text-sm text-[var(--error)] mt-1">{errors.name}</p>
                    )}
                </div>

                {/* Phone input */}
                <div>
                    <label htmlFor="phone" className="label">
                        Telefonnummer *
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => {
                            setPhone(e.target.value);
                            if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        placeholder="0176 12345678"
                        className={`input ${errors.phone ? 'border-[var(--error)]' : ''}`}
                        disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Für Terminbestätigung per SMS
                    </p>
                    {errors.phone && (
                        <p className="text-sm text-[var(--error)] mt-1">{errors.phone}</p>
                    )}
                </div>

                {/* Services */}
                <div>
                    <label className="label">Was wird gemacht? *</label>
                    <ServiceSelector
                        services={availableServices}
                        selectedServices={services}
                        onToggle={toggleService}
                        disabled={loading}
                    />
                    {errors.services && (
                        <p className="text-sm text-[var(--error)] mt-1">{errors.services}</p>
                    )}
                </div>

                {/* Duration info */}
                {services.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                        <span className="text-2xl">⏱️</span>
                        <div>
                            <p className="font-medium text-gray-800">Geschätzte Dauer</p>
                            <p className="text-sm text-gray-600">{duration.text}</p>
                            {services.length > 3 && (
                                <p className="text-xs text-blue-600 mt-1">
                                    +15 Min. da mehr als 3 Leistungen gewählt
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Privacy notice */}
                <p className="text-xs text-gray-500 text-center">
                    Mit der Buchung stimmst du der Speicherung deiner Daten zur
                    Terminverwaltung zu. Deine Daten werden nach dem Termin automatisch
                    gelöscht.
                </p>

                {/* Submit button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-bottom">
                    <div className="max-w-lg mx-auto">
                        <button
                            type="submit"
                            className="btn-primary w-full text-lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Wird gesendet...
                                </span>
                            ) : (
                                'Termin anfragen'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
