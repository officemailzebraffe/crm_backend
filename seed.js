const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB, closeDB } = require('./config/database');
const User = require('./models/User');
const Project = require('./models/Project');

// Load env vars
dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('\n🌱 Starting Database Seed...\n');

    // Check if superadmin exists
    let superAdmin = await User.findOne({ email: process.env.SUPERADMIN_EMAIL });

    if (!superAdmin) {
      // Create Super Admin
      superAdmin = await User.create({
        name: process.env.SUPERADMIN_USERNAME || 'Admin',
        email: process.env.SUPERADMIN_EMAIL,
        password: process.env.SUPERADMIN_PASSWORD,
        phone: '+91-9876543210',
        role: 'admin',
        isActive: true
      });

      console.log('✅ Super Admin Created');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', process.env.SUPERADMIN_EMAIL);
      console.log('🔑 Password:', process.env.SUPERADMIN_PASSWORD);
      console.log('👤 Username:', process.env.SUPERADMIN_USERNAME);
      console.log('🛡️  Role: Admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('ℹ️  Super Admin already exists\n');
    }

    // Check if DSA Mentor project exists
    let dsaMentorProject = await Project.findOne({ name: 'Tech Company' });

    if (!dsaMentorProject) {
      // Create Tech Company Project
      dsaMentorProject = await Project.create({
        name: 'Tech Company',
        description: 'Employee Management System for Tech Company operations',
        type: 'organization',
        owner: superAdmin._id,
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          leadSources: [],
          leadStatuses: [],
          studentStatuses: [],
          taskPriorities: [
            { name: 'Low', color: '#6b7280' },
            { name: 'Medium', color: '#f59e0b' },
            { name: 'High', color: '#ef4444' },
            { name: 'Urgent', color: '#dc2626' }
          ],
          customFields: {
            leads: [],
            students: []
          }
        },
        team: [
          {
            userId: superAdmin._id,
            role: 'admin'
          }
        ],
        isActive: true
      });

      console.log('✅ Tech Company Project Created');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📁 Project Name: Tech Company');
      console.log('📝 Description: Employee Management System');
      console.log('👥 Owner:', superAdmin.email);
      console.log('🎯 Type: Organization');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('ℹ️  Tech Company Project already exists\n');
    }

    // Add project to superadmin's projects if not already added
    const hasProject = superAdmin.projects.some(
      p => p.projectId && p.projectId.toString() === dsaMentorProject._id.toString()
    );

    if (!hasProject) {
      superAdmin.projects.push({
        projectId: dsaMentorProject._id,
        role: 'admin'
      });
      superAdmin.activeProject = dsaMentorProject._id;
      await superAdmin.save();
      console.log('✅ Tech Company Project linked to Super Admin\n');
    }

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 You can now login with:');
    console.log('   📧 Email:', process.env.SUPERADMIN_EMAIL);
    console.log('   🔑 Password:', process.env.SUPERADMIN_PASSWORD);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run the seed
seedDatabase();
