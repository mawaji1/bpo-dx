import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/server-data';

export async function GET() {
    try {
        const config = getConfig();
        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}
