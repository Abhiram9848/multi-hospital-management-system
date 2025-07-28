import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'register'>('login');

  const userRoles = [
    {
      role: 'superadmin',
      title: 'Super Admin',
      description: 'Full system access and management',
      icon: '🌐',
      color: '#dc3545',
      loginOnly: true
    },
    {
      role: 'hospital',
      title: 'Hospital',
      description: 'Hospital management and operations',
      icon: '🏥',
      color: '#6f42c1',
      loginOnly: true
    },
    {
      role: 'admin',
      title: 'Admin',
      description: 'Hospital administration and staff management',
      icon: '👨‍💼',
      color: '#fd7e14'
    },
    {
      role: 'doctor',
      title: 'Doctor',
      description: 'Patient care and medical management',
      icon: '👨‍⚕️',
      color: '#198754'
    },
    {
      role: 'patient',
      title: 'Patient',
      description: 'Book appointments and view medical records',
      icon: '🏃‍♂️',
      color: '#0d6efd'
    }
  ];

  const services = [
    {
      icon: '📅',
      title: 'Appointment Management',
      description: 'Easy online appointment booking and scheduling system for patients and doctors.'
    },
    {
      icon: '💬',
      title: 'Telemedicine',
      description: 'Video consultations and real-time chat with healthcare providers from anywhere.'
    },
    {
      icon: '📊',
      title: 'Health Records',
      description: 'Secure digital health records management and instant access to medical history.'
    },
    {
      icon: '💊',
      title: 'Prescription Management',
      description: 'Digital prescription system with medication tracking and dosage reminders.'
    },
    {
      icon: '🏥',
      title: 'Multi-Hospital Support',
      description: 'Centralized platform supporting multiple hospitals and healthcare facilities.'
    },
    {
      icon: '📱',
      title: 'Mobile Access',
      description: 'Access your healthcare information anytime, anywhere with our mobile-friendly platform.'
    }
  ];

  const handleRoleSelect = (role: string) => {
    const route = authType === 'login' ? `/login/${role}` : `/register/${role}`;
    navigate(route);
    setShowRoleModal(false);
  };

  const openAuthModal = (type: 'login' | 'register') => {
    setAuthType(type);
    setShowRoleModal(true);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="homepage">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">HealthCare Pro</span>
          </div>
          <ul className="nav-menu">
            <li className={`nav-item ${activeSection === 'home' ? 'active' : ''}`}>
              <button onClick={() => scrollToSection('home')} className="nav-link">
                Home
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'services' ? 'active' : ''}`}>
              <button onClick={() => scrollToSection('services')} className="nav-link">
                Services
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'about' ? 'active' : ''}`}>
              <button onClick={() => scrollToSection('about')} className="nav-link">
                About
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => openAuthModal('register')} className="nav-link register-btn">
                Register
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => openAuthModal('login')} className="nav-link login-btn">
                Login
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Home Section */}
      <section id="home" className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Modern Healthcare
            <span className="highlight"> Management System</span>
          </h1>
          <p className="hero-description">
            Revolutionizing healthcare with our comprehensive digital platform that connects 
            patients, doctors, and hospitals for seamless medical care coordination.
          </p>
          <div className="hero-buttons">
            <button 
              onClick={() => openAuthModal('register')} 
              className="cta-button primary"
            >
              Get Started Today
            </button>
            <button 
              onClick={() => scrollToSection('services')} 
              className="cta-button secondary"
            >
              Explore Services
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="floating-card">
            <span className="card-icon">👨‍⚕️</span>
            <span className="card-text">Expert Care</span>
          </div>
          <div className="floating-card">
            <span className="card-icon">📱</span>
            <span className="card-text">Digital Health</span>
          </div>
          <div className="floating-card">
            <span className="card-icon">🔒</span>
            <span className="card-text">Secure Platform</span>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Services</h2>
            <p>Comprehensive healthcare solutions designed to improve patient outcomes and streamline medical operations</p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About HealthCare Pro</h2>
              <p>
                We are dedicated to transforming healthcare delivery through innovative technology 
                solutions. Our platform bridges the gap between traditional healthcare and modern 
                digital convenience, ensuring that quality medical care is accessible to everyone.
              </p>
              <div className="features-list">
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>HIPAA Compliant & Secure</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>24/7 Platform Availability</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>Multi-Device Compatibility</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>Real-time Communication</span>
                </div>
              </div>
            </div>
            <div className="about-stats">
              <div className="stat-card">
                <h3>1000+</h3>
                <p>Registered Doctors</p>
              </div>
              <div className="stat-card">
                <h3>50+</h3>
                <p>Partner Hospitals</p>
              </div>
              <div className="stat-card">
                <h3>10k+</h3>
                <p>Happy Patients</p>
              </div>
              <div className="stat-card">
                <h3>99.9%</h3>
                <p>Uptime Guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{authType === 'login' ? 'Login' : 'Register'} - Select Your Role</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowRoleModal(false)}
              >
                ×
              </button>
            </div>
            <div className="roles-grid">
              {userRoles.map((roleData) => (
                <div 
                  key={roleData.role}
                  className={`role-card modal-role-card ${
                    authType === 'register' && roleData.loginOnly ? 'disabled' : ''
                  }`}
                  onClick={() => {
                    if (authType === 'register' && roleData.loginOnly) return;
                    handleRoleSelect(roleData.role);
                  }}
                >
                  <div className="role-icon" style={{ color: roleData.color }}>
                    {roleData.icon}
                  </div>
                  <h4>{roleData.title}</h4>
                  <p>{roleData.description}</p>
                  {authType === 'register' && roleData.loginOnly && (
                    <span className="login-only-notice">Login Only</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>HealthCare Pro</h4>
              <p>Transforming healthcare through innovative digital solutions.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><button onClick={() => scrollToSection('home')}>Home</button></li>
                <li><button onClick={() => scrollToSection('services')}>Services</button></li>
                <li><button onClick={() => scrollToSection('about')}>About</button></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Access</h4>
              <ul>
                <li><button onClick={() => openAuthModal('login')}>Login</button></li>
                <li><button onClick={() => openAuthModal('register')}>Register</button></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>support@healthcarepro.com</p>
              <p>+1 (555) 123-4567</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 HealthCare Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
