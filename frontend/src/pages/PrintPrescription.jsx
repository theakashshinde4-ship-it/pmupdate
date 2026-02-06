import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { FiPrinter, FiDownload, FiShare2, FiMail } from 'react-icons/fi';
import api from '../services/api';

const PrintPrescription = () => {
  const { prescriptionId } = useParams();
  const location = useLocation();
  const billId = new URLSearchParams(location.search).get('billId');
  
  const [prescription, setPrescription] = useState(null);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  // Fetch prescription and bill details
  const fetchData = async () => {
    try {
      const [presRes, billRes] = await Promise.all([
        api.get(`/api/prescriptions/${prescriptionId}`),
        billId ? api.get(`/api/bills/${billId}`) : Promise.resolve({ data: null })
      ]);

      if (presRes.data?.success) {
        setPrescription(presRes.data.data);
      }
      if (billRes.data?.success) {
        setBill(billRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Print prescription
  const handlePrint = () => {
    setPrinting(true);
    window.print();
    setTimeout(() => setPrinting(false), 1000);
  };

  // Download PDF
  const downloadPDF = async () => {
    try {
      const res = await api.get(`/api/pdf/prescription/${prescriptionId}?billId=${billId}`);
      if (res.data?.pdfUrl) {
        const link = document.createElement('a');
        link.href = res.data.pdfUrl;
        link.download = `prescription_${prescriptionId}.pdf`;
        link.click();
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  // Share via WhatsApp
  const shareWhatsApp = async () => {
    try {
      const res = await api.post(`/api/prescriptions/${prescriptionId}/share`, {
        method: 'whatsapp',
        billId
      });
      if (res.data?.shareUrl) {
        window.open(res.data.shareUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
    }
  };

  // Email prescription
  const emailPrescription = async () => {
    try {
      const email = prompt('Enter email address:');
      if (email) {
        const res = await api.post(`/api/prescriptions/${prescriptionId}/share`, {
          method: 'email',
          email,
          billId
        });
        if (res.data?.success) {
          alert('Prescription sent successfully!');
        }
      }
    } catch (error) {
      console.error('Error emailing prescription:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [prescriptionId, billId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Prescription not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Actions */}
      <div className="no-print bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold">Prescription & Bill</h1>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                disabled={printing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                <FiPrinter />
                {printing ? 'Printing...' : 'Print'}
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <FiDownload />
                Download PDF
              </button>
              <button
                onClick={shareWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <FiShare2 />
                WhatsApp
              </button>
              <button
                onClick={emailPrescription}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                <FiMail />
                Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">OM HOSPITAL</h1>
                <p className="text-gray-600">123 Medical Complex, Main Road</p>
                <p className="text-gray-600">City, State - 123456</p>
                <p className="text-gray-600">Phone: +91 1234567890 | Email: info@drjaju.com</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  <p>Date: {new Date(prescription.created_at).toLocaleDateString()}</p>
                  <p>Time: {new Date(prescription.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient & Doctor Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">PATIENT DETAILS</h3>
              <div className="space-y-1">
                <p><span className="font-medium">Name:</span> {prescription.patient?.name}</p>
                <p><span className="font-medium">Age/Gender:</span> {prescription.patient?.age}y, {prescription.patient?.gender}</p>
                <p><span className="font-medium">Phone:</span> {prescription.patient?.phone}</p>
                <p><span className="font-medium">Address:</span> {prescription.patient?.address}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">DOCTOR DETAILS</h3>
              <div className="space-y-1">
                <p><span className="font-medium">Name:</span> Dr. {prescription.doctor?.name}</p>
                <p><span className="font-medium">Specialization:</span> {prescription.doctor?.specialization}</p>
                <p><span className="font-medium">Reg. No:</span> {prescription.doctor?.registration_number}</p>
                <p><span className="font-medium">Signature:</span></p>
                <div className="h-12 border-b border-gray-400 mt-2"></div>
              </div>
            </div>
          </div>

          {/* Vitals */}
          {prescription.vitals && Object.keys(prescription.vitals).length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">VITALS</h3>
              <div className="grid grid-cols-4 gap-4 bg-gray-50 p-3 rounded">
                {prescription.vitals.temp && (
                  <div>
                    <span className="text-sm text-gray-600">Temperature:</span>
                    <span className="ml-2 font-medium">{prescription.vitals.temp}°F</span>
                  </div>
                )}
                {prescription.vitals.blood_pressure && (
                  <div>
                    <span className="text-sm text-gray-600">BP:</span>
                    <span className="ml-2 font-medium">{prescription.vitals.blood_pressure}</span>
                  </div>
                )}
                {prescription.vitals.pulse && (
                  <div>
                    <span className="text-sm text-gray-600">Pulse:</span>
                    <span className="ml-2 font-medium">{prescription.vitals.pulse}</span>
                  </div>
                )}
                {prescription.vitals.weight && (
                  <div>
                    <span className="text-sm text-gray-600">Weight:</span>
                    <span className="ml-2 font-medium">{prescription.vitals.weight}kg</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Symptoms */}
          {prescription.symptoms && prescription.symptoms.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">SYMPTOMS</h3>
              <div className="bg-gray-50 p-3 rounded">
                {prescription.symptoms.map((symptom, index) => (
                  <p key={index} className="mb-1">• {symptom}</p>
                ))}
              </div>
            </div>
          )}

          {/* Diagnosis */}
          {prescription.diagnoses && prescription.diagnoses.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">DIAGNOSIS</h3>
              <div className="bg-gray-50 p-3 rounded">
                {prescription.diagnoses.map((diagnosis, index) => (
                  <p key={index} className="mb-1">• {diagnosis}</p>
                ))}
              </div>
            </div>
          )}

          {/* Medicines */}
          {prescription.medicines && prescription.medicines.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">PRESCRIPTION</h3>
              <div className="border border-gray-300 rounded">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">Medicine</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Dosage</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Frequency</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescription.medicines.map((med, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 text-sm">{med.name || med.brand}</td>
                        <td className="px-4 py-2 text-sm">{med.dosage || '-'}</td>
                        <td className="px-4 py-2 text-sm">{med.frequency || '-'}</td>
                        <td className="px-4 py-2 text-sm">{med.duration || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Advice */}
          {prescription.advice && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">ADVICE</h3>
              <div className="bg-gray-50 p-3 rounded">
                <p className="whitespace-pre-line">{prescription.advice}</p>
              </div>
            </div>
          )}

          {/* Follow-up */}
          {prescription.follow_up && (prescription.follow_up.days || prescription.follow_up.date) && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">FOLLOW-UP</h3>
              <div className="bg-gray-50 p-3 rounded">
                {prescription.follow_up.days && (
                  <p>After {prescription.follow_up.days} days</p>
                )}
                {prescription.follow_up.date && (
                  <p>Date: {new Date(prescription.follow_up.date).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          )}

          {/* Bill Section */}
          {bill && (
            <div className="border-t-2 border-gray-800 pt-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">BILL DETAILS</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Consultation Fee:</span>
                  <span>₹{bill.consultation_fee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medicine Charges:</span>
                  <span>₹{bill.medicine_total}</span>
                </div>
                {bill.procedure_total > 0 && (
                  <div className="flex justify-between">
                    <span>Procedure Charges:</span>
                    <span>₹{bill.procedure_total}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Amount:</span>
                  <span>₹{bill.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    bill.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bill.payment_status}
                  </span>
                </div>
                {bill.payment_method && (
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span>{bill.payment_method}</span>
                  </div>
                )}
                {bill.paid_at && (
                  <div className="flex justify-between">
                    <span>Paid On:</span>
                    <span>{new Date(bill.paid_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center text-sm text-gray-600">
            <p>This is a computer-generated prescription and does not require signature.</p>
            <p>For any queries, please contact the hospital.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintPrescription;
