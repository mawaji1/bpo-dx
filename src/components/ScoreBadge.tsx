interface ScoreBadgeProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
}

const levelNames: Record<number, string> = {
    1: 'الأساس',
    2: 'النمو',
    3: 'النضج',
    4: 'التميز',
    5: 'الريادة'
};

const levelColors: Record<number, string> = {
    1: 'bg-red-100 text-red-700 border-red-200',
    2: 'bg-orange-100 text-orange-700 border-orange-200',
    3: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    4: 'bg-blue-100 text-blue-700 border-blue-200',
    5: 'bg-green-100 text-green-700 border-green-200'
};

const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
};

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
    const roundedScore = Math.round(score);
    const levelName = levelNames[roundedScore] || 'غير محدد';
    const colorClass = levelColors[roundedScore] || 'bg-slate-100 text-slate-600';

    return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full border ${colorClass} ${sizeClasses[size]}`}>
            <span className="font-bold">{score.toFixed(1)}</span>
            <span>- {levelName}</span>
        </span>
    );
}

interface StageBadgeProps {
    stage: string;
    stageName: string;
    color: string;
}

export function StageBadge({ stage, stageName, color }: StageBadgeProps) {
    return (
        <span
            className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full stage-${stage}`}
            style={{ backgroundColor: `${color}20`, color }}
        >
            {stageName}
        </span>
    );
}
