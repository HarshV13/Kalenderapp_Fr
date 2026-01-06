import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { password } = body;

        if (!password) {
            return NextResponse.json(
                { error: 'Passwort erforderlich' },
                { status: 400 }
            );
        }

        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error('ADMIN_PASSWORD environment variable not set');
            return NextResponse.json(
                { error: 'Server-Konfigurationsfehler' },
                { status: 500 }
            );
        }

        const isValid = password === adminPassword;

        if (!isValid) {
            return NextResponse.json(
                { error: 'Falsches Passwort' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            token: password, // In a real app, use proper JWT tokens
        });

    } catch (error) {
        console.error('Error in admin login:', error);
        return NextResponse.json(
            { error: 'Ein Fehler ist aufgetreten' },
            { status: 500 }
        );
    }
}
