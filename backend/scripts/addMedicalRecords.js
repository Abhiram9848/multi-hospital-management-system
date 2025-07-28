const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Department = require('../models/Department');
require('dotenv').config();

// Sample medical records data
const sampleMedicalRecords = [
  {
    reason: "Regular health checkup and blood pressure monitoring",
    notes: "Patient shows normal vital signs. Blood pressure: 120/80. Heart rate: 72 bpm. Recommended annual checkup next year.",
    prescription: {
      medicines: [
        {
          name: "Vitamin D3",
          dosage: "1000 IU",
          frequency: "Once daily",
          duration: "30 days"
        },
        {
          name: "Omega-3 Fish Oil",
          dosage: "500mg",
          frequency: "Twice daily",
          duration: "60 days"
        }
      ],
      instructions: "Take Vitamin D3 with food. Continue healthy diet and regular exercise. Schedule follow-up in 6 months."
    },
    status: "completed"
  },
  {
    reason: "Severe headache and migraine symptoms",
    notes: "Patient experiencing cluster headaches for 3 days. No signs of neurological complications. Stress-related migraine diagnosed.",
    prescription: {
      medicines: [
        {
          name: "Sumatriptan",
          dosage: "50mg",
          frequency: "As needed for migraine",
          duration: "7 days"
        },
        {
          name: "Ibuprofen",
          dosage: "400mg",
          frequency: "Every 6 hours",
          duration: "5 days"
        }
      ],
      instructions: "Avoid bright lights and loud sounds. Get adequate rest. If symptoms persist beyond 7 days, return for follow-up. Avoid trigger foods like chocolate and aged cheese."
    },
    status: "completed"
  },
  {
    reason: "Chest pain and breathing difficulties",
    notes: "ECG normal, chest X-ray clear. Anxiety-induced chest tightness. Patient reassured. No cardiac abnormalities detected.",
    prescription: {
      medicines: [
        {
          name: "Alprazolam",
          dosage: "0.25mg",
          frequency: "Twice daily",
          duration: "14 days"
        }
      ],
      instructions: "Practice deep breathing exercises. Consider stress management techniques. Avoid caffeine. Follow up if symptoms worsen or persist."
    },
    status: "completed"
  },
  {
    reason: "Diabetes management and blood sugar control",
    notes: "HbA1c: 7.2%. Blood glucose levels slightly elevated. Diet and medication adjustments recommended. Patient counseled on carbohydrate counting.",
    prescription: {
      medicines: [
        {
          name: "Metformin",
          dosage: "500mg",
          frequency: "Twice daily with meals",
          duration: "90 days"
        },
        {
          name: "Glimepiride",
          dosage: "2mg",
          frequency: "Once daily before breakfast",
          duration: "90 days"
        }
      ],
      instructions: "Monitor blood glucose daily. Maintain low carbohydrate diet. Exercise 30 minutes daily. Check feet daily for cuts or sores. Schedule HbA1c test in 3 months."
    },
    status: "completed"
  },
  {
    reason: "Skin allergy and eczema flare-up",
    notes: "Atopic dermatitis on arms and neck. Mild to moderate severity. Patient has history of seasonal allergies. Topical treatment recommended.",
    prescription: {
      medicines: [
        {
          name: "Hydrocortisone Cream 1%",
          dosage: "Apply thin layer",
          frequency: "Twice daily",
          duration: "14 days"
        },
        {
          name: "Cetirizine",
          dosage: "10mg",
          frequency: "Once daily",
          duration: "21 days"
        },
        {
          name: "Moisturizing Lotion",
          dosage: "Apply liberally",
          frequency: "After bathing",
          duration: "As needed"
        }
      ],
      instructions: "Avoid known allergens. Use fragrance-free soaps and detergents. Keep skin moisturized. Avoid scratching. If rash spreads or worsens, return immediately."
    },
    status: "completed"
  },
  {
    reason: "Upper respiratory tract infection",
    notes: "Viral URTI. No signs of bacterial infection. Throat slightly red, no exudate. Lymph nodes not enlarged. Supportive care recommended.",
    prescription: {
      medicines: [
        {
          name: "Paracetamol",
          dosage: "500mg",
          frequency: "Every 6 hours",
          duration: "5 days"
        },
        {
          name: "Throat Lozenges",
          dosage: "1 lozenge",
          frequency: "Every 2-3 hours",
          duration: "7 days"
        }
      ],
      instructions: "Drink plenty of fluids. Get adequate rest. Gargle with warm salt water. Avoid smoking and alcohol. Return if fever persists beyond 3 days or if symptoms worsen."
    },
    status: "completed"
  }
];

const addMedicalRecords = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('Connected to MongoDB');

    // Get all patients, doctors, and departments
    const patients = await User.find({ role: 'patient' }).limit(3);
    const doctors = await User.find({ role: 'doctor' });
    const departments = await Department.find();

    if (patients.length === 0 || doctors.length === 0 || departments.length === 0) {
      console.log('No patients, doctors, or departments found. Please ensure data exists.');
      return;
    }

    console.log(`Found ${patients.length} patients, ${doctors.length} doctors, ${departments.length} departments`);

    // Create completed appointments with medical records for each patient
    for (const patient of patients) {
      console.log(`Adding medical records for patient: ${patient.name}`);
      
      // Add 2-3 medical records per patient
      const recordsToAdd = sampleMedicalRecords.slice(0, Math.floor(Math.random() * 3) + 2);
      
      for (let i = 0; i < recordsToAdd.length; i++) {
        const record = recordsToAdd[i];
        const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
        const randomDepartment = departments[Math.floor(Math.random() * departments.length)];
        
        // Create appointment date in the past (last 6 months)
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() - Math.floor(Math.random() * 180));
        
        const appointment = new Appointment({
          patient: patient._id,
          doctor: randomDoctor._id,
          department: randomDepartment._id,
          appointmentDate,
          appointmentTime: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'][Math.floor(Math.random() * 6)],
          reason: record.reason,
          status: record.status,
          notes: record.notes,
          prescription: record.prescription,
          fee: Math.floor(Math.random() * 200) + 50, // Random fee between 50-250
          paymentStatus: 'paid'
        });

        await appointment.save();
        console.log(`Added medical record: ${record.reason.substring(0, 30)}...`);
      }
    }

    console.log('✅ Medical records added successfully!');
    
  } catch (error) {
    console.error('Error adding medical records:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
addMedicalRecords();
