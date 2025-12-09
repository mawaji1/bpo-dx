import { NextResponse } from 'next/server';
import { getProjects, getEvaluations } from '@/lib/server-data';
import fs from 'fs';
import path from 'path';

// Elmiyaar API configuration
const ELMIYAAR_API_URL = 'https://elmiyaar.bpo-hq.com/api/app/data/results';
const ELMIYAAR_API_KEY = 'efbr_e602bd1c585f4abab7adc2370802ad6b';
const ELMIYAAR_SCHEMA_ID = '3a1dadc4-e9b7-6e8e-cfc2-22c11ed95866';

interface ElmiyaarResult {
    id: string;
    creationTime: string;
    result: Record<string, string>;
}

async function fetchFromElmiyaar(): Promise<ElmiyaarResult[]> {
    try {
        const url = `${ELMIYAAR_API_URL}?apikey=${ELMIYAAR_API_KEY}&SchemaId=${ELMIYAAR_SCHEMA_ID}&Locale=default`;
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!response.ok) {
            throw new Error(`Elmiyaar API error: ${response.status}`);
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Failed to fetch from Elmiyaar API, falling back to saved data:', error);
        // Fallback to saved file
        return loadFromSavedFile();
    }
}

function loadFromSavedFile(): ElmiyaarResult[] {
    try {
        const filePath = path.join(process.cwd(), '..', 'elmiyaar_results.json');
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return data.results || [];
        }
    } catch (error) {
        console.error('Failed to load from saved file:', error);
    }
    return [];
}

function parseSubmission(result: ElmiyaarResult) {
    const r = result.result;
    return {
        id: result.id,
        projectName: r['اسم المشروع'] || 'بدون اسم',
        programManager: r['مدير البرنامج'] || '',
        representative: r['ممثل المشروع'] || '',
        email: r['البريد الإلكتروني للتواصل'] || '',
        createdAt: result.creationTime,
        scores: {
            strategic: parseInt(r['أي من الأوصاف التالية يعكس وضع مشروعكم الحالي في <b>البعد الاستراتيجي</b>؟'] || '0'),
            operations: parseInt(r['أي من الأوصاف التالية يعكس وضع مشروعكم الحالي في <b>العمليات الرقمية</b>؟'] || '0'),
            technology: parseInt(r['أي من الأوصاف التالية يعكس وضع مشروعكم الحالي في <b>التقنيات والأدوات</b>؟'] || '0'),
            data: parseInt(r['أي من الأوصاف التالية يعكس وضع مشروعكم الحالي في <b>البيانات والتحليلات</b>؟'] || '0'),
            customerExperience: parseInt(r['أي من الأوصاف التالية يعكس وضع مشروعكم الحالي في <b>تجربة العملاء وأصحاب المصلحة</b>؟'] || '0')
        },
        comments: {
            strategic: r['لماذا اخترتم هذا الوصف؟ يرجى توضيح أمثلة أو ممارسات تعكس الوضع الحالي.'] || '',
            operations: r['لماذا اخترتم هذا الوصف؟'] || '',
            overall: r['هل لديكم أي ملاحظات إضافية حول مقياس النضج أو طريقة التقييم؟'] || ''
        }
    };
}

export async function GET() {
    try {
        // Fetch from elmiyaar API (with fallback to saved file)
        const elmiyaarResults = await fetchFromElmiyaar();

        const projects = getProjects();
        const evaluations = getEvaluations();

        // Get list of submission IDs that are already mapped
        const mappedSubmissionIds = new Set([
            ...projects.filter(p => p.submissionId).map(p => p.submissionId),
            ...evaluations.map(e => e.submissionId)
        ]);

        // Parse and return submissions with mapped status
        const submissions = elmiyaarResults
            .filter(r => r.result && r.result['اسم المشروع']) // Filter out invalid entries
            .map(result => ({
                ...parseSubmission(result),
                mapped: mappedSubmissionIds.has(result.id)
            }));

        return NextResponse.json(submissions);
    } catch (error) {
        console.error('Error in submissions API:', error);
        return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }
}
