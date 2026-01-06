'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { de } from 'date-fns/locale';
import AppointmentCard from './components/AppointmentCard';

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

type TabType = 'pending' | 'today' | 'all';

export default function AdminDashboard() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const router = useRouter();

    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('adminToken');
    }, []);

    const fetchAppointments = useCallback(async () => {
        const token = getToken();
        if (!token) {
            router.push('/admin');
            return;
        }

        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (activeTab === 'pending') {
                params.set('status', 'PENDING');
            } else if (activeTab === 'today') {
                params.set('date', format(new Date(), 'yyyy-MM-dd'));
            }

            const response = await fetch(`/api/admin/appointments?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                localStorage.removeItem('adminToken');
                router.push('/admin');
                return;
            }

            if (!response.ok) {
                throw new Error('Fehler beim Laden');
            }

            const data = await response.json();
            setAppointments(data.appointments);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        } finally {
            setLoading(false);
        }
    }, [activeTab, getToken, router]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleAction = async (
        appointmentId: string,
        action: 'confirm' | 'reject' | 'cancel'
    ) => {
        const token = getToken();
        if (!token) return;

        setActionLoading(appointmentId);
        try {
            const response = await fetch(
                `/api/admin/appointments/${appointmentId}/${action}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Aktion fehlgeschlagen');
            }

            // Refresh appointments
            await fetchAppointments();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen');
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        router.push('/admin');
    };

    // Filter appointments based on tab
    const filteredAppointments = appointments.filter((apt) => {
        if (activeTab === 'pending') {
            return apt.status === 'PENDING';
        }
        if (activeTab === 'today') {
            return isToday(parseISO(apt.start_at));
        }
        return true;
    });

    // Sort: pending first, then by start time
    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    });

    const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-[var(--primary)] text-white py-4 px-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">✂️ Admin</h1>
                        <p className="text-xs text-gray-300">Terminverwaltung</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        Abmelden
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 sticky top-[72px] z-10">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors relative ${activeTab === 'pending'
                                    ? 'border-[var(--secondary)] text-[var(--secondary)]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Anfragen
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 right-1/4 bg-[var(--secondary)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('today')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'today'
                                    ? 'border-[var(--secondary)] text-[var(--secondary)]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Heute
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all'
                                    ? 'border-[var(--secondary)] text-[var(--secondary)]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Alle
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
                {/* Error */}
                {error && (
                    <div
                        className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm"
                        onClick={() => setError(null)}
                    >
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton h-32 rounded-xl"></div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && sortedAppointments.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">
                            {activeTab === 'pending' ? '🎉' : '📅'}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">
                            {activeTab === 'pending'
                                ? 'Keine offenen Anfragen'
                                : activeTab === 'today'
                                    ? 'Keine Termine heute'
                                    : 'Keine Termine vorhanden'}
                        </h3>
                        <p className="text-gray-500 mt-1">
                            {activeTab === 'pending'
                                ? 'Alle Anfragen wurden bearbeitet.'
                                : 'Es wurden noch keine Termine gebucht.'}
                        </p>
                    </div>
                )}

                {/* Appointments list */}
                {!loading && sortedAppointments.length > 0 && (
                    <div className="space-y-4">
                        {sortedAppointments.map((appointment) => (
                            <AppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                                onConfirm={() => handleAction(appointment.id, 'confirm')}
                                onReject={() => handleAction(appointment.id, 'reject')}
                                onCancel={() => handleAction(appointment.id, 'cancel')}
                                loading={actionLoading === appointment.id}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Refresh button */}
            <button
                onClick={fetchAppointments}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--primary-light)] transition-colors"
                disabled={loading}
            >
                <svg
                    className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                </svg>
            </button>
        </div>
    );
}
