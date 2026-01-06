import type { Config, Context } from '@netlify/functions';

// Scheduled function that runs daily at midnight Europe/Berlin (23:00 UTC)
export default async (req: Request, context: Context) => {
    console.log('Running daily cleanup job...');

    try {
        // Call the cleanup API endpoint
        const baseUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/cron/cleanup`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.ADMIN_PASSWORD}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Cleanup failed:', data);
            return new Response(JSON.stringify({ error: 'Cleanup failed', details: data }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log('Cleanup completed:', data);
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        return new Response(JSON.stringify({ error: 'Cleanup error', message: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// Run at 23:00 UTC (00:00 Europe/Berlin in winter, 01:00 in summer)
// For exact midnight, you might need to adjust based on DST
export const config: Config = {
    schedule: '0 23 * * *',
};
