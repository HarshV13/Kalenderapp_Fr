'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login fehlgeschlagen');
            }

            // Store token in localStorage
            localStorage.setItem('adminToken', data.token);
            router.push('/admin/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login fehlgeschlagen');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center p-4">
            <div className="card w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">✂️</div>
                    <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
                    <p className="text-gray-500 mt-1">Terminverwaltung</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="password" className="label">
                            Passwort
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Admin Passwort eingeben"
                            className="input"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={loading || !password}
                    >
                        {loading ? 'Wird geprüft...' : 'Anmelden'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <a
                        href="/booking"
                        className="text-sm text-gray-500 hover:text-[var(--secondary)]"
                    >
                        ← Zurück zur Buchungsseite
                    </a>
                </div>
            </div>
        </div>
    );
}
