import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface Assessment {
    strategic: number;
    operations: number;
    technology: number;
    data: number;
    customerExperience: number;
}

interface ProjectInfo {
    name: string;
    department: string;
    programManager: string;
}

const pillarDescriptions: Record<string, { name: string; levels: Record<number, string> }> = {
    strategic: {
        name: 'البعد الاستراتيجي',
        levels: {
            1: 'مبادرات رقمية منفصلة بدون خطة استراتيجية',
            2: 'وجود خطة غير مرتبطة بأهداف المشروع',
            3: 'خارطة طريق مرتبطة ببعض الأهداف',
            4: 'خطة متكاملة مع متابعة دورية',
            5: 'توجه استراتيجي مستدام مع قياس الأثر'
        }
    },
    operations: {
        name: 'العمليات الرقمية',
        levels: {
            1: 'إجراءات يدوية ورقية',
            2: 'نماذج رقمية وأدوات محدودة',
            3: 'عمليات موحدة عبر الأنظمة',
            4: 'أتمتة متكاملة من طرف لطرف',
            5: 'عمليات مدعومة بالذكاء الاصطناعي'
        }
    },
    technology: {
        name: 'التقنيات والأدوات',
        levels: {
            1: 'أنظمة قديمة والاعتماد على الجداول',
            2: 'أدوات رقمية منفصلة وغير متكاملة',
            3: 'حلول متكاملة (ERP/CRM)',
            4: 'تقنيات سحابية وواجهات API',
            5: 'منظومة ذكية مع AI وIoT'
        }
    },
    data: {
        name: 'البيانات والتحليلات',
        levels: {
            1: 'بيانات مشتتة وغير متناسقة',
            2: 'مستودع بيانات مركزي',
            3: 'تقارير ولوحات متابعة أساسية',
            4: 'تحليلات تنبؤية ومؤشرات أداء',
            5: 'تحليلات توجيهية مدعومة بالAI'
        }
    },
    customerExperience: {
        name: 'تجربة العملاء',
        levels: {
            1: 'تواصل يدوي وخدمات محدودة',
            2: 'قنوات رقمية منفصلة',
            3: 'خدمة متعددة القنوات',
            4: 'تخصيص الخدمة وبوابات ذاتية',
            5: 'خدمة استباقية مع AI وchatbots'
        }
    }
};

export async function generateRoadmap(
    project: ProjectInfo,
    selfAssessment: Assessment,
    committeeAssessment?: Assessment
): Promise<string> {
    const assessment = committeeAssessment || selfAssessment;

    // Identify weakest pillars
    const pillarScores = Object.entries(assessment).map(([key, value]) => ({
        id: key,
        name: pillarDescriptions[key].name,
        score: value,
        currentLevel: pillarDescriptions[key].levels[value],
        nextLevel: pillarDescriptions[key].levels[Math.min(value + 1, 5)]
    }));

    const sortedPillars = [...pillarScores].sort((a, b) => a.score - b.score);
    const weakestPillars = sortedPillars.slice(0, 3);

    const prompt = `أنت خبير في التحول الرقمي. بناءً على تقييم نضج التحول الرقمي التالي لمشروع "${project.name}" في ${project.department}، قم بإعداد خارطة طريق للتحسين.

## نتائج التقييم الحالي:
${pillarScores.map(p => `- ${p.name}: ${p.score}/5 (${p.currentLevel})`).join('\n')}

## المحاور الأضعف التي تحتاج تركيز:
${weakestPillars.map((p, i) => `${i + 1}. ${p.name} (${p.score}/5)`).join('\n')}

## المطلوب:
اكتب خارطة طريق مختصرة وعملية للأشهر الـ 6-12 القادمة تتضمن:
1. **مكاسب سريعة (1-3 أشهر)**: إجراءات فورية منخفضة الجهد وعالية الأثر
2. **مبادرات متوسطة المدى (3-6 أشهر)**: مشاريع تطوير متوسطة
3. **تحولات استراتيجية (6-12 شهر)**: تغييرات جوهرية طويلة المدى

لكل توصية، اذكر:
- المحور المستهدف
- الإجراء المطلوب
- المستوى المتوقع بعد التنفيذ

اكتب بصيغة Markdown واجعل التوصيات محددة وقابلة للتنفيذ.`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: 'أنت مستشار تحول رقمي متخصص في القطاع الحكومي والمؤسسي في المملكة العربية السعودية. تقدم توصيات عملية ومحددة باللغة العربية.'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.7,
        max_tokens: 2000
    });

    return response.choices[0].message.content || 'تعذر توليد خارطة الطريق';
}

export async function generatePillarRecommendation(
    pillarId: string,
    currentScore: number,
    projectContext: string
): Promise<string> {
    const pillar = pillarDescriptions[pillarId];
    const currentLevel = pillar.levels[currentScore];
    const nextLevel = pillar.levels[Math.min(currentScore + 1, 5)];

    const prompt = `بصفتك خبير تحول رقمي، قدم 3 توصيات محددة لتحسين محور "${pillar.name}" من المستوى الحالي (${currentScore}/5: ${currentLevel}) إلى المستوى التالي (${Math.min(currentScore + 1, 5)}/5: ${nextLevel}).

سياق المشروع: ${projectContext}

اكتب التوصيات بشكل مختصر ومباشر.`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
    });

    return response.choices[0].message.content || '';
}
