// Server-side data operations with file system
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

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
    mustChangePassword?: boolean;
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

// Read functions
export function getDepartments(): Department[] {
    const data = fs.readFileSync(path.join(dataDir, 'departments.json'), 'utf-8');
    return JSON.parse(data);
}

export function getProjects(): Project[] {
    const data = fs.readFileSync(path.join(dataDir, 'projects.json'), 'utf-8');
    return JSON.parse(data);
}

export function getUsers(): User[] {
    const data = fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8');
    return JSON.parse(data);
}

export function getEvaluations(): Evaluation[] {
    const data = fs.readFileSync(path.join(dataDir, 'evaluations.json'), 'utf-8');
    return JSON.parse(data);
}

export function getConfig(): Config {
    const data = fs.readFileSync(path.join(dataDir, 'config.json'), 'utf-8');
    return JSON.parse(data);
}

// Write functions
export function saveUsers(users: User[]): void {
    fs.writeFileSync(
        path.join(dataDir, 'users.json'),
        JSON.stringify(users, null, 2)
    );
}

export function saveProjects(projects: Project[]): void {
    fs.writeFileSync(
        path.join(dataDir, 'projects.json'),
        JSON.stringify(projects, null, 2)
    );
}

export function saveEvaluations(evaluations: Evaluation[]): void {
    fs.writeFileSync(
        path.join(dataDir, 'evaluations.json'),
        JSON.stringify(evaluations, null, 2)
    );
}

// CRUD operations
export function createUser(user: Omit<User, 'id'>): User {
    const users = getUsers();
    const newUser: User = {
        ...user,
        id: `user_${Date.now()}`
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...updates };
    saveUsers(users);
    return users[index];
}

export function deleteUser(id: string): boolean {
    const users = getUsers();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;

    saveUsers(filtered);
    return true;
}

export function updateEvaluation(id: string, updates: Partial<Evaluation>): Evaluation | null {
    const evaluations = getEvaluations();
    const index = evaluations.findIndex(e => e.id === id);
    if (index === -1) return null;

    evaluations[index] = {
        ...evaluations[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveEvaluations(evaluations);
    return evaluations[index];
}

export function mapSubmissionToProject(projectId: string, submissionId: string): Project | null {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === projectId);
    if (index === -1) return null;

    projects[index].submissionId = submissionId;
    saveProjects(projects);
    return projects[index];
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

export function getDepartmentStats() {
    const departments = getDepartments();
    const projects = getProjects();
    const evaluations = getEvaluations();

    return departments.map(dept => {
        const deptProjects = projects.filter(p => p.departmentId === dept.id);
        const deptEvaluations = evaluations.filter(e =>
            deptProjects.some(p => p.id === e.projectId)
        );

        const avgScores = {
            strategic: 0,
            operations: 0,
            technology: 0,
            data: 0,
            customerExperience: 0
        };

        if (deptEvaluations.length > 0) {
            deptEvaluations.forEach(ev => {
                avgScores.strategic += ev.selfAssessment.strategic;
                avgScores.operations += ev.selfAssessment.operations;
                avgScores.technology += ev.selfAssessment.technology;
                avgScores.data += ev.selfAssessment.data;
                avgScores.customerExperience += ev.selfAssessment.customerExperience;
            });

            Object.keys(avgScores).forEach(key => {
                avgScores[key as keyof typeof avgScores] /= deptEvaluations.length;
            });
        }

        return {
            ...dept,
            projectCount: deptProjects.length,
            evaluatedCount: deptEvaluations.length,
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
