import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { FiDownload } from 'react-icons/fi';
import HeaderBar from '../components/HeaderBar';
import Modal from '../components/Modal';
import { useApiClient } from '../api/client';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { openWhatsApp, generateBillMessage } from '../utils/whatsapp';
import { downloadBillingPDF } from '../services/pdfService';
import { pickArray } from '../utils/apiResponse';

// Helper function to safely format numbers
const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return num.toFixed(2);
};

export default function Receipts() {
  const api = useApiClient();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState({ name: '', uhid: '', phone: '' });
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // NEW: Clinic settings state
  const [clinicSettings, setClinicSettings] = useState(null);
  const [receiptTemplates, setReceiptTemplates] = useState([]);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewingTemplate, setPreviewingTemplate] = useState(null);
  // Service templates fallback for quick add
  const [serviceTemplates, setServiceTemplates] = useState([
    { label: 'Consultation', service_name: 'Consultation', qty: 1, unit_price: 500 },
    { label: 'Injection', service_name: 'Injection', qty: 1, unit_price: 150 },
    { label: 'Lab Test', service_name: 'Lab Test', qty: 1, unit_price: 800 }
  ]);

  // Print ref for react-to-print
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Receipt'
  });

  // Create receipt form state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [receiptForm, setReceiptForm] = useState({
    patient_id: '',
    template_id: '',
    services: [{ service_name: '', qty: 1, unit_price: 0, discount: 0, total: 0 }],
    tax: 0,
    discount: 0,
    additional_discount: 0,
    payment_method: 'cash',
    payment_id: '',
    notes: '',
    remarks: ''
  });

  // NEW: Fetch clinic settings
  const fetchClinicSettings = useCallback(async () => {
    try {
      const res = await api.get('/api/bills/clinic-settings');
      if (res.data.success && res.data.clinic) {
        setClinicSettings(res.data.clinic);
      }
    } catch (error) {
      console.error('Failed to fetch clinic settings:', error);
    }
  }, [api]);

  // Handle individual receipt selection
  const handleSelectReceipt = (receiptId) => {
    setSelectedReceipts(prev => 
      prev.includes(receiptId) 
        ? prev.filter(id => id !== receiptId)
        : [...prev, receiptId]
    );
  };

  // Handle select all receipts
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedReceipts([]);
    } else {
      setSelectedReceipts(receipts.map(r => r.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedReceipts.length === 0) {
      addToast('No receipts selected', 'warning');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedReceipts.length} receipt(s)?`)) {
      return;
    }

    try {
      // Delete all selected receipts
      await Promise.all(
        selectedReceipts.map(id => api.delete(`/api/bills/${id}`))
      );
      
      addToast(`Successfully deleted ${selectedReceipts.length} receipt(s)`, 'success');
      setSelectedReceipts([]);
      setSelectAll(false);
      fetchReceipts();
    } catch (error) {
      console.error('Failed to delete receipts:', error);
      addToast('Failed to delete some receipts', 'error');
    }
  };

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/bills');
      setReceipts(pickArray(res, ['data.bills', 'bills']));
      // Reset selection when receipts change
      setSelectedReceipts([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/api/patients?limit=100');
      setPatients(res.data?.data?.patients || res.data?.patients || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  }, [api]);

  const searchPatientsForReceipt = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setPatientSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/api/patients?search=${query}&limit=10`);
      setPatientSearchResults(res.data?.data?.patients || res.data?.patients || []);
    } catch (error) {
      console.error('Failed to search patients:', error);
    }
  }, [api]);

  const fetchReceiptTemplates = useCallback(async () => {
    try {
      const res = await api.get('/api/receipt-templates');
      setReceiptTemplates(res.data.templates || []);
    } catch (error) {
      console.error('Failed to fetch receipt templates:', error);
    }
  }, [api]);

  const fetchServices = useCallback(async () => {
    try {
      // Get clinic_id from user context or use default
      const clinicId = JSON.parse(localStorage.getItem('user'))?.clinic_id || 2;
      const res = await api.get(`/api/services?clinic_id=${clinicId}`);
      const services = res.data.services || res.data || [];
      
      if (services.length > 0) {
        // Map services to template format
        const mappedServices = services.map(service => ({
          label: service.name,
          service_name: service.name,
          qty: 1,
          unit_price: parseFloat(service.price) || 0
        }));
        setServiceTemplates(mappedServices);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      // Keep fallback services if API fails
    }
  }, [api]);

  // Fetch all data on mount
  useEffect(() => {
    fetchClinicSettings();
    fetchReceipts();
    fetchPatients();
    fetchReceiptTemplates();
    fetchServices();
  }, [fetchClinicSettings, fetchReceipts, fetchPatients, fetchReceiptTemplates, fetchServices, searchParams]);

  // Handle URL parameters (edit mode, quick create, etc.)
  useEffect(() => {
    const quick = searchParams.get('quick');
    const full = searchParams.get('full');
    const patientId = searchParams.get('patient');
    const amount = searchParams.get('amount');
    const receiptId = searchParams.get('receipt'); // Check for specific receipt ID
    const edit = searchParams.get('edit');
    const billId = searchParams.get('billId');

    console.log('Receipt URL Params:', { quick, full, patientId, amount, receiptId, edit, billId });

    // Handle edit mode
    if (edit === 'true' && billId) {
      console.log('Opening edit modal for bill:', billId);
      // ALWAYS fetch the full bill detail for editing to ensure service_items are loaded
      const fetchBillForEdit = async () => {
        try {
          const detail = await api.get(`/api/bills/${billId}`);
          const bill = detail.data?.bill || detail.data?.data?.bill || detail.data;
          if (bill) {
            // Ensure service_items are properly formatted
            if (!bill.service_items && bill.items) {
              bill.service_items = bill.items;
            }
            // If still no items, create an empty array
            if (!bill.service_items) {
              bill.service_items = [];
            }
            // Ensure all service items have unit_price field
            if (bill.service_items && Array.isArray(bill.service_items)) {
              bill.service_items = bill.service_items.map(item => ({
                ...item,
                unit_price: item.unit_price ?? item.amount ?? 0,
                quantity: item.quantity ?? item.qty ?? 1
              }));
            }
            setEditingReceipt(bill);
            setShowEditModal(true);
          }
        } catch (error) {
          console.error('Failed to fetch bill for edit:', error);
          // Try to find in list as fallback
          const receiptToEdit = receipts.find(r => r.id == billId);
          if (receiptToEdit) {
            setEditingReceipt(receiptToEdit);
            setShowEditModal(true);
          }
        }
      };
      fetchBillForEdit();
    }

    // Only show create modal if we have valid quick/full parameters with patient
    if (((quick || full) && patientId) && !receiptId && !edit) {
      const parsedAmount = parseFloat(amount) || 0;
      console.log('Opening create modal for patient:', patientId);

      setReceiptForm(prev => ({
        ...prev,
        patient_id: patientId,
        services: [{
          service: full ? 'Consultation' : 'Quick Payment',
          qty: 1,
          amount: parsedAmount,
          discount: 0,
          total: parsedAmount
        }]
      }));

      // Use setTimeout to ensure state updates after patients are loaded
      setTimeout(() => {
        setShowCreateModal(true);
      }, 100);
    }
    
    // Show specific receipt if receiptId is provided
    if (receiptId) {
      console.log('Loading specific receipt:', receiptId);
      // Find and show the specific receipt
      const receipt = receipts.find(r => r.id === parseInt(receiptId));
      if (receipt) {
        setSelectedReceipt(receipt);
        setShowSuccessModal(true);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (showViewAllModal) {
      fetchReceipts();
    }
  }, [showViewAllModal, fetchReceipts]);

  // Auto-select default template when creating new receipt
  useEffect(() => {
    if (receiptTemplates.length > 0 && showCreateModal && !receiptForm.template_id) {
      const defaultTemplate = receiptTemplates.find(t => t.is_default);
      if (defaultTemplate) {
        handleTemplateSelect(defaultTemplate.id.toString());
      }
    }
  }, [receiptTemplates, showCreateModal]);

  // NEW: Helper function to get clinic info from receipt or settings
  const getClinicInfo = (receipt = null) => {
    // Priority: receipt data > clinic settings > defaults
    if (receipt && receipt.clinic_name) {
      return {
        name: receipt.clinic_name,
        address: receipt.clinic_address,
        city: receipt.clinic_city,
        state: receipt.clinic_state,
        pincode: receipt.clinic_pincode,
        phone: receipt.clinic_phone,
        email: receipt.clinic_email,
        logo: receipt.clinic_logo
      };
    }
    
    if (clinicSettings) {
      return {
        name: clinicSettings.name,
        address: clinicSettings.address,
        city: clinicSettings.city,
        state: clinicSettings.state,
        pincode: clinicSettings.pincode,
        phone: clinicSettings.phone,
        email: clinicSettings.email,
        logo: clinicSettings.logo_url
      };
    }
    
    // Default fallback
    return {
      name: 'Healthcare Clinic',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      logo: null
    };
  };

  // NEW: Format full address
  const formatAddress = (clinic) => {
    const parts = [clinic.address, clinic.city, clinic.state, clinic.pincode].filter(Boolean);
    return parts.join(', ');
  };

  // Template selection handler
  const handleTemplateSelect = (templateId) => {
    const selectedTemplate = receiptTemplates.find(t => t.id === parseInt(templateId));

    if (selectedTemplate) {
      setReceiptForm({
        ...receiptForm,
        template_id: templateId,
        notes: selectedTemplate.footer_content || '',
        remarks: selectedTemplate.header_content || ''
      });
      console.log('Template selected:', selectedTemplate.template_name);
    } else {
      // Clear template
      setReceiptForm({
        ...receiptForm,
        template_id: '',
        notes: '',
        remarks: ''
      });
    }
  };

  // Template preview handler
  const handleTemplatePreview = (templateId) => {
    const template = receiptTemplates.find(t => t.id === parseInt(templateId));
    if (template) {
      setPreviewingTemplate(template);
      setShowTemplatePreview(true);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.name) params.append('name', search.name);
      if (search.uhid) params.append('uhid', search.uhid);
      if (search.phone) params.append('phone', search.phone);

      const res = await api.get(`/api/bills?${params}`);
      setReceipts(pickArray(res, ['data.bills', 'bills']));
    } catch (error) {
      console.error('Failed to search receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = receiptForm.services.reduce((sum, service) => sum + (parseFloat(service.total) || 0), 0);
    const taxAmount = (subtotal * parseFloat(receiptForm.tax || 0)) / 100;
    const total = subtotal + taxAmount - parseFloat(receiptForm.discount || 0) - parseFloat(receiptForm.additional_discount || 0);
    return { subtotal, taxAmount, total };
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...receiptForm.services];
    updatedServices[index][field] = value;

    if (field === 'qty' || field === 'unit_price' || field === 'discount') {
      const qty = parseFloat(updatedServices[index].qty) || 1;
      const unit_price = parseFloat(updatedServices[index].unit_price) || 0;
      const discount = parseFloat(updatedServices[index].discount) || 0;
      updatedServices[index].total = (qty * unit_price) - discount;
    }

    setReceiptForm({ ...receiptForm, services: updatedServices });
  };

  const addService = () => {
    setReceiptForm({
      ...receiptForm,
      services: [...receiptForm.services, { service_name: '', qty: 1, unit_price: 0, discount: 0, total: 0 }]
    });
  };

  const removeService = (index) => {
    if (receiptForm.services.length > 1) {
      const updatedServices = receiptForm.services.filter((_, i) => i !== index);
      setReceiptForm({ ...receiptForm, services: updatedServices });
    }
  };

  const resetForm = () => {
    setReceiptForm({
      patient_id: '',
      template_id: '',
      services: [{ service_name: '', qty: 1, unit_price: 0, discount: 0, total: 0 }],
      tax: 0,
      discount: 0,
      additional_discount: 0,
      payment_method: 'cash',
      payment_id: '',
      notes: '',
      remarks: ''
    });
  };

  const handleCreateReceipt = async () => {
    if (!receiptForm.patient_id) {
      addToast('Please select a patient', 'error');
      return;
    }

    let receiptData = null; // Declare outside try block

    try {
      const { subtotal, taxAmount, total } = calculateTotals();

      receiptData = {
        patient_id: receiptForm.patient_id,
        // IMPORTANT: preserve appointment context if the user came from Queue/Prescription flow
        appointment_id: searchParams.get('appointment') ? parseInt(searchParams.get('appointment')) : null,
        clinic_id: clinicSettings?.id, // Include clinic_id
        doctor_id: user?.role === 'doctor' ? user.id : null, // Add doctor_id if user is doctor
        template_id: receiptForm.template_id || null, // Include template_id
        amount: subtotal,
        tax: taxAmount,
        discount: parseFloat(receiptForm.discount) || 0,
        additional_discount: parseFloat(receiptForm.additional_discount) || 0,
        total_amount: total,
        payment_method: receiptForm.payment_method,
        payment_id: receiptForm.payment_id || null, // Include payment_id
        payment_status: 'pending',
        notes: receiptForm.notes || '', // Include notes (footer content)
        remarks: receiptForm.remarks || '', // Include remarks (header content)
        service_items: receiptForm.services.map(s => ({
          ...s,
          qty: parseFloat(s.qty) || 1,
          unit_price: parseFloat(s.unit_price) || 0,
          amount: parseFloat(s.unit_price) || 0, // Add amount as fallback
          discount: parseFloat(s.discount) || 0,
          total: parseFloat(s.total) || 0,
          service_name: s.service_name || s.service || 'Service'
        }))
      };

      console.log('🔍 DEBUG: Services being sent:', receiptData.service_items);
      console.log('🔍 DEBUG: Original services form:', receiptForm.services);

      const res = await api.post('/api/bills', receiptData);

      // Get template data if template was selected
      const billId = res.data.bill_id || res.data.id;
      
      // Use the complete bill data from backend response, fallback to our form data
      let receiptWithTemplate = { 
        id: billId, 
        bill_id: billId,
        ...res.data.bill || res.data, // Use bill data from backend
        ...receiptData // Merge with our form data as fallback
      };

      console.log('🔍 DEBUG: Backend response:', res.data);
      console.log('🔍 DEBUG: Backend bill data:', res.data.bill);
      console.log('🔍 DEBUG: Service items from backend:', res.data.bill?.service_items);
      console.log('🔍 DEBUG: receiptWithTemplate after merge:', receiptWithTemplate);
      console.log('🔍 DEBUG: Final service_items:', receiptWithTemplate.service_items);
      console.log('🔍 DEBUG: Total amount:', receiptWithTemplate.total_amount);

      console.log('🔍 DEBUG: receiptData.template_id =', receiptData.template_id);
      console.log('🔍 DEBUG: receiptTemplates array =', receiptTemplates);

      if (receiptData.template_id) {
        const selectedTemplate = receiptTemplates.find(t => t.id === parseInt(receiptData.template_id));
        console.log('🔍 DEBUG: selectedTemplate found =', selectedTemplate);

        if (selectedTemplate) {
          receiptWithTemplate = {
            ...receiptWithTemplate,
            template_header_image: selectedTemplate.header_image,
            template_header_content: selectedTemplate.header_content,
            template_footer_image: selectedTemplate.footer_image,
            template_footer_content: selectedTemplate.footer_content
          };
          console.log('🔍 DEBUG: receiptWithTemplate after merge =', receiptWithTemplate);
        } else {
          console.warn('⚠️ Template not found! template_id:', receiptData.template_id, 'Available templates:', receiptTemplates.map(t => t.id));
        }
      }

      setSelectedReceipt(receiptWithTemplate);
      setShowCreateModal(false);
      setShowSuccessModal(true);
      
      console.log('🔍 DEBUG: Receipt saved successfully:', receiptWithTemplate);
      console.log('🔍 DEBUG: Service items in receipt:', receiptWithTemplate.service_items);
      console.log('🔍 DEBUG: Services in receipt:', receiptWithTemplate.services);
      
      fetchReceipts();
      resetForm();
      addToast('Receipt created successfully', 'success');
    } catch (error) {
      console.error('Failed to create receipt:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error data sent:', receiptData);
      
      // Log validation details if available
      if (error.response?.data?.details) {
        console.error('Validation errors:', error.response.data.details);
        error.response.data.details.forEach((detail, index) => {
          console.error(`Validation error ${index + 1}:`, detail);
        });
      }
      
      // Show specific error message based on response
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create receipt';
      addToast(errorMessage, 'error');
    }
  };

  const selectedPatient = patients.find(p => p.id == receiptForm.patient_id);

  return (
    <div className="space-y-6">
      <HeaderBar title="Receipts" />

      {/* Search and Create Section */}
      <div className="bg-white border rounded shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">All Receipts</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowViewAllModal(true)}
              type="button"
              className="px-4 py-2 border rounded hover:bg-slate-50 transition active:scale-[0.98]"
            >
              View All Receipts
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              type="button"
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition active:scale-[0.98]"
            >
              Create New Receipt
            </button>
          </div>
        </div>

        {/* Search Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by Name"
            className="px-3 py-2 border rounded"
            value={search.name}
            onChange={(e) => setSearch({ ...search, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Search by UHID"
            className="px-3 py-2 border rounded"
            value={search.uhid}
            onChange={(e) => setSearch({ ...search, uhid: e.target.value })}
          />
          <input
            type="text"
            placeholder="Search by Phone"
            className="px-3 py-2 border rounded"
            value={search.phone}
            onChange={(e) => setSearch({ ...search, phone: e.target.value })}
          />
        </div>

        <button
          onClick={handleSearch}
          type="button"
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition active:scale-[0.98]"
        >
          Search
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedReceipts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-blue-800">
            {selectedReceipts.length} receipt{selectedReceipts.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
            >
              Delete Selected
            </button>
            <button
              onClick={() => {
                setSelectedReceipts([]);
                setSelectAll(false);
              }}
              className="px-3 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-700 transition"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Receipts Table */}
      <div className="bg-white border rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">S NO.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">PATIENT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">SERVICE</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">CREATED AT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">TOTAL AMOUNT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                    No receipts found
                  </td>
                </tr>
              ) : (
                receipts.map((receipt, index) => (
                  <tr key={receipt.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedReceipts.includes(receipt.id)}
                        onChange={() => handleSelectReceipt(receipt.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium">
                          {receipt.patient_name || `Unknown Patient (${receipt.patient_uhid || receipt.patient_id})`}
                        </div>
                        <div className="text-xs text-slate-500">{receipt.patient_uhid || receipt.patient_id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {receipt.service_items && receipt.service_items.length > 0
                        ? receipt.service_items.map(s => s.service_name || s.service).join(', ')
                        : 'Consultation'
                      }
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        receipt.payment_status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {receipt.payment_status === 'completed' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(receipt.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      ₹{formatCurrency(receipt.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              // Fetch full bill with service_items from API
                              const res = await api.get(`/api/bills/${receipt.id}`);
                              const fullBill = res.data?.bill || res.data;

                              // Add template data if receipt has template_id
                              let receiptWithTemplate = { ...fullBill };
                              if (fullBill.template_id) {
                                const template = receiptTemplates.find(t => t.id === parseInt(fullBill.template_id));
                                if (template) {
                                  receiptWithTemplate = {
                                    ...receiptWithTemplate,
                                    template_header_image: template.header_image,
                                    template_header_content: template.header_content,
                                    template_footer_image: template.footer_image,
                                    template_footer_content: template.footer_content
                                  };
                                }
                              }
                              setSelectedReceipt(receiptWithTemplate);
                              setShowSuccessModal(true);
                            } catch (error) {
                              console.error('Failed to fetch receipt details:', error);
                              addToast('Failed to load receipt details', 'error');
                            }
                          }}
                          className="text-primary hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => downloadBillingPDF(receipt.id)}
                          className="text-green-600 hover:underline flex items-center gap-1"
                          title="Download as PDF"
                        >
                          <FiDownload className="w-3 h-3" />
                          PDF
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              // Fetch full bill with service_items from API
                              const res = await api.get(`/api/bills/${receipt.id}`);
                              const fullBill = res.data?.bill || res.data;

                              // Prepare receipt for editing with proper service_items structure
                              let receiptForEdit = { ...fullBill };

                              // Ensure service_items exists and is properly formatted
                              if (!receiptForEdit.service_items || receiptForEdit.service_items.length === 0) {
                                receiptForEdit.service_items = [{
                                  service_name: 'Consultation',
                                  qty: 1,
                                  unit_price: parseFloat(fullBill.amount) || 0,
                                  discount: 0,
                                  total: parseFloat(fullBill.amount) || 0
                                }];
                              } else {
                                // Ensure all numeric values are parsed
                                receiptForEdit.service_items = receiptForEdit.service_items.map(item => ({
                                  service_name: item.service_name || item.service || 'Service',
                                  qty: parseFloat(item.qty || item.quantity) || 1,
                                  unit_price: parseFloat(item.unit_price) || parseFloat(item.amount) || 0,
                                  discount: parseFloat(item.discount || item.discount_amount) || 0,
                                  total: parseFloat(item.total || item.total_price) || 0
                                }));
                              }

                              // Add template data if receipt has template_id
                              if (fullBill.template_id) {
                                const template = receiptTemplates.find(t => t.id === parseInt(fullBill.template_id));
                                if (template) {
                                  receiptForEdit = {
                                    ...receiptForEdit,
                                    template_header_image: template.header_image,
                                    template_header_content: template.header_content,
                                    template_footer_image: template.footer_image,
                                    template_footer_content: template.footer_content
                                  };
                                }
                              }

                              setEditingReceipt(receiptForEdit);
                              setShowEditModal(true);
                            } catch (error) {
                              console.error('Failed to fetch receipt for editing:', error);
                              addToast('Failed to load receipt details', 'error');
                            }
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Delete this receipt? This action cannot be undone.')) return;
                            try {
                              await api.delete(`/api/bills/${receipt.id}`);
                              await fetchReceipts();
                            } catch (err) {
                              console.error('Delete receipt failed:', err);
                              alert('Failed to delete receipt');
                            }
                          }}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Receipt Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Receipt"
      >
        <div className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Patient *</label>
            {receiptForm.patient_id ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                <span className="text-sm text-blue-800">
                  <strong>Patient:</strong> {(patients.find(p => p.id == receiptForm.patient_id))?.name || 'Selected'}
                  {' - '}
                  {(patients.find(p => p.id == receiptForm.patient_id))?.patient_id || ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptForm({ ...receiptForm, patient_id: '' });
                    setPatientSearch('');
                    setPatientSearchResults([]);
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Search by name, phone, or patient ID..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    searchPatientsForReceipt(e.target.value);
                  }}
                />
                {patientSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white border rounded shadow-lg">
                    {patientSearchResults.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setReceiptForm({ ...receiptForm, patient_id: patient.id });
                          setPatientSearch('');
                          setPatientSearchResults([]);
                          if (!patients.find(p => p.id === patient.id)) {
                            setPatients(prev => [...prev, patient]);
                          }
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                      >
                        <p className="font-medium text-sm">{patient.name}</p>
                        <p className="text-xs text-gray-500">
                          ID: {patient.patient_id} {patient.phone ? `• ${patient.phone}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Receipt Template (Optional)</label>
            <div className="flex gap-2">
              <select
                className="flex-1 px-3 py-2 border rounded"
                value={receiptForm.template_id}
                onChange={(e) => handleTemplateSelect(e.target.value)}
              >
                <option value="">No template (use clinic default)</option>
                {receiptTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.template_name} {template.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
              {receiptForm.template_id && (
                <button
                  type="button"
                  onClick={() => handleTemplatePreview(receiptForm.template_id)}
                  className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                >
                  Preview
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select a template to add custom header/footer to this receipt
            </p>
          </div>

          {/* Patient Info Display */}
          {selectedPatient && (
            <div className="bg-slate-50 p-4 rounded grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500">Name</span>
                <p className="font-medium">{selectedPatient.name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">UHID</span>
                <p className="font-medium">{selectedPatient.patient_id}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Phone</span>
                <p className="font-medium">{selectedPatient.phone || '-'}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Email</span>
                <p className="font-medium">{selectedPatient.email || '-'}</p>
              </div>
            </div>
          )}

          {/* Services Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Services</label>
              <div className="flex items-center gap-2">
                <select
                  className="px-2 py-1 border rounded text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const tpl = serviceTemplates.find(t => t.label === val);
                    if (!tpl) return;
                    const newItem = { service_name: tpl.service_name, qty: tpl.qty, unit_price: tpl.unit_price, discount: 0, total: tpl.qty * tpl.unit_price };
                    setReceiptForm(prev => ({ ...prev, services: [...prev.services, newItem] }));
                    e.target.value = '';
                  }}
                >
                  <option value="">Add from template...</option>
                  {serviceTemplates.map(t => (
                    <option key={t.label} value={t.label}>{t.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addService}
                  className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition active:scale-[0.98]"
                >
                  + Add Service
                </button>
              </div>
            </div>
            <div className="border rounded overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">SERVICE</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">QTY</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">AMOUNT</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">DISCOUNT</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">TOTAL</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {receiptForm.services.map((service, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="Service name"
                          value={service.service_name || service.service}
                          onChange={(e) => handleServiceChange(index, 'service_name', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-16 px-2 py-1 border rounded text-sm"
                          min="1"
                          value={service.qty}
                          onChange={(e) => handleServiceChange(index, 'qty', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-20 px-2 py-1 border rounded text-sm"
                          min="0"
                          step="0.01"
                          value={service.unit_price}
                          onChange={(e) => handleServiceChange(index, 'unit_price', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-20 px-2 py-1 border rounded text-sm"
                          min="0"
                          step="0.01"
                          value={service.discount}
                          onChange={(e) => handleServiceChange(index, 'discount', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium">
                        ₹{formatCurrency(service.total)}
                      </td>
                      <td className="px-3 py-2">
                        {receiptForm.services.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeService(index)}
                            className="text-red-500 hover:text-red-700 transition active:scale-[0.98]"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 p-4 rounded space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tax (%)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded"
                  min="0"
                  step="0.01"
                  value={receiptForm.tax}
                  onChange={(e) => setReceiptForm({ ...receiptForm, tax: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Line Item Discount</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded"
                  min="0"
                  step="0.01"
                  value={receiptForm.discount}
                  onChange={(e) => setReceiptForm({ ...receiptForm, discount: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Additional Discount</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded"
                min="0"
                step="0.01"
                value={receiptForm.additional_discount}
                onChange={(e) => setReceiptForm({ ...receiptForm, additional_discount: e.target.value })}
              />
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Sub-Total:</span>
                <span>₹{formatCurrency(calculateTotals().subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>₹{formatCurrency(calculateTotals().taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-₹{formatCurrency((parseFloat(receiptForm.discount) || 0) + (parseFloat(receiptForm.additional_discount) || 0))}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-1">
                <span>Grand Total:</span>
                <span>₹{formatCurrency(calculateTotals().total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method & Payment ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={receiptForm.payment_method}
                onChange={(e) => setReceiptForm({ ...receiptForm, payment_method: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment ID / Transaction Ref</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g., TXN123456 or UPI/12345"
                value={receiptForm.payment_id}
                onChange={(e) => setReceiptForm({ ...receiptForm, payment_id: e.target.value })}
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium mb-2">Remarks / Notes</label>
            <textarea
              className="w-full px-3 py-2 border rounded"
              rows="3"
              placeholder="Add any additional remarks or notes for this receipt..."
              value={receiptForm.remarks}
              onChange={(e) => setReceiptForm({ ...receiptForm, remarks: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border rounded hover:bg-slate-50 transition active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateReceipt}
              disabled={!receiptForm.patient_id}
              className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98]"
            >
              Create Receipt
            </button>
          </div>
        </div>
      </Modal>

      {/* Receipt Success/View Modal - UPDATED with dynamic clinic info */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title=""
        size="lg"
      >
        {selectedReceipt && (() => {
          // Get dynamic clinic info
          const clinic = getClinicInfo(selectedReceipt);
          
          return (
            <div className="space-y-6">
              {/* Success Message - only show for new receipts */}
              {selectedReceipt.justCreated !== false && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-600">Receipt Created Successfully!</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Receipt for ₹{formatCurrency(selectedReceipt.total_amount)} created successfully
                  </p>
                </div>
              )}

              {/* Receipt Preview with DYNAMIC Clinic Header */}
              <div className="border rounded p-6 bg-white" ref={printRef}>
                {/* Template Header Image */}
                {selectedReceipt.template_header_image && (
                  <div className="mb-4 text-center">
                    <img
                      src={selectedReceipt.template_header_image}
                      alt="Header"
                      className="max-w-full h-auto max-h-32 mx-auto"
                    />
                  </div>
                )}

                {/* Template Header Content */}
                {selectedReceipt.template_header_content && (
                  <div className="mb-4 pb-4 border-b">
                    <div
                      className="text-sm text-slate-700"
                      dangerouslySetInnerHTML={{ __html: selectedReceipt.template_header_content }}
                    />
                  </div>
                )}

                {/* Clinic Header - Only show if no template header */}
                {!selectedReceipt.template_header_image && (
                  <div className="text-center mb-6 pb-4 border-b">
                    {clinic.logo && (
                      <img
                        src={clinic.logo}
                        alt={clinic.name}
                        className="h-16 mx-auto mb-2 object-contain"
                      />
                    )}
                    <h4 className="text-xl font-bold text-slate-800">{clinic.name}</h4>
                    {formatAddress(clinic) && (
                      <p className="text-sm text-slate-600">{formatAddress(clinic)}</p>
                    )}
                    {(clinic.phone || clinic.email) && (
                      <p className="text-sm text-slate-600">
                        {clinic.phone && `Phone: ${clinic.phone}`}
                        {clinic.phone && clinic.email && ' | '}
                        {clinic.email && `Email: ${clinic.email}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Receipt Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h5 className="font-semibold text-slate-800">RECEIPT</h5>
                    <p className="text-sm text-slate-600">Receipt #: REC{String(selectedReceipt.id).padStart(4, '0')}</p>
                    <p className="text-sm text-slate-600">
                      Date: {new Date(selectedReceipt.created_at || new Date()).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Billed To:</p>
                    <p className="font-medium">
                      {selectedReceipt.patient_name || `Unknown Patient (${selectedReceipt.patient_uhid || selectedReceipt.patient_id})`}
                    </p>
                    <p className="text-sm text-slate-600">
                      UHID: {selectedReceipt.patient_uhid || selectedReceipt.patient_id}
                    </p>
                    <p className="text-sm text-slate-600">
                      Phone: {selectedReceipt.patient_phone || '-'}
                    </p>
                  </div>
                </div>

                {/* Services Table */}
                <table className="w-full text-sm mb-4 border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-3 py-2 text-left font-semibold">S.No</th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Service</th>
                      <th className="border border-slate-300 px-3 py-2 text-center font-semibold">Qty</th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-semibold">Rate</th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReceipt.service_items || []).length > 0 ? (
                      selectedReceipt.service_items.map((service, index) => (
                        <tr key={index}>
                          <td className="border border-slate-300 px-3 py-2">{index + 1}</td>
                          <td className="border border-slate-300 px-3 py-2">{service.service_name || 'Service'}</td>
                          <td className="border border-slate-300 px-3 py-2 text-center">{service.qty || service.quantity || 1}</td>
                          <td className="border border-slate-300 px-3 py-2 text-right">₹{formatCurrency(service.unit_price)}</td>
                          <td className="border border-slate-300 px-3 py-2 text-right">₹{formatCurrency(service.total || service.total_price)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="border border-slate-300 px-3 py-2">1</td>
                        <td className="border border-slate-300 px-3 py-2">Consultation</td>
                        <td className="border border-slate-300 px-3 py-2 text-center">1</td>
                        <td className="border border-slate-300 px-3 py-2 text-right">₹{formatCurrency(selectedReceipt.amount)}</td>
                        <td className="border border-slate-300 px-3 py-2 text-right">₹{formatCurrency(selectedReceipt.amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-4">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sub-Total:</span>
                      <span>₹{formatCurrency(selectedReceipt.amount)}</span>
                    </div>
                    {parseFloat(selectedReceipt.tax) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>₹{formatCurrency(selectedReceipt.tax)}</span>
                      </div>
                    )}
                    {parseFloat(selectedReceipt.discount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Discount:</span>
                        <span>-₹{formatCurrency(selectedReceipt.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Grand Total:</span>
                      <span>₹{formatCurrency(selectedReceipt.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium">Payment Method:</span>
                      <span className="ml-2 capitalize">{selectedReceipt.payment_method || 'Cash'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 ${
                        selectedReceipt.payment_status === 'completed' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {selectedReceipt.payment_status === 'completed' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  {selectedReceipt.payment_id && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Payment ID:</span>
                      <span className="ml-2">{selectedReceipt.payment_id}</span>
                    </div>
                  )}
                  {selectedReceipt.remarks && (
                    <div className="text-sm bg-slate-50 p-3 rounded">
                      <span className="font-medium">Remarks:</span>
                      <p className="mt-1 text-slate-600">{selectedReceipt.remarks}</p>
                    </div>
                  )}
                </div>

                {/* Template Footer Content */}
                {selectedReceipt.template_footer_content && (
                  <div className="mt-6 pt-4 border-t">
                    <div
                      className="text-sm text-slate-600 text-center"
                      dangerouslySetInnerHTML={{ __html: selectedReceipt.template_footer_content }}
                    />
                  </div>
                )}

                {/* Template Footer Image */}
                {selectedReceipt.template_footer_image && (
                  <div className="mt-4 text-center">
                    <img
                      src={selectedReceipt.template_footer_image}
                      alt="Footer"
                      className="max-w-full h-auto max-h-24 mx-auto"
                    />
                  </div>
                )}

                {/* Default Footer (if no template footer) */}
                {!selectedReceipt.template_footer_content && !selectedReceipt.template_footer_image && (
                  <div className="text-center mt-6 pt-4 border-t text-xs text-slate-500">
                    <p>Thank you for choosing {clinic.name}</p>
                    <p>This is a computer generated receipt</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3 print:hidden">
                <button
                  onClick={() => {
                    // Prepare receipt for editing with proper service_items structure
                    let receiptForEdit = { ...selectedReceipt };

                    // Ensure service_items exists and is properly formatted
                    if (!receiptForEdit.service_items || receiptForEdit.service_items.length === 0) {
                      receiptForEdit.service_items = [{
                        service: 'Consultation',
                        qty: 1,
                        amount: parseFloat(selectedReceipt.amount) || 0,
                        discount: 0,
                        total: parseFloat(selectedReceipt.amount) || 0
                      }];
                    } else {
                      // Ensure all numeric values are parsed
                      receiptForEdit.service_items = receiptForEdit.service_items.map(item => ({
                        service_name: item.service_name || item.service || 'Service',
                        qty: parseFloat(item.qty) || 1,
                        amount: parseFloat(item.amount) || 0,
                        discount: parseFloat(item.discount) || 0,
                        total: parseFloat(item.total) || 0
                      }));
                    }

                    setEditingReceipt(receiptForEdit);
                    setShowSuccessModal(false);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Receipt
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const email = selectedReceipt.patient_email || selectedReceipt.email;
                    if (email) {
                      try {
                        await api.post('/api/notify/receipt', {
                          billId: selectedReceipt.id,
                          email: email,
                          method: 'email'
                        });
                        alert('Receipt sent via Email!');
                      } catch {
                        alert('Failed to send receipt');
                      }
                    } else {
                      alert('Patient email not available');
                    }
                  }}
                  className="px-4 py-2 border rounded hover:bg-slate-50 flex items-center justify-center gap-2 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 border rounded hover:bg-slate-50 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedReceipt?.id) {
                      alert('Receipt ID not available. Please try again.');
                      return;
                    }
                    try {
                      const response = await api.get(`/api/pdf/bill/${selectedReceipt.id}`, {
                        responseType: 'blob'
                      });

                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `receipt-${selectedReceipt.id}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('PDF download error:', error);
                      alert('Failed to download PDF');
                    }
                  }}
                  className="px-4 py-2 border rounded hover:bg-slate-50 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={async () => {
                    if (!selectedReceipt?.id) {
                      alert('Receipt ID not available. Please try again.');
                      return;
                    }
                    try {
                      const response = await api.get(`/api/bills/${selectedReceipt.id}/whatsapp`);
                      if (response.data && response.data.success) {
                        const { patient_phone, whatsapp_message, pdf_url } = response.data;
                        const phone = (patient_phone || '').replace(/\D/g, '');
                        const message = whatsapp_message || (pdf_url ? `Your receipt: ${pdf_url}` : 'Your receipt is ready.');
                        if (phone) {
                          openWhatsApp(phone, message);
                        } else {
                          const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                          window.open(shareUrl, '_blank');
                        }
                      } else {
                        const link = `${window.location.origin.replace(/\/$/, '')}/api/pdf/bill/${selectedReceipt.id}`;
                        const msg = `Your receipt: ${link}`;
                        const shareUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                        window.open(shareUrl, '_blank');
                      }
                    } catch (error) {
                      console.error('Failed to prepare bill for WhatsApp:', error);
                      alert('Failed to prepare bill for WhatsApp. Please try again.');
                    }
                  }}
                  className="px-4 py-2 border rounded hover:bg-slate-50 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  title="Send bill via WhatsApp"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Send Bill
                </button>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-4 border-t print:hidden">
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin.replace(/\/$/, '')}/api/pdf/bill/${selectedReceipt.id}`;
                    navigator.clipboard.writeText(link).then(() => alert('PDF link copied to clipboard'));
                  }}
                  className="px-4 py-2 border rounded hover:bg-slate-50 transition active:scale-[0.98]"
                >
                  Copy PDF Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin.replace(/\/$/, '')}/api/pdf/bill/${selectedReceipt.id}`;
                    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(link)}`;
                    window.open(qr, '_blank');
                  }}
                  className="px-4 py-2 border rounded hover:bg-slate-50 transition active:scale-[0.98]"
                >
                  Show QR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingReceipt(selectedReceipt);
                    setShowSuccessModal(false);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 border rounded hover:bg-slate-50 transition active:scale-[0.98]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 px-4 py-2 border rounded hover:bg-slate-50 transition active:scale-[0.98]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setShowCreateModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition active:scale-[0.98]"
                >
                  Create New Receipt
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* View All Receipts Modal */}
      <Modal
        isOpen={showViewAllModal}
        onClose={() => setShowViewAllModal(false)}
        title="All Receipts"
        size="xl"
      >
        <div className="space-y-4">
          {/* Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by Name"
              className="px-3 py-2 border rounded"
              value={search.name}
              onChange={(e) => setSearch({ ...search, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Search by UHID"
              className="px-3 py-2 border rounded"
              value={search.uhid}
              onChange={(e) => setSearch({ ...search, uhid: e.target.value })}
            />
            <input
              type="text"
              placeholder="Search by Phone"
              className="px-3 py-2 border rounded"
              value={search.phone}
              onChange={(e) => setSearch({ ...search, phone: e.target.value })}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Search
            </button>
          </div>

          {/* Receipts Table */}
          <div className="border rounded overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">S NO.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">PATIENT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">SERVICE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">STATUS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">TOTAL</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : receipts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                      No receipts found
                    </td>
                  </tr>
                ) : (
                  receipts.map((receipt, index) => (
                    <tr key={receipt.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">
                            {receipt.patient_name || `Unknown Patient (${receipt.patient_uhid || receipt.patient_id})`}
                          </div>
                          <div className="text-xs text-slate-500">{receipt.patient_uhid || receipt.patient_id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {receipt.service_items && receipt.service_items.length > 0
                          ? receipt.service_items.map(s => s.service_name || s.service).join(', ')
                          : 'Consultation'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          receipt.payment_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {receipt.payment_status === 'completed' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(receipt.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        ₹{formatCurrency(receipt.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                // Fetch full bill with service_items from API
                                const res = await api.get(`/api/bills/${receipt.id}`);
                                const fullBill = res.data?.bill || res.data;

                                // Add template data if receipt has template_id
                                let receiptWithTemplate = { ...fullBill, justCreated: false };
                                if (fullBill.template_id) {
                                  const template = receiptTemplates.find(t => t.id === parseInt(fullBill.template_id));
                                  if (template) {
                                    receiptWithTemplate = {
                                      ...receiptWithTemplate,
                                      template_header_image: template.header_image,
                                      template_header_content: template.header_content,
                                      template_footer_image: template.footer_image,
                                      template_footer_content: template.footer_content
                                    };
                                  }
                                }
                                setSelectedReceipt(receiptWithTemplate);
                                setShowViewAllModal(false);
                                setShowSuccessModal(true);
                              } catch (error) {
                                console.error('Failed to fetch receipt details:', error);
                                addToast('Failed to load receipt details', 'error');
                              }
                            }}
                            className="text-primary hover:underline"
                          >
                            View
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                // Fetch full bill with service_items from API
                                const res = await api.get(`/api/bills/${receipt.id}`);
                                const fullBill = res.data?.bill || res.data;

                                // Prepare receipt for editing with proper service_items structure
                                let receiptForEdit = { ...fullBill };

                                // Ensure service_items exists and is properly formatted
                                if (!receiptForEdit.service_items || receiptForEdit.service_items.length === 0) {
                                  receiptForEdit.service_items = [{
                                    service_name: 'Consultation',
                                    qty: 1,
                                    unit_price: parseFloat(fullBill.amount) || 0,
                                    discount: 0,
                                    total: parseFloat(fullBill.amount) || 0
                                  }];
                                } else {
                                  // Ensure all numeric values are parsed
                                  receiptForEdit.service_items = receiptForEdit.service_items.map(item => ({
                                    service_name: item.service_name || item.service || 'Service',
                                    qty: parseFloat(item.qty || item.quantity) || 1,
                                    unit_price: parseFloat(item.unit_price) || parseFloat(item.amount) || 0,
                                    discount: parseFloat(item.discount || item.discount_amount) || 0,
                                    total: parseFloat(item.total || item.total_price) || 0
                                  }));
                                }

                                // Add template data if receipt has template_id
                                if (fullBill.template_id) {
                                  const template = receiptTemplates.find(t => t.id === parseInt(fullBill.template_id));
                                  if (template) {
                                    receiptForEdit = {
                                      ...receiptForEdit,
                                      template_header_image: template.header_image,
                                      template_header_content: template.header_content,
                                      template_footer_image: template.footer_image,
                                      template_footer_content: template.footer_content
                                    };
                                  }
                                }

                                setEditingReceipt(receiptForEdit);
                                setShowViewAllModal(false);
                                setShowEditModal(true);
                              } catch (error) {
                                console.error('Failed to fetch receipt for editing:', error);
                                addToast('Failed to load receipt details', 'error');
                              }
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Delete this receipt? This action cannot be undone.')) return;
                              try {
                                await api.delete(`/api/bills/${receipt.id}`);
                                await fetchReceipts();
                              } catch (err) {
                                console.error('Delete receipt failed:', err);
                                alert('Failed to delete receipt');
                              }
                            }}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => setShowViewAllModal(false)}
              className="px-4 py-2 border rounded hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Receipt Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Receipt"
      >
        {editingReceipt && (
          <div className="space-y-6">
            {(() => {
              // Ensure service_items always exist
              if (!editingReceipt.service_items || editingReceipt.service_items.length === 0) {
                editingReceipt.service_items = [{ service_name: '', qty: 1, unit_price: 0, discount_amount: 0, total_price: 0 }];
              }
              return null;
            })()}
            
            {/* Patient Info Display */}
            <div className="bg-slate-50 p-4 rounded grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500">Name</span>
                <p className="font-medium">
                  {editingReceipt.patient_name || `Unknown Patient (${editingReceipt.patient_uhid || editingReceipt.patient_id})`}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">UHID</span>
                <p className="font-medium">{editingReceipt.patient_uhid || editingReceipt.patient_id}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Phone</span>
                <p className="font-medium">{editingReceipt.patient_phone || '-'}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Receipt ID</span>
                <p className="font-medium">REC{String(editingReceipt.id).padStart(4, '0')}</p>
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Receipt Template (Optional)</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-2 border rounded"
                  value={editingReceipt.template_id || ''}
                  onChange={(e) => {
                    const templateId = e.target.value;
                    const selectedTemplate = receiptTemplates.find(t => t.id === parseInt(templateId));

                    if (selectedTemplate) {
                      setEditingReceipt({
                        ...editingReceipt,
                        template_id: templateId,
                        notes: selectedTemplate.footer_content || '',
                        remarks: selectedTemplate.header_content || ''
                      });
                    } else {
                      setEditingReceipt({
                        ...editingReceipt,
                        template_id: '',
                        notes: '',
                        remarks: ''
                      });
                    }
                  }}
                >
                  <option value="">No template (use clinic default)</option>
                  {receiptTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.template_name} {template.is_default ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
                {editingReceipt.template_id && (
                  <button
                    type="button"
                    onClick={() => handleTemplatePreview(editingReceipt.template_id)}
                    className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                  >
                    Preview
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select a template to add custom header/footer to this receipt
              </p>
            </div>

            {/* Services Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Services</label>
                <div className="flex items-center gap-2">
                  <select
                    className="px-2 py-1 border rounded text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const tpl = serviceTemplates.find(t => t.label === val);
                      if (!tpl) return;
                      const updatedReceipt = { ...editingReceipt };
                      if (!updatedReceipt.service_items) updatedReceipt.service_items = [];
                      updatedReceipt.service_items.push({ service_name: tpl.service_name || tpl.service, qty: tpl.qty, unit_price: tpl.unit_price || tpl.amount, discount: 0, total: tpl.qty * (tpl.unit_price || tpl.amount) });
                      setEditingReceipt(updatedReceipt);
                      e.target.value = '';
                    }}
                  >
                    <option value="">Add from template...</option>
                    {serviceTemplates.map(t => (
                      <option key={t.label} value={t.label}>{t.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const updatedReceipt = { ...editingReceipt };
                      if (!updatedReceipt.service_items) updatedReceipt.service_items = [];
                      updatedReceipt.service_items.push({ service: '', qty: 1, amount: 0, discount: 0, total: 0 });
                      setEditingReceipt(updatedReceipt);
                    }}
                    className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                  >
                    + Add Service
                  </button>
                </div>
              </div>
              <div className="border rounded overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">SERVICE</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">QTY</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">AMOUNT</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">DISCOUNT</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">TOTAL</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(editingReceipt.service_items && editingReceipt.service_items.length > 0) ? (
                      editingReceipt.service_items.map((service, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="Service name"
                              value={service.service_name || service.service}
                            onChange={(e) => {
                              const updatedReceipt = { ...editingReceipt };
                              updatedReceipt.service_items[index].service_name = e.target.value;
                              setEditingReceipt(updatedReceipt);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            className="w-16 px-2 py-1 border rounded text-sm"
                            min="1"
                            value={service.qty ?? service.quantity ?? 1}
                            onChange={(e) => {
                              const updatedReceipt = { ...editingReceipt };
                              const qty = parseFloat(e.target.value) || 1;
                              const amount = parseFloat(service.unit_price ?? service.amount) || 0;
                              const discount = parseFloat(service.discount ?? service.discount_amount) || 0;
                              updatedReceipt.service_items[index].qty = qty;
                              updatedReceipt.service_items[index].quantity = qty;
                              updatedReceipt.service_items[index].total = (qty * amount) - discount;
                              updatedReceipt.service_items[index].total_price = (qty * amount) - discount;
                              setEditingReceipt(updatedReceipt);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border rounded text-sm"
                            min="0"
                            step="0.01"
                            value={service.unit_price ?? service.amount ?? 0}
                            onChange={(e) => {
                              const updatedReceipt = { ...editingReceipt };
                              const qty = parseFloat(service.qty ?? service.quantity) || 1;
                              const amount = parseFloat(e.target.value) || 0;
                              const discount = parseFloat(service.discount ?? service.discount_amount) || 0;
                              updatedReceipt.service_items[index].unit_price = amount;
                              updatedReceipt.service_items[index].amount = amount;
                              updatedReceipt.service_items[index].total = (qty * amount) - discount;
                              updatedReceipt.service_items[index].total_price = (qty * amount) - discount;
                              setEditingReceipt(updatedReceipt);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border rounded text-sm"
                            min="0"
                            step="0.01"
                            value={service.discount ?? service.discount_amount ?? 0}
                            onChange={(e) => {
                              const updatedReceipt = { ...editingReceipt };
                              const qty = parseFloat(service.qty ?? service.quantity) || 1;
                              const amount = parseFloat(service.unit_price ?? service.amount) || 0;
                              const discount = parseFloat(e.target.value) || 0;
                              updatedReceipt.service_items[index].discount = discount;
                              updatedReceipt.service_items[index].discount_amount = discount;
                              updatedReceipt.service_items[index].total = (qty * amount) - discount;
                              updatedReceipt.service_items[index].total_price = (qty * amount) - discount;
                              setEditingReceipt(updatedReceipt);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-sm font-medium">
                          ₹{formatCurrency(service.total ?? service.total_price ?? 0)}
                        </td>
                        <td className="px-3 py-2">
                          {(editingReceipt.service_items || []).length > 1 && (
                            <button
                              onClick={() => {
                                const updatedReceipt = { ...editingReceipt };
                                updatedReceipt.service_items.splice(index, 1);
                                setEditingReceipt(updatedReceipt);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          )}
                        </td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-3 py-4 text-center text-slate-500">
                          No services added. Use the "Add Service" button to add items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 p-4 rounded space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tax (%)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded"
                    min="0"
                    step="0.01"
                    value={editingReceipt.tax || 0}
                    onChange={(e) => setEditingReceipt({ ...editingReceipt, tax: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded"
                    min="0"
                    step="0.01"
                    value={editingReceipt.discount || 0}
                    onChange={(e) => setEditingReceipt({ ...editingReceipt, discount: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="border-t pt-2 space-y-1">
                {(() => {
                  const subtotal = (editingReceipt.service_items || []).reduce((sum, s) => sum + (parseFloat(s.total ?? s.total_price) || 0), 0);
                  const taxAmount = (subtotal * (parseFloat(editingReceipt.tax) || 0)) / 100;
                  const totalDiscount = parseFloat(editingReceipt.discount) || 0;
                  const grandTotal = subtotal + taxAmount - totalDiscount;
                  
                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Sub-Total:</span>
                        <span>₹{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>₹{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Discount:</span>
                        <span>-₹{formatCurrency(totalDiscount)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-1">
                        <span>Grand Total:</span>
                        <span>₹{formatCurrency(grandTotal)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Payment Method & Payment ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={editingReceipt.payment_method || 'cash'}
                  onChange={(e) => setEditingReceipt({ ...editingReceipt, payment_method: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment ID / Transaction Ref</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., TXN123456 or UPI/12345"
                  value={editingReceipt.payment_id || ''}
                  onChange={(e) => setEditingReceipt({ ...editingReceipt, payment_id: e.target.value })}
                />
              </div>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Payment Status</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={editingReceipt.payment_status || 'pending'}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, payment_status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium mb-2">Remarks / Notes</label>
              <textarea
                className="w-full px-3 py-2 border rounded"
                rows="3"
                placeholder="Add any additional remarks or notes for this receipt..."
                value={editingReceipt.remarks || ''}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, remarks: e.target.value })}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // Calculate subtotal using both total and total_price fields
                    const subtotal = (editingReceipt.service_items || []).reduce((sum, s) => sum + (parseFloat(s.total || s.total_price || 0) || 0), 0);
                    const taxAmount = (subtotal * (parseFloat(editingReceipt.tax) || 0)) / 100;
                    const total = subtotal + taxAmount - (parseFloat(editingReceipt.discount) || 0);

                    const updateData = {
                      template_id: editingReceipt.template_id ? parseInt(editingReceipt.template_id) : null,
                      amount: subtotal,
                      tax: parseFloat(editingReceipt.tax) || 0,
                      discount: parseFloat(editingReceipt.discount) || 0,
                      total_amount: total,
                      payment_method: editingReceipt.payment_method || 'cash',
                      payment_id: editingReceipt.payment_id || null,
                      payment_status: editingReceipt.payment_status || 'pending',
                      notes: editingReceipt.notes || null,
                      remarks: editingReceipt.remarks || null,
                      // Send service_items in the exact backend format
                      service_items: (editingReceipt.service_items || []).map(s => ({
                        service_name: s.service_name || s.service || '',
                        quantity: parseFloat(s.qty || s.quantity || 1) || 1,
                        unit_price: parseFloat(s.unit_price || s.amount || 0) || 0,
                        discount_amount: parseFloat(s.discount_amount || s.discount || 0) || 0,
                        total_price: parseFloat(s.total_price || s.total || 0) || 0
                      }))
                    };

                    const res = await api.put(`/api/bills/${editingReceipt.id}`, updateData);

                    // Fetch receipts list to refresh the table
                    await fetchReceipts();

                    // Fetch the specific updated receipt with all template data from server
                    const res2 = await api.get(`/api/bills/${editingReceipt.id}`);
                    const updatedReceiptFromServer = res2.data.bill;

                    // Set the selected receipt with fresh data from server (includes template data)
                    setSelectedReceipt(updatedReceiptFromServer);
                    setShowEditModal(false);
                    setShowSuccessModal(true);
                  } catch (error) {
                    console.error('Failed to update receipt:', error);
                    alert('Failed to update receipt: ' + (error.response?.data?.error || error.message));
                  }
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              >
                Update Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Template Preview Modal */}
      <Modal
        isOpen={showTemplatePreview}
        onClose={() => setShowTemplatePreview(false)}
        title="Template Preview"
      >
        {previewingTemplate && (
          <div className="space-y-4">
            {/* Template Name */}
            <div className="pb-4 border-b">
              <h3 className="text-lg font-semibold">{previewingTemplate.template_name}</h3>
              {previewingTemplate.is_default && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-1 inline-block">
                  Default Template
                </span>
              )}
            </div>

            {/* Header Section */}
            {(previewingTemplate.header_image || previewingTemplate.header_content) && (
              <div className="border-b pb-4">
                <p className="text-sm font-medium mb-2 text-slate-700">Header:</p>
                {previewingTemplate.header_image && (
                  <div className="mb-3">
                    <img
                      src={previewingTemplate.header_image}
                      alt="Header"
                      className="max-w-full h-auto max-h-40 mx-auto border rounded"
                    />
                  </div>
                )}
                {previewingTemplate.header_content && (
                  <div className="bg-slate-50 p-3 rounded">
                    <div
                      className="text-sm text-slate-700"
                      dangerouslySetInnerHTML={{ __html: previewingTemplate.header_content }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Footer Section */}
            {(previewingTemplate.footer_content || previewingTemplate.footer_image) && (
              <div className="border-b pb-4">
                <p className="text-sm font-medium mb-2 text-slate-700">Footer:</p>
                {previewingTemplate.footer_content && (
                  <div className="bg-slate-50 p-3 rounded mb-3">
                    <div
                      className="text-sm text-slate-700"
                      dangerouslySetInnerHTML={{ __html: previewingTemplate.footer_content }}
                    />
                  </div>
                )}
                {previewingTemplate.footer_image && (
                  <div>
                    <img
                      src={previewingTemplate.footer_image}
                      alt="Footer"
                      className="max-w-full h-auto max-h-40 mx-auto border rounded"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTemplatePreview(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}