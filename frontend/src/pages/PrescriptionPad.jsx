import React, { useRef, useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { FiEdit3, FiVideo, FiLink2, FiCopy, FiSettings, FiX, FiDownload, FiBookmark } from 'react-icons/fi';
import { useToast } from '../hooks/useToast';
import { useApiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';  // Make sure this exists
import { useTranslation } from '../context/LanguageContext';
const Letterhead = lazy(() => import('../components/Letterhead'));
const SpecialtySelector = lazy(() => import('../components/specialty/SpecialtySelector'));
const RepeatPrescriptionButton = lazy(() => import('../components/RepeatPrescriptionButton'));
const PrescriptionA5Format = lazy(() => import('../components/PrescriptionA5Format'));
import { downloadPrescriptionPDF } from '../services/pdfService';

// PHASE 1: Import Quick Wins utilities
import {
  quickTemplates,
  applyCompleteTemplate,
  keyboardShortcuts,
  RecentlyUsedMedicines
} from '../utils/prescriptionEnhancements';

// PHASE 2: Import Advanced Features
import {
  SmartMedicationCombos,
  RecentlyUsedMedicinesSidebar,
  DosageCalculator,
  VoiceToTextInput,
  DrugInteractionChecker,
  ComplianceTracker,
  SplitViewLayout,
  initializePrescriptionEnhancements
} from '../utils/PrescriptionPadEnhancements';

const symptomSuggestions = ['Fever', 'Cough', 'Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Pain', 'Weakness'];
const diagnosisSuggestions = ['Hypertension', 'Diabetes', 'URI', 'Migraine', 'Gastritis', 'Anemia', 'Asthma'];

const predefinedAdvice = {
  en: [
    'Plenty of liquids',
    'Steaming gargling',
    'Rest well',
    'Avoid spicy food',
    'Take medicines on time',
    'Follow up if symptoms persist'
  ],
  hi: [
    'खूब सारे तरल पदार्थ लें',
    'भाप और गरारे करें',
    'अच्छे से आराम करें',
    'मसालेदार भोजन से बचें',
    'समय पर दवाई लें',
    'लक्षण बने रहने पर फॉलो-अप करें'
  ],
  mr: [
    'भरपूर द्रव पदार्थ घ्या',
    'वाफ आणि गरारे करा',
    'चांगली विश्रांती घ्या',
    'मसालेदार अन्न टाळा',
    'वेळेवर औषध घ्या',
    'लक्षणे कायम राहिल्यास फॉलो-अप करा'
  ],
  bn: [
    'প্রচুর তরল গ্রহণ করুন',
    'বাষ্প এবং গড়গড় করুন',
    'ভালোভাবে বিশ্রাম নিন',
    'ঝালযুক্ত খাবার এড়িয়ে চলুন',
    'সময়মতো ওষুধ সেবন করুন',
    'উপসর্গ থাকলে ফলো-আপ করুন'
  ],
  gu: [
    'પૂરતી પ્રવાહી પદાર્થ લો',
    'વરાળ અને ગરારા કરો',
    'સારી રીતે આરામ કરો',
    'તીખું ખાવાનો ટાળો',
    'સમયે દવા લો',
    'લક્ષણો રહેલા હોય તો ફોલો-અપ કરો'
  ],
  ta: [
    'நிறைய திரவங்களை எடுக்கவும்',
    'நீராவிப்பு மற்றும் கரகரக்க செய்யவும்',
    'நன்கு ஓய்வெடுக்கவும்',
    'காரமான உணவைத் தவிர்க்கவும்',
    'சரியான நேரத்தில் மருந்துகளை எடுக்கவும்',
    'அறிகுறிகள் தொடர்ந்தால் பின்தொடர்வு செய்யவும்'
  ],
  te: [
    'సమృద్ధిగా ద్రవాలు తీసుకోండి',
    'ఆవిరం మరియు గారగారాలు చేయండి',
    'బాగా విశ్రాంతి తీసుకోండి',
    'మసాలా ఆహారాన్ని నివారించండి',
    'సమయానికి మందులు తీసుకోండి',
    'లక్షణాలు కొనసాగితే ఫాలో-అప్ చేయండి'
  ],
  kn: [
    'ಹೆಚ್ಚಿನ ದ್ರವಗಳನ್ನು ಸೇವಿಸಿ',
    'ಆವಿ ಮತ್ತು ಗರಗರನೆ ಮಾಡಿ',
    'ಚೆನ್ನಾಗಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ',
    'ಖಾರದ ಆಹಾರವನ್ನು ತಡೆಹಿಡಿರಿ',
    'ಸಮಯಕ್ಕೆ ಔಷಧಿಗಳನ್ನು ಸೇವಿಸಿ',
    'ರೋಗಲಕ್ಷಣಗಳು ಮುಂದುವರಿದರೆ ಫಾಲೋ-ಅಪ್ ಮಾಡಿ'
  ],
  ml: [
    'ധാരാളം ദ്രാവകങ്ങൾ കഴിക്കുക',
    'ആവിയും ഗാർഗാറും ചെയ്യുക',
    'നന്നായി വിശ്രമിക്കുക',
    'മസാല ഭക്ഷണം ഒഴിവാക്കുക',
    'സമയത്ത് മരുന്നുകൾ കഴിക്കുക',
    'ലക്ഷണങ്ങൾ തുടരുന്നെങ്കിൽ ഫോളോ-അപ്പ് ചെയ്യുക'
  ],
  pa: [
    'ਬਹੁਤ ਸਾਰੇ ਤਰਲ ਪਦਾਰਥ ਲਓ',
    'ਭਾਫ ਅਤੇ ਗਰਾਰੇ ਕਰੋ',
    'ਚੰਗੀ ਤਰ੍ਹਾਂ ਆਰਾਮ ਕਰੋ',
    'ਮਸਾਲੇਦਾਰ ਖਾਣਾ ਤੋਂ ਬਚੋ',
    'ਸਮੇਂ ਤੇ ਦਵਾਈ ਲਓ',
    'ਲੱਛਣ ਰਹਿਤਾਂ ਫਾਲੋ-ਅਪ ਕਰੋ'
  ],
  ur: [
    'بہت سارے مائعات لیں',
    'بھاپ اور غرارے کریں',
    'اچھی طرح آرام کریں',
    'مصالحے دار کھانا سے بچیں',
    'وقت پر دوا لیں',
    'علامات رہنے پر فالو اپ کریں'
  ]
};

const instructionLanguages = [
  { code: 'hi', name: 'हिंदी - Hindi' },
  { code: 'en', name: 'English' },
  { code: 'mr', name: 'मराठी - Marathi' },
  { code: 'bn', name: 'বাংলা - Bengali' },
  { code: 'gu', name: 'ગુજરાતી - Gujarati' },
  { code: 'ta', name: 'தமிழ் - Tamil' },
  { code: 'te', name: 'తెలుగు - Telugu' },
  { code: 'kn', name: 'ಕನ್ನಡ - Kannada' },
  { code: 'ml', name: 'മലയാളം - Malayalam' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ - Punjabi' },
  { code: 'ur', name: 'اردو - Urdu' }
];

const timingOptions = {
  en: [
    'After Meal',
    'Before Breakfast',
    'Before Meal',
    'Empty Stomach',
    'With Food'
  ],
  hi: [
    'खाने के बाद',
    'नाश्ते से पहले',
    'खाने से पहले',
    'खाली पेट',
    'खाने के साथ'
  ],
  mr: [
    'जेवणानंतर',
    'नाश्त्यापूर्वी',
    'जेवणापूर्वी',
    'रिकाम्या पोटी',
    'जेवणासोबत'
  ],
  bn: [
    'খাওয়ার পরে',
    'সকালের খাবারের আগে',
    'খাবারের আগে',
    'পেট খালি',
    'খাবারের সাথে'
  ],
  gu: [
    'ખાણ પછી',
    'નાસ્તા પહેલાં',
    'ખાણ પહેલાં',
    'પેટ ખાલી',
    'ખાણ સાથે'
  ],
  ta: [
    'உணவுக்குப் பின்',
    'காலை உணவுக்கு முன்',
    'உணவுக்கு முன்',
    'வயிற்று காலி',
    'உணவுடன்'
  ],
  te: [
    'భోజనం తర్వాత',
    'అర్థాన్నికి ముందు',
    'భోజనానికి ముందు',
    'ఖాలీ పేట',
    'భోజనంతో'
  ],
  kn: [
    'ಊಟದ ನಂತರ',
    'ಬೆಳಿಗ್ಗೆ ಊಟಕ್ಕೂ ಮೊದು',
    'ಊಟಕ್ಕೂ ಮೊದು',
    'ಖಾಲಿ ಹೊಟ್ಟ',
    'ಊಟದೊಂದಿಗೆ'
  ],
  ml: [
    'ഭക്ഷണത്തിനു ശേഷം',
    'രാവിലെ ഭക്ഷണത്തിനു മുമ്പ്',
    'ഭക്ഷണത്തിനു മുമ്പ്',
    'വയറു ശൂന്യം',
    'ഭക്ഷണത്തോടൊപ്പം'
  ],
  pa: [
    'ਖਾਣ ਤੋਂ ਬਾਅਦ',
    'ਸਵੇਰ ਤੋਂ ਪਹਿਲਾਂ',
    'ਖਾਣ ਤੋਂ ਪਹਿਲਾਂ',
    'ਖਾਲੀ ਪੇਟ',
    'ਖਾਣ ਨਾਲ'
  ],
  ur: [
    'کھنے کے بعد',
    'ناشتے سے پہلے',
    'کھانے سے پہلے',
    'بھیجے پیٹ',
    'کھانے کے ساتھ'
  ]
};

const frequencyOptions = {
  en: ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'SOS'],
  hi: ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'ज़रूरत पर'],
  mr: ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'गरजेनुसार'],
  bn: ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'প্রয়োজনে'],
  gu: ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'જરૂરીયાત'],
  ta: ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'தேவைப்படி'],
  te: ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'అవసరానుగుణంగా'],
  kn: ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'ಅಗತ್ಯಾನುಸಾರ'],
  ml: ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'ആവശ്യമെന്ന്'],
  pa: ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'ਲੋੜ ਪਈਂ'],
  ur: ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'ضرورت پڑ']
};

const uiLabels = {
  en: {
    medicines: 'Medicines',
    diagnosis: 'Diagnosis',
    advice: 'Advice / Instructions',
    followUp: 'Follow Up',
    patientNotes: 'Patient Notes',
    privateNotes: 'Private Notes',
    symptoms: 'Symptoms',
    labTests: 'Lab Tests',
    procedures: 'Procedures',
    dosage: 'Dosage',
    frequency: 'Frequency',
    duration: 'Duration',
    quantity: 'Quantity',
    instructions: 'Instructions',
    add: 'Add',
    remove: 'Remove',
    save: 'Save',
    cancel: 'Cancel',
    selectLanguage: 'Select Language'
  },
  hi: {
    medicines: 'दवाएँ',
    diagnosis: 'निदान',
    advice: 'सलाह / निर्देश',
    followUp: 'फॉलो-अप',
    patientNotes: 'रोगी नोट्स',
    privateNotes: 'निजी नोट्स',
    symptoms: 'लक्षण',
    labTests: 'लैब टेस्ट',
    procedures: 'प्रक्रियाएँ',
    dosage: 'खुराक',
    frequency: 'आवृत्ति',
    duration: 'अवधि',
    quantity: 'मात्रा',
    instructions: 'निर्देश',
    add: 'जोड़ें',
    remove: 'हटाएं',
    save: 'सेव करें',
    cancel: 'रद्द करें',
    selectLanguage: 'भाषा चुनें'
  },
  mr: {
    medicines: 'औषधे',
    diagnosis: 'निदान',
    advice: 'सल्ला / सूचना',
    followUp: 'फॉलो-अप',
    patientNotes: 'रुग्ण नोट्स',
    privateNotes: 'वैयक्तिक नोट्स',
    symptoms: 'लक्षणे',
    labTests: 'लॅब चाचण्या',
    procedures: 'प्रक्रिया',
    dosage: 'डोस',
    frequency: 'वारंवार',
    duration: 'कालावधी',
    quantity: 'प्रमाण',
    instructions: 'सूचना',
    add: 'जोडा',
    remove: 'काढा',
    save: 'जतन करा',
    cancel: 'रद्द करा',
    selectLanguage: 'भाषा निवडा'
  },
  bn: {
    medicines: 'ওষুধ',
    diagnosis: 'রোগ নির্ণয',
    advice: 'পরামর্শ / নির্দেশ',
    followUp: 'ফলো-আপ',
    patientNotes: 'রোগীর নোট',
    privateNotes: 'ব্যক্তিগত নোট',
    symptoms: 'উপসর্গ',
    labTests: 'ল্যাব পরীক্ষা',
    procedures: 'পদ্ধতি',
    dosage: 'ডোজ',
    frequency: 'ফ্রিকোয়েন্সি',
    duration: 'সময়কাল',
    quantity: 'পরিমাণ',
    instructions: 'নির্দেশ',
    add: 'যোগ করুন',
    remove: 'সরান',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    selectLanguage: 'ভাষা নির্বাচন করুন'
  },
  gu: {
    medicines: 'દવાઓ',
    diagnosis: 'નિદાન',
    advice: 'સલાહ / સૂચના',
    followUp: 'ફોલો-અપ',
    patientNotes: 'દર્દી નોટ્સ',
    privateNotes: 'ખાનગી નોટ્સ',
    symptoms: 'લક્ષણો',
    labTests: 'લેબ ટેસ્ટ',
    procedures: 'પ્રક્રિયાઓ',
    dosage: 'ડોઝ',
    frequency: 'આવર્તિ',
    duration: 'સમયગાળો',
    quantity: 'જથ્થો',
    instructions: 'સૂચના',
    add: 'ઉમેરો',
    remove: 'દૂર કરો',
    save: 'સાચવો',
    cancel: 'રદ કરો',
    selectLanguage: 'ભાષા પસંદ કરો'
  },
  ta: {
    medicines: 'மருந்துகள்',
    diagnosis: 'நோய் கண்டறி',
    advice: 'ஆலோசனை / வழிமுறைகள்',
    followUp: 'பின் தொடர்வு',
    patientNotes: 'நோயாளி குறிப்புகள்',
    privateNotes: 'தனிப்பட்ட குறிப்புகள்',
    symptoms: 'அறிகுறிகள்',
    labTests: 'ஆய்வகூட சோதனைகள்',
    procedures: 'செயல்முறைகள்',
    dosage: 'அளவு',
    frequency: 'அதிர்வதி',
    duration: 'காலம்',
    quantity: 'அளவு',
    instructions: 'வழிமுறைகள்',
    add: 'சேர்க்கவும்',
    remove: 'அகற்று',
    save: 'சேமிக்கவும்',
    cancel: 'ரத்து',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்'
  },
  te: {
    medicines: 'మందులు',
    diagnosis: 'రోగ నిర్ధారణ',
    advice: 'సలహా / సూచనలు',
    followUp: 'అనుసరించండి',
    patientNotes: 'రోగి గమనలు',
    privateNotes: 'వ్యక్తిగత గమనలు',
    symptoms: 'లక్షణాలు',
    labTests: 'ప్రయోగశాల పరీక్షలు',
    procedures: 'విధానాలు',
    dosage: 'డోసేజ్',
    frequency: 'తరచు',
    duration: 'వ్యవధి',
    quantity: 'పరిమాణం',
    instructions: 'సూచనలు',
    add: 'జోడించండి',
    remove: 'తీసివేయండి',
    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    selectLanguage: 'భాషను ఎంచుకోండి'
  },
  kn: {
    medicines: 'ಔಷಧಿಗಳು',
    diagnosis: 'ರೋಗ ನಿರ್ಣಯ',
    advice: 'ಸಲಹೆ / ಸೂಚನೆಗಳು',
    followUp: 'ಅನುಸರಿಸಿ',
    patientNotes: 'ರೋಗಿ ಟಿಪ್ಪಣಿಗಳು',
    privateNotes: 'ಖಾಸಗಿ ಟಿಪ್ಪಣಿಗಳು',
    symptoms: 'ಲಕ್ಷಣಗಳು',
    labTests: 'ಪ್ರಯೋಗಶಾಲೆ ಪರೀಕ್ಷೆಗಳು',
    procedures: 'ವಿಧಾನಗಳು',
    dosage: 'ಡೋಸ್',
    frequency: 'ಆವರ್ತಿ',
    duration: 'ಅವಧಿ',
    quantity: 'ಪ್ರಮಾಣ',
    instructions: 'ಸೂಚನೆಗಳು',
    add: 'ಸೇರಿ',
    remove: 'ತೆಗೆದುಹಾಕಿ',
    save: 'ಉಳಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    selectLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕಲಿಸಿ'
  },
  ml: {
    medicines: 'മരുന്നുകൾ',
    diagnosis: 'രോഗനിർണയം',
    advice: 'ഉപദേശം / നിർദേശങ്ങൾ',
    followUp: 'പിന്തുടർന്ന്',
    patientNotes: 'രോഗിക്കുറിപ്പുകൾ',
    privateNotes: 'സ്വകാര്യക്കുറിപ്പുകൾ',
    symptoms: 'ലക്ഷണങ്ങൾ',
    labTests: 'ലാബ് ടെസ്റ്റുകൾ',
    procedures: 'നടപടികൾ',
    dosage: 'ഡോസ്',
    frequency: 'ആവർത്തി',
    duration: 'കാലയളവ്',
    quantity: 'അളവ്',
    instructions: 'നിർദേശങ്ങൾ',
    add: 'ചേർക്കുക',
    remove: 'നീക്കംചെയ്യുക',
    save: 'സേവ് ചെയ്യുക',
    cancel: 'റദ്ദാക്കുക',
    selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക'
  },
  pa: {
    medicines: 'ਦਵਾਈਆਂ',
    diagnosis: 'ਨਿਦਾਨ',
    advice: 'ਸਲਾਹ / ਹਦਾਇਤ',
    followUp: 'ਫਾਲੋ-ਅਪ',
    patientNotes: 'ਮਰੀਜ਼ ਨੋਟ',
    privateNotes: 'ਨਿੱਜੀ ਨੋਟ',
    symptoms: 'ਲੱਛਣ',
    labTests: 'ਲੈਬ ਟੈਸਟ',
    procedures: 'ਕਾਰਵਾਈਆਂ',
    dosage: 'ਡੋਜ਼',
    frequency: 'ਫ੍ਰੀਕਵੈਂਸੀ',
    duration: 'ਮਿਆਦ',
    quantity: 'ਮਾਤਰਾ',
    instructions: 'ਹਦਾਇਤ',
    add: 'ਸ਼ਾਮਲ',
    remove: 'ਹਟਾਓ',
    save: 'ਸੇਵ ਕਰੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ'
  },
  ur: {
    medicines: 'دوائیں',
    diagnosis: 'تشخیص',
    advice: 'مشورہ / ہدایات',
    followUp: 'فالو اپ',
    patientNotes: 'مریض نوٹس',
    privateNotes: 'ذاتی نوٹس',
    symptoms: 'علامات',
    labTests: 'لیب ٹیسٹ',
    procedures: 'عمل',
    dosage: 'ڈوز',
    frequency: 'فریکوئینسی',
    duration: 'مدت',
    quantity: 'مقدار',
    instructions: 'ہدایات',
    add: 'شامل کریں',
    remove: 'ہٹائیں',
    save: 'محفوظ کریں',
    cancel: 'منسوخ کریں',
    selectLanguage: 'زبان منتخب کریں'
  }
};

export default function PrescriptionPad() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const api = useApiClient();
  const { user } = useAuth();  // Get logged in user
  const { language, changeLanguage } = useTranslation();
  
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `@page { size: A4; margin: 0; } body { -webkit-print-color-adjust: exact; }`,
  });
  const adviceEditorRef = useRef(null);

  // State
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('prescription');
  const [showVitalsConfig, setShowVitalsConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pad configuration state
  const [padFields, setPadFields] = useState([
    'Patient Medical History',
    'Dental Chart (New/PRO)',
    'Vitals',
    'Symptoms',
    'Examination Findings',
    'Lab Results',
    'Diagnosis',
    'Medications',
    'Notes',
    'Follow Up & Advices'
  ]);
  const [fieldStates, setFieldStates] = useState({});
  
  // Meta state with doctor_id, date and time
  const [meta, setMeta] = useState({
    patient_id: patientId || '',
    doctor_id: '',
    appointment_id: '',
    prescription_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    prescription_time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  });
  
  const [vitals, setVitals] = useState({
    temp: '',
    height: '',
    bmi: '',
    weight: '',
    pulse: '',
    blood_pressure: '',
    spo2: ''
  });

  // Medical History State (dr.eka.care style)
  const [medicalHistoryData, setMedicalHistoryData] = useState({
    medicalHistory: [],      // Y/N toggle conditions
    existingConditions: [],  // Chronic conditions
    surgicalHistory: [],     // Past surgeries
    allergies: [],           // Drug allergies
    familyHistory: []        // Family history
  });
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState(false);
  const [showAddConditionModal, setShowAddConditionModal] = useState(false);
  const [showAddSurgeryModal, setShowAddSurgeryModal] = useState(false);
  const [newCondition, setNewCondition] = useState({ condition_name: '', icd_code: '', start_date: '', notes: '' });
  const [newSurgery, setNewSurgery] = useState({ surgery_name: '', surgery_date: '', hospital: '', surgeon: '', complications: '' });

  // Load pad configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('padConfiguration');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.fields && config.fieldStates) {
          setPadFields(config.fields);
          setFieldStates(config.fieldStates);
        }
      } catch (error) {
        console.error('Failed to load pad configuration:', error);
      }
    }
  }, []);

  // Function to render sections dynamically based on pad configuration
  const renderDynamicSections = () => {
    return padFields.map(fieldName => {
      const isEnabled = fieldStates[fieldName]?.enabled !== false;
      
      if (!isEnabled) return null;

      switch (fieldName) {
        case 'Patient Medical History':
          return (
            <div key="medical-history" className="bg-white border border-amber-200 rounded-lg shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 border-b border-amber-100">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-800">
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">Hx</span>
                  Patient Medical History
                  {medicalHistoryLoading && <span className="text-xs text-amber-600 ml-2">(Loading...)</span>}
                </h2>
              </div>

              <div className="p-4 space-y-5">
                {/* Quick Condition Toggles - dr.eka.care style */}
                {medicalHistoryData.medicalHistory && medicalHistoryData.medicalHistory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      Quick Medical History
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {medicalHistoryData.medicalHistory.map((item) => (
                        <div key={item.option_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                          <span className="text-sm text-gray-700 flex-1 truncate" title={item.condition_name}>
                            {item.condition_name}
                          </span>
                          <div className="flex items-center gap-1">
                            {/* Y/N Toggle Buttons */}
                            <button
                              onClick={() => toggleMedicalCondition(item, true)}
                              className={`px-2 py-0.5 text-xs font-bold rounded transition-all ${
                                item.has_condition
                                  ? 'bg-green-500 text-white shadow-sm'
                                  : 'bg-gray-200 text-gray-500 hover:bg-green-100'
                              }`}
                            >
                              Y+
                            </button>
                            <button
                              onClick={() => toggleMedicalCondition(item, false)}
                              className={`px-2 py-0.5 text-xs font-bold rounded transition-all ${
                                !item.has_condition
                                  ? 'bg-red-500 text-white shadow-sm'
                                  : 'bg-gray-200 text-gray-500 hover:bg-red-100'
                              }`}
                            >
                              -
                            </button>
                          </div>
                          {/* Since field - only shows when Y is selected */}
                          {item.has_condition && (
                            <input
                              type="text"
                              placeholder="Since"
                              className="w-16 px-1 py-0.5 text-xs border rounded bg-white focus:ring-1 focus:ring-amber-300"
                              value={item.since_date || ''}
                              onChange={(e) => updateConditionSince(item, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Conditions Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      EXISTING CONDITIONS
                      {medicalHistoryData.existingConditions?.length > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                          {medicalHistoryData.existingConditions.length}
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={() => setShowAddConditionModal(true)}
                      className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors flex items-center gap-1 font-medium"
                    >
                      <span>+</span> Add Condition
                    </button>
                  </div>
                  {medicalHistoryData.existingConditions?.length > 0 ? (
                    <div className="space-y-2">
                      {medicalHistoryData.existingConditions.map((condition) => (
                        <div key={condition.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-100">
                          <div className="flex-1">
                            <span className="font-medium text-gray-800">{condition.condition_name}</span>
                            {condition.icd_code && <span className="ml-2 text-xs text-gray-500">({condition.icd_code})</span>}
                            {condition.start_date && <span className="ml-2 text-xs text-gray-400">Since: {condition.start_date}</span>}
                          </div>
                          <button
                            onClick={() => deleteExistingCondition(condition.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No existing conditions recorded</p>
                  )}
                </div>

                {/* Past Surgical Procedures Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      PAST SURGICAL PROCEDURES
                      {medicalHistoryData.surgicalHistory?.length > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                          {medicalHistoryData.surgicalHistory.length}
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={() => setShowAddSurgeryModal(true)}
                      className="text-xs px-3 py-1 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors flex items-center gap-1 font-medium"
                    >
                      <span>+</span> Add Surgery
                    </button>
                  </div>
                  {medicalHistoryData.surgicalHistory?.length > 0 ? (
                    <div className="space-y-2">
                      {medicalHistoryData.surgicalHistory.map((surgery) => (
                        <div key={surgery.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex-1">
                            <span className="font-medium text-gray-800">{surgery.surgery_name}</span>
                            {surgery.surgery_date && <span className="ml-2 text-xs text-gray-500">{surgery.surgery_date}</span>}
                            {surgery.hospital && <span className="ml-2 text-xs text-gray-400">@ {surgery.hospital}</span>}
                          </div>
                          <button
                            onClick={() => deleteSurgicalProcedure(surgery.id)}
                            className="text-purple-400 hover:text-purple-600 p-1"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No surgical history recorded</p>
                  )}
                </div>

                {/* Allergies Quick View */}
                {medicalHistoryData.allergies?.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      DRUG ALLERGIES
                      <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                        {medicalHistoryData.allergies.length}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {medicalHistoryData.allergies.map((allergy) => (
                        <span
                          key={allergy.id}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            allergy.severity === 'Severe'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : allergy.severity === 'Moderate'
                              ? 'bg-orange-100 text-orange-700 border border-orange-200'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          }`}
                        >
                          {allergy.allergen_name}
                          {allergy.severity && <span className="ml-1 text-xs opacity-70">({allergy.severity})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Family History Quick View */}
                {medicalHistoryData.familyHistory?.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      FAMILY HISTORY
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {medicalHistoryData.familyHistory.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {medicalHistoryData.familyHistory.map((fh) => (
                        <div key={fh.id} className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                          <span className="font-medium text-blue-800">{fh.relation}</span>
                          {fh.condition_name && <span className="text-gray-600">: {fh.condition_name}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state - show when no quick toggles are configured */}
                {(!medicalHistoryData.medicalHistory || medicalHistoryData.medicalHistory.length === 0) &&
                 !medicalHistoryLoading && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No medical history options configured.</p>
                    <p className="text-gray-400 text-xs mt-1">Contact admin to configure quick toggle conditions.</p>
                  </div>
                )}
              </div>

              {/* Add Condition Modal */}
              {showAddConditionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="font-semibold text-gray-800">Add Existing Condition</h3>
                      <button onClick={() => setShowAddConditionModal(false)} className="text-gray-400 hover:text-gray-600">
                        <FiX size={20} />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Condition Name *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-300"
                          placeholder="e.g., Type 2 Diabetes"
                          value={newCondition.condition_name}
                          onChange={(e) => setNewCondition({ ...newCondition, condition_name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ICD Code</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="E11.9"
                            value={newCondition.icd_code}
                            onChange={(e) => setNewCondition({ ...newCondition, icd_code: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border rounded-lg"
                            value={newCondition.start_date}
                            onChange={(e) => setNewCondition({ ...newCondition, start_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={2}
                          placeholder="Additional notes..."
                          value={newCondition.notes}
                          onChange={(e) => setNewCondition({ ...newCondition, notes: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                      <button
                        onClick={() => setShowAddConditionModal(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addExistingCondition}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Add Condition
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Surgery Modal */}
              {showAddSurgeryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="font-semibold text-gray-800">Add Surgical Procedure</h3>
                      <button onClick={() => setShowAddSurgeryModal(false)} className="text-gray-400 hover:text-gray-600">
                        <FiX size={20} />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Surgery Name *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-300"
                          placeholder="e.g., Appendectomy"
                          value={newSurgery.surgery_name}
                          onChange={(e) => setNewSurgery({ ...newSurgery, surgery_name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Surgery Date</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border rounded-lg"
                            value={newSurgery.surgery_date}
                            onChange={(e) => setNewSurgery({ ...newSurgery, surgery_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="Hospital name"
                            value={newSurgery.hospital}
                            onChange={(e) => setNewSurgery({ ...newSurgery, hospital: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Surgeon</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Surgeon name"
                          value={newSurgery.surgeon}
                          onChange={(e) => setNewSurgery({ ...newSurgery, surgeon: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Complications</label>
                        <textarea
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={2}
                          placeholder="Any complications..."
                          value={newSurgery.complications}
                          onChange={(e) => setNewSurgery({ ...newSurgery, complications: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                      <button
                        onClick={() => setShowAddSurgeryModal(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addSurgicalProcedure}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                      >
                        Add Surgery
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );

        case 'Dental Chart (New/PRO)':
          return (
            <div key="dental-chart" className="bg-white border rounded shadow-sm p-4 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">🦷</span>
                Dental Chart (New/PRO)
              </h2>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🦷</div>
                <p>Dental chart functionality will be implemented here</p>
                <p className="text-sm">This section will allow dental examination and charting</p>
              </div>
            </div>
          );

        case 'Vitals':
          return (
            <div key="vitals" className="bg-white border rounded shadow-sm p-4 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">V</span>
                Vitals
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="98.6"
                    value={vitals.temp}
                    onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="170"
                    value={vitals.height}
                    onChange={(e) => {
                      const newHeight = e.target.value;
                      const newWeight = vitals.weight;
                      let bmi = '';
                      
                      if (newHeight && newWeight) {
                        const heightInMeters = parseFloat(newHeight) / 100;
                        bmi = (parseFloat(newWeight) / (heightInMeters * heightInMeters)).toFixed(2);
                      }
                      
                      setVitals({ ...vitals, height: newHeight, bmi });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="70"
                    value={vitals.weight}
                    onChange={(e) => {
                      const newWeight = e.target.value;
                      const newHeight = vitals.height;
                      let bmi = '';
                      
                      if (newHeight && newWeight) {
                        const heightInMeters = parseFloat(newHeight) / 100;
                        bmi = (parseFloat(newWeight) / (heightInMeters * heightInMeters)).toFixed(2);
                      }
                      
                      setVitals({ ...vitals, weight: newWeight, bmi });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded bg-gray-100"
                    placeholder="24.2"
                    value={vitals.bmi}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pulse</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="72"
                    value={vitals.pulse}
                    onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="120/80"
                    value={vitals.blood_pressure}
                    onChange={(e) => setVitals({ ...vitals, blood_pressure: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SpO2 (%)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="98"
                    value={vitals.spo2}
                    onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  />
                </div>
              </div>
            </div>
          );

        case 'Symptoms':
          return (
            <div key="symptoms" className="bg-white border rounded shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">Sx</span>
                  {uiLabels[language]?.symptoms || 'Symptoms'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTemplateSelector(true)}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition"
                  title="Use Symptoms Template"
                >
                  📋 Use Template
                </button>
              </div>
              <div className="relative">
                <input
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Start typing Symptoms / Chief Complaints"
                  value={symptomInput}
                  onChange={(e) => {
                    setSymptomInput(e.target.value);
                    setSymptomDropdown(true);
                  }}
                  onFocus={() => setSymptomDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && symptomInput) {
                      e.preventDefault();
                      addSymptom(symptomInput);
                    }
                  }}
                  onBlur={() => setTimeout(() => setSymptomDropdown(false), 200)}
                />
                {symptomDropdown && filteredSymptoms.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                    {filteredSymptoms.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addSymptom(s)}
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">S</span>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm">
                    {s}
                    <button
                      type="button"
                      onClick={() => setSymptoms(symptoms.filter((_, i) => i !== idx))}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {symptomSuggestions.slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => addSymptom(s)}
                    className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          );

        case 'Examination Findings':
          return (
            <div key="examination-findings" className="bg-white border rounded shadow-sm p-4 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">🔍</span>
                Examination Findings
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">General Examination</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Enter general examination findings..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Systemic Examination</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Enter systemic examination findings..."
                  />
                </div>
              </div>
            </div>
          );

        case 'Lab Results':
          return (
            <div key="lab-results" className="bg-white border rounded shadow-sm p-4 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">🧪</span>
                Lab Results
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Investigations</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Enter lab investigations and results..."
                  />
                </div>
              </div>
            </div>
          );

        case 'Diagnosis':
          return (
            <div key="diagnosis" className="bg-white border rounded shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">Dx</span>
                  {uiLabels[language]?.diagnosis || 'Diagnosis'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDiagnosisTemplateSelector(true)}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 transition"
                  title="Use Diagnosis Template"
                >
                  📋 Use Template
                </button>
              </div>
              <div className="relative">
                <input
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Start typing Diagnosis"
                  value={diagnosisInput}
                  onChange={(e) => {
                    setDiagnosisInput(e.target.value);
                    setDiagnosisDropdown(true);
                    setSnomedDiagnosisPage(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && diagnosisInput) {
                      e.preventDefault();
                      addDiagnosis(diagnosisInput);
                    }
                  }}
                  onBlur={() => setTimeout(() => setDiagnosisDropdown(false), 200)}
                />
                {diagnosisDropdown && (combinedDiagnosisResults.length > 0 || snomedDiagnosisResults.length > 0) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-64 overflow-y-auto">
                    {combinedDiagnosisResults.length > 0 && (
                      <>
                        <div className="px-3 py-1.5 bg-slate-50 text-xs font-semibold text-slate-600 border-b flex items-center justify-between">
                          <span>Suggestions</span>
                          {diagnosisLoading && (
                            <span className="text-xs font-normal text-slate-500">Searching…</span>
                          )}
                        </div>
                        {combinedDiagnosisResults.map((item) => (
                          <button
                            key={`${item.type}-${item.code || item.label}`}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => addDiagnosis(item.label)}
                          >
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">Dx</span>
                            <div className="flex flex-col">
                              <span>{item.label}</span>
                              {item.type === 'icd' && item.code && (
                                <span className="text-xs text-slate-500">{item.version || 'ICD'}: {item.code}</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {diagnoses.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-sm">
                    {typeof d === 'string' ? d : d.label || d.icd_title}
                    <button
                      type="button"
                      onClick={() => setDiagnoses(diagnoses.filter((_, i) => i !== idx))}
                      className="text-purple-500 hover:text-purple-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {diagnosisSuggestions.slice(0, 8).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onMouseDown={() => addDiagnosis(d)}
                    className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition"
                  >
                    + {d}
                  </button>
                ))}
              </div>
            </div>
          );

        case 'Medications':
          return (
            <div key="medications" className="bg-white border rounded shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">Rx</span>
                  {uiLabels[language]?.medications || 'Medications'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMedicationsTemplateSelector(true)}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition"
                  title="Use Medications Template"
                >
                  📋 Use Template
                </button>
              </div>
              
              {/* Smart Suggestions */}
              {showSmartSuggestions && (
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-blue-900">💡 Smart Suggestions</h4>
                    <button
                      type="button"
                      onClick={() => setShowSmartSuggestions(false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Debug Info */}
                  <div className="mb-2 text-xs text-gray-600">
                    Debug: {JSON.stringify({
                      medicines: smartSuggestions.medicines?.length || 0,
                      frequentlyUsed: smartSuggestions.frequentlyUsed?.length || 0,
                      diagnoses: smartSuggestions.diagnoses?.length || 0
                    })}
                  </div>

                  {/* Frequently Used Medicines */}
                  {smartSuggestions.frequentlyUsed.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-2">🔄 Frequently Used for This Patient</div>
                      <div className="flex flex-wrap gap-1">
                        {smartSuggestions.frequentlyUsed.slice(0, 5).map((med, idx) => (
                          <button
                            key={`freq-sugg-${idx}`}
                            type="button"
                            onMouseDown={() => addMed(med)}
                            className="px-2 py-1 bg-white border border-blue-200 rounded text-xs hover:bg-blue-50 transition"
                          >
                            {med.brand || med.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Diagnosis-based Medicines */}
                  {smartSuggestions.medicines && smartSuggestions.medicines.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-2">🎯 Suggested Medicines</div>
                      <div className="flex flex-wrap gap-1">
                        {smartSuggestions.medicines.slice(0, 10).map((med, idx) => (
                          <button
                            key={`med-sugg-${idx}`}
                            type="button"
                            onMouseDown={() => addMed(med)}
                            className={`px-2 py-1 border rounded text-xs hover:opacity-80 transition ${
                              med.source === 'icd11' ? 'bg-purple-50 border-purple-200' :
                              med.source === 'icd10' ? 'bg-blue-50 border-blue-200' :
                              med.source === 'symptom' ? 'bg-green-50 border-green-200' :
                              med.source === 'dosage_reference' ? 'bg-yellow-50 border-yellow-200' :
                              med.source === 'snomed_medication' ? 'bg-pink-50 border-pink-200' :
                              'bg-white border-gray-200'
                            }`}
                            title={`${med.source} - ${med.evidence_level || 'No evidence level'}`}
                          >
                            {med.brand || med.name}
                            {med.evidence_level && (
                              <span className="ml-1 text-xs opacity-75">({med.evidence_level})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Symptom-based Medicines */}
                  {smartSuggestions.medicines && smartSuggestions.medicines.filter(m => m.original_symptom).length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-2">🔥 Based on Symptoms</div>
                      <div className="flex flex-wrap gap-1">
                        {smartSuggestions.medicines
                          .filter(m => m.original_symptom)
                          .slice(0, 8)
                          .map((med, idx) => (
                            <button
                              key={`sym-sugg-${idx}`}
                              type="button"
                              onMouseDown={() => addMed(med)}
                              className="px-2 py-1 bg-green-50 border border-green-200 rounded text-xs hover:bg-green-100 transition"
                              title={`For ${med.original_symptom}`}
                            >
                              {med.brand || med.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {meds.map((med, idx) => (
                  <div key={idx} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border rounded mr-2"
                        placeholder="Medicine name"
                        value={med.name || ''}
                        onChange={(e) => updateMed(idx, 'name', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeMed(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="px-3 py-2 border rounded"
                        placeholder="Brand"
                        value={med.brand || ''}
                        onChange={(e) => updateMed(idx, 'brand', e.target.value)}
                      />
                      <input
                        type="text"
                        className="px-3 py-2 border rounded"
                        placeholder="Strength"
                        value={med.strength || ''}
                        onChange={(e) => updateMed(idx, 'strength', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        className="px-3 py-2 border rounded"
                        value={med.frequency || ''}
                        onChange={(e) => updateMed(idx, 'frequency', e.target.value)}
                      >
                        <option value="">Frequency</option>
                        {(timingOptions[language] || timingOptions.en).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <select
                        className="px-3 py-2 border rounded"
                        value={med.timing || 'After Meal'}
                        onChange={(e) => updateMed(idx, 'timing', e.target.value)}
                      >
                        <option value="Before Meal">Before Meal</option>
                        <option value="After Meal">After Meal</option>
                      </select>
                      <input
                        type="text"
                        className="px-3 py-2 border rounded"
                        placeholder="Duration"
                        value={med.duration || ''}
                        onChange={(e) => updateMed(idx, 'duration', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="px-3 py-2 border rounded"
                        placeholder="Quantity"
                        value={med.qty || ''}
                        onChange={(e) => updateMed(idx, 'qty', e.target.value)}
                      />
                      <input
                        type="text"
                        className="px-3 py-2 border rounded"
                        placeholder="Instructions"
                        value={med.instructions || ''}
                        onChange={(e) => updateMed(idx, 'instructions', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addEmptyMed}
                className="w-full py-2 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition"
              >
                + Add Medicine
              </button>
            </div>
          );

        case 'Notes':
          return (
            <div key="notes" className="bg-white border rounded shadow-sm p-4 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs font-bold">📝</span>
                Notes
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Enter patient notes..."
                    value={patientNotes}
                    onChange={(e) => setPatientNotes(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Private Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Enter private notes (for doctor reference only)..."
                    value={privateNotes}
                    onChange={(e) => setPrivateNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          );

        case 'Follow Up & Advices':
          return (
            <div key="followup" className="bg-white border rounded shadow-sm p-4 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">📅</span>
                Follow Up & Advices
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow Up Days</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded"
                      placeholder="7"
                      value={followUp.days}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 0;
                        const today = new Date();
                        const followUpDate = new Date(today);
                        followUpDate.setDate(today.getDate() + days);
                        setFollowUp({ 
                          ...followUp, 
                          days: e.target.value,
                          date: followUpDate.toISOString().split('T')[0]
                        });
                      }}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow Up Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded"
                      value={followUp.date}
                      onChange={(e) => setFollowUp({ ...followUp, date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advice</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Enter advice for patient..."
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quick Advice Selection</label>
                  <div className="flex flex-wrap gap-2">
                    {(predefinedAdvice[language] || predefinedAdvice.en).map((adv) => (
                      <button
                        key={adv}
                        type="button"
                        onClick={() => {
                          if (advice && !advice.endsWith('\n')) {
                            setAdvice(advice + '\n' + adv);
                          } else {
                            setAdvice((advice || '') + adv);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition"
                      >
                        + {adv}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    });
  };

  const [symptomInput, setSymptomInput] = useState('');
  const [symptomDropdown, setSymptomDropdown] = useState(false);
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [diagnosisDropdown, setDiagnosisDropdown] = useState(false);
  const [diagnosisSearchResults, setDiagnosisSearchResults] = useState([]); // ICD diagnosis search results
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [snomedDiagnosisResults, setSnomedDiagnosisResults] = useState([]); // SNOMED CT diagnosis search results
  const [symptoms, setSymptoms] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  // ICD integration state
  const [icdQuery, setIcdQuery] = useState('');
  const [icdResults, setIcdResults] = useState([]);
  const [showIcdDropdown, setShowIcdDropdown] = useState(false);
  const [selectedIcds, setSelectedIcds] = useState([]); // [{ icd_code, icd_title }]
  const [icdVersion, setIcdVersion] = useState('all'); // 'icd10', 'icd11', 'all'
  const [symptomsTemplates, setSymptomsTemplates] = useState([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [diagnosisTemplates, setDiagnosisTemplates] = useState([]);
  const [showDiagnosisTemplateSelector, setShowDiagnosisTemplateSelector] = useState(false);
  const [medInput, setMedInput] = useState('');
  const [medDropdown, setMedDropdown] = useState(false);
  const [meds, setMeds] = useState([]);
  const [medications, setMedications] = useState([]); // Alias for meds for compatibility
  const [snomedDrugResults, setSnomedDrugResults] = useState([]); // SNOMED CT drug search results
  const [medicationSuggestions, setMedicationSuggestions] = useState([]); // Real medications from API
  const [frequentlyPrescribedMeds, setFrequentlyPrescribedMeds] = useState([]); // Patient's frequently prescribed
  const [medicationLoading, setMedicationLoading] = useState(false); // Loading state for med search
  const [medicationsTemplates, setMedicationsTemplates] = useState([]);
  const [showMedicationsTemplateSelector, setShowMedicationsTemplateSelector] = useState(false);
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [advice, setAdvice] = useState('');
  const [enableTranslations, setEnableTranslations] = useState(false);
  const [selectedAdvice, setSelectedAdvice] = useState([]);
  const [printOnPrescription, setPrintOnPrescription] = useState(true);
  const [followUp, setFollowUp] = useState({ days: '', date: '', autoFill: false });
  const [patientNotes, setPatientNotes] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [adviceTemplates, setAdviceTemplates] = useState([]);
  const [adviceTemplatesLoading, setAdviceTemplatesLoading] = useState(false);
  // Allergies and warnings
  const [patientAllergies, setPatientAllergies] = useState([]);
  const [allergyConflicts, setAllergyConflicts] = useState([]);
  // SNOMED pagination & suggestions
  const [snomedDiagnosisPage, setSnomedDiagnosisPage] = useState(0);
  const [snomedDrugPage, setSnomedDrugPage] = useState(0);
  const [snomedSymptomResults, setSnomedSymptomResults] = useState([]);
  const [suggestedDx, setSuggestedDx] = useState([]);
  const [suggestedMeds, setSuggestedMeds] = useState([]);
  const [showMedicationSuggestionModal, setShowMedicationSuggestionModal] = useState(false);
  const [pendingMedicationSuggestions, setPendingMedicationSuggestions] = useState([]);
  
  // PHASE 1: Quick Wins state variables
  const [showTemplateQuickWins, setShowTemplateQuickWins] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [recentMedicines, setRecentMedicines] = useState([]);

  // Custom Template Creation states
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateShortName, setNewTemplateShortName] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    symptoms: '',
    diagnoses: '',
    medications: [{ name: '', brand: '', composition: '', frequency: '', timing: 'After Meal', duration: '', instructions: '', qty: '' }],
    investigations: '',
    precautions: '',
    diet_restrictions: '',
    activities: '',
    advice: '',
    follow_up_days: '',
    duration_days: '7'
  });

  // Fetch custom templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const response = await api.get('/api/prescription-templates');
        setCustomTemplates(response.data.templates || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setCustomTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // PHASE 2: Advanced Features state variables
  const [showMedicationCombos, setShowMedicationCombos] = useState(false);
  const [medicationCombos, setMedicationCombos] = useState({
    'URTI': [
      { name: 'Amoxicillin', brand: '', composition: '500mg', frequency: '1-1-1', timing: '1-1-1', duration: '5 days', instructions: 'After food', qty: '' },
      { name: 'Cetirizine', brand: '', composition: '10mg', frequency: '0-0-1', timing: '0-0-1', duration: '5 days', instructions: 'At night', qty: '' }
    ],
    'Migraine': [
      { name: 'Ibuprofen', brand: '', composition: '400mg', frequency: '1-0-1', timing: '1-0-1', duration: '7 days', instructions: 'After food', qty: '' },
      { name: 'Metoclopramide', brand: '', composition: '10mg', frequency: '1-1-1', timing: '1-1-1', duration: '7 days', instructions: 'Before meals', qty: '' }
    ],
    'Gastritis': [
      { name: 'Omeprazole', brand: '', composition: '20mg', frequency: '1-0-0', timing: '1-0-0', duration: '10 days', instructions: 'Before breakfast', qty: '' },
      { name: 'Domperidone', brand: '', composition: '10mg', frequency: '1-1-1', timing: '1-1-1', duration: '10 days', instructions: 'Before meals', qty: '' }
    ],
    'HTN': [
      { name: 'Amlodipine', brand: '', composition: '5mg', frequency: '1-0-0', timing: '1-0-0', duration: 'Continued', instructions: 'Once daily', qty: '' },
      { name: 'Lisinopril', brand: '', composition: '10mg', frequency: '1-0-0', timing: '1-0-0', duration: 'Continued', instructions: 'Once daily', qty: '' }
    ],
    'Diabetes': [
      { name: 'Metformin', brand: '', composition: '500mg', frequency: '1-1-1', timing: '1-1-1', duration: 'Continued', instructions: 'With meals', qty: '' },
      { name: 'Glipizide', brand: '', composition: '5mg', frequency: '1-0-1', timing: '1-0-1', duration: 'Continued', instructions: 'Before meals', qty: '' }
    ]
  });
  const [showRecentSidebar, setShowRecentSidebar] = useState(true);
  const [dosageCalculator, setDosageCalculator] = useState({
    calculateDosage: (drugName, weight, age) => {
      const dosages = {
        'Paracetamol': { base: 15, frequency: '1-1-1', unit: 'mg/kg' },
        'Ibuprofen': { base: 10, frequency: '1-1-1', unit: 'mg/kg' },
        'Amoxicillin': { base: 25, frequency: '1-1-1', unit: 'mg/kg' },
        'Metformin': { base: 0, frequency: '0-0-0', unit: 'fixed', fixed: 500 },
        'Cephalexin': { base: 25, frequency: '1-1-1', unit: 'mg/kg' }
      };
      const dose = dosages[drugName];
      if (!dose) return { calculatedDose: 'Not found', frequency: '', warning: '' };
      if (dose.unit === 'fixed') {
        return { calculatedDose: `${dose.fixed}mg`, frequency: dose.frequency, warning: '' };
      }
      const calcDose = Math.round((weight * dose.base) / 10) * 10;
      let warning = '';
      if (age < 5 && calcDose > 250) warning = 'Consider pediatric dosing';
      if (age > 65 && calcDose > 500) warning = 'Monitor renal function';
      return { calculatedDose: `${calcDose}mg`, frequency: dose.frequency, warning };
    }
  });
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showComplianceTracker, setShowComplianceTracker] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [splitViewMode, setSplitViewMode] = useState('full'); // 'split' or 'full'

  // NEW: Additional sections
  const [examinationFindings, setExaminationFindings] = useState('');
  const [labResults, setLabResults] = useState([]);
  const [labTestInput, setLabTestInput] = useState('');
  const [procedures, setProcedures] = useState([]);
  const [printProcedures, setPrintProcedures] = useState(true);
  const [referralDoctor, setReferralDoctor] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString());

  // Past data states
  const [pastVisitsTab, setPastVisitsTab] = useState('past');
  const [pastVisits, setPastVisits] = useState([]);
  const [pastPrescriptions, setPastPrescriptions] = useState([]);
  const [pastVitals, setPastVitals] = useState([]);
  const [pastRecords, setPastRecords] = useState([]);
  const [loadingPastData, setLoadingPastData] = useState(false);

  // Patient search states
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [showPatientSearch, setShowPatientSearch] = useState(false);

  // Current prescription ID for PDF download and compliance tracker
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState(null);

  // Monetize Rx option
  const [monetizeRx, setMonetizeRx] = useState(false);

  // Lab results modal state
  const [showLabResultsModal, setShowLabResultsModal] = useState(false);
  const [previousLabResults, setPreviousLabResults] = useState([]);

  // Receipt template states
  const [receiptTemplates, setReceiptTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Specialty module states
  const [showSpecialtySelector, setShowSpecialtySelector] = useState(false);
  const [specialtyData, setSpecialtyData] = useState(null);

  // Print format states
  const [printFormat, setPrintFormat] = useState('A4'); // 'A4' or 'A5'

  // Smart Prescription states
  const [smartSuggestions, setSmartSuggestions] = useState({
    medicines: [],
    diagnoses: [],
    investigations: [],
    frequentlyUsed: [],
    interactions: [],
    warnings: []
  });
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [drugInteractions, setDrugInteractions] = useState([]);
  const [showInteractionWarnings, setShowInteractionWarnings] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  // Calculate filtered symptoms for dropdown (after smartSuggestions is declared)
  const remoteSymptomTerms = (snomedSymptomResults || [])
    .map(c => (c?.pt?.term || c?.fsn?.term || ''))
    .filter(Boolean);
  const combinedSymptomsPool = [...new Set([...remoteSymptomTerms, ...symptomSuggestions])];
  const filteredSymptoms = symptomInput.length > 0
    ? combinedSymptomsPool.filter(s => s.toLowerCase().includes(symptomInput.toLowerCase()))
    : [...new Set([...remoteSymptomTerms.slice(0, 6), ...symptomSuggestions.slice(0, 4)])];

  // Fetch smart suggestions based on diagnosis, symptoms, and patient history
  const fetchSmartSuggestions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (diagnoses.length > 0) params.append('diagnosis', diagnoses.map(d => d.icd_code || d).join(','));
      if (symptoms.length > 0) params.append('symptoms', symptoms.join(','));
      if (patient?.age) params.append('age', patient.age);
      if (patient?.weight) params.append('weight', patient.weight);

      console.log('🔍 Fetching smart suggestions with params:', params.toString());
      const res = await api.get(`/api/smart-prescription/suggestions?${params}`);
      console.log('📊 Smart suggestions response:', res.data);
      
      if (res.data?.success) {
        console.log('✅ Smart suggestions data:', res.data.data);
        setSmartSuggestions(res.data.data);
        setShowSmartSuggestions(true);
      } else {
        console.log('❌ Smart suggestions failed:', res.data);
      }
    } catch (error) {
      console.error('Error fetching smart suggestions:', error);
    }
  }, [api, patientId, diagnoses, symptoms, patient]);

  // Check for drug interactions
  const checkDrugInteractions = useCallback(async () => {
    try {
      const medicines = meds.map(m => ({ name: m.name || m.brand, composition: m.composition }));
      const res = await api.post('/api/smart-prescription/check-interactions', { medicines });
      if (res.data?.success) {
        setDrugInteractions(res.data.data.interactions);
        setShowInteractionWarnings(res.data.data.interactions.length > 0 || res.data.data.warnings.length > 0);
      }
    } catch (error) {
      console.error('Error checking drug interactions:', error);
    }
  }, [api, meds]);

  // Calculate dosage for a medicine
  const calculateDosage = useCallback(async (medicineName) => {
    try {
      const params = new URLSearchParams();
      params.append('medicineName', medicineName);
      if (patient?.age) params.append('age', patient.age);
      if (patient?.weight) params.append('weight', patient.weight);
      params.append('patientType', patient?.age && parseInt(patient.age) < 18 ? 'pediatric' : 'adult');

      const res = await api.get(`/api/smart-prescription/calculate-dosage?${params}`);
      if (res.data?.success) {
        return res.data.data.dosage;
      }
    } catch (error) {
      console.error('Error calculating dosage:', error);
    }
    return null;
  }, [api, patient]);

  // Auto-save functionality
  const saveDraft = useCallback(async () => {
    try {
      const draftData = {
        patientId,
        symptoms,
        diagnoses,
        meds,
        advice,
        followUp,
        patientNotes,
        privateNotes,
        procedures,
        vitals,
        timestamp: new Date().toISOString()
      };

      // Save to localStorage for now (can be extended to backend)
      localStorage.setItem(`prescription_draft_${patientId}`, JSON.stringify(draftData));
      setAutoSaveStatus('Draft saved');
      setTimeout(() => setAutoSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [patientId, symptoms, diagnoses, meds, advice, followUp, patientNotes, privateNotes, procedures, vitals]);

  // Load draft on component mount
  const loadDraft = useCallback(() => {
    try {
      if (!patientId) return;
      const draft = localStorage.getItem(`prescription_draft_${patientId}`);
      if (draft) {
        const draftData = JSON.parse(draft);
        // Only load if draft is less than 24 hours old
        const draftTime = new Date(draftData.timestamp);
        const now = new Date();
        const hoursDiff = (now - draftTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setSymptoms(draftData.symptoms || []);
          setDiagnoses(draftData.diagnoses || []);
          setMeds(draftData.meds || []);
          setAdvice(draftData.advice || '');
          setFollowUp(draftData.followUp || { days: '', date: '', autoFill: false });
          setPatientNotes(draftData.patientNotes || '');
          setPrivateNotes(draftData.privateNotes || '');
          setProcedures(draftData.procedures || []);
          setVitals(draftData.vitals || {});
          addToast('Draft loaded from auto-save', 'info');
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }, [patientId, addToast]);

  // Template Management states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateShortName, setTemplateShortName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // Save current prescription as template
  const saveAsTemplate = useCallback(async () => {
    if (!templateName.trim()) {
      addToast('Please enter a template name', 'error');
      return;
    }

    try {
      const templateData = {
        template_name: templateName,
        short_name: templateShortName,
        category: templateCategory,
        description: templateDescription,
        symptoms: JSON.stringify(symptoms),
        diagnoses: JSON.stringify(diagnoses),
        medications: JSON.stringify(meds.map(m => ({
          name: m.name,
          brand: m.brand,
          strength: m.strength,
          dosage_form: m.dosage_form,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions
        }))),
        advice,
        precautions: advice, // Using advice for precautions
        follow_up_days: followUp.days || null,
        duration_days: followUp.days || 7,
        created_by: user?.id
      };

      await api.post('/api/prescription-templates', templateData);
      addToast('Template saved successfully', 'success');
      setShowTemplateModal(false);
      setTemplateName('');
      setTemplateShortName('');
      setTemplateCategory('');
      setTemplateDescription('');
    } catch (error) {
      console.error('Error saving template:', error);
      addToast('Failed to save template', 'error');
    }
  }, [templateName, templateShortName, templateCategory, templateDescription, meds, symptoms, diagnoses, advice, followUp, user, api, addToast]);

  // ========================================
  // Fetch Doctor ID
  // ========================================
  const fetchDoctorId = useCallback(async () => {
    try {
      // Method 1: If user is logged in and is a doctor
      if (user && user.id) {
        try {
          const res = await api.get(`/api/doctors/by-user/${user.id}`);
          if (res.data && res.data.id) {
            setMeta(prev => ({ ...prev, doctor_id: res.data.id }));
            return;
          }
        } catch (err) {
          console.log('User is not a doctor, trying fallback...');
        }
      }

      // Method 2: Fallback - get first available doctor
      try {
        const res = await api.get('/api/doctors');
        if (res.data.doctors && res.data.doctors.length > 0) {
          setMeta(prev => ({ ...prev, doctor_id: res.data.doctors[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch doctors list:', err);
      }
    } catch (error) {
      console.error('Error fetching doctor ID:', error);
    }
  }, [api, user]);

  // ========================================
  // Fetch Patient
  // ========================================
  const fetchPatient = useCallback(async () => {
    try {
      if (!patientId) {
        addToast('No patient ID provided', 'error');
        return;
      }
      const res = await api.get(`/api/patients/${patientId}`);
      setPatient(res.data);
      setMeta(prev => ({ ...prev, patient_id: res.data.id }));
    } catch (error) {
      console.error('Error loading patient:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load patient';
      addToast(errorMsg, 'error');
    }
  }, [api, patientId, addToast]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [saveDraft]);

  // Load draft on component mount
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Fetch smart suggestions when diagnosis or symptoms change
  useEffect(() => {
    if (diagnoses.length > 0 || symptoms.length > 0) {
      const timer = setTimeout(() => {
        fetchSmartSuggestions();
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timer);
    }
  }, [diagnoses, symptoms, fetchSmartSuggestions]);

  // Check drug interactions when medicines change
  useEffect(() => {
    if (meds.length >= 2) {
      const timer = setTimeout(() => {
        checkDrugInteractions();
      }, 2000); // Debounce 2 seconds

      return () => clearTimeout(timer);
    }
  }, [meds, checkDrugInteractions]);

  // ========================================
  // Search Patients
  // ========================================
  const searchPatients = async (query) => {
    if (!query || query.length < 2) {
      setPatientResults([]);
      return;
    }

    try {
      const res = await api.get(`/api/patients?search=${query}`);
      setPatientResults(res.data.patients || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatientResults([]);
    }
  };

  const handlePatientSelect = (selectedPatient) => {
    navigate(`/orders/${selectedPatient.id}`);
    setShowPatientSearch(false);
    setPatientSearch('');
    setPatientResults([]);
  };

  // ========================================
  // Fetch Past Data
  // ========================================
  const fetchPastData = useCallback(async () => {
    if (!patientId) return;
    setLoadingPastData(true);
    try {
      // Fetch past prescriptions
      try {
        const rxRes = await api.get(`/api/prescriptions/${patientId}`);
        setPastPrescriptions(rxRes.data.prescriptions || []);
      } catch (err) {
        console.error('Failed to fetch prescriptions:', err);
      }
      
      // Fetch past appointments (visits)
      try {
        const aptRes = await api.get(`/api/appointments`);
        const allAppointments = aptRes.data.appointments || [];
        const patientAppointments = allAppointments.filter(apt => 
          apt.patient_id == patientId || apt.patient_id?.toString() === patientId
        );
        setPastVisits(patientAppointments.slice(0, 10));
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
      }
      
      // Fetch past vitals
      try {
        const vitalsRes = await api.get(`/api/patient-data/vitals/${patientId}`);
        const vitalsData = vitalsRes.data.vitals || [];
        setPastVitals(vitalsData);

        // Auto-fill with latest vitals if available
        if (vitalsData.length > 0) {
          const latestVital = vitalsData[0]; // Assuming sorted by date DESC
          setVitals({
            temp: latestVital.temperature || '',
            height: latestVital.height_cm || '',
            bmi: '', // Will be calculated
            weight: latestVital.weight_kg || '',
            pulse: latestVital.pulse || '',
            blood_pressure: latestVital.blood_pressure || '',
            spo2: latestVital.spo2 || ''
          });
          console.log('Auto-filled vitals from latest record:', latestVital);
        }
      } catch (err) {
        console.error('Failed to fetch vitals:', err);
      }
      
      // Fetch medical records
      try {
        const recordsRes = await api.get(`/api/patient-data/records/${patientId}`);
        setPastRecords(recordsRes.data.records || []);
      } catch (err) {
        console.error('Failed to fetch records:', err);
      }
    } catch (err) {
      console.error('Failed to load past data:', err);
    } finally {
      setLoadingPastData(false);
    }
  }, [api, patientId]);

  // ========================================
  // Medical History Functions (dr.eka.care style)
  // ========================================
  const fetchMedicalHistory = useCallback(async () => {
    if (!patientId) return;
    setMedicalHistoryLoading(true);
    try {
      const res = await api.get(`/api/medical-history/patient/${patientId}`);
      if (res.data?.success) {
        setMedicalHistoryData(res.data.data || {
          medicalHistory: [],
          existingConditions: [],
          surgicalHistory: [],
          allergies: [],
          familyHistory: []
        });
      }
    } catch (err) {
      console.error('Failed to fetch medical history:', err);
    } finally {
      setMedicalHistoryLoading(false);
    }
  }, [api, patientId]);

  const toggleMedicalCondition = async (option, newValue) => {
    try {
      await api.put(`/api/medical-history/patient/${patientId}/toggle`, {
        option_id: option.option_id,
        condition_name: option.condition_name,
        has_condition: newValue,
        since_date: option.since_date || null
      });
      // Update local state
      setMedicalHistoryData(prev => ({
        ...prev,
        medicalHistory: prev.medicalHistory.map(item =>
          item.option_id === option.option_id
            ? { ...item, has_condition: newValue }
            : item
        )
      }));
    } catch (err) {
      console.error('Failed to toggle condition:', err);
      addToast('Failed to update condition', 'error');
    }
  };

  const updateConditionSince = async (option, sinceDate) => {
    try {
      await api.put(`/api/medical-history/patient/${patientId}/toggle`, {
        option_id: option.option_id,
        condition_name: option.condition_name,
        has_condition: option.has_condition,
        since_date: sinceDate
      });
      // Update local state
      setMedicalHistoryData(prev => ({
        ...prev,
        medicalHistory: prev.medicalHistory.map(item =>
          item.option_id === option.option_id
            ? { ...item, since_date: sinceDate }
            : item
        )
      }));
    } catch (err) {
      console.error('Failed to update since date:', err);
    }
  };

  const addExistingCondition = async () => {
    if (!newCondition.condition_name.trim()) {
      addToast('Condition name is required', 'error');
      return;
    }
    try {
      const res = await api.post(`/api/medical-history/patient/${patientId}/existing-condition`, newCondition);
      if (res.data?.success) {
        setMedicalHistoryData(prev => ({
          ...prev,
          existingConditions: [...prev.existingConditions, { id: res.data.id, ...newCondition, status: 'Active' }]
        }));
        setNewCondition({ condition_name: '', icd_code: '', start_date: '', notes: '' });
        setShowAddConditionModal(false);
        addToast('Condition added', 'success');
      }
    } catch (err) {
      console.error('Failed to add condition:', err);
      addToast('Failed to add condition', 'error');
    }
  };

  const deleteExistingCondition = async (conditionId) => {
    try {
      await api.delete(`/api/medical-history/patient/${patientId}/existing-condition/${conditionId}`);
      setMedicalHistoryData(prev => ({
        ...prev,
        existingConditions: prev.existingConditions.filter(c => c.id !== conditionId)
      }));
      addToast('Condition removed', 'success');
    } catch (err) {
      console.error('Failed to delete condition:', err);
      addToast('Failed to remove condition', 'error');
    }
  };

  const addSurgicalProcedure = async () => {
    if (!newSurgery.surgery_name.trim()) {
      addToast('Surgery name is required', 'error');
      return;
    }
    try {
      const res = await api.post(`/api/medical-history/patient/${patientId}/surgical-procedure`, newSurgery);
      if (res.data?.success) {
        setMedicalHistoryData(prev => ({
          ...prev,
          surgicalHistory: [...prev.surgicalHistory, { id: res.data.id, ...newSurgery }]
        }));
        setNewSurgery({ surgery_name: '', surgery_date: '', hospital: '', surgeon: '', complications: '' });
        setShowAddSurgeryModal(false);
        addToast('Surgery added', 'success');
      }
    } catch (err) {
      console.error('Failed to add surgery:', err);
      addToast('Failed to add surgery', 'error');
    }
  };

  const deleteSurgicalProcedure = async (procedureId) => {
    try {
      await api.delete(`/api/medical-history/patient/${patientId}/surgical-procedure/${procedureId}`);
      setMedicalHistoryData(prev => ({
        ...prev,
        surgicalHistory: prev.surgicalHistory.filter(s => s.id !== procedureId)
      }));
      addToast('Surgery removed', 'success');
    } catch (err) {
      console.error('Failed to delete surgery:', err);
      addToast('Failed to remove surgery', 'error');
    }
  };

  // ========================================
  // useEffect Hooks
  // ========================================

  // Load appointment context from sessionStorage
  useEffect(() => {
    try {
      const appointmentData = sessionStorage.getItem('currentAppointment');
      if (appointmentData) {
        const { appointmentId } = JSON.parse(appointmentData);
        if (appointmentId) {
          console.log('Loading appointment ID from sessionStorage:', appointmentId);
          setMeta(prev => ({ ...prev, appointment_id: appointmentId }));
        }
      }
    } catch (error) {
      console.error('Error loading appointment context:', error);
    }
  }, []);

  useEffect(() => {
    fetchDoctorId();
  }, [fetchDoctorId]);

  useEffect(() => {
    if (patientId) {
      fetchPatient();
      fetchPastData();
      fetchMedicalHistory();
    }
  }, [patientId, fetchPatient, fetchPastData, fetchMedicalHistory]);

  // Fetch active allergies for this patient
  useEffect(() => {
    const fetchAllergies = async () => {
      if (!patientId) return;
      try {
        const res = await api.get(`/api/allergies/${patientId}`, { params: { active: 1 } });
        setPatientAllergies(Array.isArray(res.data?.items) ? res.data.items : []);
      } catch (e) {
        setPatientAllergies([]);
      }
    };
    fetchAllergies();
  }, [api, patientId]);

  // Compute allergy conflicts whenever meds or allergies change
  useEffect(() => {
    const normalize = (s) => (s || '')
      .toString()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s\.\-]/g, '')
      .trim();

    const conflicts = [];
    for (const m of meds) {
      const medName = normalize(m?.name || m?.brand || m?.medication_name);
      if (!medName) continue;
      for (const a of patientAllergies) {
        const alNameOrig = a?.allergen_name || '';
        const alName = normalize(alNameOrig);
        if (!alName) continue;
        if (medName.includes(alName) || alName.includes(medName)) {
          const label = `${m?.brand || m?.name || 'Medicine'} ↔ ${alNameOrig}`;
          conflicts.push(label);
        }
      }
    }
    // de-duplicate
    setAllergyConflicts([...new Set(conflicts)]);
  }, [meds, patientAllergies]);

  // Prefill from last prescription if coming from Patient Overview
  useEffect(() => {
    try {
      const prefillStr = sessionStorage.getItem('prefill_last_rx');
      if (!prefillStr) return;
      sessionStorage.removeItem('prefill_last_rx');
      const rx = JSON.parse(prefillStr);
      if (!rx) return;

      // Symptoms
      const sx = Array.isArray(rx.symptoms) ? rx.symptoms : (rx.symptoms ? [rx.symptoms] : []);
      if (sx.length) setSymptoms(sx);

      // Diagnoses
      const dx = Array.isArray(rx.diagnoses) ? rx.diagnoses : (rx.diagnoses ? [rx.diagnoses] : []);
      if (dx.length) setDiagnoses(dx);

      // Medications - Filter out invalid entries
      const medsIn = Array.isArray(rx.medications) ? rx.medications : [];
      if (medsIn.length) {
        const validMeds = medsIn
          .filter(m => m && (m.name || m.medication_name || m.brand))
          .map(m => ({
            name: m.name || m.medication_name || m.brand || '',
            brand: m.brand || m.name || '',
            composition: m.composition || '',
            frequency: m.frequency || m.dosage || '',
            timing: m.timing || (timingOptions[language] || timingOptions.en)[0],
            duration: m.duration || '',
            instructions: m.instructions || '',
            qty: m.quantity || m.qty || 0
          }));
        if (validMeds.length > 0) {
          setMeds(validMeds);
        }
      }

      // Advice
      if (rx.advice || rx.advices) setAdvice(rx.advice || rx.advices || '');

      // Follow-up
      if (rx.follow_up_date) setFollowUp(prev => ({ ...prev, date: rx.follow_up_date }));

      addToast('Prefilled from last prescription. Review and save.', 'success');
    } catch (e) {
      console.error('Prefill error:', e);
    }
  }, [language, addToast]);

  // Fetch symptoms templates
  useEffect(() => {
    const fetchSymptomsTemplates = async () => {
      try {
        const res = await api.get('/api/symptoms-templates');
        setSymptomsTemplates(res.data.templates || []);
      } catch (error) {
        console.error('Failed to fetch symptoms templates:', error);
      }
    };
    fetchSymptomsTemplates();
  }, [api]);

  // Fetch diagnosis templates
  useEffect(() => {
    const fetchDiagnosisTemplates = async () => {
      try {
        const res = await api.get('/api/diagnosis-templates');
        setDiagnosisTemplates(res.data.templates || []);
      } catch (error) {
        console.error('Failed to fetch diagnosis templates:', error);
      }
    };
    fetchDiagnosisTemplates();
  }, [api]);

  // Fetch advice templates based on language
  useEffect(() => {
    const fetchAdviceTemplates = async () => {
      try {
        setAdviceTemplatesLoading(true);
        const res = await api.get('/api/advice/templates', {
          params: { language, limit: 50 }
        });
        const payload = res.data?.data || res.data || [];
        setAdviceTemplates(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error('Failed to fetch advice templates:', error);
        setAdviceTemplates([]);
      } finally {
        setAdviceTemplatesLoading(false);
      }
    };
    fetchAdviceTemplates();
  }, [language, api]);

  // Fetch medications templates
  useEffect(() => {
    const fetchMedicationsTemplates = async () => {
      try {
        const res = await api.get('/api/medications-templates');
        setMedicationsTemplates(res.data.templates || []);
      } catch (error) {
        console.error('Failed to fetch medications templates:', error);
      }
    };
    fetchMedicationsTemplates();
  }, [api]);

  // Fetch receipt templates for prescription letterhead
  useEffect(() => {
    const fetchReceiptTemplates = async () => {
      try {
        const res = await api.get('/api/receipt-templates');
        const templates = res.data.templates || [];
        setReceiptTemplates(templates);

        // Don't auto-select default template - let user choose manually
        setSelectedTemplateId(null);
        setSelectedTemplate(null);
      } catch (error) {
        console.error('Failed to fetch receipt templates:', error);
      }
    };
    fetchReceiptTemplates();
  }, [api]);

  // Clear selected advice when language changes to avoid mismatch
  useEffect(() => {
    // Clear selected advice when language changes
    setSelectedAdvice([]);
  }, [language]);

  // PHASE 1: Initialize recent medicines and keyboard shortcuts
  useEffect(() => {
    // Load recently used medicines
    const recent = RecentlyUsedMedicines.getAll();
    setRecentMedicines(recent.slice(0, 15));

    // Setup keyboard shortcuts
    const handleKeyDown = (e) => {
      // Ctrl+T = Open template selector
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setShowTemplateQuickWins(!showTemplateQuickWins);
        addToast('Template selector opened (Ctrl+T)', 'info');
      }
      // Ctrl+S = Save prescription  
      else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveDraft();
        addToast('Draft saved (Ctrl+S)', 'success');
      }
      // Ctrl+Shift+S = Save as template
      else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setShowTemplateModal(true);
        addToast('Save as template (Ctrl+Shift+S)', 'info');
      }
      // Ctrl+P = Print prescription
      else if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
      // Ctrl+M = Focus medicine input
      else if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        const medicineInput = document.querySelector('[data-testid="medicine-input"]');
        if (medicineInput) {
          medicineInput.focus();
          addToast('Focused on medicine input (Ctrl+M)', 'info');
        }
      }
      // Ctrl+D = Focus diagnosis input
      else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        const diagnosisInput = document.querySelector('input[placeholder*="Diagnosis"]');
        if (diagnosisInput) {
          diagnosisInput.focus();
          addToast('Focused on diagnosis input (Ctrl+D)', 'info');
        }
      }
      // Ctrl+L = Focus lab tests input
      else if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        const labInput = document.querySelector('[data-testid="lab-input"]');
        if (labInput) {
          labInput.focus();
          addToast('Focused on lab tests input (Ctrl+L)', 'info');
        }
      }
      // Ctrl+I = Check interactions
      else if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        checkDrugInteractions();
        addToast('Checking drug interactions (Ctrl+I)', 'info');
      }
      // Ctrl+Shift+C = Clear form
      else if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (window.confirm('Clear entire prescription? This cannot be undone.')) {
          handleClearForm();
          addToast('Prescription cleared', 'success');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTemplateQuickWins, addToast]);

  // PHASE 1: Handle diagnosis auto-suggestions
  const handleDiagnosisAutoSuggest = useCallback((diagnosisName) => {
    const suggestions = diagnosisSuggestions[diagnosisName];
    if (!suggestions) return;

    // Auto-add investigations (lab tests)
    if (suggestions.investigations && labResults.length === 0) {
      setProcedures([...procedures, ...suggestions.investigations.map(inv => ({
        name: inv,
        notes: ''
      }))]);
      addToast(`Added ${diagnosisName} investigations`, 'info');
    }

    // Auto-add precautions
    if (suggestions.precautions && advice.length === 0) {
      setAdvice(suggestions.precautions);
    }

    // Auto-add diet advice
    if (suggestions.diet && !advice.includes(suggestions.diet)) {
      setAdvice(prev => prev ? `${prev}\n\nDiet: ${suggestions.diet}` : `Diet: ${suggestions.diet}`);
    }
  }, [procedures, labResults, advice, addToast]);

  // Handle template application
  const handleApplyTemplate = useCallback((templateName) => {
    // First check quickTemplates
    let template = quickTemplates[templateName];
    
    // If not found in quickTemplates, search in custom templates from DB
    if (!template) {
      const customTemplate = customTemplates.find(t => t.template_name === templateName);
      if (customTemplate) {
        template = {
          name: customTemplate.template_name,
          shortName: customTemplate.category,
          symptoms: typeof customTemplate.symptoms === 'string' ? 
            JSON.parse(customTemplate.symptoms) : customTemplate.symptoms || [],
          diagnoses: typeof customTemplate.diagnoses === 'string' ? 
            JSON.parse(customTemplate.diagnoses) : customTemplate.diagnoses || [],
          medications: typeof customTemplate.medications === 'string' ? 
            JSON.parse(customTemplate.medications) : customTemplate.medications || [],
          investigations: customTemplate.investigations || '',
          precautions: customTemplate.precautions || '',
          dietRestrictions: customTemplate.diet_restrictions || '',
          activities: customTemplate.activities || '',
          advice: customTemplate.advice || '',
          followUpDays: customTemplate.follow_up_days || 7
        };
      }
    }
    
    if (!template) return;

    // Apply template using the utility function
    applyCompleteTemplate(template, {
      setSymptoms,
      setDiagnoses,
      setMeds,
      setAdvice,
      setFollowUp: (days) => setFollowUp(prev => ({ ...prev, days: days.toString() })),
      setPatientNotes,
      setProcedures,
      language
    });

    setShowTemplateQuickWins(false);
    addToast(`Applied ${templateName} template successfully`, 'success');
  }, [addToast, language, customTemplates]);

  // Save current prescription as custom template
  const handleSaveAsTemplate = useCallback(async () => {
    if (!newTemplateName.trim()) {
      addToast('Template name is required', 'error');
      return;
    }
    if (!newTemplateShortName.trim()) {
      addToast('Short name is required', 'error');
      return;
    }

    try {
      const symptomsArr = templateFormData.symptoms
        ? templateFormData.symptoms.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const diagnosesArr = templateFormData.diagnoses
        ? templateFormData.diagnoses.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const medsArr = templateFormData.medications.filter(m => m.name.trim());

      const newTemplate = {
        template_name: newTemplateName,
        category: newTemplateShortName,
        description: `Custom template: ${symptomsArr.join(', ') || newTemplateName}`,
        symptoms: JSON.stringify(symptomsArr),
        diagnoses: JSON.stringify(diagnosesArr),
        medications: JSON.stringify(medsArr),
        investigations: templateFormData.investigations || '',
        precautions: templateFormData.precautions || '',
        diet_restrictions: templateFormData.diet_restrictions || '',
        activities: templateFormData.activities || '',
        advice: templateFormData.advice || '',
        follow_up_days: parseInt(templateFormData.follow_up_days) || 7,
        duration_days: parseInt(templateFormData.duration_days) || 7,
        is_active: 1
      };

      const response = await api.post('/api/prescription-templates', newTemplate);

      if (response.data.template) {
        setCustomTemplates([...customTemplates, response.data.template]);
        setShowCreateTemplateModal(false);
        setNewTemplateName('');
        setNewTemplateShortName('');
        setTemplateFormData({
          symptoms: '', diagnoses: '',
          medications: [{ name: '', brand: '', composition: '', frequency: '', timing: 'After Meal', duration: '', instructions: '', qty: '' }],
          investigations: '', precautions: '', diet_restrictions: '', activities: '', advice: '', follow_up_days: '', duration_days: '7'
        });
        addToast(`Template "${newTemplateName}" saved successfully!`, 'success');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      addToast('Failed to save template', 'error');
    }
  }, [
    newTemplateName,
    newTemplateShortName,
    templateFormData,
    customTemplates,
    addToast
  ]);

  // Delete custom template
  const handleDeleteCustomTemplate = useCallback(async (templateId) => {
    try {
      await api.delete(`/api/prescription-templates/${templateId}`);
      setCustomTemplates(customTemplates.filter(t => t.id !== templateId));
      addToast('Template deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting template:', error);
      addToast('Failed to delete template', 'error');
    }
  }, [customTemplates, addToast]);

  // Clear form function
  const handleClearForm = useCallback(() => {
    setSymptoms([]);
    setDiagnoses([]);
    setMeds([]);
    setAdvice('');
    setFollowUp({ days: '', date: '', autoFill: false });
    setPatientNotes('');
    setPrivateNotes('');
    setProcedures([]);
    setVitals({ temp: '', height: '', bmi: '', weight: '', pulse: '', blood_pressure: '', spo2: '' });
  }, []);

  // ICD Search - debounced API call
  useEffect(() => {
    if (icdQuery.length < 1) {
      setIcdResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        // Search ICD based on selected version
        const response = await api.get('/api/icd/search', {
          params: { 
            q: icdQuery, 
            version: icdVersion, // 'icd10', 'icd11', 'icd11local', or 'all'
            limit: 20 
          }
        });

        const payload = response.data?.data || response.data;

        // Handle response formats:
        // - { success: true, data: { items: [...] } }
        // - { items: [...] }
        // - legacy: { results: [...] }
        if (payload?.items && Array.isArray(payload.items)) {
          setIcdResults(payload.items);
        } else if (payload?.results && Array.isArray(payload.results)) {
          setIcdResults(payload.results);
        } else if (Array.isArray(payload)) {
          setIcdResults(payload);
        } else {
          setIcdResults([]);
        }
      } catch (err) {
        console.error('ICD search error:', err);
        setIcdResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [icdQuery, icdVersion, api]);

  // Symptom Search - searches from snomed_clinical_findings + symptom_medication_mapping
  useEffect(() => {
    if (symptomInput.length < 1) {
      setSnomedSymptomResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        // Search from ALL symptom sources (snomed_clinical_findings + symptom_medication_mapping)
        const res = await api.get('/api/symptoms/search', {
          params: { q: symptomInput, limit: 25 }
        });
        const allResults = (res.data?.symptoms || []).map(s => ({
          pt: { term: s.symptom.charAt(0).toUpperCase() + s.symptom.slice(1) },
          fsn: { term: s.symptom },
          source: s.source || 'mapping',
          snomed_id: s.snomed_id,
          icd_code: s.icd_code
        }));

        setSnomedSymptomResults(allResults);
      } catch (err) {
        console.debug('Symptom search error:', err);
        setSnomedSymptomResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [symptomInput, api]);

  // ICD Diagnosis Search (ICD-10 + ICD-11 from local DB) - debounced
  useEffect(() => {
    if (diagnosisInput.length < 1) {
      setDiagnosisSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        setDiagnosisLoading(true);
        const response = await api.get('/api/icd/search', {
          params: { q: diagnosisInput, version: 'all', limit: 20 }
        });

        const payload = response.data?.data || response.data;
        // Handle ICD search response format
        const results = payload?.results || payload?.items || payload?.diagnoses || [];
        setDiagnosisSearchResults(Array.isArray(results) ? results.map(r => ({
          code: r.icd_code || r.icd11_code || r.code || '',
          diagnosis_name: r.primary_description || r.preferred_label || r.title || r.diagnosis_name || '',
          description: r.secondary_description || r.full_title || r.description || '',
          version: r.version === 'icd11' ? 'ICD-11' : (r.version === 'icd10' ? 'ICD-10' : (r.icd11_code ? 'ICD-11' : 'ICD-10'))
        })) : []);
      } catch (err) {
        console.debug('Diagnosis search error:', err);
        setDiagnosisSearchResults([]);
      } finally {
        setDiagnosisLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [diagnosisInput, api]);

  // SNOMED Diagnosis Search - debounced API call
  useEffect(() => {
    if (diagnosisInput.length < 1) {
      setSnomedDiagnosisResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        const response = await api.get('/api/snomed-local/search', {
          params: { q: diagnosisInput, limit: 10, offset: snomedDiagnosisPage * 10, semanticTag: 'disorder', mode: 'like' }
        });

        if (response.data?.items && Array.isArray(response.data.items)) {
          setSnomedDiagnosisResults(response.data.items);
        } else {
          setSnomedDiagnosisResults([]);
        }
      } catch (err) {
        console.debug('SNOMED diagnosis search error:', err);
        setSnomedDiagnosisResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [diagnosisInput, api, snomedDiagnosisPage]);

  // SNOMED Drug Search - debounced API call
  useEffect(() => {
    if (medInput.length < 1) {
      setSnomedDrugResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        const response = await api.get('/api/snomed-local/drugs', {
          params: { q: medInput, limit: 15, offset: snomedDrugPage * 15 }
        });

        if (response.data?.items && Array.isArray(response.data.items)) {
          setSnomedDrugResults(response.data.items);
        } else {
          setSnomedDrugResults([]);
        }
      } catch (err) {
        console.debug('SNOMED drug search error:', err);
        setSnomedDrugResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [medInput, api, snomedDrugPage]);

  // ========================================
  // Utility Functions
  // ========================================

  // Helper function to translate timing from any language to target language
  const translateTiming = (timingValue, targetLang) => {
    if (!timingValue) return timingValue;

    // Create reverse lookup: find which index this timing value corresponds to
    let foundIndex = -1;
    let sourceLang = null;

    // Check each language to find where this timing value exists
    ['en', 'hi', 'mr'].forEach(lang => {
      const idx = timingOptions[lang]?.indexOf(timingValue);
      if (idx !== -1) {
        foundIndex = idx;
        sourceLang = lang;
      }
    });

    // If found, return the corresponding value in target language
    if (foundIndex !== -1 && timingOptions[targetLang]) {
      return timingOptions[targetLang][foundIndex] || timingValue;
    }

    return timingValue; // Return original if not found
  };

  // Helper function to translate instructions
  const translateInstruction = (instruction, targetLang) => {
    if (!instruction) return '';
    
    // Instruction translations dictionary
    const instructionTranslations = {
      'After food to avoid gastric irritation': {
        en: 'After food to avoid gastric irritation',
        hi: 'गैस्ट्रिक जलन से बचने के लिए खाने के बाद',
        mr: 'जठरामाशयीय जलनापासून बचण्यासाठी खाण्यानंतर'
      },
      'Take with water': {
        en: 'Take with water',
        hi: 'पानी के साथ लें',
        mr: 'पाण्याबरोबर घ्या'
      },
      'May cause mild drowsiness': {
        en: 'May cause mild drowsiness',
        hi: 'हल्की नींद आ सकती है',
        mr: 'हल्की निंद्रा येऊ शकते'
      },
      'Take at onset of headache': {
        en: 'Take at onset of headache',
        hi: 'सिरदर्द की शुरुआत में लें',
        mr: 'डोकेदुखी सुरू होताच घ्या'
      },
      'Preventive. Continue for 1 month.': {
        en: 'Preventive. Continue for 1 month.',
        hi: 'निवारक। 1 महीने तक जारी रखें।',
        mr: 'प्रতिबंधक। 1 महिन्यासाठी सुरू ठेवा।'
      },
      'For nausea and vomiting': {
        en: 'For nausea and vomiting',
        hi: 'मतली और उल्टी के लिए',
        mr: 'मळमळीक आणि उल्टीसाठी'
      },
      'Take 30 min before food': {
        en: 'Take 30 min before food',
        hi: 'खाने से 30 मिनट पहले लें',
        mr: 'खाण्यापूर्वी 30 मिनिटे आधी घ्या'
      },
      'Take on empty stomach': {
        en: 'Take on empty stomach',
        hi: 'खाली पेट पर लें',
        mr: 'रिकाम्या पोटी घ्या'
      },
      'Protective coating for stomach': {
        en: 'Protective coating for stomach',
        hi: 'पेट के लिए सुरक्षात्मक कोटिंग',
        mr: 'पोटासाठी संरक्षक कोटिंग'
      },
      'For sudden pain relief': {
        en: 'For sudden pain relief',
        hi: 'अचानक दर्द से राहत के लिए',
        mr: 'अचानक दुखापुरठे मदतीसाठी'
      },
      'Long-acting ACE inhibitor': {
        en: 'Long-acting ACE inhibitor',
        hi: 'दीर्घकालिक ACE अवरोधक',
        mr: 'दीर्घ-कार्यरत ACE प्रतिबंधक'
      },
      'ACE inhibitor for BP control': {
        en: 'ACE inhibitor for BP control',
        hi: 'रक्तचाप नियंत्रण के लिए ACE अवरोधक',
        mr: 'BP नियंत्रणासाठी ACE प्रतिबंधक'
      }
    };
    
    // Check if instruction exists in translations
    if (instructionTranslations[instruction]) {
      return instructionTranslations[instruction][targetLang] || instruction;
    }
    
    // Return original instruction if not found in translations
    return instruction;
  };

  // Parse frequency strings like '1-0-1', 'OD', 'BD', 'TDS', 'QID'
  const parseFrequency = (freq) => {
    if (!freq) return 0;
    const s = String(freq).toUpperCase().trim();
    if (/^\d+(-\d+)*$/.test(s)) {
      return s.split('-').map(x => parseInt(x || '0', 10)).reduce((a, b) => a + b, 0);
    }
    const map = { OD: 1, BD: 2, TDS: 3, TID: 3, QID: 4, HS: 1, STAT: 1, QHS: 1, QOD: 0.5 };
    return map[s] || 0;
  };

  const parseDurationDays = (dur) => {
    if (!dur) return 0;
    const m = String(dur).match(/(\d+)/);
    if (!m) return 0;
    return parseInt(m[1], 10) || 0;
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateFollowUpDate = (days) => {
    if (!days) return '';
    const date = new Date();
    date.setDate(date.getDate() + parseInt(days));
    return date.toISOString().split('T')[0];
  };

  // ========================================
  // MyGenie Integration - Apply suggestion to current prescription
  // Accessible to other components (e.g., MyGenie widget) via window.applyMyGenieSuggestion
  const applyGenieSuggestion = (suggestion) => {
    if (!suggestion) return;

    try {
      // Symptoms
      if (Array.isArray(suggestion.symptoms) && suggestion.symptoms.length > 0) {
        const newSx = suggestion.symptoms.filter(s => !symptoms.includes(s));
        if (newSx.length) setSymptoms(prev => [...prev, ...newSx]);
      }

      // Diagnoses
      if (Array.isArray(suggestion.diagnoses) && suggestion.diagnoses.length > 0) {
        const newDx = suggestion.diagnoses.filter(d => !diagnoses.includes(d));
        if (newDx.length) setDiagnoses(prev => [...prev, ...newDx]);
      }

      // Medications - accept array of medication-like objects
      if (Array.isArray(suggestion.medications) && suggestion.medications.length > 0) {
        const toAdd = suggestion.medications.map(m => ({
          name: m.name || m.medication_name || m.brand || '',
          brand: m.brand || m.name || '',
          composition: m.composition || '',
          frequency: m.frequency || '1-0-1',
          timing: m.timing || (timingOptions[language] || timingOptions.en)[0],
          duration: m.duration || '7 days',
          instructions: m.instructions || '',
          qty: m.qty || m.quantity || 7
        }));

        setMeds(prev => {
          const existing = prev || [];
          const filtered = toAdd.filter(n => !existing.some(e => (e.name && n.name && e.name === n.name) || (e.brand && n.brand && e.brand === n.brand)));
          return [...existing, ...filtered];
        });
      }

      // Advice / Free text
      if (suggestion.advice && typeof suggestion.advice === 'string') {
        setAdvice(prev => (prev ? `${prev}\n${suggestion.advice}` : suggestion.advice));
      }

      // Patient / private notes
      if (suggestion.note && typeof suggestion.note === 'string') {
        setPatientNotes(prev => (prev ? `${prev}\n${suggestion.note}` : suggestion.note));
      }

      addToast('Applied MyGenie suggestion to the prescription', 'success');
    } catch (err) {
      console.error('Failed to apply MyGenie suggestion:', err);
      addToast('Could not apply MyGenie suggestion', 'error');
    }
  };

  useEffect(() => {
    // Expose a short-lived bridge for other components to apply suggestions
    try {
      window.applyMyGenieSuggestion = applyGenieSuggestion;
    } catch (e) {
      // ignore in non-browser environments
    }
    return () => {
      try {
        if (window.applyMyGenieSuggestion === applyGenieSuggestion) delete window.applyMyGenieSuggestion;
      } catch (e) {}
    };
  }, [symptoms, diagnoses, meds, language, advice]);

  // ========================================
  // Symptom Handlers
  // ========================================
  const addSymptom = async (s) => {
    if (!s) return;
    if (!symptoms.includes(s)) {
      setSymptoms((prev) => [...prev, s]);

      // Auto-suggest diagnosis and medications based on symptom
      try {
        const response = await api.get(`/api/symptom-medications/suggestions?symptoms=${encodeURIComponent(s)}`);

        // Backend returns { diagnoses: [...], medications: [...], flatList: [...] }
        const dxFromApi = response.data?.diagnoses || response.data?.diagnosis || [];
        const medsFromApi = response.data?.flatList || response.data?.medications || [];

        // Auto-fill diagnosis if available
        if (Array.isArray(dxFromApi) && dxFromApi.length > 0) {
          const labels = dxFromApi
            .map(d => d?.diagnosis_name || d?.icd_code || d)
            .filter(Boolean);
          const newDiagnoses = labels.filter(d => !diagnoses.includes(d));
          if (newDiagnoses.length > 0) {
            setDiagnoses((prev) => [...prev, ...newDiagnoses]);
            addToast(`${newDiagnoses.length} diagnosis added for ${s}`, 'info');
          }
        }

        // Show medication suggestions in modal instead of auto-adding
        if (Array.isArray(medsFromApi) && medsFromApi.length > 0) {
          // Filter out medications that are already added AND remove duplicates from suggestions
          const uniqueMeds = [];
          const seenMeds = new Set();

          medsFromApi.forEach(med => {
            // Create a unique key for this medication
            const medKey = `${(med.name || '').toLowerCase().trim()}|${(med.brand || '').toLowerCase().trim()}|${(med.composition || '').toLowerCase().trim()}`;
            
            // Skip if already seen in suggestions or already added to prescription
            if (!seenMeds.has(medKey) && !meds.some(m => {
              const existingKey = `${(m.name || '').toLowerCase().trim()}|${(m.brand || '').toLowerCase().trim()}|${(m.composition || '').toLowerCase().trim()}`;
              return existingKey === medKey;
            })) {
              seenMeds.add(medKey);
              uniqueMeds.push(med);
            }
          });

          if (uniqueMeds.length > 0) {
            // Normalize keys expected by UI
            const normalized = uniqueMeds.map(m => ({
              name: m.name || m.medication_name,
              brand: m.brand || m.name || m.medication_name,
              composition: m.composition || '',
              dosage: m.dosage || m.strength || '',
              frequency: m.frequency || '1-0-1',
              duration: m.duration || '7 days',
              timing: m.timing,
              route: m.route,
              id: m.medicine_id || m.id
            }));

            // Store suggestions and show modal
            setPendingMedicationSuggestions(normalized);
            setShowMedicationSuggestionModal(true);
            addToast(`${normalized.length} medication(s) suggested for ${s}`, 'info');
          }
        }

        // New: also query diagnoses from symptoms (ICD suggestions)
        try {
          const respDx = await api.get('/api/diagnosis-suggestion/diagnoses/suggest-by-symptoms', {
            params: { symptoms: [...symptoms, s].join(',') }
          });
          if (Array.isArray(respDx.data?.data)) {
            const dxList = respDx.data.data.map(d => d.diagnosis_name || d.icd_code).filter(Boolean);
            const newDx = dxList.filter(d => !diagnoses.includes(d));
            if (newDx.length > 0) {
              setDiagnoses(prev => [...prev, ...newDx]);
              addToast(`${newDx.length} diagnosis suggested`, 'info');
            }
          }
        } catch (e2) {
          // ignore
        }
      } catch (error) {
        console.error('Error fetching medication suggestions:', error);
        // Silently fail - don't interrupt the doctor's workflow
      }
    }
    setSymptomInput('');
    setSymptomDropdown(false);
  };

  // Handle accepting medication suggestions
  const handleAcceptMedicationSuggestions = (selectedMeds) => {
    const defaultTiming = (timingOptions[language] || timingOptions.en)[0];
    
    selectedMeds.forEach(med => {
      const medObj = {
        name: med.name,
        brand: med.brand || med.name,
        strength: med.strength || '',
        dosage_form: med.dosage_form || '',
        frequency: med.frequency || '1-0-1',
        timing: med.timing || defaultTiming,
        duration: med.duration || '7 days',
        instructions: med.instructions || '',
        qty: 7
      };
      setMeds((prev) => [...prev, medObj]);
    });

    setShowMedicationSuggestionModal(false);
    setPendingMedicationSuggestions([]);
    addToast(`${selectedMeds.length} medication(s) added`, 'success');
  };

  const removeSymptom = (idx) => {
    setSymptoms((prev) => prev.filter((_, i) => i !== idx));
  };

  const copySymptom = (s) => {
    navigator.clipboard.writeText(s);
    addToast('Copied to clipboard', 'success');
  };

  // Apply symptoms template
  const applySymptomTemplate = async (template) => {
    try {
      const templateSymptoms = Array.isArray(template.symptoms)
        ? template.symptoms
        : JSON.parse(template.symptoms || '[]');

      // Add template symptoms to existing symptoms (avoid duplicates)
      const newSymptoms = [...symptoms];
      const addedSymptoms = [];

      templateSymptoms.forEach(symptom => {
        if (!newSymptoms.includes(symptom)) {
          newSymptoms.push(symptom);
          addedSymptoms.push(symptom);
        }
      });

      setSymptoms(newSymptoms);
      setShowTemplateSelector(false);
      addToast(`Applied template: ${template.name}`, 'success');

      // Auto-suggest diagnosis and medications for all newly added symptoms
      if (addedSymptoms.length > 0) {
        try {
          const symptomsQuery = addedSymptoms.join(',');
          const response = await api.get(`/api/symptom-medications/suggestions?symptoms=${encodeURIComponent(symptomsQuery)}`);

          // Backend returns { diagnoses: [...], medications: [...], flatList: [...] }
          const dxFromApi = response.data?.diagnoses || response.data?.diagnosis || [];
          const medsFromApi = response.data?.flatList || response.data?.medications || [];

          // Auto-fill diagnosis if available
          if (Array.isArray(dxFromApi) && dxFromApi.length > 0) {
            const labels = dxFromApi
              .map(d => d?.diagnosis_name || d?.icd_code || d)
              .filter(Boolean);
            const newDiagnoses = labels.filter(d => !diagnoses.includes(d));
            if (newDiagnoses.length > 0) {
              setDiagnoses((prev) => [...prev, ...newDiagnoses]);
              addToast(`${newDiagnoses.length} diagnosis suggested`, 'info');
            }
          }

          // Auto-fill medications if available
          if (Array.isArray(medsFromApi) && medsFromApi.length > 0) {
            addToast(`${medsFromApi.length} medication(s) suggested`, 'info');

            // Auto-add top 2 medications for each symptom
            const topSuggestions = medsFromApi.slice(0, 4); // Max 4 total
            topSuggestions.forEach(med => {
              const alreadyExists = meds.some(m =>
                m.name === med.name || m.brand === med.brand
              );

              if (!alreadyExists) {
                const defaultTiming = (timingOptions[language] || timingOptions.en)[0];
                const medObj = {
                  name: med.name,
                  brand: med.brand || med.name,
                  composition: med.composition || '',
                  frequency: med.frequency || '1-0-1',
                  timing: med.timing || defaultTiming,
                  duration: med.duration || '7 days',
                  instructions: '',
                  qty: 7
                };
                setMeds((prev) => [...prev, medObj]);
              }
            });
          }
        } catch (error) {
          console.error('Error fetching medication suggestions:', error);
          // Silently fail
        }
      }
    } catch (error) {
      console.error('Error applying template:', error);
      addToast('Failed to apply template', 'error');
    }
  };

  // ========================================
  // Diagnosis Handlers
  // ========================================
  const addDiagnosis = (d) => {
    if (!d) return;
    if (!diagnoses.includes(d)) {
      setDiagnoses((prev) => [...prev, d]);
    }
    setDiagnosisInput('');
    setDiagnosisDropdown(false);
  };

  const removeDiagnosis = (idx) => {
    setDiagnoses((prev) => prev.filter((_, i) => i !== idx));
  };

  const copyDiagnosis = (d) => {
    navigator.clipboard.writeText(d);
    addToast('Copied to clipboard', 'success');
  };

  // Apply diagnosis template
  const applyDiagnosisTemplate = (template) => {
    try {
      const templateDiagnoses = Array.isArray(template.diagnoses)
        ? template.diagnoses
        : JSON.parse(template.diagnoses || '[]');

      // Add template diagnoses to existing diagnoses (avoid duplicates)
      const newDiagnoses = [...diagnoses];
      templateDiagnoses.forEach(diagnosis => {
        if (!newDiagnoses.includes(diagnosis)) {
          newDiagnoses.push(diagnosis);
        }
      });

      setDiagnoses(newDiagnoses);
      setShowDiagnosisTemplateSelector(false);
      addToast(`Applied template: ${template.name}`, 'success');
    } catch (error) {
      console.error('Error applying diagnosis template:', error);
      addToast('Failed to apply template', 'error');
    }
  };

  // Handle ICD code selection - fetch related symptoms, diagnoses, and medications
  const handleIcdSelect = async (icdCode, icdTitle) => {
    try {
      // Fetch related data for this ICD code
      const response = await api.get(`/api/icd/${icdCode}/related`, {
        params: { limit: 20 }
      });

      const relatedData = response.data?.data || response.data || {};

      // Add related symptoms
      if (relatedData.symptoms && Array.isArray(relatedData.symptoms)) {
        const newSymptoms = relatedData.symptoms.filter(s => !symptoms.includes(s));
        if (newSymptoms.length > 0) {
          setSymptoms(prev => [...prev, ...newSymptoms]);
          addToast(`${newSymptoms.length} symptom(s) added for ${icdCode}`, 'info');
        }
      }

      // Add related diagnoses
      if (relatedData.diagnoses && Array.isArray(relatedData.diagnoses)) {
        const newDiagnoses = relatedData.diagnoses.filter(d => !diagnoses.includes(d));
        if (newDiagnoses.length > 0) {
          setDiagnoses(prev => [...prev, ...newDiagnoses]);
          addToast(`${newDiagnoses.length} diagnosis/diagnoses added for ${icdCode}`, 'info');
        }
      }

      // Add related medications
      if (relatedData.medications && Array.isArray(relatedData.medications)) {
        const uniqueMeds = [];
        const seenMeds = new Set();

        relatedData.medications.forEach(med => {
          const medKey = `${(med.name || '').toLowerCase().trim()}|${(med.brand || '').toLowerCase().trim()}|${(med.composition || '').toLowerCase().trim()}`;
          
          if (!seenMeds.has(medKey) && !meds.some(m => {
            const existingKey = `${(m.name || '').toLowerCase().trim()}|${(m.brand || '').toLowerCase().trim()}|${(m.composition || '').toLowerCase().trim()}`;
            return existingKey === medKey;
          })) {
            seenMeds.add(medKey);
            uniqueMeds.push(med);
          }
        });

        if (uniqueMeds.length > 0) {
          setPendingMedicationSuggestions(uniqueMeds);
          setShowMedicationSuggestionModal(true);
          addToast(`${uniqueMeds.length} medication(s) suggested for ${icdCode}`, 'info');
        }
      }
    } catch (error) {
      console.error('Error fetching ICD related data:', error);
      // Silently fail - ICD selection still works even if related data fetch fails
    }
  };

  // ========================================
  // Medication Handlers
  // ========================================
  const addEmptyMed = () => {
    const defaultTiming = (timingOptions[language] || timingOptions.en)[0];
    const medObj = {
      name: '',
      brand: '',
      composition: '',
      frequency: '',
      timing: defaultTiming,
      duration: '',
      instructions: '',
      qty: 7
    };
    setMeds(prev => [...prev, medObj]);
  };

  const addMed = async (med) => {
    if (!med) return;
    const defaultTiming = (timingOptions[language] || timingOptions.en)[0];

    const baseMed = typeof med === 'string'
      ? { name: med, brand: med, composition: '' }
      : { ...med };

    // Try to fetch dosage defaults
    let dosage = '';
    let frequency = baseMed.recommended_frequency || '1-0-1';
    let duration = baseMed.recommended_duration || '7 days';
    let route = '';
    let qty = 7;

    // If med already has dosage data from dosage_references (via search)
    if (baseMed.standard_dosage) {
      dosage = baseMed.standard_dosage;
      frequency = baseMed.recommended_frequency || frequency;
      duration = baseMed.recommended_duration || duration;
    }

    // Try to fetch dosage from dosage_references by medicine name
    const medName = baseMed.name || baseMed.medication_name || baseMed.brand || '';
    try {
      if (medName) {
        const resp = await api.get('/api/medicines/dosage', {
          params: { name: medName }
        });
        const dosageInfo = resp.data?.dosage;
        if (dosageInfo) {
          dosage = dosageInfo.standard_dosage || dosage;
          frequency = dosageInfo.recommended_frequency || frequency;
          duration = dosageInfo.recommended_duration || duration;
          route = dosageInfo.route_of_administration || route;
        }
      }
    } catch (e) {
      // Fallback: try medicine defaults by id
      try {
        if (baseMed.id) {
          const resp = await api.get(`/api/medicines/${baseMed.id}/defaults`);
          const defs = resp.data?.defaults || {};
          dosage = defs.dosage || dosage;
          frequency = defs.frequency || frequency;
          duration = defs.duration || duration;
          route = defs.route || route;
        }
      } catch (e2) {
        // ignore
      }
    }

    // Estimate quantity
    const perDay = parseFrequency(frequency);
    const days = parseDurationDays(duration);
    if (perDay && days) qty = perDay * days;

    const medObj = {
      name: medName,
      brand: baseMed.brand || baseMed.name || '',
      composition: baseMed.composition || baseMed.generic_name || '',
      frequency,
      timing: baseMed.timing || defaultTiming,
      duration,
      instructions: baseMed.instructions || '',
      qty
    };

    setMeds((prev) => [...prev, medObj]);
    setMedInput('');
    setMedDropdown(false);
  };

  const removeMed = (idx) => {
    setMeds((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMed = (idx, field, value) => {
    setMeds((prev) => {
      const updated = [...prev];
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], [field]: value };
      }
      return updated;
    });
  };

  // Search medications from database (replaces hardcoded list)
  const searchMedications = useCallback(async (query) => {
    if (!query || query.length < 1) {
      setMedicationSuggestions([]);
      return;
    }

    try {
      setMedicationLoading(true);
      const response = await api.get('/api/medicines/search', {
        params: { q: query, limit: 20 }
      });

      // Handle response format: { medicines: [...] }
      const meds = response.data.medicines || response.data.medications || response.data.items || [];
      setMedicationSuggestions(Array.isArray(meds) ? meds.map(m => ({
        id: m.id,
        name: m.name || m.medication_name || '',
        brand: m.brand || m.name || '',
        composition: m.generic_name || m.active_ingredient || '',
        strength: m.strength || '',
        dosage_form: m.dosage_form || '',
        source: m.source || 'local',
        standard_dosage: m.standard_dosage,
        recommended_frequency: m.recommended_frequency,
        recommended_duration: m.recommended_duration,
        available: true
      })) : []);
    } catch (err) {
      console.error('Medication search error:', err);
      setMedicationSuggestions([]);
    } finally {
      setMedicationLoading(false);
    }
  }, [api]);

  // Fetch frequently prescribed medications for this patient
  const fetchFrequentlyPrescribedMeds = useCallback(async () => {
    if (!patientId) return;

    try {
      const response = await api.get(`/api/medicines/patient/${patientId}/recent`, {
        params: { limit: 10 }
      });

      const meds = response.data.medications || response.data.items || response.data || [];
      setFrequentlyPrescribedMeds(Array.isArray(meds) ? meds : []);
    } catch (err) {
      console.error('Failed to fetch frequently prescribed medications:', err);
      setFrequentlyPrescribedMeds([]);
    }
  }, [api, patientId]);

  // Load frequently prescribed meds when patient loads
  useEffect(() => {
    if (patientId) {
      fetchFrequentlyPrescribedMeds();
    }
  }, [patientId, fetchFrequentlyPrescribedMeds]);

  // Search medications with debounce
  useEffect(() => {
    if (medInput.length < 1) {
      setMedicationSuggestions([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      searchMedications(medInput);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [medInput, searchMedications]);

  // Apply medications template
  const applyMedicationsTemplate = (template) => {
    try {
      const templateMeds = Array.isArray(template.medications)
        ? template.medications
        : JSON.parse(template.medications || '[]');

      // Add template medications to existing medications (avoid duplicates)
      templateMeds.forEach(med => {
        const alreadyExists = meds.some(m =>
          m.name === med.name || m.brand === med.brand
        );

        if (!alreadyExists) {
          const defaultTiming = (timingOptions[language] || timingOptions.en)[0];
          const medObj = {
            name: med.name || med.medication_name || '',
            brand: med.brand || med.brand_name || med.name || '',
            composition: med.composition || '',
            frequency: med.frequency || '1-0-1',
            timing: med.timing || defaultTiming,
            duration: med.duration || '7 days',
            instructions: med.instructions || '',
            qty: med.qty || med.quantity || 7
          };
          setMeds((prev) => [...prev, medObj]);
        }
      });

      setShowMedicationsTemplateSelector(false);
      addToast(`Applied template: ${template.name}`, 'success');
    } catch (error) {
      console.error('Error applying medications template:', error);
      addToast('Failed to apply template', 'error');
    }
  };

  // ========================================
  // Advice Handlers
  // ========================================
  const toggleAdvice = (adv) => {
    setSelectedAdvice((prev) => 
      prev.includes(adv) ? prev.filter(a => a !== adv) : [...prev, adv]
    );
  };

  const formatAdvice = (command) => {
    const editor = adviceEditorRef.current;
    if (!editor) return;
    document.execCommand(command, false, null);
    editor.focus();
  };

  // ========================================
  // Follow-up Handler
  // ========================================
  const handleFollowUpDaysChange = (days) => {
    const daysStr = (typeof days === 'string' ? days : String(days || ''));
    setFollowUp({
      ...followUp,
      days: daysStr,
      date: daysStr ? calculateFollowUpDate(daysStr) : ''
    });
  };

  // ========================================
  // Specialty Module Handlers
  // ========================================
  const handleSpecialtyDataChange = (data) => {
    setSpecialtyData(data);
    console.log('Specialty data updated:', data);
  };

  // ========================================
  // Repeat Prescription Handler
  // ========================================
  const handleRepeatSuccess = (prescriptionData) => {
    // Populate form with repeated prescription data
    if (prescriptionData.prescription) {
      const rx = prescriptionData.prescription;

      // Set symptoms
      if (rx.medication_name) {
        setSymptoms([rx.medication_name]);
      }

      // Set medications
      if (rx.medications && Array.isArray(rx.medications)) {
        setMeds(rx.medications.map(med => ({
          medication_name: med.medication_name || med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions
        })));
      }

      // Set advice
      if (rx.instructions) {
        setAdvice(rx.instructions);
      }

      // Set vitals if available
      if (rx.vitals) {
        setVitals(rx.vitals);
      }

      addToast('Last prescription loaded successfully! Review and modify as needed.', 'success');
    }
  };

  // ========================================
  // Save Prescription
  // ========================================
  const handleSave = async () => {
    // Validation
    if (!meta.patient_id) {
      addToast('Patient ID is required', 'error');
      return;
    }

    // Validate patient_id is a valid number
    const parsedPatientId = parseInt(meta.patient_id);
    if (isNaN(parsedPatientId)) {
      addToast('Invalid patient ID. Please select a patient from the queue or patients list.', 'error');
      return;
    }

    if (!meds.length) {
      addToast('At least one medicine is required', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Get doctor_id - with fallback
      let doctorId = meta.doctor_id;

      if (!doctorId) {
        try {
          const docRes = await api.get('/api/doctors');
          if (docRes.data.doctors && docRes.data.doctors.length > 0) {
            doctorId = docRes.data.doctors[0].id;
            setMeta(prev => ({ ...prev, doctor_id: doctorId }));
          }
        } catch (err) {
          console.error('Failed to get doctor:', err);
        }
      }

      // Prepare medications data
      const medicationsData = meds.map(m => ({
        medication_name: m.name || m.brand,
        brand_name: m.brand || m.name,
        dosage: m.dosage || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
        instructions: m.instructions || '',
        timing: m.timing || '',
        quantity: m.qty || 0
      }));

      // Prepare request body
      const requestBody = {
        patient_id: parsedPatientId,
        doctor_id: doctorId || null,  // Backend will handle fallback
        appointment_id: meta.appointment_id ? parseInt(meta.appointment_id) : null,
        template_id: selectedTemplateId || null,  // Letterhead template
        medications: medicationsData,
        symptoms: symptoms,
        diagnosis: diagnoses,
        vitals: {
          temp: vitals.temp || null,
          height: vitals.height || null,
          weight: vitals.weight || null,
          pulse: vitals.pulse || null,
          bmi: vitals.bmi || null,
          blood_pressure: vitals.blood_pressure || null,
          spo2: vitals.spo2 || null
        },
        advice: advice + (selectedAdvice.length > 0 ? '\n' + selectedAdvice.join('\n') : ''),
        follow_up_days: followUp.days ? parseInt(followUp.days) : null,
        follow_up_date: followUp.date || null,
        patient_notes: patientNotes || '',
        private_notes: privateNotes || ''
      };

      console.log('Saving prescription:', requestBody);

      const response = await api.post('/api/prescriptions', requestBody);
      
      console.log('Prescription saved:', response.data);
      addToast('Prescription saved successfully', 'success');

      // Save vitals to patient's vitals record
      try {
        if (vitals.temp || vitals.height || vitals.weight || vitals.pulse || vitals.blood_pressure || vitals.spo2) {
          const vitalsData = {
            vitals: [
              { label: 'Temperature', value: vitals.temp, date: new Date().toISOString() },
              { label: 'Height', value: vitals.height, date: new Date().toISOString() },
              { label: 'Weight', value: vitals.weight, date: new Date().toISOString() },
              { label: 'Pulse Rate', value: vitals.pulse, date: new Date().toISOString() },
              { label: 'Blood Pressure', value: vitals.blood_pressure, date: new Date().toISOString() },
              { label: 'SpO2', value: vitals.spo2, date: new Date().toISOString() },
              ...(vitals.bmi ? [{ label: 'BMI', value: vitals.bmi, date: new Date().toISOString() }] : [])
            ].filter(v => v.value)
          };
          await api.post(`/api/patient-data/vitals/${parsedPatientId}`, vitalsData);
          console.log('Vitals saved to patient record');
        }
      } catch (vitalErr) {
        console.warn('Could not save vitals to patient record:', vitalErr);
        // Don't fail the prescription save if vitals save fails
      }

      // Store prescription ID for PDF download
      if (response.data?.id) {
        setCurrentPrescriptionId(response.data.id);
      }

      // Save ICD diagnoses if selected
      try {
        if (response.data?.id && selectedIcds.length > 0) {
          await api.post(`/api/prescriptions/detail/${response.data.id}/diagnoses`, selectedIcds);
          addToast('Diagnoses (ICD) saved', 'success');
        }
      } catch (e) {
        console.error('Failed to save ICD diagnoses:', e);
        addToast('Prescription saved, but ICD diagnoses could not be saved', 'warning');
      }
      
      return response.data;
    } catch (error) {
      console.error('Save error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.details || 'Failed to save prescription';
      addToast(errorMsg, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // Finish Visit
  // ========================================
  const handleFinish = async () => {
    try {
      // Step 1: Save the prescription
      await handleSave();
      
      // Step 2: Mark appointment as completed if appointment_id exists
      if (meta.appointment_id) {
        try {
          await api.patch(`/api/appointments/${meta.appointment_id}/status`, {
            status: 'completed'
          });
          addToast('Appointment marked as completed', 'success');
        } catch (error) {
          console.error('Error marking appointment as completed:', error);
          addToast('Prescription saved but could not mark appointment as completed', 'warning');
        }
      }
      
      addToast('Prescription completed and visit ended', 'success');

      // Hand off to billing / receipt creation
      if (meta.patient_id && meta.appointment_id) {
        navigate(`/receipts?patient=${meta.patient_id}&appointment=${meta.appointment_id}&quick=true`);
      } else {
        navigate('/queue');
      }
    } catch (error) {
      console.error('Finish error:', error);
      // Error already shown in handleSave
    }
  };

  // ========================================
  // Clear Form
  // ========================================
  const handleClear = () => {
    setSymptoms([]);
    setDiagnoses([]);
    setMeds([]);
    setAdvice('');
    setPatientNotes('');
    setPrivateNotes('');
    setVitals({ temp: '', height: '', bmi: '', weight: '', pulse: '', blood_pressure: '', spo2: '' });
    setFollowUp({ days: '', date: '', autoFill: false });
    setSelectedAdvice([]);
    addToast('Prescription cleared', 'info');
  };

  // ========================================
  // Filtered Lists
  // ========================================
  // Note: filteredSymptoms is already defined above in component scope
  
  const filteredDiagnoses = diagnosisInput.length > 0
    ? diagnosisSuggestions.filter(d => 
        d.toLowerCase().startsWith(diagnosisInput.toLowerCase())
      )
    : diagnosisSuggestions.slice(0, 4);

  const combinedDiagnosisResults = (() => {
    const out = [];

    // 1) Backend ICD results (ICD-10 + ICD-11)
    for (const r of diagnosisSearchResults) {
      const label = r.diagnosis_name || r.code;
      if (!label) continue;
      out.push({ type: 'icd', label, code: r.code, description: r.description, version: r.version });
    }

    // 2) Quick suggestions (only if no ICD results or no input)
    if (out.length === 0) {
      for (const d of filteredDiagnoses) {
        out.push({ type: 'quick', label: d });
      }
    }

    // De-dup by label
    const seen = new Set();
    return out.filter(x => {
      const k = (x.label || '').toLowerCase().trim();
      if (!k) return false;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  })();

  const filteredMeds = medInput.length > 0
    ? medicationSuggestions.filter(m =>
        (m.name || '').toLowerCase().includes(medInput.toLowerCase()) ||
        (m.brand || '').toLowerCase().includes(medInput.toLowerCase()) ||
        (m.composition || '').toLowerCase().includes(medInput.toLowerCase())
      )
    : medicationSuggestions.slice(0, 10);

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="space-y-4">
      {/* No Patient Selected - Show Search */}
      {!patient && !patientId && (
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select a Patient</h3>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search by name, UHID, or phone number..."
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                searchPatients(e.target.value);
                setShowPatientSearch(true);
              }}
              onFocus={() => setShowPatientSearch(true)}
            />

            {/* Search Results Dropdown */}
            {showPatientSearch && patientResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {patientResults.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handlePatientSelect(p)}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-600">
                      UHID: {p.patient_id} • {p.phone} • {p.gender}, {calculateAge(p.dob)} years
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center text-gray-600">
            <p className="mb-2">Or select from:</p>
            <div className="flex gap-3 justify-center">
              <Link to="/queue" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
                View Queue
              </Link>
              <Link to="/patients" className="px-4 py-2 border border-primary text-primary rounded hover:bg-primary/10">
                All Patients
              </Link>
            </div>
            </div>
            </div>
            )}

      {/* Patient Info Header */}
      {patient && (
        <div className="bg-white border rounded shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{patient.name}</h2>
                  <select className="text-sm border rounded px-2 py-1">
                    <option>{patient.name}</option>
                  </select>
                </div>
                <p className="text-sm text-slate-600">
                  {calculateAge(patient.dob)} years, {patient.gender || ''} • UHID: {patient.patient_id || ''} • {patient.phone || ''}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                  <span>📅 {new Date(meta.prescription_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span>🕐 {meta.prescription_time}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="p-2 border rounded hover:bg-slate-50 transition active:scale-[0.98]" title="Edit" onClick={() => {}}>
                <FiEdit3 />
              </button>
              <button type="button" className="p-2 border rounded hover:bg-slate-50 transition active:scale-[0.98]" title="Video Call" onClick={() => {}}>
                <FiVideo />
              </button>
              <button type="button" className="p-2 border rounded hover:bg-slate-50 transition active:scale-[0.98]" title="Link" onClick={() => {}}>
                <FiLink2 />
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b">
            <button
              type="button"
              onClick={() => navigate(`/patient-overview/${patientId}`)}
              className="px-4 py-2 text-sm border-b-2 border-transparent hover:border-primary transition active:scale-[0.98]"
            >
              Patient Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prescription')}
              className={`px-4 py-2 text-sm border-b-2 transition active:scale-[0.98] ${
                activeTab === 'prescription' ? 'border-primary text-primary' : 'border-transparent'
              }`}
            >
              Prescription Pad
            </button>
            <button
              type="button"
              onClick={() => navigate('/rx-template')}
              className="px-4 py-2 text-sm border-b-2 border-transparent hover:border-primary transition active:scale-[0.98]"
            >
              Templates
            </button>
            <button
              type="button"
              onClick={() => navigate('/pad-configuration')}
              className="px-4 py-2 text-sm border-b-2 border-transparent hover:border-primary transition active:scale-[0.98]"
            >
              Configure your pad
            </button>
          </div>
        </div>
      )}

      {/* PHASE 1: Quick Templates Bar */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <span className="text-lg">🚀</span>
              Quick Templates
            </h3>
            <button
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              className="text-xs bg-blue-200 hover:bg-blue-300 text-blue-900 px-2 py-1 rounded transition"
              title="Show keyboard shortcuts"
            >
              ⌨️ Ctrl+T
            </button>
          </div>
        </div>

        {/* Keyboard Help */}
        {showKeyboardHelp && (
          <div className="mb-3 p-3 bg-white rounded border border-blue-300 text-sm">
            <div className="font-semibold mb-2 text-gray-900">Keyboard Shortcuts:</div>
            <div className="grid grid-cols-2 gap-2">
              <div><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+T</kbd> Template</div>
              <div><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+S</kbd> Save</div>
              <div><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+P</kbd> Print</div>
              <div><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+M</kbd> Medicine</div>
              <div><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+L</kbd> Lab</div>
              <div><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+Shift+C</kbd> Clear</div>
            </div>
          </div>
        )}

        {/* Template Buttons */}
        <div className="flex flex-wrap gap-3">
          {Object.keys(quickTemplates).map(templateName => {
            const template = quickTemplates[templateName];
            const medCount = template.medications ? template.medications.length : 0;
            const getIcon = (name) => {
              const icons = {
                'URTI': '🤒',
                'Migraine': '🤕',
                'Gastritis': '🤢',
                'Hypertension': '💓',
                'Diabetes': '🩺',
                'Fever': '🌡️',
                'Anxiety': '😰',
                'Allergy': '🤧',
                'Cough': '🤐'
              };
              return icons[name] || '💊';
            };
            
            return (
              <button
                key={templateName}
                onClick={() => handleApplyTemplate(templateName)}
                className="px-4 py-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition transform hover:scale-110 hover:shadow-lg shadow-md text-sm flex flex-col items-center gap-1"
                title={`Apply ${template.name} template - ${medCount} medicines (fills form automatically)`}
              >
                <span className="text-xl">{getIcon(templateName)}</span>
                <span>{templateName}</span>
                <span className="text-xs opacity-85">{medCount} meds</span>
              </button>
            );
          })}

          {/* Custom Templates */}
          {customTemplates.length > 0 && (
            <>
              <div className="w-full h-0.5 bg-gray-300 my-2"></div>
              {customTemplates.map(template => {
                const medications = typeof template.medications === 'string' ? 
                  JSON.parse(template.medications) : template.medications || [];
                const medCount = medications.length;
                
                return (
                  <div key={template.id} className="relative group">
                    <button
                      onClick={() => handleApplyTemplate(template.template_name)}
                      className="px-4 py-3 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition transform hover:scale-110 hover:shadow-lg shadow-md text-sm flex flex-col items-center gap-1"
                      title={`Apply "${template.template_name}" custom template`}
                    >
                      <span className="text-xl">⭐</span>
                      <span className="text-xs line-clamp-1">{template.category || template.template_name}</span>
                      <span className="text-xs opacity-85">{medCount} meds</span>
                    </button>
                    {/* Delete button on hover */}
                    <button
                      onClick={() => handleDeleteCustomTemplate(template.id)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                      title="Delete custom template"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {/* Create New Template Button */}
          <button
            onClick={() => setShowCreateTemplateModal(true)}
            className="px-4 py-3 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition transform hover:scale-110 hover:shadow-lg shadow-md text-sm flex flex-col items-center gap-1"
            title="Save current prescription as custom template"
          >
            <span className="text-xl">➕</span>
            <span>Create</span>
            <span className="text-xs opacity-85">Template</span>
          </button>
        </div>

        {/* Template Info */}
        <div className="mt-3 text-xs text-gray-600 bg-white p-3 rounded border border-blue-200">
          <span className="font-semibold">💡 Pro Tip:</span> Click any button → Entire prescription fills in 1 second with pre-defined medicines, advice, and investigations! Create custom templates from your current prescription.
        </div>
      </div>

      {/* Create Template Modal */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
            <div className="p-3 border-b flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-gray-800">Create New Template</h2>
              <button
                onClick={() => {
                  setShowCreateTemplateModal(false);
                  setNewTemplateName('');
                  setNewTemplateShortName('');
                  setTemplateFormData({
                    symptoms: '', diagnoses: '',
                    medications: [{ name: '', brand: '', composition: '', frequency: '', timing: 'After Meal', duration: '', instructions: '', qty: '' }],
                    investigations: '', precautions: '', diet_restrictions: '', activities: '', advice: '', follow_up_days: '', duration_days: '7'
                  });
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-3 space-y-3 overflow-y-auto flex-1">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Template Name *</label>
                  <input type="text" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., Asthma Management" className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Short Name *</label>
                  <input type="text" value={newTemplateShortName} onChange={(e) => setNewTemplateShortName(e.target.value)}
                    placeholder="e.g., Asthma" maxLength="15" className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs" />
                </div>
              </div>

              {/* Symptoms & Diagnoses */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Symptoms</label>
                  <textarea value={templateFormData.symptoms}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                    placeholder="Fever, Cough, Headache"
                    className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs" rows="2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Diagnoses</label>
                  <textarea value={templateFormData.diagnoses}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, diagnoses: e.target.value }))}
                    placeholder="Acute URI, Bronchitis"
                    className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs" rows="2" />
                </div>
              </div>

              {/* Medications */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700">Medications</label>
                  <button type="button" onClick={() => setTemplateFormData(prev => ({
                    ...prev,
                    medications: [...prev.medications, { name: '', brand: '', composition: '', frequency: '', timing: 'After Meal', duration: '', instructions: '', qty: '' }]
                  }))} className="text-xs px-2 py-0.5 bg-green-500 text-white rounded hover:bg-green-600">+ Add</button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {templateFormData.medications.map((med, idx) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded border relative">
                      {templateFormData.medications.length > 1 && (
                        <button type="button" onClick={() => setTemplateFormData(prev => ({
                          ...prev, medications: prev.medications.filter((_, i) => i !== idx)
                        }))} className="absolute top-1 right-1 text-red-400 hover:text-red-600 text-xs">✕</button>
                      )}
                      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                        <input type="text" value={med.name} placeholder="Medicine Name *"
                          onChange={(e) => { const m = [...templateFormData.medications]; m[idx] = { ...m[idx], name: e.target.value }; setTemplateFormData(prev => ({ ...prev, medications: m })); }}
                          className="px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-purple-500" />
                        <input type="text" value={med.frequency} placeholder="Frequency (1-1-1)"
                          onChange={(e) => { const m = [...templateFormData.medications]; m[idx] = { ...m[idx], frequency: e.target.value }; setTemplateFormData(prev => ({ ...prev, medications: m })); }}
                          className="px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-purple-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <select value={med.timing}
                          onChange={(e) => { const m = [...templateFormData.medications]; m[idx] = { ...m[idx], timing: e.target.value }; setTemplateFormData(prev => ({ ...prev, medications: m })); }}
                          className="px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-purple-500">
                          <option value="Before Meal">Before Meal</option>
                          <option value="After Meal">After Meal</option>
                          <option value="With Meal">With Meal</option>
                          <option value="Empty Stomach">Empty Stomach</option>
                          <option value="Bedtime">Bedtime</option>
                        </select>
                        <input type="text" value={med.duration} placeholder="Duration (5 days)"
                          onChange={(e) => { const m = [...templateFormData.medications]; m[idx] = { ...m[idx], duration: e.target.value }; setTemplateFormData(prev => ({ ...prev, medications: m })); }}
                          className="px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-purple-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investigations & Precautions */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Investigations</label>
                  <textarea value={templateFormData.investigations}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, investigations: e.target.value }))}
                    placeholder="CBC, Blood Sugar, etc."
                    className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs" rows="1" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Precautions</label>
                  <textarea value={templateFormData.precautions}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, precautions: e.target.value }))}
                    placeholder="Avoid cold water..."
                    className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs" rows="1" />
                </div>
              </div>

              {/* Diet & Advice */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Diet Restrictions</label>
                  <textarea value={templateFormData.diet_restrictions}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, diet_restrictions: e.target.value }))}
                    placeholder="Avoid spicy food..."
                    className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs" rows="1" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Advice</label>
                  <textarea value={templateFormData.advice}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, advice: e.target.value }))}
                    placeholder="Plenty of fluids..."
                    className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs" rows="1" />
                </div>
              </div>

              {/* Follow-up & Duration */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Follow-up Days</label>
                  <input type="number" value={templateFormData.follow_up_days}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, follow_up_days: e.target.value }))}
                    placeholder="7" className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration Days</label>
                  <input type="number" value={templateFormData.duration_days}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, duration_days: e.target.value }))}
                    placeholder="7" className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs" />
                </div>
              </div>
            </div>

            <div className="p-3 border-t flex gap-2 shrink-0">
              <button
                onClick={() => {
                  setShowCreateTemplateModal(false);
                  setNewTemplateName('');
                  setNewTemplateShortName('');
                  setTemplateFormData({
                    symptoms: '', diagnoses: '',
                    medications: [{ name: '', brand: '', composition: '', frequency: '', timing: 'After Meal', duration: '', instructions: '', qty: '' }],
                    investigations: '', precautions: '', diet_restrictions: '', activities: '', advice: '', follow_up_days: '', duration_days: '7'
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsTemplate}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition"
                disabled={!newTemplateName.trim() || !newTemplateShortName.trim()}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {/* PHASE 2: Advanced Features Bar */}
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 shadow-sm relative z-20">
            <h3 className="font-semibold text-purple-900 flex items-center gap-2 mb-3">
              <span className="text-lg">⚡</span>
              Advanced Features
            </h3>
            
            <div className="flex flex-wrap gap-2 relative">
              {/* Smart Combos Button */}
              <SmartMedicationCombos
                medicationCombos={medicationCombos}
                addMedicationCombo={() => setShowMedicationCombos(true)}
                setMedications={setMedications}
                language={language}
                addToast={addToast}
              />
              
              {/* Dosage Calculator Button */}
              <DosageCalculator
                patientWeight={parseFloat(vitals.weight) || 0}
                patientAge={patient ? calculateAge(patient.dob) : 0}
                dosageCalculator={dosageCalculator}
                language={language}
                addToast={addToast}
                addMedicine={(med) => {
                  // Add to prescription list
                  setMedications(prev => [...prev, med]);
                  // Persist to recent medicines and update UI
                  RecentlyUsedMedicines.add(med);
                  const recent = RecentlyUsedMedicines.getAll();
                  setRecentMedicines(recent.slice(0, 15));
                }}
              />
              
              {/* Voice-to-Text Button */}
              <VoiceToTextInput
                addMedicine={(med) => {
                  setMedications(prev => [...prev, med]);
                }}
                language={language}
                addToast={addToast}
              />
              
              {/* Compliance Tracker Button */}
              <ComplianceTracker
                prescriptionId={currentPrescriptionId}
                patientId={patient?.id}
                language={language}
                addToast={addToast}
                api={api}
              />
              
              {/* Drug Interaction Info */}
              <button
                onClick={() => setShowInteractionWarnings(!showInteractionWarnings)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium flex items-center gap-2"
                title={language === 'hi' ? 'दवा संपर्क जांच' : 'Drug interactions'}
              >
                ⚠️ {language === 'hi' ? 'संपर्क' : 'Interactions'}
              </button>
            </div>
            
            <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded">
              💊 Smart combos, voice input, dosage calculator, and interaction checker all ready!
            </div>
          </div>

          {/* Drug Interaction Warnings */}
          {showInteractionWarnings && medications.length >= 2 && (
            <DrugInteractionChecker
              medications={medications}
              drugInteractions={drugInteractions}
              language={language}
              addToast={addToast}
            />
          )}

          {/* Recently Used Sidebar */}
          {showRecentSidebar && recentMedicines.length > 0 && (
            <RecentlyUsedMedicinesSidebar
              recentMedicines={recentMedicines}
              addMedicine={(med) => {
                setMedications(prev => [...prev, med]);
              }}
              language={language}
              addToast={addToast}
            />
          )}

          {/* Dynamic Sections - Render based on pad configuration */}
          {renderDynamicSections()}

          {/* Smart Suggestions */}
          {showSmartSuggestions && (
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-blue-900">💡 Smart Suggestions</h4>
                <button
                  type="button"
                  onClick={() => setShowSmartSuggestions(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Debug Info */}
              <div className="mb-2 text-xs text-gray-600">
                Debug: {JSON.stringify({
                  medicines: smartSuggestions.medicines?.length || 0,
                  frequentlyUsed: smartSuggestions.frequentlyUsed?.length || 0,
                  diagnoses: smartSuggestions.diagnoses?.length || 0
                })}
              </div>

              {/* Frequently Used Medicines */}
              {smartSuggestions.frequentlyUsed.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">🔄 Frequently Used for This Patient</div>
                  <div className="flex flex-wrap gap-1">
                    {smartSuggestions.frequentlyUsed.slice(0, 5).map((med, idx) => (
                      <button
                        key={`freq-sugg-${idx}`}
                        type="button"
                        onMouseDown={() => addMed(med)}
                        className="px-2 py-1 bg-white border border-blue-200 rounded text-xs hover:bg-blue-50 transition"
                      >
                        {med.brand || med.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

            {/* Instruction Language Selector */}
            <div className="flex items-center gap-2 mb-3">
              <label htmlFor="instruction-language" className="text-sm font-medium text-gray-700">Instruction Language:</label>
              <select
                className="px-3 py-2 border rounded text-sm"
                id="instruction-language"
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                {instructionLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <input
                data-testid="medicine-input"
                className="w-full px-3 py-2 border rounded"
                placeholder="Start typing Medicines"
                value={medInput}
                onFocus={() => setMedDropdown(true)}
                onChange={(e) => {
                  setMedInput(e.target.value);
                  setMedDropdown(true);
                  setSnomedDrugPage(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && medInput.trim()) {
                    e.preventDefault();
                    addMed(medInput.trim());
                  }
                }}
                onBlur={() => setTimeout(() => setMedDropdown(false), 200)}
              />
              {medDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-80 overflow-y-auto">
                  {frequentlyPrescribedMeds.length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-blue-50 text-xs font-semibold text-blue-900 border-b">
                        FREQUENTLY prescribed by you
                      </div>
                      {frequentlyPrescribedMeds.filter(m =>
                        (m.name || '').toLowerCase().includes(medInput.toLowerCase()) ||
                        (m.brand || '').toLowerCase().includes(medInput.toLowerCase())
                      ).map((m, idx) => (
                        <button
                          key={`freq-${idx}-${m.name}`}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addMed(m)}
                        >
                          <div className="font-medium">{m.name || m.brand}</div>
                          <div className="text-xs text-slate-600">{m.composition || m.generic_name || ''}</div>
                        </button>
                      ))}
                    </>
                  )}
                  {filteredMeds.length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-green-50 text-xs font-semibold text-green-900 border-b">
                        MEDICINES ({filteredMeds.length} results)
                      </div>
                      {filteredMeds.map((m, idx) => (
                        <button
                          key={`sugg-${idx}-${m.name}`}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-green-50 border-b border-slate-100"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addMed(m)}
                        >
                          <div className="font-medium">{m.name || m.brand}</div>
                          <div className="text-xs text-slate-600">
                            {m.composition && <span>{m.composition}</span>}
                            {m.strength && <span> • {m.strength}</span>}
                            {m.dosage_form && <span> • {m.dosage_form}</span>}
                            {m.source && <span className="ml-1 px-1 py-0.5 bg-slate-100 rounded text-[10px]">{m.source}</span>}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  {snomedDrugResults.length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-purple-50 text-xs font-semibold text-purple-900 border-b flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <span>🔬 SNOMED CT Drug Database</span>
                          <span className="text-purple-600 font-normal">({snomedDrugResults.length} results)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" className="px-2 py-0.5 border rounded text-xs disabled:opacity-50" onClick={() => setSnomedDrugPage(p => Math.max(0, p - 1))} disabled={snomedDrugPage === 0}>Prev</button>
                          <span className="text-xs text-purple-700">Page {snomedDrugPage + 1}</span>
                          <button type="button" className="px-2 py-0.5 border rounded text-xs" onClick={() => setSnomedDrugPage(p => p + 1)}>Next</button>
                        </div>
                      </div>
                      {snomedDrugResults.map((drug, idx) => (
                        <button
                          key={`snomed-${idx}-${drug.conceptId}`}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-purple-50 border-b border-slate-100 last:border-0"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            // Convert SNOMED drug to medication format
                            const medData = {
                              name: drug.genericName || drug.drugName,
                              brand: drug.brandName || drug.drugName,
                              composition: drug.genericName || '',
                              strength: drug.strength || '',
                              dosageForm: drug.dosageForm || '',
                              snomedId: drug.conceptId,
                              available: true
                            };
                            addMed(medData);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-800">{drug.drugName || drug.brandName}</span>
                            {drug.dosageForm && (
                              <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{drug.dosageForm}</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            {drug.genericName && <span>{drug.genericName}</span>}
                            {drug.strength && <span> • {drug.strength}</span>}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  {frequentlyPrescribedMeds.length === 0 && filteredMeds.length === 0 && snomedDrugResults.length === 0 && medInput.length === 0 && (
                    <div className="px-3 py-3 text-sm text-slate-500 text-center">
                      Start typing to search medicines...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Smart Suggestions */}
            {showSmartSuggestions && (
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm text-blue-900">💡 Smart Suggestions</h4>
                  <button
                    type="button"
                    onClick={() => setShowSmartSuggestions(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Debug Info */}
                <div className="mb-2 text-xs text-gray-600">
                  Debug: {JSON.stringify({
                    medicines: smartSuggestions.medicines?.length || 0,
                    frequentlyUsed: smartSuggestions.frequentlyUsed?.length || 0,
                    diagnoses: smartSuggestions.diagnoses?.length || 0
                  })}
                </div>

                {/* Frequently Used Medicines */}
                {smartSuggestions.frequentlyUsed.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">🔄 Frequently Used for This Patient</div>
                    <div className="flex flex-wrap gap-1">
                      {smartSuggestions.frequentlyUsed.slice(0, 5).map((med, idx) => (
                        <button
                          key={`freq-sugg-${idx}`}
                          type="button"
                          onMouseDown={() => addMed(med)}
                          className="px-2 py-1 bg-white border border-blue-200 rounded text-xs hover:bg-blue-50 transition"
                        >
                          {med.brand || med.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diagnosis-based Medicines */}
                {smartSuggestions.medicines && smartSuggestions.medicines.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">🎯 Suggested Medicines</div>
                    <div className="flex flex-wrap gap-1">
                      {smartSuggestions.medicines.slice(0, 10).map((med, idx) => (
                        <button
                          key={`med-sugg-${idx}`}
                          type="button"
                          onMouseDown={() => addMed(med)}
                          className={`px-2 py-1 border rounded text-xs hover:opacity-80 transition ${
                            med.source === 'icd11' ? 'bg-purple-50 border-purple-200' :
                            med.source === 'icd10' ? 'bg-blue-50 border-blue-200' :
                            med.source === 'symptom' ? 'bg-green-50 border-green-200' :
                            med.source === 'dosage_reference' ? 'bg-yellow-50 border-yellow-200' :
                            med.source === 'snomed_medication' ? 'bg-pink-50 border-pink-200' :
                            'bg-white border-gray-200'
                          }`}
                          title={`${med.source} - ${med.evidence_level || 'No evidence level'}`}
                        >
                          {med.brand || med.name}
                          {med.evidence_level && (
                            <span className="ml-1 text-xs opacity-75">({med.evidence_level})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symptom-based Medicines */}
                {smartSuggestions.medicines && smartSuggestions.medicines.filter(m => m.original_symptom).length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">🔥 Based on Symptoms</div>
                    <div className="flex flex-wrap gap-1">
                      {smartSuggestions.medicines
                        .filter(m => m.original_symptom)
                        .slice(0, 8)
                        .map((med, idx) => (
                          <button
                            key={`sym-sugg-${idx}`}
                            type="button"
                            onMouseDown={() => addMed(med)}
                            className="px-2 py-1 bg-green-50 border border-green-200 rounded text-xs hover:bg-green-100 transition"
                            title={`For ${med.original_symptom}`}
                          >
                            {med.brand || med.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Injection Suggestions */}
                {smartSuggestions.injections && smartSuggestions.injections.length > 0 && (
                  <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-xs font-semibold text-orange-800 mb-2 flex items-center gap-1">
                      💉 Suggested Injections
                      <span className="text-[10px] font-normal text-orange-600">({smartSuggestions.injections.length} found)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {smartSuggestions.injections.slice(0, 8).map((inj, idx) => (
                        <button
                          key={`inj-sugg-${idx}`}
                          type="button"
                          onMouseDown={() => addMed({
                            name: inj.injection_name,
                            brand: inj.generic_name || inj.injection_name,
                            strength: inj.dose,
                            dose: inj.dose,
                            dosage_form: `${inj.route} Injection`,
                            route: inj.route,
                            frequency: inj.timing || 'As directed',
                            duration: 'As needed',
                            instructions: inj.instructions || '',
                            type: 'injection'
                          })}
                          className="px-2.5 py-1.5 bg-white border border-orange-300 rounded-md text-xs hover:bg-orange-100 hover:border-orange-400 transition shadow-sm"
                          title={`${inj.generic_name || ''} - ${inj.dose || ''}\n${inj.instructions || ''}`}
                        >
                          <span className="font-medium">{inj.injection_name}</span>
                          <span className="ml-1 text-orange-600">({inj.route})</span>
                          {inj.is_first_line === 1 && <span className="ml-1 text-green-600">★</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investigation Suggestions */}
                {smartSuggestions.investigations.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">🔬 Recommended Investigations</div>
                    <div className="flex flex-wrap gap-1">
                      {smartSuggestions.investigations.slice(0, 5).map((inv, idx) => (
                        <button
                          key={`inv-sugg-${idx}`}
                          type="button"
                          onClick={() => {
                            setProcedures(prev => [...prev, { name: inv.investigation_name, notes: '' }]);
                          }}
                          className="px-2 py-1 bg-white border border-purple-200 rounded text-xs hover:bg-purple-50 transition"
                        >
                          {inv.investigation_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Drug Interaction Warnings */}
            {showInteractionWarnings && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-red-900">⚠️ Drug Interactions</h4>
                  <button
                    type="button"
                    onClick={() => setShowInteractionWarnings(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                {drugInteractions.length > 0 && (
                  <div className="space-y-1">
                    {drugInteractions.map((interaction, idx) => (
                      <div key={`interaction-${idx}`} className="text-xs">
                        <span className="font-medium">{interaction.medicine1}</span> + 
                        <span className="font-medium"> {interaction.medicine2}</span>: 
                        <span className={`ml-1 px-1 py-0.5 rounded text-white ${
                          interaction.severity === 'high' ? 'bg-red-500' :
                          interaction.severity === 'moderate' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}>
                          {interaction.severity}
                        </span>
                        <div className="text-gray-600 mt-1">{interaction.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Auto-save Status */}
            {autoSaveStatus && (
              <div className="mt-2 text-xs text-green-600 text-center">
                {autoSaveStatus}
              </div>
            )}

            {/* Display Added Items (Medications) */}
            <div className="space-y-4">
              {/* Medications List */}
              {meds.filter(m => !m.type || m.type === 'medication').length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-3 text-blue-800 flex items-center gap-2">
                    💊 Medications
                    <span className="text-xs font-normal bg-blue-100 px-2 py-0.5 rounded-full">
                      {meds.filter(m => !m.type || m.type === 'medication').length} items
                    </span>
                  </h4>
                  <div className="bg-white border rounded overflow-x-auto">
                    <div className="grid grid-cols-7 min-w-[800px] bg-blue-100 text-xs font-semibold text-blue-800 px-3 py-2">
                      <span className="col-span-2">MEDICINE (Generic)</span>
                      <span>FREQUENCY</span>
                      <span>TIMING</span>
                      <span>DURATION</span>
                      <span>INSTRUCTIONS</span>
                      <span>QTY / ACTION</span>
                    </div>
                    {meds.filter(m => !m.type || m.type === 'medication').map((med, idx) => {
                      const actualIdx = meds.findIndex(m => m === med);
                      return (
                        <div key={idx} className="grid grid-cols-7 min-w-[800px] px-3 py-2 border-t text-sm hover:bg-blue-50 transition">
                          <div className="col-span-2">
                            <div className="font-medium text-gray-900">{med.brand || med.name}</div>
                            {med.composition && <div className="text-xs text-gray-500">{med.composition}</div>}
                          </div>
                          <input
                            className="px-2 py-1 border rounded text-xs"
                            value={med.frequency || ''}
                            onChange={(e) => {
                              const updated = [...meds];
                              updated[actualIdx].frequency = e.target.value;
                              setMeds(updated);
                            }}
                            placeholder="1-0-1"
                          />
                          <select
                            className="px-2 py-1 border rounded text-xs"
                            value={med.timing || ''}
                            onChange={(e) => {
                              const updated = [...meds];
                              updated[actualIdx].timing = e.target.value;
                              setMeds(updated);
                            }}
                          >
                            {(timingOptions[language] || timingOptions.en).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <input
                            className="px-2 py-1 border rounded text-xs"
                            value={med.duration || ''}
                            onChange={(e) => {
                              const updated = [...meds];
                              updated[actualIdx].duration = e.target.value;
                              setMeds(updated);
                            }}
                            placeholder="7 days"
                          />
                          <input
                            className="px-2 py-1 border rounded text-xs"
                            value={med.instructions || ''}
                            onChange={(e) => {
                              const updated = [...meds];
                              updated[actualIdx].instructions = e.target.value;
                              setMeds(updated);
                            }}
                            placeholder="After food"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              className="px-2 py-1 border rounded text-xs w-16"
                              type="number"
                              value={med.qty || ''}
                              onChange={(e) => {
                                const updated = [...meds];
                                updated[actualIdx].qty = e.target.value || '';
                                setMeds(updated);
                              }}
                            />
                            <button
                              onClick={() => removeMed(actualIdx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Injections List */}
              {meds.filter(m => m.type === 'injection').length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-3 text-orange-800 flex items-center gap-2">
                    💉 Injections / IVF
                    <span className="text-xs font-normal bg-orange-100 px-2 py-0.5 rounded-full">
                      {meds.filter(m => m.type === 'injection').length} items
                    </span>
                  </h4>
                  <div className="bg-white border rounded overflow-x-auto">
                    <div className="grid grid-cols-9 min-w-[950px] bg-orange-100 text-xs font-semibold text-orange-800 px-3 py-2">
                      <span className="col-span-2">INJECTION NAME</span>
                      <span>DOSE</span>
                      <span>ROUTE</span>
                      <span>INFUSION RATE</span>
                      <span>FREQUENCY</span>
                      <span>DURATION</span>
                      <span>INSTRUCTIONS</span>
                      <span className="text-center">ACTION</span>
                    </div>
                    {meds.filter(m => m.type === 'injection').map((inj, idx) => {
                      const actualIdx = meds.findIndex(m => m === inj);
                      return (
                        <div key={idx} className="grid grid-cols-9 min-w-[950px] px-3 py-2 border-t text-sm hover:bg-orange-50 transition">
                          <div className="col-span-2">
                            <div className="font-medium text-gray-900">{inj.brand || inj.name}</div>
                            {inj.composition && <div className="text-xs text-gray-500">{inj.composition}</div>}
                          </div>
                          <div className="text-xs text-gray-700">{inj.dosage || inj.dose || inj.strength || '-'}</div>
                          <div className="text-xs">
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{inj.route || inj.dosage_form || '-'}</span>
                          </div>
                          <div className="text-xs text-gray-600">{inj.infusion_rate || '-'}</div>
                          <div className="text-xs text-gray-700">{inj.frequency || '-'}</div>
                          <div className="text-xs text-gray-700">{inj.duration || '-'}</div>
                          <div className="text-xs text-gray-600 truncate" title={inj.instructions}>{translateInstruction(inj.instructions, language) || '-'}</div>
                          <div className="flex justify-center">
                            <button
                              onClick={() => removeMed(actualIdx)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                              title="Remove injection"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {meds.length === 0 && (
                <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <div className="text-gray-400 text-lg mb-2">💊 💉</div>
                  <div className="text-gray-500 text-sm">
                    No medications or injections added yet
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Search above or use smart suggestions to add items
                  </div>
                </div>
              )}
            </div>
          

          {/* Injections section removed (merged into medications list). */}

          {/* Lab Investigations - Now dynamically rendered based on pad configuration */}
          {/* <div className="bg-white border rounded shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Lab Investigations</h3>
              <button
                onClick={async () => {
                  try {
                    const res = await api.get(`/api/lab-investigations?patient=${patientId}`);
                    const investigations = res.data.investigations || [];

                    if (investigations.length === 0) {
                      addToast('No previous lab results found', 'info');
                      return;
                    }

                    setPreviousLabResults(investigations);
                    setShowLabResultsModal(true);
                  } catch (error) {
                    console.error('Error fetching previous lab results:', error);
                    addToast('Failed to load previous lab results', 'error');
                  }
                }}
                className="text-sm text-primary hover:underline"
              >
                View Previous Results
              </button>
            </div>

            <div className="flex gap-2 mb-2">
              <input
                data-testid="lab-input"
                type="text"
                value={labTestInput}
                onChange={(e) => setLabTestInput(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
                placeholder="Add lab test (e.g., CBC, Blood Sugar, etc.)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (labTestInput.trim()) {
                      setLabResults(prev => [...prev, {
                        test: labTestInput.trim(),
                        status: 'pending',
                        date: new Date().toISOString().split('T')[0]
                      }]);
                      setLabTestInput('');
                    }
                  }
                }}
              />
            </div>

            {labResults.length > 0 && (
              <div className="border rounded overflow-hidden">
                <div className="grid grid-cols-3 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                  <span>Test Name</span>
                  <span>Date</span>
                  <span>Action</span>
                </div>
                {labResults.map((lab, idx) => (
                  <div key={idx} className="grid grid-cols-3 px-3 py-2 border-t items-center text-sm">
                    <span>{lab.test}</span>
                    <span className="text-gray-600">{lab.date}</span>
                    <button
                      onClick={() => setLabResults(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advices - Now dynamically rendered based on pad configuration */}
          {/* <div className="bg-white border rounded shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{uiLabels[language]?.advice || 'Advices'}</h3>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={enableTranslations}
                    onChange={(e) => setEnableTranslations(e.target.checked)}
                  />
                  Enable Translations
                </label>
                {enableTranslations && (
                  <select
                    className="px-2 py-1 border rounded text-sm"
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="mr">Marathi</option>
                  </select>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(adviceTemplates.length > 0 ? adviceTemplates.map(t => t.text) : (predefinedAdvice[language] || predefinedAdvice.en)).map((adv) => (
                <label key={adv} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedAdvice.includes(adv)}
                    onChange={() => toggleAdvice(adv)}
                  />
                  {adv}
                </label>
              ))}
            </div>
            <div className="border rounded p-2">
              <div className="flex gap-2 mb-2 border-b pb-2">
                <button
                  type="button"
                  onClick={() => formatAdvice('bold')}
                  className="px-2 py-1 text-sm border rounded hover:bg-slate-50 font-bold"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => formatAdvice('italic')}
                  className="px-2 py-1 text-sm border rounded hover:bg-slate-50 italic"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => formatAdvice('insertUnorderedList')}
                  className="px-2 py-1 text-sm border rounded hover:bg-slate-50"
                  title="List"
                >
                  •
                </button>
              </div>
              <div
                ref={adviceEditorRef}
                contentEditable
                className="min-h-[100px] p-2 focus:outline-none"
                onInput={(e) => setAdvice(e.target.innerText)}
                suppressContentEditableWarning={true}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={printOnPrescription}
                onChange={(e) => setPrintOnPrescription(e.target.checked)}
              />
              {language === 'hi' ? 'प्रिस्क्रिप्शन पर प्रिंट करें' : language === 'mr' ? 'प्रिस्क्रिप्शनवर छापा' : 'Print on prescription'}
            </label>
          </div>

          {/* Follow Up - Now dynamically rendered based on pad configuration */}
          {/* <div className="bg-white border rounded shadow-sm p-4 space-y-3">
            <h3 className="font-semibold">{uiLabels[language]?.followUp || 'Follow Up'}</h3>
            <div className="flex gap-2 items-center">
              <input
                className="px-3 py-2 border rounded"
                placeholder={language === 'hi' ? 'दिन' : language === 'mr' ? 'दिवस' : 'Days'}
                type="number"
                value={followUp.days}
                onChange={(e) => handleFollowUpDaysChange(e.target.value)}
              />
              <input
                className="px-3 py-2 border rounded"
                type="date"
                value={followUp.date}
                onChange={(e) => setFollowUp({ ...followUp, date: e.target.value })}
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={followUp.autoFill}
                  onChange={(e) => setFollowUp({ ...followUp, autoFill: e.target.checked })}
                />
                {language === 'hi' ? 'Rx से ऑटो फिल' : language === 'mr' ? 'Rx वरून ऑटो भरा' : 'Auto Fill from Rx'}
              </label>
            </div>
            <textarea
              className="w-full px-3 py-2 border rounded"
              rows={2}
              placeholder={language === 'hi' ? 'नोट्स' : language === 'mr' ? 'टिपा' : 'Notes'}
            />
          </div> */}

          {/* Notes - Now dynamically rendered based on pad configuration */}
          {/* <div className="bg-white border rounded shadow-sm p-4 space-y-3">
            <h3 className="font-semibold">{language === 'hi' ? 'नोट्स' : language === 'mr' ? 'टिपा' : 'Notes'}</h3>
            <div>
              <label className="block text-sm font-medium mb-1">{uiLabels[language]?.patientNotes || 'Patient Notes'}</label>
              <textarea
                className="w-full px-3 py-2 border rounded"
                rows={3}
                placeholder={language === 'hi' ? 'रोगी को दिखने वाले नोट्स' : language === 'mr' ? 'रुग्यांना दिसणारे नोट्स' : 'Notes visible to patient'}
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {(uiLabels[language]?.privateNotes || 'PRIVATE NOTES').toUpperCase()}
                <span className="text-xs text-slate-500 ml-2">(These will not be printed)</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded"
                rows={3}
                placeholder={language === 'hi' ? 'डॉक्टर के लिए निजी नोट्स' : language === 'mr' ? 'डॉक्टरसाठी खाजगी नोट्स' : 'Private notes for doctor'}
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
              />
            </div>
          </div> */}

          {/* Bottom Action Bar */}
          <div className="bg-white border rounded shadow-sm p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-3">
              <button
                className="px-3 py-2 text-sm border rounded hover:bg-slate-50"
                onClick={handleClear}
              >
                Clear
              </button>
              <button 
                className="px-3 py-2 text-sm border rounded hover:bg-slate-50"
                onClick={() => addToast('Print settings dialog would open here', 'info')}
              >
                Print Settings
              </button>
              <select
                className="px-3 py-2 text-sm border rounded"
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
              </select>
              <select
                className="px-3 py-2 text-sm border rounded bg-blue-50"
                value={selectedTemplateId || ''}
                onChange={(e) => {
                  const templateId = e.target.value ? parseInt(e.target.value) : null;
                  setSelectedTemplateId(templateId);
                  const template = receiptTemplates.find(t => t.id === templateId);
                  setSelectedTemplate(template || null);
                }}
                title="Select Letterhead Template"
              >
                <option value="">Default Letterhead</option>
                {receiptTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.template_name} {template.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
              <button 
                className="px-3 py-2 text-sm border rounded hover:bg-slate-50"
                onClick={() => addToast('Updates pushed to patient', 'success')}
              >
                Push Updates
              </button>
              <button
                className="px-3 py-2 text-sm border rounded hover:bg-slate-50"
                onClick={handlePrint}
              >
                Preview
              </button>
              <label className="flex items-center gap-1 text-sm px-3 py-2 border rounded">
                <input
                  type="checkbox"
                  checked={monetizeRx}
                  onChange={(e) => setMonetizeRx(e.target.checked)}
                />
                Monetize Rx
              </label>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-start md:justify-end">
              {/* Repeat Prescription Button */}
              {patient && patientId && (
                <Suspense fallback={<div className="px-4 py-2 border rounded text-sm">Loading...</div>}>
                  <RepeatPrescriptionButton
                    patientId={patientId}
                    onRepeatSuccess={handleRepeatSuccess}
                  />
                </Suspense>
              )}

              {/* Specialty Modules Button */}
              <button
                onClick={() => setShowSpecialtySelector(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                title="Access specialty-specific assessment modules"
              >
                <FiSettings />
                <span className="hidden sm:inline">Specialty Modules</span>
                <span className="sm:hidden">Modules</span>
              </button>

              <button
                data-testid="save-btn"
                className="px-3 py-2 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Prescription'}
              </button>
              <button
                className="flex items-center gap-1 px-3 py-2 text-sm border rounded hover:bg-blue-50 text-blue-700 hover:border-blue-300"
                onClick={() => setShowTemplateModal(true)}
                title="Save current prescription as a template"
              >
                <FiBookmark />
                <span className="hidden sm:inline">Save as Template</span>
                <span className="sm:hidden">Template</span>
              </button>
              {currentPrescriptionId && (
                <button
                  className="flex items-center gap-1 px-3 py-2 text-sm border rounded hover:bg-green-50 text-green-700 hover:border-green-300"
                  onClick={() => downloadPrescriptionPDF(currentPrescriptionId)}
                  title="Download prescription as PDF"
                >
                  <FiDownload className="w-4 h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>
              )}
              <button
                className="px-3 py-2 text-sm border rounded hover:bg-slate-50"
                onClick={() => addToast('Order medicines feature coming soon', 'info')}
              >
                <span className="hidden sm:inline">Order Medicines</span>
                <span className="sm:hidden">Order</span>
              </button>

              {/* Print Format Selector */}
              <div className="flex items-center gap-2 px-3 py-1 border rounded bg-gray-50">
                <span className="text-xs font-medium text-gray-700 hidden sm:inline">Print:</span>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="radio"
                    value="A4"
                    checked={printFormat === 'A4'}
                    onChange={(e) => setPrintFormat(e.target.value)}
                    className="cursor-pointer"
                  />
                  <span>A4</span>
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="radio"
                    value="A5"
                    checked={printFormat === 'A5'}
                    onChange={(e) => setPrintFormat(e.target.value)}
                    className="cursor-pointer"
                  />
                  <span>A5</span>
                </label>
              </div>

              <button
                className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50"
                onClick={handlePrint}
              >
                Print
              </button>
              <button
                className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] font-medium shadow-sm hover:shadow-md transition-all duration-200 order-first md:order-last"
                onClick={handleFinish}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Send Rx & End Visit'}
              </button>
            </div>
          </div>

        </div>

        {/* Right Sidebar - Past Visits */}
        <aside className="space-y-4">
          <div className="bg-white border rounded shadow-sm p-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-3 border-b pb-2">
              <button
                onClick={() => setPastVisitsTab('past')}
                className={`px-2 py-1 text-xs border rounded ${
                  pastVisitsTab === 'past' ? 'bg-primary text-white' : 'hover:bg-slate-50'
                }`}
                title="Past Visits"
              >
                P
              </button>
              <button
                onClick={() => setPastVisitsTab('history')}
                className={`px-2 py-1 text-xs border rounded ${
                  pastVisitsTab === 'history' ? 'bg-primary text-white' : 'hover:bg-slate-50'
                }`}
                title="History"
              >
                H
              </button>
              <button
                onClick={() => setPastVisitsTab('vitals')}
                className={`px-2 py-1 text-xs border rounded ${
                  pastVisitsTab === 'vitals' ? 'bg-primary text-white' : 'hover:bg-slate-50'
                }`}
                title="Vitals"
              >
                V
              </button>
              <button
                onClick={() => setPastVisitsTab('records')}
                className={`px-2 py-1 text-xs border rounded relative ${
                  pastVisitsTab === 'records' ? 'bg-primary text-white' : 'hover:bg-slate-50'
                }`}
                title="Records"
              >
                R
                {pastRecords.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">
                    {pastRecords.length > 9 ? '9+' : pastRecords.length}
                  </span>
                )}
              </button>
            </div>

            {/* See all link */}
            <div className="text-xs text-slate-600 mb-3">
              <Link to={`/patient-overview/${patientId}`} className="text-primary hover:underline">
                See all Past Visits {pastVisits.length > 0 && `[${pastVisits.length}]`}
              </Link>
            </div>

            {/* Tab Content */}
            {loadingPastData ? (
              <div className="text-xs text-slate-500 text-center py-4">Loading...</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {pastVisitsTab === 'past' && (
                  <>
                    {pastPrescriptions.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-4">No past visits</div>
                    ) : (
                      pastPrescriptions.slice(0, 5).map((visit, idx) => (
                        <div key={`past-${idx}`} className="border rounded p-2 space-y-2">
                          <div className="text-xs font-semibold text-slate-700">
                            {new Date(visit.prescribed_date || visit.created_at).toLocaleDateString()}
                          </div>
                          {visit.medications && visit.medications.length > 0 && (
                            <div className="space-y-1">
                              {visit.medications.slice(0, 2).map((med, mIdx) => (
                                <div key={`med-${mIdx}`} className="flex items-center gap-1 text-xs">
                                  <span className="w-4 h-4 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-[10px]">Mx</span>
                                  <span className="truncate">{med.medication_name || med.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {visit.diagnosis && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px]">Dx</span>
                              <span className="truncate">{visit.diagnosis}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </>
                )}

                {pastVisitsTab === 'history' && (
                  <>
                    {pastVisits.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-4">No history available</div>
                    ) : (
                      pastVisits.slice(0, 5).map((visit, idx) => (
                        <div key={`history-${idx}`} className="border rounded p-2 space-y-1">
                          <div className="text-xs font-semibold">
                            {new Date(visit.appointment_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-600">{visit.reason_for_visit || 'No reason specified'}</div>
                          {visit.notes && (
                            <div className="text-xs text-slate-500 italic">{visit.notes}</div>
                          )}
                        </div>
                      ))
                    )}
                  </>
                )}

                {pastVisitsTab === 'vitals' && (
                  <>
                    {pastVitals.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-4">No vitals recorded</div>
                    ) : (
                      pastVitals.slice(0, 5).map((vital, idx) => (
                        <div key={`vital-${idx}`} className="border rounded p-2 space-y-1">
                          <div className="text-xs font-semibold">
                            {vital.date ? new Date(vital.date).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="text-xs text-slate-600">
                            {vital.value || 'No vitals data'}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {pastVisitsTab === 'records' && (
                  <>
                    {pastRecords.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-4">No records available</div>
                    ) : (
                      pastRecords.slice(0, 5).map((record, idx) => (
                        <div key={`record-${idx}`} className="border rounded p-2 space-y-1">
                          <div className="text-xs font-semibold">{record.record_title || record.record_type}</div>
                          <div className="text-xs text-slate-600">
                            {new Date(record.uploaded_date || record.created_at).toLocaleDateString()}
                          </div>
                          {record.description && (
                            <div className="text-xs text-slate-500 truncate">{record.description}</div>
                          )}
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </aside>
      </section>

      {/* Hidden printable region containing the Letterhead wrapper */}
      <div className="hidden print:block">
        <div ref={printRef}>
          {printFormat === 'A4' ? (
            <Suspense fallback={<div>Loading letterhead...</div>}>
              <Letterhead template={selectedTemplate}>
                <div>
                {patient && (
                <div style={{ marginBottom: 16, fontSize: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{patient.name}</div>
                  <div style={{ color: '#444' }}>
                    {`${patient.gender || ''} • ${patient.dob ? `${new Date(patient.dob).toLocaleDateString()} (${calculateAge(patient.dob)} yrs)` : ''} • UHID: ${patient.patient_id || ''} • ${patient.phone || ''}`}
                  </div>
                  <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                    📅 {new Date(meta.prescription_date).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })} • 🕐 {meta.prescription_time}
                  </div>
                </div>
              )}

              {(vitals.temp || vitals.height || vitals.bmi || vitals.weight || vitals.pulse) && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Vitals</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
                    {vitals.temp && <div>Temp: {vitals.temp}</div>}
                    {vitals.height && <div>Height: {vitals.height}</div>}
                    {vitals.bmi && <div>BMI: {vitals.bmi}</div>}
                    {vitals.weight && <div>Weight: {vitals.weight}</div>}
                    {vitals.pulse && <div>Pulse: {vitals.pulse}</div>}
                    {vitals.blood_pressure && <div>BP: {vitals.blood_pressure}</div>}
                    {vitals.spo2 && <div>SpO2: {vitals.spo2}%</div>}
                  </div>
                </div>
              )}

              {symptoms.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Symptoms</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                    {symptoms.map((s, i) => (<li key={`print-sx-${i}`}>{s}</li>))}
                  </ul>
                </div>
              )}

              {diagnoses.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Diagnosis</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                    {diagnoses.map((d, i) => (<li key={`print-dx-${i}`}>{d}</li>))}
                  </ul>
                </div>
              )}

              {meds.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Medications</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 4px' }}>Medicine</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 4px' }}>Frequency</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 4px' }}>Timing</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 4px' }}>Duration</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 4px' }}>Instructions</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 4px' }}>Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meds.map((m, idx) => (
                        <tr key={`print-med-${idx}`}>
                          <td style={{ borderBottom: '1px solid #eee', padding: '6px 4px' }}>
                            <div style={{ fontWeight: 600 }}>{m.brand || m.name}</div>
                            {m.composition && <div style={{ color: '#666', fontSize: 11 }}>{m.composition}</div>}
                          </td>
                          <td style={{ borderBottom: '1px solid #eee', padding: '6px 4px' }}>{m.frequency}</td>
                          <td style={{ borderBottom: '1px solid #eee', padding: '6px 4px' }}>{translateTiming(m.timing, language)}</td>
                          <td style={{ borderBottom: '1px solid #eee', padding: '6px 4px' }}>{m.duration}</td>
                          <td style={{ borderBottom: '1px solid #eee', padding: '6px 4px' }}>{translateInstruction(m.instructions, language)}</td>
                          <td style={{ borderBottom: '1px solid #eee', padding: '6px 4px' }}>{m.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(advice || selectedAdvice.length > 0) && printOnPrescription && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Advice</div>
                  {advice && (
                    <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{advice}</div>
                  )}
                  {selectedAdvice.length > 0 && (
                    <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 16, fontSize: 13 }}>
                      {selectedAdvice.map((a, i) => (<li key={`print-adv-${i}`}>{a}</li>))}
                    </ul>
                  )}
                </div>
              )}

              {(followUp.days || followUp.date) && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Follow Up</div>
                  <div style={{ fontSize: 13 }}>
                    {followUp.days && <>In {followUp.days} day(s){followUp.date ? ', ' : ''}</>}
                    {followUp.date && <>on {new Date(followUp.date).toLocaleDateString()}</>}
                  </div>
                </div>
              )}
            </div>
          </Letterhead>
            </Suspense>
          ) : (
            <Suspense fallback={<div>Loading compact format...</div>}>
              <PrescriptionA5Format
              prescriptionData={{
                date: meta.prescription_date,
                prescription_id: meta.prescription_id,
                vitals: vitals,
                symptoms: symptoms,
                diagnosis: diagnoses,
                medications: meds,
                advice: advice,
                selectedAdvice: selectedAdvice
              }}
              patientData={{
                name: patient?.name,
                age: patient?.dob ? calculateAge(patient.dob) : 'N/A',
                gender: patient?.gender,
                phone: patient?.phone,
                patient_id: patient?.patient_id
              }}
              doctorData={{
                name: user?.name || 'Dr. Name',
                specialization: user?.specialization || ''
              }}
              clinicData={{
                name: 'Clinic Name',
                address: 'Clinic Address',
                phone: 'Clinic Phone'
              }}
            />
            </Suspense>
          )}
        </div>
      </div>

      {/* Specialty Selector Modal */}
      {showSpecialtySelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
              <Suspense fallback={<div className="p-6">Loading module...</div>}>
                <SpecialtySelector
                  patientData={{
                    age: patient?.dob ? calculateAge(patient.dob) : null,
                    weight: vitals.weight,
                    height: vitals.height,
                    ...patient
                  }}
                  onDataChange={handleSpecialtyDataChange}
                  onClose={() => setShowSpecialtySelector(false)}
                />
              </Suspense>
          </div>
        </div>
      )}

      {/* Lab Results Modal */}
      {showLabResultsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Previous Lab Results</h2>
              <button
                onClick={() => setShowLabResultsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              {previousLabResults.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No previous lab results found</p>
              ) : (
                <div className="space-y-4">
                  {previousLabResults.map((result, idx) => (
                    <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{result.test_name || result.test}</h3>
                          <p className="text-sm text-gray-600">
                            Date: {new Date(result.date || result.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          result.status === 'completed' ? 'bg-green-100 text-green-800' :
                          result.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.status || 'Pending'}
                        </span>
                      </div>
                      {result.result && (
                        <div className="mt-2 p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium text-gray-700">Result:</p>
                          <p className="text-sm mt-1">{result.result}</p>
                        </div>
                      )}
                      {result.notes && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">{result.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowLabResultsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Symptoms Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Select Symptoms Template</h2>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {symptomsTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No templates available. Create templates in Settings.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {symptomsTemplates.map((template) => {
                    const templateSymptoms = Array.isArray(template.symptoms)
                      ? template.symptoms
                      : JSON.parse(template.symptoms || '[]');

                    return (
                      <div
                        key={template.id}
                        onClick={() => applySymptomTemplate(template)}
                        className="border rounded-lg p-3 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{template.name}</h3>
                            {template.category && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                {template.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {template.description && (
                          <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {templateSymptoms.slice(0, 4).map((symptom, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {symptom}
                            </span>
                          ))}
                          {templateSymptoms.length > 4 && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                              +{templateSymptoms.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnosis Template Selector Modal */}
      {showDiagnosisTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Select Diagnosis Template</h2>
              <button
                onClick={() => setShowDiagnosisTemplateSelector(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {diagnosisTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No templates available. Create templates in Settings.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {diagnosisTemplates.map((template) => {
                    const templateDiagnoses = Array.isArray(template.diagnoses)
                      ? template.diagnoses
                      : JSON.parse(template.diagnoses || '[]');

                    return (
                      <div
                        key={template.id}
                        onClick={() => applyDiagnosisTemplate(template)}
                        className="border rounded-lg p-3 hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{template.name}</h3>
                            {template.category && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                                {template.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {template.description && (
                          <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {templateDiagnoses.slice(0, 4).map((diagnosis, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {diagnosis}
                            </span>
                          ))}
                          {templateDiagnoses.length > 4 && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                              +{templateDiagnoses.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowDiagnosisTemplateSelector(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medications Template Selector Modal */}
      {showMedicationsTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Select Medications Template</h2>
              <button
                onClick={() => setShowMedicationsTemplateSelector(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {medicationsTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No templates available. Create templates in Settings.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {medicationsTemplates.map((template) => {
                    const templateMeds = Array.isArray(template.medications)
                      ? template.medications
                      : JSON.parse(template.medications || '[]');

                    return (
                      <div
                        key={template.id}
                        onClick={() => applyMedicationsTemplate(template)}
                        className="border rounded-lg p-3 hover:border-pink-500 hover:bg-pink-50 cursor-pointer transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{template.name}</h3>
                            {template.category && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-pink-100 text-pink-800 rounded">
                                {template.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {template.description && (
                          <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                        )}

                        <div className="space-y-1">
                          {templateMeds.slice(0, 3).map((med, idx) => (
                            <div key={idx} className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">
                              <div className="font-medium">{med.brand || med.brand_name || med.name || med.medication_name}</div>
                              {(med.frequency || med.duration) && (
                                <div className="text-gray-600">
                                  {med.frequency} {med.duration && `• ${med.duration}`}
                                </div>
                              )}
                            </div>
                          ))}
                          {templateMeds.length > 3 && (
                            <div className="text-xs text-gray-600 text-center py-1">
                              +{templateMeds.length - 3} more medications
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowMedicationsTemplateSelector(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medication Suggestion Modal */}
      {showMedicationSuggestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">💊 Suggested Medications</h3>
              <button
                onClick={() => {
                  setShowMedicationSuggestionModal(false);
                  setPendingMedicationSuggestions([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600">
                Select medications you want to add to the prescription. Duplicates have been filtered out.
              </p>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {pendingMedicationSuggestions.map((med, idx) => (
                  <label key={`med-${idx}-${med.name}`} className="flex items-start gap-3 p-3 border rounded hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="mt-1"
                      id={`med-check-${idx}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{med.brand || med.name}</div>
                      <div className="text-sm text-gray-600">{med.strength} {med.dosage_form}</div>
                      {med.frequency && (
                        <div className="text-xs text-gray-500 mt-1">
                          Frequency: {med.frequency}
                        </div>
                      )}
                      {med.duration && (
                        <div className="text-xs text-gray-500">
                          Duration: {med.duration}
                        </div>
                      )}
                      {med.instructions && (
                        <div className="text-xs text-blue-600 mt-1 font-medium">
                          💡 {med.instructions}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {pendingMedicationSuggestions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No medications to suggest
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowMedicationSuggestionModal(false);
                  setPendingMedicationSuggestions([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  // Get all checked medications
                  const selectedMeds = [];
                  pendingMedicationSuggestions.forEach((med, idx) => {
                    const checkbox = document.getElementById(`med-check-${idx}`);
                    if (checkbox && checkbox.checked) {
                      selectedMeds.push(med);
                    }
                  });
                  handleAcceptMedicationSuggestions(selectedMeds);
                }}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 font-medium"
              >
                Add Selected ({pendingMedicationSuggestions.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save as Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Save as Template</h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., Asthma Management"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Name *
                </label>
                <input
                  type="text"
                  value={templateShortName}
                  onChange={(e) => setTemplateShortName(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., Asthma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., Respiratory, Cardiac"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="bg-gray-50 p-3 rounded text-xs">
                <p className="font-medium mb-1">📋 Template will save with:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• <span className="font-medium">{meds.length}</span> medicines</li>
                  <li>• <span className="font-medium">{symptoms.length}</span> symptoms</li>
                  <li>• <span className="font-medium">{diagnoses.length}</span> diagnoses</li>
                  <li>• Advice & precautions</li>
                  <li>• Follow-up: {followUp.days || 'Not set'} days</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveAsTemplate}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 font-medium"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}