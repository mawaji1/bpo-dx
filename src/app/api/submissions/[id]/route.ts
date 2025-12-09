import { NextRequest, NextResponse } from 'next/server';
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

async function fetchSubmissionById(submissionId: string): Promise<ElmiyaarResult | null> {
    try {
        // Try API first
        const url = `${ELMIYAAR_API_URL}?apikey=${ELMIYAAR_API_KEY}&SchemaId=${ELMIYAAR_SCHEMA_ID}&Locale=default`;
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 }
        });

        if (response.ok) {
            const data = await response.json();
            const result = data.results?.find((r: ElmiyaarResult) => r.id === submissionId);
            if (result) return result;
        }
    } catch (error) {
        console.error('Failed to fetch from API:', error);
    }

    // Fallback to saved file
    try {
        const filePath = path.join(process.cwd(), '..', 'elmiyaar_results.json');
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return data.results?.find((r: ElmiyaarResult) => r.id === submissionId) || null;
        }
    } catch (error) {
        console.error('Failed to load from file:', error);
    }

    return null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const submission = await fetchSubmissionById(id);

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        const r = submission.result;

        // Parse full submission with all comments
        const parsed = {
            id: submission.id,
            projectName: r['اسم المشروع'] || '',
            programManager: r['مدير البرنامج'] || '',
            representative: r['ممثل المشروع'] || '',
            email: r['البريد الإلكتروني للتواصل'] || '',
            createdAt: submission.creationTime,
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

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('Error fetching submission:', error);
        return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
    }
}
