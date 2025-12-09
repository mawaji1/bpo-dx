import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/db';

export async function GET() {
    try {
        const config = await getConfig();
        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching config:', error);
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}
