'use client';

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts';

interface Assessment {
    strategic: number;
    operations: number;
    technology: number;
    data: number;
    customerExperience: number;
}

interface PillarRadarChartProps {
    selfAssessment: Assessment;
    committeeAssessment?: Assessment | null;
    showLegend?: boolean;
}

const pillarLabels: Record<string, string> = {
    strategic: 'الاستراتيجي',
    operations: 'العمليات',
    technology: 'التقنيات',
    data: 'البيانات',
    customerExperience: 'تجربة العملاء'
};

export default function PillarRadarChart({
    selfAssessment,
    committeeAssessment,
    showLegend = true
}: PillarRadarChartProps) {
    const data = Object.keys(pillarLabels).map(key => ({
        pillar: pillarLabels[key],
        'التقييم الذاتي': selfAssessment[key as keyof Assessment],
        ...(committeeAssessment && { 'تقييم اللجنة': committeeAssessment[key as keyof Assessment] })
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid />
                <PolarAngleAxis
                    dataKey="pillar"
                    tick={{ fill: '#475569', fontSize: 12 }}
                />
                <PolarRadiusAxis
                    angle={90}
                    domain={[0, 5]}
                    tickCount={6}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Radar
                    name="التقييم الذاتي"
                    dataKey="التقييم الذاتي"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                />
                {committeeAssessment && (
                    <Radar
                        name="تقييم اللجنة"
                        dataKey="تقييم اللجنة"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.3}
                        strokeWidth={2}
                    />
                )}
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                    }}
                />
                {showLegend && <Legend />}
            </RadarChart>
        </ResponsiveContainer>
    );
}
