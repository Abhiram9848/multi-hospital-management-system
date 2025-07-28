const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Department = require('./models/Department');
const Hospital = require('./models/Hospital');
const dotenv = require('dotenv');

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Hospital.deleteMany({});
    console.log('Cleared existing data');

    // Create departments
    const departments = await Department.create([
      {
        name: 'Cardiology',
        description: 'Heart and cardiovascular system care'
      },
      {
        name: 'Neurology',
        description: 'Brain and nervous system treatment'
      },
      {
        name: 'Orthopedics',
        description: 'Bone and joint care'
      },
      {
        name: 'Pediatrics',
        description: 'Child healthcare services'
      },
      {
        name: 'General Medicine',
        description: 'General medical care and consultation'
      }
    ]);
    console.log('Created departments');

    // Create sample hospitals
    const hospitals = await Hospital.create([
      {
        name: 'City General Hospital',
        email: 'admin@citygeneral.com',
        phone: '+1234567890',
        address: {
          street: '123 Medical Center Dr',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        registrationNumber: 'CGH001',
        licenseNumber: 'LIC001',
        establishedDate: new Date('1995-01-15'),
        hospitalType: 'private',
        specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'],
        capacity: {
          totalBeds: 200,
          icuBeds: 20,
          emergencyBeds: 15
        },
        facilities: ['Emergency Room', 'ICU', 'Surgery', 'Pharmacy', 'Laboratory'],
        website: 'https://citygeneral.com',
        emergencyContact: '+1234567899',
        subscription: {
          plan: 'premium',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          isActive: true
        }
      },
      {
        name: 'Metro Health Center',
        email: 'contact@metrohealth.com',
        phone: '+1234567891',
        address: {
          street: '456 Healthcare Blvd',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA'
        },
        registrationNumber: 'MHC002',
        licenseNumber: 'LIC002',
        establishedDate: new Date('2000-05-20'),
        hospitalType: 'government',
        specialties: ['General Medicine', 'Pediatrics', 'Emergency Medicine'],
        capacity: {
          totalBeds: 150,
          icuBeds: 15,
          emergencyBeds: 10
        },
        facilities: ['Emergency Room', 'ICU', 'Outpatient Clinic', 'Pharmacy'],
        website: 'https://metrohealth.com',
        emergencyContact: '+1234567892',
        subscription: {
          plan: 'basic',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      }
    ]);
    console.log('Created hospitals');

    // Create sample users
    const users = [
      // Super Admin
      {
        name: 'Super Admin',
        email: 'superadmin@hospital.com',
        password: 'password123',
        role: 'superadmin',
        phone: '+1234567890',
        address: 'Hospital Administrative Office'
      },
      // Hospital Admins
      {
        name: 'John Admin',
        email: 'admin@citygeneral.com',
        password: 'password123',
        role: 'admin',
        phone: '+1234567891',
        address: '123 Medical Center Dr, New York, NY',
        hospitalId: hospitals[0]._id
      },
      {
        name: 'Jane Admin',
        email: 'admin@metrohealth.com',
        password: 'password123',
        role: 'admin',
        phone: '+1234567892',
        address: '456 Healthcare Blvd, Los Angeles, CA',
        hospitalId: hospitals[1]._id
      },
      // Doctors - City General Hospital
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@citygeneral.com',
        password: 'password123',
        role: 'doctor',
        phone: '+1234567893',
        address: '123 Medical St, New York, NY',
        specialization: 'Cardiology',
        experience: 15,
        qualification: 'MBBS, MD Cardiology',
        department: departments[0]._id,
        hospitalId: hospitals[0]._id
      },
      {
        name: 'Dr. Michael Brown',
        email: 'michael.brown@citygeneral.com',
        password: 'password123',
        role: 'doctor',
        phone: '+1234567894',
        address: '456 Health Ave, New York, NY',
        specialization: 'Neurology',
        experience: 12,
        qualification: 'MBBS, MD Neurology',
        department: departments[1]._id,
        hospitalId: hospitals[0]._id
      },
      // Doctors - Metro Health Center
      {
        name: 'Dr. Emily Davis',
        email: 'emily.davis@metrohealth.com',
        password: 'password123',
        role: 'doctor',
        phone: '+1234567895',
        address: '789 Care Blvd, Los Angeles, CA',
        specialization: 'Pediatrics',
        experience: 8,
        qualification: 'MBBS, MD Pediatrics',
        department: departments[3]._id,
        hospitalId: hospitals[1]._id
      },
      // Patients - City General Hospital
      {
        name: 'Alice Smith',
        email: 'alice.smith@email.com',
        password: 'password123',
        role: 'patient',
        phone: '+1234567896',
        address: '321 Patient St, New York, NY',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'female',
        bloodGroup: 'A+',
        hospitalId: hospitals[0]._id,
        emergencyContact: {
          name: 'Bob Smith',
          phone: '+1234567897',
          relation: 'Husband'
        }
      },
      {
        name: 'Robert Wilson',
        email: 'robert.wilson@email.com',
        password: 'password123',
        role: 'patient',
        phone: '+1234567898',
        address: '654 Health St, New York, NY',
        dateOfBirth: new Date('1985-08-22'),
        gender: 'male',
        bloodGroup: 'B+',
        hospitalId: hospitals[0]._id,
        emergencyContact: {
          name: 'Mary Wilson',
          phone: '+1234567899',
          relation: 'Wife'
        }
      },
      // Patients - Metro Health Center
      {
        name: 'Emma Johnson',
        email: 'emma.johnson@email.com',
        password: 'password123',
        role: 'patient',
        phone: '+1234567800',
        address: '987 Wellness Ave, Los Angeles, CA',
        dateOfBirth: new Date('1995-12-10'),
        gender: 'female',
        bloodGroup: 'O+',
        hospitalId: hospitals[1]._id,
        emergencyContact: {
          name: 'James Johnson',
          phone: '+1234567801',
          relation: 'Father'
        }
      }
    ];

    const createdUsers = await User.create(users);
    console.log('Created sample users');

    // Update hospitals with their admin IDs
    const cityGeneralAdmin = createdUsers.find(user => user.email === 'admin@citygeneral.com');
    const metroHealthAdmin = createdUsers.find(user => user.email === 'admin@metrohealth.com');

    await Hospital.findByIdAndUpdate(hospitals[0]._id, { adminId: cityGeneralAdmin._id });
    await Hospital.findByIdAndUpdate(hospitals[1]._id, { adminId: metroHealthAdmin._id });
    console.log('Updated hospitals with admin assignments');

    console.log('\n=== Sample Login Credentials ===');
    console.log('Super Admin: superadmin@hospital.com / password123');
    console.log('\n--- Hospital Logins ---');
    console.log('City General Hospital: admin@citygeneral.com / admin@citygeneral.com / password123');
    console.log('Metro Health Center: contact@metrohealth.com / admin@metrohealth.com / password123');
    console.log('\n--- Direct Admin Logins ---');
    console.log('City General Admin: admin@citygeneral.com / password123');
    console.log('Metro Health Admin: admin@metrohealth.com / password123');
    console.log('\n--- Doctor Logins ---');
    console.log('Dr. Sarah Johnson (City General): sarah.johnson@citygeneral.com / password123');
    console.log('Dr. Emily Davis (Metro Health): emily.davis@metrohealth.com / password123');
    console.log('\n--- Patient Logins ---');
    console.log('Alice Smith (City General): alice.smith@email.com / password123');
    console.log('Emma Johnson (Metro Health): emma.johnson@email.com / password123');
    console.log('================================\n');

    mongoose.connection.close();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
