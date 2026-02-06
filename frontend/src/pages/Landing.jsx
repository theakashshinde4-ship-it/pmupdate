import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaPhoneAlt, FaEnvelope, FaStar, FaHeart, FaStethoscope, FaUserMd, FaNotesMedical, FaHospital, FaCalendarCheck, FaMapMarkerAlt, FaGoogle } from 'react-icons/fa';
import { useApiClient } from '../api/client';
import { useToast } from '../hooks/useToast';

// Google Place ID for the clinic (configure in environment)
const GOOGLE_PLACE_ID = import.meta.env.VITE_GOOGLE_PLACE_ID || '';

// Specialties data
const specialties = [
  { name: 'Diabetes Management', icon: FaNotesMedical, description: 'Comprehensive diabetes care and monitoring' },
  { name: 'Cardiology', icon: FaHeart, description: 'Heart health and cardiac care' },
  { name: 'Internal Medicine', icon: FaStethoscope, description: 'General adult medical care' },
  { name: 'Thyroid Disorders', icon: FaUserMd, description: 'Thyroid diagnosis and treatment' },
  { name: 'Hypertension', icon: FaHospital, description: 'Blood pressure management' },
  { name: 'Preventive Care', icon: FaCalendarCheck, description: 'Health checkups and prevention' },
];

// Patient testimonials with real content
const patientStories = [
  {
    name: 'Rajesh Kumar',
    location: 'Kharadi, Pune',
    quote: 'Om Hospital diagnosed my diabetes early with Dr. Jaju\'s expert care. The treatment plan helped me manage it effectively. Very caring and knowledgeable team.',
    rating: 5
  },
  {
    name: 'Priya Sharma',
    location: 'Wagholi, Pune',
    quote: 'Best healthcare facility in the area. The doctors take time to explain everything clearly and follow up regularly. Highly recommended!',
    rating: 5
  },
  {
    name: 'Amit Patel',
    location: 'Viman Nagar, Pune',
    quote: 'I was suffering from thyroid issues for years. Om Hospital\'s treatment with Dr. Jaju has been life-changing. Thank you!',
    rating: 5
  },
  {
    name: 'Sunita Deshmukh',
    location: 'Hadapsar, Pune',
    quote: 'Dr. Jaju is very patient and listens to all concerns carefully. My mother\'s diabetes is now well controlled thanks to his expert guidance. Excellent doctor!',
    rating: 5
  },
  {
    name: 'Manoj Kulkarni',
    location: 'Kalyani Nagar, Pune',
    quote: 'I visited Om Hospital for my high blood pressure issues. Dr. Jaju prescribed the right medication and my BP is now under control. Very professional staff.',
    rating: 5
  },
  {
    name: 'Neha Joshi',
    location: 'Wadgaon Sheri, Pune',
    quote: 'The clinic is clean and well-maintained. Dr. Jaju explained my thyroid condition in simple terms and the treatment has worked wonderfully. Highly recommend!',
    rating: 5
  },
  {
    name: 'Sanjay Gaikwad',
    location: 'Mundhwa, Pune',
    quote: 'Very satisfied with the treatment for my heart condition. Dr. Jaju is thorough with his diagnosis and takes time to explain everything. Best doctor in Kharadi.',
    rating: 5
  },
  {
    name: 'Aarti Bhosale',
    location: 'Chandan Nagar, Pune',
    quote: 'My father has been visiting Om Hospital for diabetes management for over a year now. His sugar levels are perfectly controlled. Thank you Dr. Jaju!',
    rating: 5
  },
  {
    name: 'Vikram Jadhav',
    location: 'Kharadi, Pune',
    quote: 'Dr. Gopal Jaju is an excellent physician. He diagnosed my lifestyle disorder accurately and suggested both medication and diet changes. Feeling much better now.',
    rating: 5
  },
  {
    name: 'Pooja Mehta',
    location: 'Magarpatta, Pune',
    quote: 'I was referred to Dr. Jaju for my cholesterol issues. Within 3 months of treatment, my levels normalized. Very knowledgeable and caring doctor.',
    rating: 4
  },
  {
    name: 'Rahul Patil',
    location: 'Wagholi, Pune',
    quote: 'Staff is very cooperative and the appointment system is smooth. Dr. Jaju gives proper time to each patient and doesn\'t rush. Very happy with the treatment.',
    rating: 5
  },
  {
    name: 'Deepa Nair',
    location: 'Viman Nagar, Pune',
    quote: 'Om Hospital has become our family doctor. From my husband\'s BP treatment to my thyroid medication, Dr. Jaju handles everything with great expertise.',
    rating: 5
  },
  {
    name: 'Sachin Wagh',
    location: 'Keshav Nagar, Pune',
    quote: 'I appreciate how Dr. Jaju focuses on preventive care. Regular health checkups here have helped me avoid serious complications. Very trustworthy clinic.',
    rating: 5
  },
  {
    name: 'Anjali Deshpande',
    location: 'Koregaon Park, Pune',
    quote: 'After visiting multiple doctors for my persistent fatigue, Dr. Jaju correctly identified it as a thyroid issue. Proper diagnosis and effective treatment. Thank you!',
    rating: 5
  },
  {
    name: 'Hemant Shirke',
    location: 'Hadapsar, Pune',
    quote: 'Dr. Jaju is one of the best physicians in Pune. His approach to treating diabetes with both medicine and lifestyle advice has really helped me. Highly recommended!',
    rating: 5
  },
];

// Hospital affiliations
const hospitals = [
  { name: 'Manipal Hospital', location: 'Kharadi' },
  { name: 'Venkatesh Hospital', location: 'Wagholi' },
  { name: 'Ojas Hospital', location: 'Wagholi' },
  { name: 'Om Hospital', location: 'City Vista, Kharadi' },
];

const whatsappNumber = '+91 85303 45858';
const whatsappLink = 'https://wa.me/918530345858';

const LandingPage = () => {
  const { addToast } = useToast();

  // Add CSS animation for floating effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floatImage {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-30px);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({ name: '', email: '', phone: '', preferred_date: '', appointment_time: '', arrival_type: 'online' });
  const [showQRModal, setShowQRModal] = useState(false);
  const [doctorParam, setDoctorParam] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [allTimeSlots, setAllTimeSlots] = useState([]);
  const [doctorAvailability, setDoctorAvailability] = useState([]);
  const [googleReviews, setGoogleReviews] = useState([]);
  const [googleRating, setGoogleRating] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Initialize API client
  const api = useApiClient();

  // Parse doctor param for QR booking - auto open booking modal
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const d = params.get('doctor');
      if (d) {
        setDoctorParam(parseInt(d));
        // Auto open booking modal when coming from QR code
        setShowBookingModal(true);
      }
    } catch {}
  }, []);

  // Fetch Google Reviews
  useEffect(() => {
    const fetchGoogleReviews = async () => {
      if (!GOOGLE_PLACE_ID) return;

      setLoadingReviews(true);
      try {
        const response = await api.get(`/api/google-reviews?placeId=${GOOGLE_PLACE_ID}`);
        if (response.data.reviews) {
          setGoogleReviews(response.data.reviews);
          setGoogleRating(response.data.rating);
        }
      } catch (err) {
        console.log('Google reviews not available, using fallback testimonials');
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchGoogleReviews();
  }, []);

  // Fetch doctor's time slots and availability on component mount
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const slotsResponse = await api.get('/api/doctor-availability/2/slots');
        const slots = (slotsResponse.data.slots || [])
          .filter(slot => slot.is_active)
          .map(slot => ({
            dbTime: slot.slot_time.substring(0, 5),
            displayTime: slot.display_time
          }));
        setAllTimeSlots(slots);

        const availResponse = await api.get('/api/doctor-availability/2/availability');
        setDoctorAvailability(availResponse.data.availability || []);
      } catch (error) {
        console.error('Error fetching doctor settings:', error);
        setAllTimeSlots([
          { dbTime: '12:15', displayTime: '12:15 PM' },
          { dbTime: '12:30', displayTime: '12:30 PM' },
          { dbTime: '12:45', displayTime: '12:45 PM' },
          { dbTime: '13:00', displayTime: '01:00 PM' },
          { dbTime: '18:00', displayTime: '06:00 PM' },
          { dbTime: '18:30', displayTime: '06:30 PM' },
          { dbTime: '19:00', displayTime: '07:00 PM' },
          { dbTime: '19:30', displayTime: '07:30 PM' },
          { dbTime: '20:00', displayTime: '08:00 PM' },
        ]);
      }
    };

    fetchTimeSlots();
  }, []);

  // Fetch booked slots when date changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!bookingData.preferred_date) {
        setBookedSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const response = await api.get('/api/appointments/booked-slots', {
          params: {
            doctor_id: 2,
            date: bookingData.preferred_date
          }
        });
        setBookedSlots(response.data.bookedSlots || []);
      } catch (error) {
        console.error('Error fetching booked slots:', error);
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [bookingData.preferred_date]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'experience', 'doctor', 'specialties', 'testimonials', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingData.preferred_date || !bookingData.appointment_time) {
      addToast('Please select date and time', 'error');
      return;
    }

    try {
      const response = await api.post('/api/appointment-intents', {
        full_name: bookingData.name,
        phone: bookingData.phone,
        email: bookingData.email,
        speciality: 'Consultation',
        preferred_date: bookingData.preferred_date,
        preferred_time: bookingData.appointment_time,
        doctor_id: doctorParam || 2,
        arrival_type: bookingData.arrival_type,
        message: `${bookingData.arrival_type === 'online' ? 'Online' : 'Offline'} appointment request on ${bookingData.preferred_date} at ${bookingData.appointment_time}`,
        auto_create: true
      });
      addToast('Appointment booked successfully!', 'success');
      setShowBookingModal(false);
      setBookingData({ name: '', email: '', phone: '', preferred_date: '', appointment_time: '', arrival_type: 'online' });
      setBookedSlots([]);
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to book appointment';
      addToast(errorMessage, 'error');

      if (errorMessage.includes('already booked')) {
        try {
          const response = await api.get('/api/appointments/booked-slots', {
            params: {
              doctor_id: 2,
              date: bookingData.preferred_date
            }
          });
          setBookedSlots(response.data.bookedSlots || []);
        } catch (refreshError) {
          console.error('Error refreshing slots:', refreshError);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col relative">
      {/* Header */}
      <header className="bg-white border-b-2 border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
              Om
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">Om Hospital</p>
              <p className="text-xs text-blue-600 font-medium">Dr. Gopal Jaju</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#home" className={`transition ${activeSection === 'home' ? 'font-semibold text-blue-700' : 'hover:text-blue-600'}`}>Home</a>
            <a href="#experience" className={`transition ${activeSection === 'experience' ? 'font-semibold text-blue-700' : 'hover:text-blue-600'}`}>Experience</a>
            <a href="#doctor" className={`transition ${activeSection === 'doctor' ? 'font-semibold text-blue-700' : 'hover:text-blue-600'}`}>About Doctor</a>
            <a href="#specialties" className={`transition ${activeSection === 'specialties' ? 'font-semibold text-blue-700' : 'hover:text-blue-600'}`}>Specialties</a>
            <a href="#testimonials" className={`transition ${activeSection === 'testimonials' ? 'font-semibold text-blue-700' : 'hover:text-blue-600'}`}>Reviews</a>
            <a href="#contact" className={`transition ${activeSection === 'contact' ? 'font-semibold text-blue-700' : 'hover:text-blue-600'}`}>Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline-flex px-5 py-2 text-sm font-medium text-blue-700 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition">
              Login
            </Link>
            <button onClick={() => setShowBookingModal(true)} className="px-6 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition">
              Book Now
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Dark Blue Gradient */}
      <section id="home" className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <p className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-400/30 to-blue-500/30 text-blue-50 text-xs font-bold rounded-full mb-6 border border-blue-300/60 shadow-lg backdrop-blur-sm">
              ✨ TRUSTED HEALTHCARE PROVIDER
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 text-white drop-shadow-lg">
              Dr. Gopal Jaju<br />
              <span className="bg-gradient-to-r from-blue-200 via-blue-100 to-white bg-clip-text text-transparent">Expert Medical Care</span>
            </h1>
            <p className="text-blue-50 mb-3 text-lg lg:text-xl font-semibold">
              🏥 MD Medicine | Consultant Physician
            </p>
            <p className="text-blue-100 mb-8 text-base lg:text-lg leading-relaxed max-w-2xl font-medium">
              Specialist in Diabetes, Cardiology, and Internal Medicine with over 10 years of experience. Known for accurate diagnosis, ethical practice, and personalized treatment plans focused on long-term health.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-8 py-4 rounded-xl bg-white text-blue-700 font-bold text-base shadow-xl hover:shadow-2xl transition hover:bg-blue-50 transform hover:-translate-y-1 active:translate-y-0 flex items-center gap-2"
              >
                <span className="text-xl">📅</span> Book Appointment
              </button>
              <a
                href={`tel:+918530345858`}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-400/40 to-blue-500/40 hover:from-blue-400/60 hover:to-blue-500/60 text-white font-bold text-base border-2 border-white/60 transition flex items-center gap-2 hover:shadow-lg transform hover:-translate-y-1 backdrop-blur-sm"
              >
                <span className="text-2xl">📞</span> 8530345858
              </a>
            </div>

            {/* Stats with Icons */}
            <div className="flex gap-6 lg:gap-10 flex-wrap">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-lg border border-white/20 hover:bg-white/15 transition">
                <div className="text-4xl">👨‍⚕️</div>
                <div>
                  <p className="text-3xl font-black text-white">10+</p>
                  <p className="text-blue-200 text-xs font-semibold">Years Exp.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-lg border border-white/20 hover:bg-white/15 transition">
                <div className="text-4xl">👥</div>
                <div>
                  <p className="text-3xl font-black text-white">10K+</p>
                  <p className="text-blue-200 text-xs font-semibold">Patients</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-lg border border-white/20 hover:bg-white/15 transition">
                <div className="text-4xl">⭐</div>
                <div>
                  <p className="text-3xl font-black text-white">4.9</p>
                  <p className="text-blue-200 text-xs font-semibold">Rating</p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Image with Enhanced Styling */}
          <div className="hidden lg:flex justify-center items-center" style={{animation: 'floatImage 4s ease-in-out infinite'}}>
            <div className="relative">
              {/* Outer glow effect */}
              <div className="absolute -inset-6 bg-gradient-to-br from-blue-300/40 to-blue-500/20 rounded-3xl blur-2xl -z-20 animate-pulse" style={{animationDuration: '3s'}}></div>
              
              {/* Main image container */}
              <div className="w-80 h-96 rounded-3xl bg-white/10 backdrop-blur-md border-4 border-white/50 overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 relative">
                {/* Image frame border decoration */}
                <div className="absolute inset-0 border-8 border-white/20 rounded-3xl pointer-events-none"></div>
                
                <img
                  src="/dr-gopal-jaju.jpg"
                  alt="Dr. Gopal Jaju"
                  className="w-full h-full object-cover object-top hover:scale-105 transition duration-500"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-white/30 text-6xl"><svg class="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg></div>';
                  }}
                />
              </div>

              {/* Floating decorative elements */}
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/25 rounded-full -z-10 blur-3xl animate-pulse" style={{animationDuration: '5s'}}></div>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-400/25 rounded-full -z-10 blur-3xl animate-pulse" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>
              <div className="absolute -bottom-4 right-0 w-24 h-24 bg-blue-300/20 rounded-full -z-10 blur-2xl animate-pulse" style={{animationDuration: '3s', animationDelay: '1s'}}></div>

              {/* Badge overlay */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 backdrop-blur-sm border border-green-300/60">
                ✓ Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* Clinical Excellence & Experience */}
        <section id="experience" className="py-16 lg:py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">EXPERIENCE</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Clinical Excellence & Experience</h2>
            </div>

            {/* Experience Stats Card */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-10 mb-12 max-w-3xl mx-auto border border-blue-100">
              <div className="flex items-center justify-between flex-wrap gap-8">
                <div className="text-center flex-1">
                  <div className="text-4xl mb-2">💪</div>
                  <p className="text-5xl font-black text-blue-700">10,000+</p>
                  <p className="text-gray-600 text-sm mt-2 font-semibold">Patients Treated</p>
                </div>
                <div className="w-px h-20 bg-blue-200 hidden sm:block"></div>
                <div className="text-center flex-1">
                  <div className="text-4xl mb-2">📚</div>
                  <p className="text-5xl font-black text-blue-700">15+</p>
                  <p className="text-gray-600 text-sm mt-2 font-semibold">Years Experience</p>
                </div>
                <div className="w-px h-20 bg-blue-200 hidden sm:block"></div>
                <div className="text-center flex-1">
                  <div className="text-4xl mb-2">⭐</div>
                  <p className="text-5xl font-black text-blue-700">4.9</p>
                  <p className="text-gray-600 text-sm mt-2 font-semibold\">Patient Rating</p>
                </div>
              </div>
            </div>

            {/* Hospital Affiliations */}
            <div className="mb-8">
              <h3 className="text-center text-lg font-semibold text-gray-700 mb-6">Hospital Affiliations</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {hospitals.map((hospital, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-5 shadow-md border-2 border-blue-100 text-center hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 group">
                    <FaHospital className="text-3xl text-blue-600 mx-auto mb-3 group-hover:text-blue-700" />
                    <p className="font-bold text-gray-900 text-sm">{hospital.name}</p>
                    <p className="text-gray-500 text-xs mt-1 font-medium">{hospital.location}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Training Background */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-8 shadow-xl border border-blue-100 max-w-3xl mx-auto">
              <h3 className="font-black text-gray-900 mb-6 text-center text-xl">🎓 Training & Qualifications</h3>
              <div className="grid sm:grid-cols-2 gap-5 text-sm">
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-blue-100 hover:shadow-md transition">
                  <div className="text-2xl">🏥</div>
                  <div>
                    <p className="font-bold text-gray-900">Lilavati Hospital, Mumbai</p>
                    <p className="text-gray-500 text-xs mt-1 font-semibold\">Ex ICU Registrar</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-blue-100 hover:shadow-md transition">
                  <div className="text-2xl">🏥</div>
                  <div>
                    <p className="font-bold text-gray-900">Nanavati Hospital, Mumbai</p>
                    <p className="text-gray-500 text-xs mt-1 font-semibold\">Ex ICU Registrar</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-blue-100 hover:shadow-md transition">
                  <div className="text-2xl">📜</div>
                  <div>
                    <p className="font-bold text-gray-900">MBBS, MD Medicine</p>
                    <p className="text-gray-500 text-xs mt-1 font-semibold\">Internal Medicine Specialist</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-blue-100 hover:shadow-md transition">
                  <div className="text-2xl">✅</div>
                  <div>
                    <p className="font-bold text-gray-900">MMC Registered</p>
                    <p className="text-gray-500 text-xs mt-1 font-semibold\">Reg: MMC-2022051089</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Profile Section */}
        <section id="doctor" className="py-16 lg:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-8 lg:p-12 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

              <div className="grid lg:grid-cols-2 gap-10 items-center relative z-10">
                {/* Doctor Image */}
                <div className="flex justify-center lg:justify-start">
                  <div className="w-64 h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
                    <img
                      src="/dr-gopal-jaju.jpg"
                      alt="Dr. Gopal Jaju"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white/50"><svg class="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg></div>';
                      }}
                    />
                  </div>
                </div>

                {/* Doctor Info */}
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold mb-2">Dr. Gopal Jaju</h2>
                  <p className="text-blue-400 font-medium text-lg mb-4">MD Medicine | Consultant Physician</p>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Specialist in Diabetes, Cardiology, and Internal Medicine with over 10 years of experience.
                    Known for accurate diagnosis, ethical practice, and personalized treatment plans focused on long-term health.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center bg-white/5 rounded-xl p-3">
                      <p className="text-2xl font-bold text-blue-400">10+</p>
                      <p className="text-xs text-gray-400">Years Exp.</p>
                    </div>
                    <div className="text-center bg-white/5 rounded-xl p-3">
                      <p className="text-2xl font-bold text-blue-400">10K+</p>
                      <p className="text-xs text-gray-400">Patients</p>
                    </div>
                    <div className="text-center bg-white/5 rounded-xl p-3">
                      <p className="text-2xl font-bold text-blue-400">4.9</p>
                      <p className="text-xs text-gray-400">Rating</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition"
                    >
                      Book Appointment
                    </button>
                    <a
                      href={`tel:${whatsappNumber.replace(/\s/g, '')}`}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition flex items-center gap-2"
                    >
                      <FaPhoneAlt /> 8530345858
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Specialties */}
        <section id="specialties" className="py-16 lg:py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">SERVICES</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Our Specialties</h2>
              <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
                Comprehensive medical care for a wide range of conditions
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialties.map((specialty, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition group"
                >
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition shadow-sm">
                    <specialty.icon className="text-2xl text-blue-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{specialty.name}</h3>
                  <p className="text-gray-600 text-sm">{specialty.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Patient Experiences / Testimonials */}
        <section id="testimonials" className="py-16 lg:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">REVIEWS</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Patient Experiences</h2>
              <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
                What our patients say about their experience with Dr. Gopal Jaju
              </p>

              {/* Google Rating Badge */}
              {googleRating && (
                <div className="mt-4 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
                  <FaGoogle className="text-blue-500" />
                  <span className="font-semibold text-gray-900">{googleRating.toFixed(1)}</span>
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FaStar key={i} className={i < Math.round(googleRating) ? 'text-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className="text-gray-500 text-sm">on Google</span>
                </div>
              )}
            </div>

            {loadingReviews ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {/* Show Google reviews if available, otherwise show static testimonials */}
                {(googleReviews.length > 0 ? googleReviews : patientStories).slice(0, showAllReviews ? undefined : 3).map((story, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition">
                    {/* Google badge for Google reviews */}
                    {googleReviews.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <FaGoogle className="text-blue-500" />
                        <span>Google Review</span>
                      </div>
                    )}

                    {/* Stars */}
                    <div className="flex text-yellow-400 text-sm gap-0.5 mb-4">
                      {Array.from({ length: story.rating || 5 }).map((_, i) => <FaStar key={i} />)}
                    </div>

                    {/* Quote */}
                    <p className="text-gray-700 mb-6 leading-relaxed line-clamp-4">
                      "{story.text || story.quote}"
                    </p>

                    {/* Patient Info */}
                    <div className="flex items-center gap-3">
                      {story.profile_photo_url ? (
                        <img
                          src={story.profile_photo_url}
                          alt={story.author_name || story.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                          {(story.author_name || story.name || 'A').charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{story.author_name || story.name}</p>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          {story.relative_time_description ? (
                            <span>{story.relative_time_description}</span>
                          ) : (
                            <>
                              <FaMapMarkerAlt className="text-blue-500" />
                              {story.location}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View All / Show Less toggle */}
            {!showAllReviews && (googleReviews.length > 3 || patientStories.length > 3) && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAllReviews(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition shadow-md"
                >
                  View All Reviews
                </button>
              </div>
            )}
            {showAllReviews && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAllReviews(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition"
                >
                  Show Less
                </button>
              </div>
            )}

            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-8 py-4 rounded-xl bg-blue-700 text-white font-semibold shadow hover:bg-blue-800 transition"
              >
                Book Your Appointment
              </button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 lg:py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">CONTACT</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Get In Touch</h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Phone */}
              <a
                href={`tel:${whatsappNumber.replace(/\s/g, '')}`}
                className="bg-white rounded-2xl p-6 shadow-md border-2 border-blue-100 hover:shadow-lg hover:border-blue-300 transition text-center group"
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition">
                  <FaPhoneAlt className="text-xl text-blue-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Call Us</h3>
                <p className="text-blue-600 font-bold">+91 85303 45858</p>
              </a>

              {/* WhatsApp */}
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="bg-white rounded-2xl p-6 shadow-md border-2 border-green-100 hover:shadow-lg hover:border-green-300 transition text-center group"
              >
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition">
                  <FaWhatsapp className="text-2xl text-green-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                <p className="text-green-600 font-bold">Chat with us</p>
              </a>

              {/* Location */}
              <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-amber-100 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <FaMapMarkerAlt className="text-xl text-amber-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Visit Us</h3>
                <p className="text-gray-600 text-sm font-medium">City Vista, Kharadi, Pune</p>
              </div>
            </div>

            {/* Clinic Timings */}
            <div className="mt-10 bg-white rounded-2xl p-6 shadow-md border-2 border-blue-100 max-w-3xl mx-auto">
              <h3 className="font-semibold text-gray-900 text-center mb-4">Clinic Timings</h3>

              {/* Time Slots Range */}
              {allTimeSlots.length > 0 && (() => {
                const times = allTimeSlots.map(s => s.dbTime).sort();
                const groups = [];
                let groupStart = times[0];
                let prev = times[0];
                for (let i = 1; i <= times.length; i++) {
                  const curr = times[i];
                  const prevMins = prev ? parseInt(prev.split(':')[0]) * 60 + parseInt(prev.split(':')[1]) : 0;
                  const currMins = curr ? parseInt(curr.split(':')[0]) * 60 + parseInt(curr.split(':')[1]) : 0;
                  if (!curr || currMins - prevMins > 60) {
                    groups.push({ start: groupStart, end: prev });
                    if (curr) groupStart = curr;
                  }
                  prev = curr;
                }
                const fmt = (t) => {
                  const [h, m] = t.split(':').map(Number);
                  const ampm = h >= 12 ? 'PM' : 'AM';
                  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
                  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
                };
                return (
                  <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
                    {groups.map((g, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-gray-700 font-medium">{i === 0 ? 'Morning / Afternoon' : 'Evening'}</span>
                        <span className="font-bold text-blue-700">{fmt(g.start)} - {fmt(g.end)}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Working Days */}
              {doctorAvailability.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {doctorAvailability.map(day => (
                    <span
                      key={day.day_of_week}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        day.is_available
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-400 border border-red-200 line-through'
                      }`}
                    >
                      {day.day_name}
                    </span>
                  ))}
                </div>
              )}
              {doctorAvailability.length > 0 && (() => {
                const closedDays = doctorAvailability.filter(d => !d.is_available).map(d => d.day_name);
                return closedDays.length > 0 ? (
                  <p className="text-center text-gray-500 text-xs mt-3">Closed on {closedDays.join(', ')}</p>
                ) : (
                  <p className="text-center text-gray-500 text-xs mt-3">Open all days</p>
                );
              })()}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-gray-300 border-t-4 border-blue-600 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-700/10 rounded-full -z-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full -z-10 blur-3xl"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            {/* Clinic Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">🏥</div>
                <div>
                  <p className="font-bold text-white text-lg">Om Hospital</p>
                  <p className="text-xs text-blue-300">Dr. Gopal Jaju</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">Expert care for Diabetes, Heart Disease, and Lifestyle disorders. Your health is our priority.</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                Quick Links
              </h4>
              <div className="space-y-3 text-sm">
                <a href="#home" className="block text-gray-400 hover:text-blue-300 transition duration-200 font-medium">
                  ➜ Home
                </a>
                <a href="#doctor" className="block text-gray-400 hover:text-blue-300 transition duration-200 font-medium">
                  ➜ About Doctor
                </a>
                <a href="#specialties" className="block text-gray-400 hover:text-blue-300 transition duration-200 font-medium">
                  ➜ Specialties
                </a>
                <a href="#contact" className="block text-gray-400 hover:text-blue-300 transition duration-200 font-medium">
                  ➜ Contact
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-lg">💊</span>
                Services
              </h4>
              <div className="space-y-3 text-sm">
                <p className="text-gray-400 font-medium">✓ Diabetes Management</p>
                <p className="text-gray-400 font-medium">✓ Cardiac Care</p>
                <p className="text-gray-400 font-medium">✓ Lifestyle Disorders</p>
                <p className="text-gray-400 font-medium">✓ General Consultation</p>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-lg">📞</span>
                Contact
              </h4>
              <div className="space-y-3 text-sm">
                <a href="tel:+918530345858" className="block text-gray-400 hover:text-blue-300 transition font-medium">
                  📱 +91 85303 45858
                </a>
                <p className="text-gray-400 font-medium">
                  📍 City Vista, Kharadi, Pune
                </p>
                <a href="mailto:drjajugopal@gmail.com" className="block text-gray-400 hover:text-blue-300 transition font-medium">
                  ✉️ drjajugopal@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-blue-700/50 my-8"></div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-gray-500 text-center md:text-left">
              &copy; 2025 Om Hospital And Diagnostic Center. All rights reserved.
            </p>
            
            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/918530345858?text=${encodeURIComponent('Hello, I would like to book an appointment at Om Hospital.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-lg">💬</span>
              WhatsApp Us
            </a>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-xl font-semibold">Book Appointment</h2>
              <button onClick={() => {
                setShowBookingModal(false);
                setBookingData({ name: '', email: '', phone: '', preferred_date: '', appointment_time: '', arrival_type: 'online' });
              }} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={bookingData.name}
                  onChange={e => setBookingData({ ...bookingData, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={bookingData.phone}
                  onChange={e => setBookingData({ ...bookingData, phone: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={bookingData.email}
                  onChange={e => setBookingData({ ...bookingData, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter email (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Consultation Type *</label>
                <select
                  required
                  value={bookingData.arrival_type}
                  onChange={e => setBookingData({ ...bookingData, arrival_type: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="offline">Offline - Hospital Visit</option>
                  <option value="online">Online - WhatsApp / Video Call</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {bookingData.arrival_type === 'online'
                    ? 'Doctor will connect via WhatsApp call or video call'
                    : 'Visit the hospital for in-person consultation'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingData.preferred_date}
                  onChange={e => {
                    const selectedDate = new Date(e.target.value + 'T00:00:00');
                    const dayOfWeek = selectedDate.getDay();

                    const dayAvailability = doctorAvailability.find(d => d.day_of_week === dayOfWeek);
                    if (dayAvailability && !dayAvailability.is_available) {
                      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
                      addToast(`Clinic is closed on ${dayName}s. Please select another date.`, 'error');
                      return;
                    }

                    setBookingData({ ...bookingData, preferred_date: e.target.value, appointment_time: '' });
                  }}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Clinic is closed on Sundays</p>
              </div>

              {bookingData.preferred_date && (() => {
                const isToday = bookingData.preferred_date === new Date().toISOString().split('T')[0];
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();

                // Filter slots: if today, only show future slots
                const availableSlots = allTimeSlots.filter(slot => {
                  if (!isToday) return true;
                  const [h, m] = slot.dbTime.split(':').map(Number);
                  return h * 60 + m > currentMinutes;
                });

                return (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Time Slot *
                    {loadingSlots && <span className="text-xs text-gray-500 ml-2">(Loading...)</span>}
                  </label>
                  {availableSlots.length === 0 ? (
                    <div className="text-center py-4 border rounded-xl bg-gray-50">
                      <p className="text-gray-500 text-sm">No available slots {isToday ? 'remaining for today' : 'for this date'}. Please select another date.</p>
                    </div>
                  ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-xl p-3">
                    {availableSlots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot.dbTime);
                      const isSelected = bookingData.appointment_time === slot.dbTime;

                      return (
                        <button
                          key={slot.dbTime}
                          type="button"
                          disabled={isBooked}
                          onClick={() => {
                            if (isBooked) {
                              addToast('This slot is already booked. Please choose another slot.', 'error');
                              return;
                            }
                            setBookingData({ ...bookingData, appointment_time: slot.dbTime });
                          }}
                          title={isBooked ? 'Already booked - choose another slot' : `Book at ${slot.displayTime}`}
                          className={`
                            px-2 py-2 text-xs rounded-lg font-medium transition-all relative
                            ${isBooked
                              ? 'bg-red-50 text-red-400 cursor-not-allowed border border-red-200'
                              : isSelected
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                            }
                          `}
                        >
                          {slot.displayTime}
                          {isBooked && <span className="block text-[10px] text-red-400 mt-0.5">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                  )}
                </div>
                );
              })()}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingData({ name: '', email: '', phone: '', preferred_date: '', appointment_time: '', arrival_type: 'online' });
                    setBookedSlots([]);
                  }}
                  className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition font-medium"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Doctor QR Booking</h3>
              <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-center">
              {(() => {
                const link = `${window.location.origin}${window.location.pathname}?doctor=${doctorParam || 2}`;
                const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(link)}`;
                return (
                  <>
                    <img src={qrSrc} alt="Booking QR" className="mx-auto" />
                    <p className="text-sm text-gray-600 break-all">{link}</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={async () => { await navigator.clipboard.writeText(link); addToast('Link copied!', 'success'); }}
                        className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => {
                          const msg = `Book your appointment here: ${link}`;
                          const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                          window.open(wa, '_blank');
                        }}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Share via WhatsApp
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Floating Button */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl p-4 flex items-center justify-center z-[9999] transition-all duration-300 hover:scale-110"
        aria-label="Contact us on WhatsApp"
      >
        <FaWhatsapp className="text-2xl" />
      </a>
    </div>
  );
};

export default LandingPage;
