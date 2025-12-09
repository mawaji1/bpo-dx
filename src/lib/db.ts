import { prisma } from './prisma';

// ============= USERS =============

export async function getUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            department: true,
            mustChangePassword: true,
        },
    });
    return users.map((u: any) => ({
        ...u,
        assignedProjects: [] // Will be computed from evaluations
    }));
}

export async function getUserById(id: string) {
    return await prisma.user.findUnique({
        where: { id },
    });
}

export async function getUserByEmail(email: string) {
    return await prisma.user.findUnique({
        where: { email },
    });
}

export async function createUser(data: {
    email: string;
    name: string;
    password: string;
    role: string;
    department?: string | null;
    mustChangePassword?: boolean;
}) {
    return await prisma.user.create({
        data: {
            ...data,
            mustChangePassword: data.mustChangePassword ?? true,
        },
    });
}

export async function updateUser(id: string, data: Partial<{
    email: string;
    name: string;
    password: string;
    role: string;
    department: string | null;
    mustChangePassword: boolean;
}>) {
    return await prisma.user.update({
        where: { id },
        data,
    });
}

export async function deleteUser(id: string) {
    return await prisma.user.delete({
        where: { id },
    });
}

// ============= DEPARTMENTS =============

export async function getDepartments() {
    return await prisma.department.findMany({
        include: {
            projects: true,
        },
    });
}

export async function getDepartmentById(id: string) {
    return await prisma.department.findUnique({
        where: { id },
    });
}

// ============= PROJECTS =============

export async function getProjects() {
    const projects = await prisma.project.findMany({
        include: {
            department: true,
            evaluation: true,
        },
    });
    return projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        departmentId: p.departmentId,
        department: p.department.name,
        programManager: p.programManager,
        city: p.city,
        submissionId: p.submissionId,
    }));
}

export async function getProjectById(id: string) {
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            department: true,
            evaluation: true,
        },
    });
    if (!project) return null;
    return {
        id: project.id,
        name: project.name,
        departmentId: project.departmentId,
        department: project.department.name,
        programManager: project.programManager,
        city: project.city,
        submissionId: project.submissionId,
    };
}

export async function createProject(data: {
    name: string;
    departmentId: string;
    programManager?: string;
    city?: string;
    submissionId?: string;
}) {
    const project = await prisma.project.create({
        data: {
            name: data.name,
            departmentId: data.departmentId,
            programManager: data.programManager || '',
            city: data.city || 'الرياض',
            submissionId: data.submissionId,
        },
        include: {
            department: true,
        },
    });

    // Create evaluation entry
    await prisma.evaluation.create({
        data: {
            projectId: project.id,
            stage: 'pending',
        },
    });

    return {
        id: project.id,
        name: project.name,
        departmentId: project.departmentId,
        department: project.department.name,
        programManager: project.programManager,
        city: project.city,
        submissionId: project.submissionId,
    };
}

export async function updateProject(id: string, data: Partial<{
    name: string;
    departmentId: string;
    programManager: string;
    city: string;
    submissionId: string;
}>) {
    const project = await prisma.project.update({
        where: { id },
        data,
        include: {
            department: true,
        },
    });
    return {
        id: project.id,
        name: project.name,
        departmentId: project.departmentId,
        department: project.department.name,
        programManager: project.programManager,
        city: project.city,
        submissionId: project.submissionId,
    };
}

export async function deleteProject(id: string) {
    // Evaluation will be cascade deleted
    return await prisma.project.delete({
        where: { id },
    });
}

// ============= EVALUATIONS =============

export async function getEvaluations() {
    const evaluations = await prisma.evaluation.findMany({
        include: {
            project: true,
        },
    });
    return evaluations.map((e: any) => formatEvaluation(e));
}

export async function getEvaluationById(id: string) {
    const evaluation = await prisma.evaluation.findUnique({
        where: { id },
        include: {
            project: true,
        },
    });
    if (!evaluation) return null;
    return formatEvaluation(evaluation);
}

export async function getEvaluationByProjectId(projectId: string) {
    const evaluation = await prisma.evaluation.findUnique({
        where: { projectId },
        include: {
            project: true,
        },
    });
    if (!evaluation) return null;
    return formatEvaluation(evaluation);
}

export async function updateEvaluation(id: string, data: any) {
    const updateData: any = {};

    if (data.stage) updateData.stage = data.stage;
    if (data.assignedEvaluators) updateData.assignedEvaluators = data.assignedEvaluators;
    if (data.meetingDate !== undefined) updateData.meetingDate = data.meetingDate;

    if (data.selfAssessment) {
        updateData.selfStrategic = data.selfAssessment.strategic || 0;
        updateData.selfOperations = data.selfAssessment.operations || 0;
        updateData.selfTechnology = data.selfAssessment.technology || 0;
        updateData.selfData = data.selfAssessment.data || 0;
        updateData.selfCustomerExperience = data.selfAssessment.customerExperience || 0;
    }

    if (data.committeeAssessment) {
        updateData.committeeStrategic = data.committeeAssessment.strategic;
        updateData.committeeOperations = data.committeeAssessment.operations;
        updateData.committeeTechnology = data.committeeAssessment.technology;
        updateData.committeeData = data.committeeAssessment.data;
        updateData.committeeCustomerExperience = data.committeeAssessment.customerExperience;
    }

    if (data.finalAssessment) {
        updateData.finalStrategic = data.finalAssessment.strategic;
        updateData.finalOperations = data.finalAssessment.operations;
        updateData.finalTechnology = data.finalAssessment.technology;
        updateData.finalData = data.finalAssessment.data;
        updateData.finalCustomerExperience = data.finalAssessment.customerExperience;
    }

    if (data.evaluatorScores !== undefined) updateData.evaluatorScores = data.evaluatorScores;
    if (data.evaluatorComments !== undefined) updateData.evaluatorComments = data.evaluatorComments;

    const evaluation = await prisma.evaluation.update({
        where: { id },
        data: updateData,
        include: {
            project: true,
        },
    });

    return formatEvaluation(evaluation);
}

function formatEvaluation(e: any) {
    return {
        id: e.id,
        projectId: e.projectId,
        projectName: e.project?.name,
        stage: e.stage,
        assignedEvaluators: e.assignedEvaluators || [],
        meetingDate: e.meetingDate,
        selfAssessment: {
            strategic: e.selfStrategic,
            operations: e.selfOperations,
            technology: e.selfTechnology,
            data: e.selfData,
            customerExperience: e.selfCustomerExperience,
        },
        committeeAssessment: e.committeeStrategic !== null ? {
            strategic: e.committeeStrategic,
            operations: e.committeeOperations,
            technology: e.committeeTechnology,
            data: e.committeeData,
            customerExperience: e.committeeCustomerExperience,
        } : null,
        finalAssessment: e.finalStrategic !== null ? {
            strategic: e.finalStrategic,
            operations: e.finalOperations,
            technology: e.finalTechnology,
            data: e.finalData,
            customerExperience: e.finalCustomerExperience,
        } : null,
        evaluatorScores: e.evaluatorScores,
        evaluatorComments: e.evaluatorComments,
    };
}

// ============= CONFIG =============

export async function getConfig() {
    const config = await prisma.config.findUnique({
        where: { id: 'default' },
    });
    return config?.data || {};
}

export async function updateConfig(data: any) {
    return await prisma.config.upsert({
        where: { id: 'default' },
        update: { data },
        create: { id: 'default', data },
    });
}
