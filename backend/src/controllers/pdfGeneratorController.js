// =====================================================
// PDF GENERATOR CONTROLLER
// Purpose: Generate PDFs for prescriptions, bills, certificates, referrals
// Version: 1.0
// =====================================================

const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const html2canvas = require('html2canvas');
const puppeteer = require('puppeteer');
const { getDb } = require('../config/db');
const path = require('path');

// =====================================================
// PRESCRIPTION PDF
// =====================================================

exports.generatePrescriptionPDF = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    
    console.log('🔍 Generating PDF for prescription ID:', prescriptionId);

    const db = getDb();

    // Fetch prescription data
    console.log('🔍 Fetching prescription data...');
    const [prescriptions] = await db.execute(`
      SELECT
        p.id,
        p.patient_id,
        p.doctor_id,
        p.prescribed_date,
        p.chief_complaint,
        p.advice,
        p.diagnosis,
        pa.name as patient_name,
        pa.phone as patient_phone,
        pa.email as patient_email,
        pa.dob,
        pa.age_years,
        pa.gender,
        u.name as doctor_name,
        d.specialization,
        c.name as clinic_name,
        c.phone as clinic_phone,
        c.address as clinic_address
      FROM prescriptions p
      JOIN patients pa ON p.patient_id = pa.id
      JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      JOIN clinics c ON d.clinic_id = c.id
      WHERE p.id = ?
    `, [prescriptionId]);

    console.log('🔍 Found prescriptions:', prescriptions.length);

    if (prescriptions.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const prescription = prescriptions[0];
    console.log('🔍 Prescription data:', prescription);

    // Fetch prescription items (medicines)
    console.log('🔍 Fetching prescription items...');
    const [items] = await db.execute(`
      SELECT
        pi.id,
        pi.medicine_id,
        pi.medicine_name,
        pi.dosage,
        pi.frequency,
        pi.duration,
        pi.notes as instructions
      FROM prescription_items pi
      WHERE pi.prescription_id = ?
    `, [prescriptionId]);

    console.log('🔍 Found items:', items.length);

    // Generate PDF
    console.log('🔍 Starting PDF generation...');
    const doc = new jsPDF('p', 'mm', 'A4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text(prescription.clinic_name || 'Clinic', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${prescription.clinic_address || ''}`, pageWidth / 2, yPosition, { align: 'center' });
    doc.text(`Phone: ${prescription.clinic_phone || 'N/A'}`, pageWidth / 2, yPosition + 5, { align: 'center' });

    // Horizontal line
    yPosition += 15;
    doc.setDrawColor(0, 51, 102);
    doc.line(15, yPosition, pageWidth - 15, yPosition);

    // Prescription Header
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('PRESCRIPTION', 15, yPosition);

    // Doctor Info
    yPosition += 12;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Doctor: Dr. ${prescription.doctor_name || 'N/A'}`, 15, yPosition);
    doc.text(`Specialization: ${prescription.specialization || 'General'}`, 15, yPosition + 6);
    
    // Patient Info
    yPosition += 16;
    doc.setFont(undefined, 'bold');
    doc.text('Patient Information:', 15, yPosition);

    yPosition += 8;
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${prescription.patient_name || 'N/A'}`, 15, yPosition);
    yPosition += 6;
    doc.text(`Age: ${prescription.age_years || 'N/A'} years | Gender: ${prescription.gender || 'N/A'}`, 15, yPosition);
    yPosition += 6;
    doc.text(`Phone: ${prescription.patient_phone || 'N/A'} | Email: ${prescription.patient_email || 'N/A'}`, 15, yPosition);
    yPosition += 6;
    doc.text(`Date: ${prescription.prescribed_date ? new Date(prescription.prescribed_date).toLocaleDateString() : 'N/A'}`, 15, yPosition);

    // Diagnosis
    if (prescription.diagnosis) {
      yPosition += 12;
      doc.setFont(undefined, 'bold');
      doc.text('Diagnosis:', 15, yPosition);

      yPosition += 6;
      doc.setFont(undefined, 'normal');
      const splitDiagnosis = doc.splitTextToSize(prescription.diagnosis, pageWidth - 30);
      doc.text(splitDiagnosis, 20, yPosition);
      yPosition += splitDiagnosis.length * 5;
    }

    // Medicines
    yPosition += 12;
    doc.setFont(undefined, 'bold');
    doc.text('Medications:', 15, yPosition);

    yPosition += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    // Table headers
    const medicineTableHeaders = ['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions'];
    const medicineTableData = items.map(item => [
      item.medicine_name,
      item.dosage || '-',
      item.frequency || '-',
      item.duration || '-',
      item.instructions || '-'
    ]);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        head: [medicineTableHeaders],
        body: medicineTableData,
        startY: yPosition,
        margin: 15,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 35 }
        }
      });
    } else {
      medicineTableData.forEach((row) => {
        doc.text(`- ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]}`, 15, yPosition);
        yPosition += 6;
      });
      doc.lastAutoTable = { finalY: yPosition };
    }

    // Chief Complaint
    if (prescription.chief_complaint) {
      yPosition = doc.lastAutoTable.finalY + 12;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('Chief Complaint:', 15, yPosition);

      yPosition += 6;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const splitComplaint = doc.splitTextToSize(prescription.chief_complaint, pageWidth - 30);
      doc.text(splitComplaint, 15, yPosition);
      yPosition += splitComplaint.length * 5;
    } else {
      yPosition = doc.lastAutoTable.finalY;
    }

    // Advice
    if (prescription.advice) {
      yPosition += 12;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('Advice:', 15, yPosition);

      yPosition += 6;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const splitAdvice = doc.splitTextToSize(prescription.advice, pageWidth - 30);
      doc.text(splitAdvice, 15, yPosition);
      yPosition += splitAdvice.length * 5;
    }

    // Footer
    doc.setFont(undefined, 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by Patient Management System', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Send PDF
    console.log('🔍 Generating PDF data...');
    const pdfData = doc.output('arraybuffer');
    console.log('🔍 PDF data generated, size:', pdfData.byteLength);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prescription_${prescriptionId}.pdf"`);
    console.log('🔍 Sending PDF response...');
    res.send(Buffer.from(pdfData));
    console.log('🔍 PDF sent successfully');

  } catch (error) {
    console.error('🔍 Error generating prescription PDF:', error);
    console.error('🔍 Error code:', error.code);
    console.error('🔍 Error errno:', error.errno);
    console.error('🔍 Error sqlState:', error.sqlState);
    console.error('🔍 Error sqlMessage:', error.sqlMessage);
    console.error('🔍 Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
  }
};

// =====================================================
// BILLING/INVOICE PDF
// =====================================================

exports.generateBillingPDF = async (req, res) => {
  try {
    const { billId } = req.params;

    const db = getDb();

    // Fetch bill data
    const [bills] = await db.execute(`
      SELECT 
        b.id,
        b.patient_id,
        b.bill_date,
        b.total_amount,
        b.discount_amount,
        b.total_amount - b.discount_amount as net_amount,
        b.payment_status,
        b.notes,
        pa.name as patient_name,
        pa.phone as patient_phone,
        pa.email as patient_email,
        c.name as clinic_name,
        c.address as clinic_address,
        c.phone as clinic_phone
      FROM bills b
      JOIN patients pa ON b.patient_id = pa.id
      JOIN clinics c ON b.clinic_id = c.id
      WHERE b.id = ?
    `, [billId]);

    if (bills.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const bill = bills[0];

    // Fetch bill items
    const [items] = await db.execute(`
      SELECT 
        service_name as description,
        quantity,
        unit_price,
        total_price as amount
      FROM bill_items
      WHERE bill_id = ?
    `, [billId]);

    // Generate PDF
    const doc = new jsPDF('p', 'mm', 'A4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text(bill.clinic_name, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${bill.clinic_address}`, pageWidth / 2, yPosition, { align: 'center' });
    doc.text(`Phone: ${bill.clinic_phone}`, pageWidth / 2, yPosition + 5, { align: 'center' });

    // Horizontal line
    yPosition += 15;
    doc.setDrawColor(0, 51, 102);
    doc.line(15, yPosition, pageWidth - 15, yPosition);

    // Invoice Header
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE / BILL', 15, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Bill #: ${bill.id}`, pageWidth - 50, yPosition);

    // Patient Info
    yPosition += 12;
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 15, yPosition);
    
    yPosition += 6;
    doc.setFont(undefined, 'normal');
    doc.text(`${bill.patient_name}`, 15, yPosition);
    doc.text(`Phone: ${bill.patient_phone}`, 15, yPosition + 6);
    doc.text(`Email: ${bill.patient_email}`, 15, yPosition + 12);

    // Bill Date
    yPosition += 20;
    doc.text(`Date: ${new Date(bill.bill_date).toLocaleDateString()}`, pageWidth - 50, yPosition);

    // Items Table
    yPosition += 12;
    doc.setFont(undefined, 'bold');
    doc.text('Items:', 15, yPosition);

    yPosition += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    const itemTableHeaders = ['Description', 'Service', 'Qty', 'Unit Price', 'Amount'];
    const itemTableData = items.map(item => [
      item.description,
      'Service',  // Default service type since item_type doesn't exist
      item.quantity.toString(),
      `₹${item.unit_price.toFixed(2)}`,
      `₹${item.amount.toFixed(2)}`
    ]);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        head: [itemTableHeaders],
        body: itemTableData,
        startY: yPosition,
        margin: 15,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 }
        }
      });
    } else {
      itemTableData.forEach((row) => {
        doc.text(`- ${row[0]} | ${row[2]} x ${row[3]} = ${row[4]}`, 15, yPosition);
        yPosition += 6;
      });
      doc.lastAutoTable = { finalY: yPosition };
    }

    // Summary
    yPosition = doc.lastAutoTable.finalY + 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text(`Total Amount:`, pageWidth - 80, yPosition);
    doc.text(`₹${bill.total_amount.toFixed(2)}`, pageWidth - 30, yPosition, { align: 'right' });

    yPosition += 7;
    doc.text(`Discount:`, pageWidth - 80, yPosition);
    doc.text(`-₹${bill.discount_amount.toFixed(2)}`, pageWidth - 30, yPosition, { align: 'right' });

    yPosition += 7;
    doc.setDrawColor(0, 0, 0);
    doc.line(pageWidth - 80, yPosition - 2, pageWidth - 10, yPosition - 2);

    yPosition += 5;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(`Net Amount:`, pageWidth - 80, yPosition);
    doc.text(`₹${bill.net_amount.toFixed(2)}`, pageWidth - 30, yPosition, { align: 'right' });

    // Payment Status
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const statusColor = bill.payment_status === 'paid' ? [0, 128, 0] : [255, 0, 0];
    doc.setTextColor(...statusColor);
    doc.text(`Status: ${bill.payment_status.toUpperCase()}`, pageWidth - 80, yPosition);

    // Notes
    if (bill.notes) {
      yPosition += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text('Notes:', 15, yPosition);
      
      yPosition += 5;
      doc.setFont(undefined, 'normal');
      const splitNotes = doc.splitTextToSize(bill.notes, pageWidth - 30);
      doc.text(splitNotes, 15, yPosition);
    }

    // Send PDF
    const pdfData = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice_${billId}.pdf"`);
    res.send(Buffer.from(pdfData));

  } catch (error) {
    console.error('Error generating billing PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// =====================================================
// MEDICAL CERTIFICATE PDF
// =====================================================

exports.generateCertificatePDF = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const db = getDb();

    // Fetch certificate data
    const [certificates] = await db.execute(`
      SELECT
        c.id,
        c.patient_id,
        c.certificate_type,
        c.issue_date,
        c.valid_from,
        c.valid_to,
        c.content,
        c.remarks,
        pa.name as patient_name,
        pa.phone as patient_phone,
        u.name as doctor_name,
        d.specialization,
        cl.name as clinic_name,
        cl.address as clinic_address
      FROM medical_certificates c
      JOIN patients pa ON c.patient_id = pa.id
      JOIN doctors d ON c.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      JOIN clinics cl ON c.clinic_id = cl.id
      WHERE c.id = ?
    `, [certificateId]);

    if (certificates.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const certificate = certificates[0];

    // Generate PDF
    const doc = new jsPDF('p', 'mm', 'A4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 30;

    // Header
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text(certificate.clinic_name, pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(certificate.clinic_address, pageWidth / 2, 22, { align: 'center' });

    // Certificate Title
    yPosition += 10;
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.setFont(undefined, 'bold');
    doc.text('MEDICAL CERTIFICATE', pageWidth / 2, yPosition, { align: 'center' });

    // Certificate Type
    yPosition += 12;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Type: ${certificate.certificate_type}`, pageWidth / 2, yPosition, { align: 'center' });

    // Content/Body
    yPosition += 16;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const splitContent = doc.splitTextToSize(certificate.content, pageWidth - 40);
    doc.text(splitContent, 20, yPosition);

    // Patient Details
    yPosition = yPosition + (splitContent.length * 5) + 12;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('Patient Details:', 20, yPosition);

    yPosition += 7;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Name: ${certificate.patient_name}`, 25, yPosition);
    doc.text(`Phone: ${certificate.patient_phone}`, 25, yPosition + 6);

    // Doctor Signature Area
    yPosition = pageHeight - 50;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('Authorized By:', 20, yPosition);
    
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Dr. ${certificate.doctor_name}`, 20, yPosition);
    doc.text(`(${certificate.specialization})`, 20, yPosition + 5);

    // Signature line
    yPosition += 15;
    doc.line(20, yPosition, 60, yPosition);
    doc.setFontSize(8);
    doc.text('Signature', 20, yPosition + 3);

    // Date
    doc.text(`Date: ${new Date(certificate.issue_date).toLocaleDateString()}`, pageWidth - 60, yPosition);

    // Validity
    yPosition = pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Valid from: ${new Date(certificate.valid_from).toLocaleDateString()} to ${new Date(certificate.valid_to).toLocaleDateString()}`, 20, yPosition);

    // Send PDF
    const pdfData = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${certificateId}.pdf"`);
    res.send(Buffer.from(pdfData));

  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// =====================================================
// REFERRAL PDF
// =====================================================

exports.generateReferralPDF = async (req, res) => {
  try {
    const { referralId } = req.params;

    const db = getDb();

    // Fetch referral data
    const [referrals] = await db.execute(`
      SELECT 
        r.id,
        r.patient_id,
        r.referred_by_doctor,
        r.referred_to_doctor,
        r.referral_date,
        r.reason,
        r.notes,
        r.urgency_level,
        pa.name as patient_name,
        pa.phone as patient_phone,
        pa.age,
        pa.gender,
        CONCAT(u1.first_name, ' ', u1.last_name) as from_doctor,
        CONCAT(u2.first_name, ' ', u2.last_name) as to_doctor,
        c1.name as from_clinic,
        c2.name as to_clinic
      FROM patient_referrals r
      JOIN patients pa ON r.patient_id = pa.id
      JOIN doctors d1 ON r.referred_by_doctor = d1.id
      LEFT JOIN users u1 ON d1.user_id = u1.id
      LEFT JOIN doctors d2 ON r.referred_to_doctor = d2.id
      LEFT JOIN users u2 ON d2.user_id = u2.id
      JOIN clinics c1 ON d1.clinic_id = c1.id
      LEFT JOIN clinics c2 ON d2.clinic_id = c2.id
      WHERE r.id = ?
    `, [referralId]);

    if (referrals.length === 0) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    const referral = referrals[0];

    // Generate PDF
    const doc = new jsPDF('p', 'mm', 'A4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text(referral.from_clinic, pageWidth / 2, yPosition, { align: 'center' });
    doc.setFont(undefined, 'bold');

    // Referral Title
    yPosition += 15;
    doc.setFontSize(14);
    doc.text('REFERRAL LETTER', pageWidth / 2, yPosition, { align: 'center' });

    // Referral Date
    yPosition += 12;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Date: ${new Date(referral.referral_date).toLocaleDateString()}`, 15, yPosition);

    // Urgency
    const urgencyColor = referral.urgency_level === 'emergency' ? [255, 0, 0] : 
                        referral.urgency_level === 'urgent' ? [255, 165, 0] : [0, 128, 0];
    doc.setTextColor(...urgencyColor);
    doc.setFont(undefined, 'bold');
    doc.text(`Urgency: ${referral.urgency_level.toUpperCase()}`, pageWidth - 60, yPosition);

    // Patient Information
    yPosition += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Patient Information:', 15, yPosition);

    yPosition += 6;
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${referral.patient_name}`, 20, yPosition);
    doc.text(`Age: ${referral.age} years | Gender: ${referral.gender}`, 20, yPosition + 6);
    doc.text(`Phone: ${referral.patient_phone}`, 20, yPosition + 12);

    // Referred From/To
    yPosition += 22;
    doc.setFont(undefined, 'bold');
    doc.text('Referred From:', 15, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    doc.text(`Dr. ${referral.from_doctor}`, 20, yPosition);

    yPosition += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Referred To:', 15, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    if (referral.to_doctor) {
      doc.text(`Dr. ${referral.to_doctor}`, 20, yPosition);
      doc.text(`${referral.to_clinic}`, 20, yPosition + 6);
    } else {
      doc.text('To be determined by patient', 20, yPosition);
    }

    // Reason for Referral
    yPosition += 16;
    doc.setFont(undefined, 'bold');
    doc.text('Reason for Referral:', 15, yPosition);

    yPosition += 6;
    doc.setFont(undefined, 'normal');
    const splitReason = doc.splitTextToSize(referral.reason, pageWidth - 30);
    doc.text(splitReason, 20, yPosition);

    // Notes
    if (referral.notes) {
      yPosition += (splitReason.length * 5) + 6;
      doc.setFont(undefined, 'bold');
      doc.text('Additional Notes:', 15, yPosition);

      yPosition += 6;
      doc.setFont(undefined, 'normal');
      const splitNotes = doc.splitTextToSize(referral.notes, pageWidth - 30);
      doc.text(splitNotes, 20, yPosition);
    }

    // Signature Area
    yPosition = 240;
    doc.setFont(undefined, 'normal');
    doc.line(15, yPosition, 70, yPosition);
    doc.setFontSize(9);
    doc.text('Dr. Signature', 20, yPosition + 5);

    // Send PDF
    const pdfData = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="referral_${referralId}.pdf"`);
    res.send(Buffer.from(pdfData));

  } catch (error) {
    console.error('Error generating referral PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// =====================================================
// EXPORT ALL FUNCTIONS
// =====================================================

// Already exported using exports.function syntax above
// No need for additional module.exports
