import { useEffect, useState, useCallback, Fragment } from 'react';
import HeaderBar from '../components/HeaderBar';
import Modal from '../components/Modal';
import { useApiClient } from '../api/client';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiSend, FiPrinter, FiTrash2, FiEye, FiDownload } from 'react-icons/fi';
import { openWhatsApp } from '../utils/whatsapp';
import { pickArray } from '../utils/apiResponse';

const paymentMethods = ['Cash', 'GPay', 'Debit Card', 'Credit Card', 'UPI', 'Bank Transfer'];
const serviceOptions = [
  { name: 'Consultation', price: 500 },
  { name: 'Follow-up', price: 300 },
  { name: 'Lab Test', price: 200 },
  { name: 'X-Ray', price: 800 },
  { name: 'ECG', price: 400 },
  { name: 'Injection', price: 150 },
  { name: 'Lab', price: 300 }
];

export default function Payments() {
  const api = useApiClient();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [billedPayments, setBilledPayments] = useState([]);
  const [unbilledVisits, setUnbilledVisits] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [services, setServices] = useState(serviceOptions); // Initialize with non-empty array
  const [activeTab, setActiveTab] = useState('billed'); // 'billed', 'unbilled', 'pending'
  const [summary, setSummary] = useState({
    total: 0,
    unbilled_visits: 0,
    pending_payment: 0,
    paid: { count: 0, total: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10, // Changed to 10 as requested
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [billedPagination, setBilledPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [unbilledPagination, setUnbilledPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [pendingPagination, setPendingPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    paymode: '',
    service: '',
    dateRange: 'all' // 'all', 'today', 'last7days', 'thisweek', 'thismonth', 'custom'
  });
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [editingPayment, setEditingPayment] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [showUnbilledModal, setShowUnbilledModal] = useState(false);
  const [billCreationModal, setBillCreationModal] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [partialPaymentAmount, setPartialPaymentAmount] = useState('');
  const [receiptTemplates, setReceiptTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [billServices, setBillServices] = useState([{ service: '', qty: 1, days: 1, amount: 0, discount: 0 }]);
  const [billTax, setBillTax] = useState(0);
  const [billDiscount, setBillDiscount] = useState(0);
  const [billPaymentMethod, setBillPaymentMethod] = useState('cash');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const currentPagination = activeTab === 'billed' ? billedPagination : 
                              activeTab === 'unbilled' ? unbilledPagination : 
                              pendingPagination;
      const params = new URLSearchParams();
      params.append('page', currentPagination.page);
      params.append('limit', currentPagination.limit);
      params.append('_t', Date.now()); // Cache-busting timestamp
      if (search) params.append('search', search);
      if (filters.paymode) params.append('payment_status', filters.paymode.toLowerCase().replace(' ', '_'));
      if (filters.service) params.append('service', filters.service);
      
      // Add date range parameters
      if (filters.dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.append('start_date', today);
        params.append('end_date', today);
      } else if (filters.dateRange === 'last7days') {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        params.append('start_date', start.toISOString().split('T')[0]);
        params.append('end_date', end.toISOString().split('T')[0]);
      } else if (filters.dateRange === 'thisweek') {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        const end = new Date(now);
        end.setDate(now.getDate() - dayOfWeek + 6);
        params.append('start_date', start.toISOString().split('T')[0]);
        params.append('end_date', end.toISOString().split('T')[0]);
      } else if (filters.dateRange === 'thismonth') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        params.append('start_date', start.toISOString().split('T')[0]);
        params.append('end_date', end.toISOString().split('T')[0]);
      } else if (filters.dateRange === 'custom' && customDateRange.start && customDateRange.end) {
        params.append('start_date', customDateRange.start);
        params.append('end_date', customDateRange.end);
      }

      let billedRes, unbilledRes, pendingRes;
      
      if (activeTab === 'billed') {
        // Fetch all bills that are not pending (includes paid, completed, etc.)
        [billedRes] = await Promise.all([
          api.get(`/api/bills?${params}`)
        ]);
        unbilledRes = { data: { data: { visits: [] } } };
        pendingRes = { data: { data: { bills: [] } } };
      } else if (activeTab === 'unbilled') {
        // Fetch only unbilled visits
        [unbilledRes] = await Promise.all([
          api.get(`/api/bills/unbilled-visits?${params}`)
        ]);
        console.log('Unbilled API Response:', unbilledRes.data);
        console.log('Visits found:', unbilledRes.data?.visits?.length);
        billedRes = { data: { bills: [] } };
        pendingRes = { data: { data: { bills: [] } } };
      } else if (activeTab === 'pending') {
        // Fetch bills with pending payments
        const [resPending] = await Promise.all([
          api.get(`/api/bills?${params}`)
        ]);

        const pendingBills = resPending.data?.data?.bills || resPending.data?.bills || [];
        // Filter bills that have pending payments
        const pending = pendingBills.filter(b => 
          b.payment_status === 'pending'
        );

        pendingRes = {
          data: {
            bills: pending
          }
        };
        billedRes = { data: { bills: [] } };
        unbilledRes = { data: { data: { visits: [] } } };
      }

      const bills = pickArray(billedRes, ['data.bills', 'bills'])
        .filter(b => b.payment_status !== 'pending')
        .map(b => ({ 
          ...b, 
          bill_type: 'billed',
          status: b.payment_status || b.status // Map payment_status to status
        }));
      const unbilled = pickArray(unbilledRes, ['data.visits', 'visits', 'data.data.visits']).map(u => ({ ...u, bill_type: 'unbilled' }));
      const pending = pickArray(pendingRes, ['data.bills', 'bills']).map(p => ({ 
        ...p, 
        bill_type: 'pending',
        status: p.payment_status || p.status // Map payment_status to status
      }));
      
      setBilledPayments(bills);
      setUnbilledVisits(unbilled);
      setPendingPayments(pending);
      setPayments(activeTab === 'billed' ? bills : activeTab === 'unbilled' ? unbilled : pending);
      
      // Update pagination from response
      if (activeTab === 'billed') {
        const pag = billedRes?.data?.data?.pagination || billedRes?.data?.pagination;
        if (pag) setBilledPagination(pag);
      } else if (activeTab === 'unbilled') {
        const pag = unbilledRes?.data?.pagination || unbilledRes?.pagination;
        if (pag) setUnbilledPagination(pag);
      } else if (activeTab === 'pending') {
        const pag = pendingRes?.data?.data?.pagination || pendingRes?.data?.pagination;
        if (pag) setPendingPagination(pag);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      addToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, search, filters, customDateRange, activeTab, billedPagination.page, billedPagination.limit, unbilledPagination.page, unbilledPagination.limit, pendingPagination.page, pendingPagination.limit, addToast]);

  const fetchSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('_t', Date.now()); // Cache-busting timestamp
      
      if (filters.dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.append('start_date', today);
        params.append('end_date', today);
      } else if (filters.dateRange === 'last7days') {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        params.append('start_date', start.toISOString().split('T')[0]);
        params.append('end_date', end.toISOString().split('T')[0]);
      } else if (filters.dateRange === 'thisweek') {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        const end = new Date(now);
        end.setDate(now.getDate() - dayOfWeek + 6);
        params.append('start_date', start.toISOString().split('T')[0]);
        params.append('end_date', end.toISOString().split('T')[0]);
      } else if (filters.dateRange === 'thismonth') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        params.append('start_date', start.toISOString().split('T')[0]);
        params.append('end_date', end.toISOString().split('T')[0]);
      } else if (filters.dateRange === 'custom' && customDateRange.start && customDateRange.end) {
        params.append('start_date', customDateRange.start);
        params.append('end_date', customDateRange.end);
      }

      const res = await api.get(`/api/bills/summary?${params}`);
      const summaryData = res.data || {};
      setSummary({
        total: summaryData.total_bills || 0,
        unbilled_visits: summaryData.unbilled_visits || 0,
        pending_payment: summaryData.pending_count || summaryData.pending_bills || 0,
        paid: { 
          count: summaryData.paid_count || summaryData.paid_bills || 0,
          total: summaryData.total_collected || summaryData.total_paid || 0
        }
      });
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, [filters.dateRange, customDateRange]);

  // Fetch receipt templates
  const fetchReceiptTemplates = useCallback(async () => {
    try {
      const res = await api.get('/api/receipt-templates');
      if (res.data?.success && res.data?.templates) {
        setReceiptTemplates(res.data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch receipt templates:', error);
    }
  }, [api]);

  useEffect(() => {
    fetchPayments();
    fetchSummary();
    fetchReceiptTemplates();
  }, [fetchPayments, fetchSummary, api]);

  const handleUpdatePayment = async (paymentId, field, value) => {
    try {
      if (field === 'payment_status' || field === 'payment_method') {
        await api.patch(`/api/bills/${paymentId}/status`, {
          payment_status: field === 'payment_status' ? value : undefined,
          payment_method: field === 'payment_method' ? value : undefined
        });
        addToast('Payment updated', 'success');
        fetchPayments();
        fetchSummary();
      }
    } catch {
      addToast('Failed to update payment', 'error');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    
    try {
      await api.delete(`/api/bills/${paymentId}`);
      addToast('Payment deleted', 'success');
      fetchPayments();
      fetchSummary();
    } catch {
      addToast('Failed to delete payment', 'error');
    }
  };

  const handleDownloadReport = () => {
    addToast('Download report functionality - to be implemented', 'info');
    // Would generate and download CSV/PDF report
  };

  const handleEditReceipt = (payment) => {
    // Navigate to receipts page to edit/recreate the receipt
    navigate(`/receipts?edit=true&billId=${payment.id}`);
  };

  const handlePrintReceipt = async (payment) => {
    try {
      // Fetch the receipt PDF and print it
      const response = await api.get(`/api/pdf/bill/${payment.id}`, {
        responseType: 'blob'
      });

      // Create a blob URL and open in new window for printing
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Failed to print receipt:', error);
      addToast('Failed to print receipt', 'error');
    }
  };

  const handleViewReceipt = async (payment) => {
    try {
      // Fetch full bill details with template
      const response = await api.get(`/api/bills/${payment.id}`);
      console.log('View receipt response:', response.data);
      // Response is wrapped in { success: true, bill: {...} }
      const billData = response.data.bill || response.data;
      setViewingReceipt(billData);
    } catch (error) {
      console.error('Failed to fetch receipt:', error);
      addToast('Failed to view receipt', 'error');
    }
  };

  const handleSendReceipt = async (payment) => {
    if (!payment.patient_phone) {
      addToast('Patient phone number not available', 'error');
      return;
    }

    try {
      // Ask backend to prepare WhatsApp message (includes pdf_url when available)
      const res = await api.get(`/api/bills/${payment.id}/whatsapp`);

      if (res.data && res.data.success) {
        const { patient_phone, whatsapp_message, pdf_url } = res.data;
        const phone = (patient_phone || payment.patient_phone || '').replace(/\D/g, '');

        if (!phone) {
          addToast('Patient phone number not available', 'error');
          return;
        }

        // Prefer server-formatted message; if missing, craft a simple message with pdf link
        const message = whatsapp_message || `Hello ${payment.patient_name || ''}, here is your receipt. ${pdf_url || ''}`;
        openWhatsApp(phone, message);
        addToast('Opening WhatsApp...', 'success');
      } else {
        addToast('Failed to prepare WhatsApp message', 'error');
      }
    } catch (error) {
      console.error('Failed to send receipt:', error);
      addToast('Failed to send receipt', 'error');
    }
  };

  const handleQuickReceipt = (payment) => {
    // Navigate to receipts page with payment data for quick receipt
    navigate(`/receipts?quick=true&patient=${payment.patient_id}&amount=${payment.amount}`);
  };

  const handleFullReceipt = (payment) => {
    // Navigate to receipts page with payment data for full receipt
    navigate(`/receipts?full=true&patient=${payment.patient_id}&amount=${payment.amount}`);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCreateBillClick = (visit) => {
    setBillCreationModal(visit);
    setBillServices([{ service: 'Consultation', qty: 1, days: 1, amount: 500, discount: 0 }]);
    setBillTax(0);
    setBillDiscount(0);
    setBillPaymentMethod('cash');
    setBillDate(new Date().toISOString().split('T')[0]); // Reset to today
  };

  const handleAddService = () => {
    setBillServices([...billServices, { service: '', qty: 1, days: 1, amount: 0, discount: 0 }]);
  };

  const handleRemoveService = (index) => {
    setBillServices(billServices.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index, field, value) => {
    const updated = [...billServices];
    if (field === 'service') {
      const selectedService = serviceOptions.find(s => s.name === value);
      updated[index] = { 
        ...updated[index], 
        service: value, 
        amount: selectedService?.price || 0 
      };
    } else {
      updated[index][field] = field === 'qty' || field === 'days' ? parseInt(value) || 1 : parseFloat(value) || 0;
    }
    setBillServices(updated);
  };

  // Fetch services from backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/api/bills/services');
        if (res.data?.success && res.data.services?.length > 0) {
          setServices(res.data.services);
        }
      } catch (error) {
        // Silently use fallback services
      }
    };
    fetchServices();
  }, [api]);

  const getSubtotal = () => {
    return billServices.reduce((sum, item) => sum + ((item.amount || 0) * (item.qty || 1) * (item.days || 1) - (item.discount || 0)), 0);
  };

  const getTaxAmount = () => {
    return (getSubtotal() * billTax) / 100;
  };

  const getGrandTotal = () => {
    return getSubtotal() + getTaxAmount() - billDiscount;
  };

  const handleUpdateAppointmentStatus = async () => {
    if (!editingStatus || !newStatus) return;
    
    try {
      if (editingStatus.source_type === 'appointment') {
        // Update appointment status
        await api.patch(`/api/appointments/${editingStatus.id}/status`, { status: newStatus });
        
        // If status is 'paid', create a bill automatically
        if (newStatus === 'paid') {
          const billData = {
            patient_id: editingStatus.patient_id || editingStatus.patient_uhid,
            appointment_id: editingStatus.id,
            total_amount: editingStatus.consultation_fee || 500,
            payment_method: 'cash',
            payment_status: 'paid',
            amount_paid: editingStatus.consultation_fee || 500,
            service_name: 'Consultation',
            bill_date: new Date().toISOString().split('T')[0],
            tax_amount: 0,
            discount_amount: 0
          };
          await api.post('/api/bills', billData);
          addToast('Bill created and marked as paid', 'success');
        } else {
          addToast('Status updated successfully', 'success');
        }
      } else {
        // Update bill payment status
        if (newStatus === 'partial' && partialPaymentAmount) {
          // Handle partial payment - send amount_paid which backend will use to calculate balance
          const paidAmount = parseFloat(partialPaymentAmount) || 0;
          await api.patch(`/api/bills/${editingStatus.id}/status`, {
            amount_paid: paidAmount,
            payment_status: 'partial'
          });
          addToast(`Partial payment of ₹${partialPaymentAmount} recorded`, 'success');
        } else {
          // Handle full payment or status change
          // For paid status, send amount_paid = total_amount
          const billTotal = parseFloat(editingStatus.total_amount) || 0;
          const amountPaid = newStatus === 'paid' ? billTotal : 0;
          
          await api.patch(`/api/bills/${editingStatus.id}/status`, { 
            amount_paid: amountPaid,
            payment_status: newStatus === 'paid' ? 'paid' : newStatus 
          });
          addToast('Status updated successfully', 'success');
        }
      }
      
      setEditingStatus(null);
      setNewStatus('');
      setPartialPaymentAmount('');
      fetchPayments(); // Refresh all tabs
      fetchSummary(); // Refresh summary
    } catch (error) {
      console.error('Failed to update status:', error);
      addToast('Failed to update status', 'error');
    }
  };

  const handlePartialPayment = async () => {
    if (!paymentModal || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      addToast('Please enter a valid payment amount', 'error');
      return;
    }

    try {
      const amount = parseFloat(paymentAmount);
      const currentPaid = paymentModal.paid_amount || 0;
      const totalAmount = paymentModal.consultation_fee || paymentModal.total_amount;
      const newPaidAmount = currentPaid + amount;
      const remainingAmount = totalAmount - newPaidAmount;

      // Update the bill with new payment amounts
      await api.patch(`/api/bills/${paymentModal.id}/payment`, {
        paid_amount: newPaidAmount,
        payment_status: remainingAmount <= 0 ? 'paid' : 'pending'
      });

      const statusText = remainingAmount <= 0 ? 'Payment completed' : 'Partial payment recorded';
      addToast(`${statusText}: ₹${amount}`, 'success');
      setPaymentModal(null);
      setPaymentAmount('');
      fetchPayments();
      fetchSummary();
    } catch (error) {
      console.error('Failed to process payment:', error);
      addToast('Failed to process payment', 'error');
    }
  };

  const handleCreateBill = async () => {
    if (!billCreationModal) return;

    try {
      const totalAmount = getGrandTotal();
      if (totalAmount <= 0) {
        addToast('Bill total must be greater than 0', 'error');
        return;
      }

      const billData = {
        patient_id: billCreationModal.patient_id,
        appointment_id: billCreationModal.appointment_id,
        total_amount: totalAmount,
        payment_method: billPaymentMethod,
        payment_status: 'pending',
        service_name: selectedTemplate ? selectedTemplate.template_name : billServices.map(s => s.service).join(', '),
        bill_date: billDate,
        tax_amount: getTaxAmount(),
        discount_amount: billDiscount,
        template_id: selectedTemplate?.id || null
      };

      const response = await api.post('/api/bills', billData);
      const createdId = response.data?.bill_id || response.data?.id;
      let createdBill = null;
      if (createdId) {
        try {
          const detail = await api.get(`/api/bills/${createdId}`);
          createdBill = detail.data?.bill || detail.data?.data?.bill || null;
        } catch (_) {
        }
      }

      addToast('Bill created successfully', 'success');

      // Remove from payments list
      setPayments(prev => prev.filter(v => v.appointment_id !== billCreationModal.appointment_id));

      // Reset form
      setBillCreationModal(null);
      setSelectedTemplate(null);

      // Don't auto-open receipt - let user click to view when needed
      // if (createdBill) setViewingReceipt(createdBill);

      // Refresh summary
      fetchSummary();
      fetchPayments();
    } catch (error) {
      console.error('Failed to create bill:', error);
      
      // Handle duplicate bill error specifically
      if (error.response?.status === 409 && error.response?.data?.existing_bill_id) {
        const existingBillId = error.response.data.existing_bill_id;
        addToast('Bill already exists for this appointment', 'warning');
        
        // Don't auto-open existing receipt - let user click to view when needed
        /*
        try {
          const detail = await api.get(`/api/bills/${existingBillId}`);
          const existingBill = detail.data?.bill || detail.data?.data?.bill || null;
          if (existingBill) {
            setViewingReceipt(existingBill);
            // Remove from unbilled list
            setPayments(prev => prev.filter(v => v.appointment_id !== billCreationModal.appointment_id));
            fetchSummary();
            fetchPayments();
          }
        } catch (fetchError) {
          console.error('Failed to fetch existing bill:', fetchError);
          addToast('Failed to load existing bill', 'error');
        }
        */
      } else {
        const errorMsg = error.response?.data?.error || error.message || 'Failed to create bill';
        addToast(errorMsg, 'error');
      }
    }
  };

  return (
    <div className="space-y-4">
      <HeaderBar title="Payments" />

      {/* Tabs for Billed/Unbilled/Pending */}
      <div className="bg-white rounded shadow-sm border">
        <div className="flex border-b">
          <button
            onClick={() => {
              setActiveTab('billed');
              setBilledPagination({ ...billedPagination, page: 1 });
            }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'billed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Billed Payments ({billedPayments.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('unbilled');
              setUnbilledPagination({ ...unbilledPagination, page: 1 });
            }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'unbilled'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Unbilled Visits ({unbilledVisits.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('pending');
              setPendingPagination({ ...pendingPagination, page: 1 });
            }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Pending Payments ({pendingPayments.length})
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded shadow-sm border">
          <p className="text-xs text-slate-500 mb-1">Total Bills</p>
          <p className="text-2xl font-semibold">{summary.total}</p>
        </div>
        <div className="p-4 bg-white rounded shadow-sm border">
          <p className="text-xs text-slate-500 mb-1">Unbilled Visits</p>
          <p className="text-2xl font-semibold text-orange-600">{summary.unbilled_visits}</p>
        </div>
        <div className="p-4 bg-white rounded shadow-sm border">
          <p className="text-xs text-slate-500 mb-1">Pending Payments</p>
          <p className="text-2xl font-semibold text-yellow-600">{summary.pending_payment}</p>
        </div>
        <div className="p-4 bg-white rounded shadow-sm border">
          <p className="text-xs text-slate-500 mb-1">Paid</p>
          <p className="text-2xl font-semibold text-green-600">{summary.paid?.count || 0} (₹{Number(summary.paid?.total || 0).toFixed(2)})</p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="bg-white rounded shadow-sm border p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            id="search-input"
            name="search"
            placeholder="Search by Phone / Name / UHID"
            className="flex-1 px-3 py-2 border rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchPayments();
              }
            }}
          />
          <select
            className="px-3 py-2 border rounded"
            value={filters.paymode}
            onChange={(e) => setFilters({ ...filters, paymode: e.target.value })}
          >
            <option value="">All Paymodes</option>
            {paymentMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border rounded"
            value={filters.service}
            onChange={(e) => setFilters({ ...filters, service: e.target.value })}
          >
            <option value="">All Services</option>
            {serviceOptions.map(service => (
              <option key={service.name} value={service.name}>{service.name}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border rounded"
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="last7days">Last 7 Days</option>
            <option value="thisweek">This Week</option>
            <option value="thismonth">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
          >
            <FiDownload className="inline mr-2" />
            Download Report
          </button>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <div className="flex gap-4">
            <input
              type="date"
              id="start-date"
              name="start_date"
              className="px-3 py-2 border rounded"
              placeholder="Start Date"
              value={customDateRange.start}
              onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
            />
            <input
              type="date"
              id="end-date"
              name="end_date"
              className="px-3 py-2 border rounded"
              placeholder="End Date"
              value={customDateRange.end}
              onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
            />
          </div>
        )}
      </section>

      {/* Payments Table */}
      <section className="bg-white rounded shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">S.NO</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">PATIENT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">SERVICE</th>
                {activeTab === 'billed' ? (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">AMOUNT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">PAID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">STATUS</th>
                  </>
                ) : activeTab === 'pending' ? (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">TOTAL AMOUNT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">PAID AMOUNT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">BALANCE</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">DOCTOR</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">CONSULTATION FEE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">PAID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">REMAINING</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">DATE</th>
                  </>
                )}
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
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'billed' ? 7 : activeTab === 'pending' ? 7 : 8} className="px-4 py-8 text-center text-slate-500">
                    {activeTab === 'billed' ? 'No billed payments found' : 
                     activeTab === 'pending' ? 'No pending payments found' : 
                     'No unbilled visits found'}
                  </td>
                </tr>
              ) : (
                payments.map((payment, index) => (
                  <Fragment key={payment.id || payment.appointment_id}>
                    <tr className={`${payment.bill_type === 'unbilled' ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">{payment.patient_name || 'N/A'}</div>
                          <div className="text-xs text-slate-500">{payment.patient_id || payment.patient_uhid || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {payment.service_name || 
                         (payment.bill_type === 'unbilled' 
                           ? payment.consultation_type || 'Consultation'
                           : 'N/A')}
                      </td>
                      {activeTab === 'billed' ? (
                        <>
                          <td className="px-4 py-3 text-sm font-medium">
                            ₹{payment.total_amount || 0}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            ₹{payment.amount_paid || 0}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              payment.status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : payment.status === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {payment.status || 'pending'}
                            </span>
                          </td>
                        </>
                      ) : activeTab === 'pending' ? (
                        <>
                          <td className="px-4 py-3 text-sm font-medium">
                            ₹{payment.total_amount || 0}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            ₹{payment.amount_paid || 0}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-orange-600">
                            ₹{(payment.total_amount || 0) - (payment.amount_paid || 0)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm">
                            {payment.doctor_name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            ₹{payment.consultation_fee || 500}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600">
                            ₹{payment.paid_amount || 0}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-orange-600">
                            ₹{payment.remaining_amount || (payment.consultation_fee || 500)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {new Date(payment.appointment_date).toLocaleDateString()}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-1">
                          {payment.bill_type === 'unbilled' ? (
                            <>
                              {payment.source_type === 'appointment' ? (
                                <button
                                  onClick={() => {
                                    setBillCreationModal(payment);
                                    setBillServices([{
                                      service: payment.service_name || 'Consultation',
                                      qty: 1,
                                      days: 1,
                                      amount: payment.consultation_fee || 500,
                                      discount: 0
                                    }]);
                                    setBillDate(new Date().toISOString().split('T')[0]); // Reset to today
                                  }}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Create Bill
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setViewingReceipt(payment);
                                  }}
                                  className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                  View Bill
                                </button>
                              )}
                              {payment.source_type === 'bill' && payment.remaining_amount > 0 && (
                                <button
                                  onClick={() => {
                                    setPaymentModal(payment);
                                    setPaymentAmount('');
                                  }}
                                  className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                                >
                                  Add Payment
                                </button>
                              )}
                              <div className="relative">
                                <button
                                  onClick={() => setEditingStatus(payment)}
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Update Status
                                </button>
                              </div>
                              {/* Delete unbilled visit button */}
                              <button
                                onClick={async () => {
                                  if (window.confirm('Delete this unbilled visit?')) {
                                    try {
                                      await api.delete(`/api/bills/unbilled-visits/${payment.id}`);
                                      addToast('Unbilled visit deleted', 'success');
                                      fetchPayments();
                                      fetchSummary();
                                    } catch (error) {
                                      console.error('Failed to delete unbilled visit:', error);
                                      addToast('Failed to delete unbilled visit', 'error');
                                    }
                                  }
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete Unbilled Visit"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditReceipt(payment)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit Receipt"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => handlePrintReceipt(payment)}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                title="Print Receipt"
                              >
                                <FiPrinter size={16} />
                              </button>
                              <button
                                onClick={() => handleSendReceipt(payment)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Send WhatsApp"
                              >
                                <FiSend size={16} />
                              </button>
                              {/* Delete button for pending payments only */}
                              {activeTab === 'pending' && payment.payment_status === 'pending' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('Delete this pending bill?')) {
                                      handleDeletePayment(payment.id);
                                    }
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete Pending Bill"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {((activeTab === 'billed' && billedPagination.totalPages > 1) || 
          (activeTab === 'unbilled' && unbilledPagination.totalPages > 1) ||
          (activeTab === 'pending' && pendingPagination.totalPages > 1)) && (
          <div className="px-4 py-3 border-t bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                Showing {((activeTab === 'billed' ? billedPagination : 
                            activeTab === 'unbilled' ? unbilledPagination : 
                            pendingPagination).page - 1) * 
                      (activeTab === 'billed' ? billedPagination : 
                       activeTab === 'unbilled' ? unbilledPagination : 
                       pendingPagination).limit + 1} to{' '}
                {Math.min((activeTab === 'billed' ? billedPagination : 
                          activeTab === 'unbilled' ? unbilledPagination : 
                          pendingPagination).page * 
                          (activeTab === 'billed' ? billedPagination : 
                           activeTab === 'unbilled' ? unbilledPagination : 
                           pendingPagination).limit, 
                          (activeTab === 'billed' ? billedPagination : 
                           activeTab === 'unbilled' ? unbilledPagination : 
                           pendingPagination).total)} of{' '}
                {(activeTab === 'billed' ? billedPagination : 
                  activeTab === 'unbilled' ? unbilledPagination : 
                  pendingPagination).total} entries
              </div>
              <select
                value={activeTab === 'billed' ? billedPagination.limit : 
                       activeTab === 'unbilled' ? unbilledPagination.limit : 
                       pendingPagination.limit}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value);
                  if (activeTab === 'billed') {
                    setBilledPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
                  } else if (activeTab === 'unbilled') {
                    setUnbilledPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
                  } else {
                    setPendingPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
                  }
                }}
                className="px-2 py-1 text-sm border rounded"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (activeTab === 'billed') {
                    setBilledPagination(prev => ({ ...prev, page: prev.page - 1 }));
                  } else if (activeTab === 'unbilled') {
                    setUnbilledPagination(prev => ({ ...prev, page: prev.page - 1 }));
                  } else {
                    setPendingPagination(prev => ({ ...prev, page: prev.page - 1 }));
                  }
                }}
                disabled={!(activeTab === 'billed' ? billedPagination.hasPrev : 
                           activeTab === 'unbilled' ? unbilledPagination.hasPrev : 
                           pendingPagination.hasPrev)}
                className={`px-3 py-1 text-sm rounded ${
                  (activeTab === 'billed' ? billedPagination.hasPrev : 
                   activeTab === 'unbilled' ? unbilledPagination.hasPrev : 
                   pendingPagination.hasPrev)
                    ? 'bg-white border hover:bg-slate-50'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {activeTab === 'billed' ? billedPagination.page : 
                      activeTab === 'unbilled' ? unbilledPagination.page : 
                      pendingPagination.page} of{' '}
                {activeTab === 'billed' ? billedPagination.totalPages : 
                 activeTab === 'unbilled' ? unbilledPagination.totalPages : 
                 pendingPagination.totalPages}
              </span>
              <button
                onClick={() => {
                  if (activeTab === 'billed') {
                    setBilledPagination(prev => ({ ...prev, page: prev.page + 1 }));
                  } else if (activeTab === 'unbilled') {
                    setUnbilledPagination(prev => ({ ...prev, page: prev.page + 1 }));
                  } else {
                    setPendingPagination(prev => ({ ...prev, page: prev.page + 1 }));
                  }
                }}
                disabled={!(activeTab === 'billed' ? billedPagination.hasNext : 
                           activeTab === 'unbilled' ? unbilledPagination.hasNext : 
                           pendingPagination.hasNext)}
                className={`px-3 py-1 text-sm rounded ${
                  (activeTab === 'billed' ? billedPagination.hasNext : 
                   activeTab === 'unbilled' ? unbilledPagination.hasNext : 
                   pendingPagination.hasNext)
                    ? 'bg-white border hover:bg-slate-50'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Bill Creation Modal */}
      {billCreationModal && (
        <Modal
          isOpen={!!billCreationModal}
          onClose={() => {
            setBillCreationModal(null);
            setSelectedTemplate(null);
          }}
          title={`Create Bill - ${billCreationModal.patient_name}`}
          size="lg"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Patient Info */}
            <div className="bg-slate-50 p-3 rounded">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Patient Name</p>
                  <p className="font-medium">{billCreationModal.patient_name}</p>
                </div>
                <div>
                  <p className="text-slate-500">UHID</p>
                  <p className="font-medium">{billCreationModal.patient_uhid || billCreationModal.patient_id}</p>
                </div>
                <div>
                  <p className="text-slate-500">Contact</p>
                  <p className="font-medium">{billCreationModal.patient_phone || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Doctor</p>
                  <p className="font-medium">Dr. {billCreationModal.doctor_name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Bill Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bill Date</label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={billPaymentMethod}
                  onChange={(e) => setBillPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method.toLowerCase().replace(' ', '_')}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Receipt Template (Optional)</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = receiptTemplates.find(t => t.id === parseInt(e.target.value));
                  setSelectedTemplate(template || null);
                }}
              >
                <option value="">No Template (Default)</option>
                {receiptTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.template_name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <p className="text-xs text-slate-500 mt-1">
                  Template: {selectedTemplate.template_name} will be used as service name
                </p>
              )}
            </div>

            {/* Services */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-sm">Services</h3>
                <button
                  onClick={handleAddService}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  + Add Service
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold">SERVICE</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold w-16">QTY</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold w-16">DAYS</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold w-24">AMOUNT</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold w-20">DISCOUNT</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold w-20">TOTAL</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold w-12">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billServices.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-3 py-2">
                          <select
                            value={item.service || ''}
                            onChange={(e) => handleServiceChange(index, 'service', e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded"
                          >
                            <option value="">Select service</option>
                            {serviceOptions.map(s => (
                              <option key={s.name} value={s.name}>{s.name} (₹{s.price})</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            id={`qty-${index}`}
                            name={`qty-${index}`}
                            value={item.qty}
                            onChange={(e) => handleServiceChange(index, 'qty', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right"
                            min="1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            id={`days-${index}`}
                            name={`days-${index}`}
                            value={item.days || 1}
                            onChange={(e) => handleServiceChange(index, 'days', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right"
                            min="1"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            id={`amount-${index}`}
                            name={`amount-${index}`}
                            value={item.amount}
                            onChange={(e) => handleServiceChange(index, 'amount', e.target.value)}
                            className="w-24 px-2 py-1 border rounded text-right"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            id={`discount-${index}`}
                            name={`discount-${index}`}
                            value={item.discount}
                            onChange={(e) => handleServiceChange(index, 'discount', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-right"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          ₹{Number((((item.amount || 0) * (item.qty || 1) * (item.days || 1)) - (item.discount || 0))).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleRemoveService(index)}
                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Sub-Total:</span>
                <span className="font-medium">₹{Number(getSubtotal()).toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <label className="w-20">Tax (%):</label>
                <input
                  type="number"
                  id="tax-input"
                  name="tax"
                  value={billTax}
                  onChange={(e) => setBillTax(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border rounded"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="font-medium text-right flex-1">₹{Number(getTaxAmount()).toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <label className="w-20">Discount:</label>
                <input
                  type="number"
                  id="discount-input"
                  name="discount"
                  value={billDiscount}
                  onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border rounded"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex justify-between text-lg font-semibold border-t pt-3">
                <span>Grand Total:</span>
                <span className="text-green-600">₹{Number(getGrandTotal()).toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setBillCreationModal(null);
                  setSelectedTemplate(null);
                }}
                className="flex-1 px-4 py-2 border rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBill}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                Create Bill
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Receipt View Modal */}
      {editingPayment && (
        <Modal
          isOpen={!!editingPayment}
          onClose={() => setEditingPayment(null)}
          title="Edit Payment"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                id="payment-amount"
                name="payment_amount"
                className="w-full px-3 py-2 border rounded"
                value={editingPayment.total_amount || 0}
                onChange={(e) => setEditingPayment({ ...editingPayment, total_amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={editingPayment.payment_method || 'cash'}
                onChange={(e) => setEditingPayment({ ...editingPayment, payment_method: e.target.value })}
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method.toLowerCase().replace(' ', '_')}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Status</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={editingPayment.payment_status || 'pending'}
                onChange={(e) => setEditingPayment({ ...editingPayment, payment_status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditingPayment(null)}
                className="flex-1 px-4 py-2 border rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleUpdatePayment(editingPayment.id, 'payment_status', editingPayment.payment_status);
                  await handleUpdatePayment(editingPayment.id, 'payment_method', editingPayment.payment_method);
                  setEditingPayment(null);
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}



      {/* View Receipt Modal */}
      {viewingReceipt && (
        <Modal
          isOpen={!!viewingReceipt}
          onClose={() => setViewingReceipt(null)}
          title="Receipt Preview"
        >
          <div id="receipt-view-area" className="space-y-6">
            {/* Clinic Header */}
            <div className="text-center border-b pb-4">
              {viewingReceipt.clinic_logo && (
                <img
                  src={viewingReceipt.clinic_logo}
                  alt="Clinic Logo"
                  className="h-16 mx-auto mb-2"
                />
              )}
              <h2 className="text-xl font-bold">{viewingReceipt.clinic_name || 'Clinic'}</h2>
              <p className="text-sm text-slate-600">
                {viewingReceipt.clinic_address && `${viewingReceipt.clinic_address}, `}
                {viewingReceipt.clinic_city && `${viewingReceipt.clinic_city}, `}
                {viewingReceipt.clinic_state && `${viewingReceipt.clinic_state} `}
                {viewingReceipt.clinic_pincode}
              </p>
              <p className="text-sm text-slate-600">
                {viewingReceipt.clinic_phone && `Phone: ${viewingReceipt.clinic_phone}`}
                {viewingReceipt.clinic_email && ` | Email: ${viewingReceipt.clinic_email}`}
              </p>
            </div>

            {/* Receipt Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Receipt No:</p>
                <p className="font-medium">#{viewingReceipt.id}</p>
              </div>
              <div>
                <p className="text-slate-500">Date:</p>
                <p className="font-medium">
                  {new Date(viewingReceipt.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Patient Name:</p>
                <p className="font-medium">{viewingReceipt.patient_name}</p>
              </div>
              <div>
                <p className="text-slate-500">UHID:</p>
                <p className="font-medium">{viewingReceipt.patient_uhid}</p>
              </div>
              {viewingReceipt.patient_phone && (
                <div>
                  <p className="text-slate-500">Phone:</p>
                  <p className="font-medium">{viewingReceipt.patient_phone}</p>
                </div>
              )}
              {viewingReceipt.doctor_name && (
                <div>
                  <p className="text-slate-500">Doctor:</p>
                  <p className="font-medium">{viewingReceipt.doctor_name}</p>
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span>{viewingReceipt.service_name || 'Consultation'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>₹{viewingReceipt.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>₹{viewingReceipt.discount_amount || 0}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{viewingReceipt.total_amount - (viewingReceipt.discount_amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="capitalize">{viewingReceipt.payment_method?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`capitalize px-2 py-1 rounded text-xs ${
                    viewingReceipt.payment_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {viewingReceipt.payment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            {(viewingReceipt.template_footer || viewingReceipt.notes) && (
              <div className="border-t pt-4 text-sm text-slate-600">
                {viewingReceipt.template_footer && (
                  <div dangerouslySetInnerHTML={{ __html: viewingReceipt.template_footer }} />
                )}
                {viewingReceipt.notes && (
                  <p className="mt-2">Notes: {viewingReceipt.notes}</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => handlePrintReceipt(viewingReceipt)}
                className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 flex items-center justify-center gap-2"
              >
                <FiPrinter /> Print
              </button>
              <button
                onClick={() => handleSendReceipt(viewingReceipt)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <FiSend /> Send
              </button>
              <button
                onClick={() => setViewingReceipt(null)}
                className="flex-1 px-4 py-2 border rounded hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Edit Modal */}
      {editingStatus && (
        <Modal
          isOpen={true}
          onClose={() => {
            setEditingStatus(null);
            setNewStatus('');
            setPartialPaymentAmount('');
          }}
          title="Update Payment Status"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient: {editingStatus.patient_name}
              </label>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date: {new Date(editingStatus.appointment_date).toLocaleDateString()}
              </label>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Total Amount: ₹{editingStatus.total_amount || editingStatus.consultation_fee || 0}
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={newStatus}
                onChange={(e) => {
                  setNewStatus(e.target.value);
                  if (e.target.value !== 'partial') {
                    setPartialPaymentAmount('');
                  }
                }}
              >
                <option value="">Select Status</option>
                <option value="paid">Paid (Full Payment)</option>
                <option value="partial">Partially Paid</option>
              </select>
            </div>

            {newStatus === 'partial' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount Paid
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter amount paid"
                  value={partialPaymentAmount}
                  onChange={(e) => setPartialPaymentAmount(e.target.value)}
                  min="0"
                  max={editingStatus.total_amount || editingStatus.consultation_fee || 0}
                />
                {partialPaymentAmount && (
                  <div className="mt-2 text-sm">
                    <span className="text-green-600">Paid: ₹{partialPaymentAmount}</span>
                    <span className="mx-2">|</span>
                    <span className="text-orange-600">
                      Remaining: ₹{(editingStatus.total_amount || editingStatus.consultation_fee || 0) - parseFloat(partialPaymentAmount || 0)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  if (newStatus === 'partial' && !partialPaymentAmount) {
                    addToast('Please enter amount paid for partial payment', 'error');
                    return;
                  }
                  handleUpdateAppointmentStatus();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update Status
              </button>
              <button
                onClick={() => {
                  setEditingStatus(null);
                  setNewStatus('');
                  setPartialPaymentAmount('');
                }}
                className="flex-1 px-4 py-2 border rounded hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setPaymentModal(null);
            setPaymentAmount('');
          }}
          title="Add Payment"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient: {paymentModal.patient_name}
              </label>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Total Amount: ₹{paymentModal.consultation_fee || paymentModal.total_amount}
              </label>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Already Paid: ₹{paymentModal.paid_amount || 0}
              </label>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Remaining: ₹{paymentModal.remaining_amount}
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Amount
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={paymentModal.remaining_amount}
                min="1"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handlePartialPayment}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Payment
              </button>
              <button
                onClick={() => {
                  setPaymentModal(null);
                  setPaymentAmount('');
                }}
                className="flex-1 px-4 py-2 border rounded hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

