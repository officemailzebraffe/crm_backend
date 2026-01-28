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
    let dsaMentorProject = await Project.findOne({ name: 'DSA Mentor' });

    if (!dsaMentorProject) {
      // Create DSA Mentor Project
      dsaMentorProject = await Project.create({
        name: 'DSA Mentor',
        description: 'Data Structures & Algorithms mentorship and training program',
        type: 'education',
        owner: superAdmin._id,
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          leadSources: [
            'Website',
            'Referral',
            'LinkedIn',
            'Instagram',
            'Facebook',
            'WhatsApp',
            'Direct Contact',
            'Event'
          ],
          leadStatuses: [
            { name: 'New', color: '#3b82f6' },
            { name: 'Contacted', color: '#8b5cf6' },
            { name: 'Qualified', color: '#10b981' },
            { name: 'Proposal Sent', color: '#f59e0b' },
            { name: 'Negotiation', color: '#ef4444' },
            { name: 'Converted', color: '#22c55e' },
            { name: 'Lost', color: '#6b7280' }
          ],
          studentStatuses: [
            { name: 'Active', color: '#10b981' },
            { name: 'Completed', color: '#3b82f6' },
            { name: 'On Hold', color: '#f59e0b' },
            { name: 'Dropped', color: '#ef4444' }
          ],
          taskPriorities: [
            { name: 'Low', color: '#6b7280' },
            { name: 'Medium', color: '#f59e0b' },
            { name: 'High', color: '#ef4444' },
            { name: 'Urgent', color: '#dc2626' }
          ],
          customFields: {
            leads: [
              {
                name: 'Programming Experience',
                type: 'dropdown',
                options: ['Beginner', 'Intermediate', 'Advanced'],
                required: false
              },
              {
                name: 'Preferred Batch Time',
                type: 'dropdown',
                options: ['Morning (6-9 AM)', 'Evening (6-9 PM)', 'Weekend'],
                required: false
              },
              {
                name: 'Goal',
                type: 'dropdown',
                options: ['Placement Preparation', 'Skill Development', 'Interview Prep', 'Competitive Programming'],
                required: false
              }
            ],
            students: [
              {
                name: 'Batch',
                type: 'text',
                required: true
              },
              {
                name: 'Payment Status',
                type: 'dropdown',
                options: ['Paid', 'Pending', 'Partial', 'Scholarship'],
                required: true
              },
              {
                name: 'Progress',
                type: 'dropdown',
                options: ['0-25%', '26-50%', '51-75%', '76-100%'],
                required: false
              }
            ]
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

      console.log('✅ DSA Mentor Project Created');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📁 Project Name: DSA Mentor');
      console.log('📝 Description: Data Structures & Algorithms mentorship');
      console.log('👥 Owner:', superAdmin.email);
      console.log('🎯 Type: Education');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('ℹ️  DSA Mentor Project already exists\n');
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
      console.log('✅ DSA Mentor Project linked to Super Admin\n');
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
