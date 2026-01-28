'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, isToday, isTomorrow, startOfDay, endOfDay, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import AppointmentCard from './components/AppointmentCard';
import BlockSlotModal from './components/BlockSlotModal';
import TodayTimeline from './components/TodayTimeline';

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

interface BlockedTime {
    id: string;
    start_at: string;
    end_at: string;
    reason: string | null;
}

type TabType = 'pending' | 'today' | 'all';
type TodayFilter = 'all' | 'confirmed' | 'pending';

export default function AdminDashboard() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showBlockModal, setShowBlockModal] = useState(false);

    // Today tab filters
    const [todayFilter, setTodayFilter] = useState<TodayFilter>('confirmed');

    // All tab filters
    const [allStatusFilter, setAllStatusFilter] = useState<string[]>(['CONFIRMED', 'PENDING']);
    const [allDateFrom, setAllDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [allDateTo, setAllDateTo] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
    const [searchQuery, setSearchQuery] = useState('');

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
            const response = await fetch('/api/admin/appointments', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 401) {
                localStorage.removeItem('adminToken');
                router.push('/admin');
                return;
            }

            if (!response.ok) throw new Error('Fehler beim Laden');
            const data = await response.json();
            setAppointments(data.appointments);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        } finally {
            setLoading(false);
        }
    }, [getToken, router]);

    const fetchBlockedTimes = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/admin/blocked-times', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setBlockedTimes(data.blockedTimes);
            }
        } catch (err) {
            console.error('Error fetching blocked times:', err);
        }
    }, [getToken]);

    useEffect(() => {
        fetchAppointments();
        fetchBlockedTimes();
    }, [fetchAppointments, fetchBlockedTimes]);

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

            await fetchAppointments();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlockSlot = async (startAt: string, endAt: string, reason: string) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/admin/blocked-times', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ startAt, endAt, reason }),
            });

            if (!response.ok) throw new Error('Fehler beim Blockieren');

            await fetchBlockedTimes();
            await fetchAppointments();
            setShowBlockModal(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Fehler');
        }
    };

    const handleUnblockSlot = async (id: string) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`/api/admin/blocked-times?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Fehler beim Entsperren');

            await fetchBlockedTimes();
            await fetchAppointments();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Fehler');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        router.push('/admin');
    };

    // Statistics
    const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
    const todayAppointments = appointments.filter((a) => isToday(parseISO(a.start_at)));
    const todayConfirmed = todayAppointments.filter((a) => a.status === 'CONFIRMED').length;
    const todayPending = todayAppointments.filter((a) => a.status === 'PENDING').length;

    // Filter appointments for each tab
    const getFilteredAppointments = () => {
        if (activeTab === 'pending') {
            return appointments
                .filter((a) => a.status === 'PENDING')
                .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
        }

        if (activeTab === 'today') {
            let filtered = todayAppointments;
            if (todayFilter === 'confirmed') {
                filtered = filtered.filter((a) => a.status === 'CONFIRMED');
            } else if (todayFilter === 'pending') {
                filtered = filtered.filter((a) => a.status === 'PENDING');
            }
            return filtered.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
        }

        if (activeTab === 'all') {
            let filtered = appointments.filter((a) => {
                const date = parseISO(a.start_at);
                const from = startOfDay(parseISO(allDateFrom));
                const to = endOfDay(parseISO(allDateTo));
                return date >= from && date <= to;
            });

            if (allStatusFilter.length > 0) {
                filtered = filtered.filter((a) => allStatusFilter.includes(a.status));
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(
                    (a) =>
                        a.customer_name.toLowerCase().includes(query) ||
                        a.customer_phone.includes(query)
                );
            }

            return filtered.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
        }

        return [];
    };

    const filteredAppointments = getFilteredAppointments();

    // Today's blocked times
    const todayBlockedTimes = blockedTimes.filter((bt) => isToday(parseISO(bt.start_at)));

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-[var(--primary)] text-white py-4 px-4 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">✂️ Admin Panel</h1>
                        <p className="text-xs text-gray-300">Terminverwaltung</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowBlockModal(true)}
                            className="text-sm bg-[var(--secondary)] px-3 py-1.5 rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            🚫 Blockieren
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-sm bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            Abmelden
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="bg-white border-b border-gray-200 py-3 px-4">
                <div className="max-w-4xl mx-auto flex justify-around text-center">
                    <div>
                        <p className="text-2xl font-bold text-[var(--warning)]">{pendingCount}</p>
                        <p className="text-xs text-gray-500">Offene Anfragen</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-[var(--success)]">{todayConfirmed}</p>
                        <p className="text-xs text-gray-500">Heute bestätigt</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-600">{todayPending}</p>
                        <p className="text-xs text-gray-500">Heute offen</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 sticky top-[72px] z-10">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex">
                        {(['pending', 'today', 'all'] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors relative ${activeTab === tab
                                        ? 'border-[var(--secondary)] text-[var(--secondary)]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab === 'pending' && 'Anfragen'}
                                {tab === 'today' && 'Heute'}
                                {tab === 'all' && 'Alle'}
                                {tab === 'pending' && pendingCount > 0 && (
                                    <span className="absolute -top-1 right-1/4 bg-[var(--secondary)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab-specific filters */}
            {activeTab === 'today' && (
                <div className="bg-gray-100 py-2 px-4 border-b border-gray-200">
                    <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto">
                        {(['confirmed', 'pending', 'all'] as TodayFilter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setTodayFilter(f)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${todayFilter === f
                                        ? 'bg-[var(--secondary)] text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {f === 'confirmed' && '✅ Nur Bestätigt'}
                                {f === 'pending' && '⏳ Nur Offen'}
                                {f === 'all' && '📋 Alle'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'all' && (
                <div className="bg-gray-100 py-3 px-4 border-b border-gray-200 space-y-2">
                    <div className="max-w-4xl mx-auto">
                        {/* Date range */}
                        <div className="flex gap-2 mb-2">
                            <input
                                type="date"
                                value={allDateFrom}
                                onChange={(e) => setAllDateFrom(e.target.value)}
                                className="flex-1 px-2 py-1 rounded border text-sm"
                            />
                            <span className="text-gray-400 self-center">–</span>
                            <input
                                type="date"
                                value={allDateTo}
                                onChange={(e) => setAllDateTo(e.target.value)}
                                className="flex-1 px-2 py-1 rounded border text-sm"
                            />
                        </div>
                        {/* Search */}
                        <input
                            type="text"
                            placeholder="🔍 Name oder Telefon suchen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 rounded border text-sm"
                        />
                        {/* Status filter */}
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {['CONFIRMED', 'PENDING', 'REJECTED', 'CANCELLED'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        if (allStatusFilter.includes(status)) {
                                            setAllStatusFilter(allStatusFilter.filter((s) => s !== status));
                                        } else {
                                            setAllStatusFilter([...allStatusFilter, status]);
                                        }
                                    }}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${allStatusFilter.includes(status)
                                            ? status === 'CONFIRMED'
                                                ? 'bg-green-500 text-white'
                                                : status === 'PENDING'
                                                    ? 'bg-yellow-500 text-white'
                                                    : status === 'REJECTED'
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-gray-500 text-white'
                                            : 'bg-white text-gray-600'
                                        }`}
                                >
                                    {status === 'CONFIRMED' && '✅ Bestätigt'}
                                    {status === 'PENDING' && '⏳ Offen'}
                                    {status === 'REJECTED' && '❌ Abgelehnt'}
                                    {status === 'CANCELLED' && '🚫 Storniert'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
                {/* Error */}
                {error && (
                    <div
                        className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm cursor-pointer"
                        onClick={() => setError(null)}
                    >
                        {error} (Klicken zum Schließen)
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

                {/* Today Tab - Timeline View */}
                {!loading && activeTab === 'today' && (
                    <TodayTimeline
                        appointments={filteredAppointments}
                        blockedTimes={todayBlockedTimes}
                        onUnblock={handleUnblockSlot}
                    />
                )}

                {/* Pending & All Tabs - Card View */}
                {!loading && activeTab !== 'today' && (
                    <>
                        {filteredAppointments.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">
                                    {activeTab === 'pending' ? '🎉' : '📅'}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-700">
                                    {activeTab === 'pending'
                                        ? 'Keine offenen Anfragen'
                                        : 'Keine Termine gefunden'}
                                </h3>
                                <p className="text-gray-500 mt-1">
                                    {activeTab === 'pending'
                                        ? 'Alle Anfragen wurden bearbeitet.'
                                        : 'Passe die Filter an um Termine zu finden.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500 mb-2">
                                    {filteredAppointments.length} Termin{filteredAppointments.length !== 1 ? 'e' : ''}
                                </p>
                                {filteredAppointments.map((appointment) => (
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
                    </>
                )}
            </main>

            {/* Refresh button */}
            <button
                onClick={() => {
                    fetchAppointments();
                    fetchBlockedTimes();
                }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--primary-light)] transition-colors z-30"
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

            {/* Block Slot Modal */}
            {showBlockModal && (
                <BlockSlotModal
                    onClose={() => setShowBlockModal(false)}
                    onBlock={handleBlockSlot}
                />
            )}
        </div>
    );
}
