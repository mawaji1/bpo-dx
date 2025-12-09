import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'data', 'maturity-definitions.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const definitions = JSON.parse(fileContent);
        return NextResponse.json(definitions);
    } catch (error) {
        console.error('Error reading maturity definitions:', error);
        return NextResponse.json({ error: 'Failed to load definitions' }, { status: 500 });
    }
}
