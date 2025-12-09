/**
 * Scoring utility for DX Maturity Assessment
 * 
 * Score Hierarchy:
 * 1. finalAssessment (if exists) - Calibrated/approved score
 * 2. committeeAssessment (if exists) - Average of evaluator scores
 * 3. selfAssessment (if score > 0) - Self-reported from survey
 * 4. null - Pending, should be excluded from averages
 */

export interface Assessment {
    strategic: number;
    operations: number;
    technology: number;
    data: number;
    customerExperience: number;
}

export interface Evaluation {
    id: string;
    projectId: string;
    submissionId?: string;
    selfAssessment: Assessment;
    committeeAssessment: Assessment | null;
    finalAssessment: Assessment | null;
    stage: string;
    assignedEvaluators: string[];
    meetingDate: string | null;
    meetingNotes: string;
    llmRoadmap: string | null;
}

/**
 * Get the active/effective score for an evaluation based on stage hierarchy
 */
export function getActiveScore(evaluation: Evaluation): Assessment | null {
    // 1. Final assessment takes priority (calibrated/approved)
    if (evaluation.finalAssessment) {
        return evaluation.finalAssessment;
    }

    // 2. Committee assessment (average of evaluators)
    if (evaluation.committeeAssessment) {
        return evaluation.committeeAssessment;
    }

    // 3. Self-assessment if it has actual scores (not all zeros)
    if (evaluation.selfAssessment) {
        const hasScores = Object.values(evaluation.selfAssessment).some(v => v > 0);
        if (hasScores) {
            return evaluation.selfAssessment;
        }
    }

    // 4. No valid score (pending) - return null to exclude from averages
    return null;
}

/**
 * Check if an evaluation should be included in aggregate calculations
 */
export function shouldIncludeInAggregates(evaluation: Evaluation): boolean {
    // Exclude pending evaluations (no self-assessment submitted yet)
    if (evaluation.stage === 'pending') {
        return false;
    }

    // Exclude if no valid scores
    return getActiveScore(evaluation) !== null;
}

/**
 * Calculate average score across pillars
 */
export function calculateOverallScore(assessment: Assessment | null): number {
    if (!assessment) return 0;

    const scores = Object.values(assessment);
    const sum = scores.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / scores.length) * 10) / 10;
}

/**
 * Get the stage label in Arabic
 */
export function getStageLabel(stage: string): string {
    const labels: Record<string, string> = {
        'pending': 'في الانتظار',
        'self_submitted': 'تقييم ذاتي',
        'under_review': 'قيد المراجعة',
        'committee_evaluated': 'تم تقييم اللجنة',
        'completed': 'مكتمل'
    };
    return labels[stage] || stage;
}

/**
 * Get score source label
 */
export function getScoreSourceLabel(evaluation: Evaluation): string {
    if (evaluation.finalAssessment) return 'النتيجة النهائية';
    if (evaluation.committeeAssessment) return 'تقييم اللجنة';
    if (getActiveScore(evaluation)) return 'التقييم الذاتي';
    return 'لم يتم التقييم';
}
