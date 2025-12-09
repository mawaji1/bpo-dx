import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load dotenv
require('dotenv').config();

// Log to debug
console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);

// Set up pg pool with explicit connection string
const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    console.log('🌱 Starting database seed...');

    // Read JSON data files
    const dataDir = path.join(process.cwd(), 'data');

    const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8'));
    const departments = JSON.parse(fs.readFileSync(path.join(dataDir, 'departments.json'), 'utf-8'));
    const projects = JSON.parse(fs.readFileSync(path.join(dataDir, 'projects.json'), 'utf-8'));
    const evaluations = JSON.parse(fs.readFileSync(path.join(dataDir, 'evaluations.json'), 'utf-8'));
    const config = JSON.parse(fs.readFileSync(path.join(dataDir, 'config.json'), 'utf-8'));

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.evaluation.deleteMany();
    await prisma.project.deleteMany();
    await prisma.department.deleteMany();
    await prisma.user.deleteMany();
    await prisma.config.deleteMany();

    // Seed users
    console.log('👤 Seeding users...');
    for (const user of users) {
        await prisma.user.create({
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                password: user.password,
                role: user.role,
                department: user.department,
                mustChangePassword: user.mustChangePassword || false,
            }
        });
    }
    console.log(`   ✅ Created ${users.length} users`);

    // Seed departments
    console.log('🏢 Seeding departments...');
    for (const dept of departments) {
        await prisma.department.create({
            data: {
                id: dept.id,
                name: dept.name,
            }
        });
    }
    console.log(`   ✅ Created ${departments.length} departments`);

    // Seed projects
    console.log('📁 Seeding projects...');
    for (const project of projects) {
        await prisma.project.create({
            data: {
                id: project.id,
                name: project.name,
                departmentId: project.departmentId,
                programManager: project.programManager || '',
                city: project.city || 'الرياض',
                submissionId: project.submissionId,
            }
        });
    }
    console.log(`   ✅ Created ${projects.length} projects`);

    // Seed evaluations
    console.log('📊 Seeding evaluations...');
    for (const eval_ of evaluations) {
        const selfAssessment = eval_.selfAssessment || {};
        const committeeAssessment = eval_.committeeAssessment || {};
        const finalAssessment = eval_.finalAssessment || {};

        await prisma.evaluation.create({
            data: {
                id: eval_.id,
                projectId: eval_.projectId,
                stage: eval_.stage || 'pending',
                assignedEvaluators: eval_.assignedEvaluators || [],
                meetingDate: eval_.meetingDate || null,

                selfStrategic: selfAssessment.strategic || 0,
                selfOperations: selfAssessment.operations || 0,
                selfTechnology: selfAssessment.technology || 0,
                selfData: selfAssessment.data || 0,
                selfCustomerExperience: selfAssessment.customerExperience || 0,

                committeeStrategic: committeeAssessment.strategic,
                committeeOperations: committeeAssessment.operations,
                committeeTechnology: committeeAssessment.technology,
                committeeData: committeeAssessment.data,
                committeeCustomerExperience: committeeAssessment.customerExperience,

                finalStrategic: finalAssessment.strategic,
                finalOperations: finalAssessment.operations,
                finalTechnology: finalAssessment.technology,
                finalData: finalAssessment.data,
                finalCustomerExperience: finalAssessment.customerExperience,

                evaluatorScores: eval_.evaluatorScores || null,
                evaluatorComments: eval_.evaluatorComments || null,
            }
        });
    }
    console.log(`   ✅ Created ${evaluations.length} evaluations`);

    // Seed config
    console.log('⚙️  Seeding config...');
    await prisma.config.create({
        data: {
            id: 'default',
            data: config,
        }
    });
    console.log('   ✅ Created config');

    console.log('');
    console.log('🎉 Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end();
        await prisma.$disconnect();
    });
