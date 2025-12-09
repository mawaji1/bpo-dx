// Static data imports - works on both client and server
import departmentsData from '../../data/departments.json';
import projectsData from '../../data/projects.json';
import usersData from '../../data/users.json';
import evaluationsData from '../../data/evaluations.json';
import configData from '../../data/config.json';

export interface Department {
    id: string;
    name: string;
    nameEn: string;
    projectCount: number;
}

export interface Project {
    id: string;
    name: string;
    departmentId: string;
    programManager: string;
    city: string;
    submissionId: string | null;
}

export interface User {
    id: string;
    email: string;
    name: string;
    password: string;
    role: 'admin' | 'evaluator';
    department: string | null;
    assignedProjects: string[];
}

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
    submissionId: string;
    selfAssessment: Assessment;
    committeeAssessment: Assessment | null;
    finalAssessment: Assessment | null;
    stage: string;
    assignedEvaluators: string[];
    meetingDate: string | null;
    meetingNotes: string;
    llmRoadmap: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface PillarConfig {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    levels: { level: number; name: string; description: string }[];
}

export interface StageConfig {
    id: string;
    name: string;
    order: number;
    color: string;
}

export interface Config {
    pillars: PillarConfig[];
    stages: StageConfig[];
    evaluatorDepartments: { id: string; name: string }[];
}

// Read functions - using static imports
export function getDepartments(): Department[] {
    return departmentsData as Department[];
}

export function getProjects(): Project[] {
    return projectsData as Project[];
}

export function getUsers(): User[] {
    return usersData as User[];
}

export function getEvaluations(): Evaluation[] {
    return evaluationsData as Evaluation[];
}

export function getConfig(): Config {
    return configData as Config;
}

// Helper functions
export function getProjectWithDetails(projectId: string) {
    const projects = getProjects();
    const departments = getDepartments();
    const evaluations = getEvaluations();
    const config = getConfig();

    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const department = departments.find(d => d.id === project.departmentId);
    const evaluation = evaluations.find(e => e.projectId === projectId);
    const stage = config.stages.find(s => s.id === evaluation?.stage);

    return {
        ...project,
        department,
        evaluation,
        stage
    };
}

export function getProjectsByDepartment(departmentId: string) {
    const projects = getProjects();
    return projects.filter(p => p.departmentId === departmentId);
}

export function calculateAverageScore(assessment: Assessment): number {
    const values = Object.values(assessment);
    return values.reduce((a, b) => a + b, 0) / values.length;
}

export function getDepartmentStats() {
    const departments = getDepartments();
    const projects = getProjects();
    const evaluations = getEvaluations();

    // Helper to get active score (same logic as scoring.ts but inline to avoid import issues)
    const getActiveScore = (evaluation: Evaluation): Assessment | null => {
        if (evaluation.finalAssessment) return evaluation.finalAssessment;
        if (evaluation.committeeAssessment) return evaluation.committeeAssessment;
        if (evaluation.selfAssessment) {
            const hasScores = Object.values(evaluation.selfAssessment).some(v => v > 0);
            if (hasScores) return evaluation.selfAssessment;
        }
        return null;
    };

    return departments.map(dept => {
        const deptProjects = projects.filter(p => p.departmentId === dept.id);
        const deptEvaluations = evaluations.filter(e =>
            deptProjects.some(p => p.id === e.projectId)
        );

        // Only count evaluations with valid scores
        const validEvaluations = deptEvaluations.filter(e => getActiveScore(e) !== null);

        const avgScores = {
            strategic: 0,
            operations: 0,
            technology: 0,
            data: 0,
            customerExperience: 0
        };

        if (validEvaluations.length > 0) {
            validEvaluations.forEach(ev => {
                const activeScore = getActiveScore(ev);
                if (activeScore) {
                    avgScores.strategic += activeScore.strategic;
                    avgScores.operations += activeScore.operations;
                    avgScores.technology += activeScore.technology;
                    avgScores.data += activeScore.data;
                    avgScores.customerExperience += activeScore.customerExperience;
                }
            });

            Object.keys(avgScores).forEach(key => {
                avgScores[key as keyof typeof avgScores] =
                    Math.round((avgScores[key as keyof typeof avgScores] / validEvaluations.length) * 10) / 10;
            });
        }

        return {
            ...dept,
            projectCount: deptProjects.length,
            evaluatedCount: validEvaluations.length,
            avgScores
        };
    });
}

export function getPipelineStats() {
    const evaluations = getEvaluations();
    const config = getConfig();
    const projects = getProjects();

    return config.stages.map(stage => {
        const stageEvaluations = evaluations.filter(e => e.stage === stage.id);
        return {
            ...stage,
            count: stageEvaluations.length,
            projects: stageEvaluations.map(e => {
                const project = projects.find(p => p.id === e.projectId);
                return { ...e, project };
            })
        };
    });
}

