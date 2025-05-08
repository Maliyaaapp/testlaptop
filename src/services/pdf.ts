import  { jsPDF } from 'jspdf';
import { CURRENCY } from '../utils/constants';

// Create a Base64 encoded canvas with Arabic text
const createTextAsImage = (text: string, fontSize = 16, fontWeight = 'normal', color = '#000000', align = 'right'): string => {
  // Create canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Set canvas size (make it larger for longer text)
  canvas.width = Math.max(text.length * fontSize * 1.5, 300);
  canvas.height = fontSize * 3;
  
  // Configure canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Configure text
  ctx.fillStyle = color;
  ctx.font = `${fontWeight} ${fontSize}px 'Tajawal', 'Cairo', 'Noto Kufi Arabic', 'Arial'`;
  ctx.textAlign = align as CanvasTextAlign;
  ctx.textBaseline = 'middle';
  
  // Draw text - right-to-left support
  if (align === 'right') {
    ctx.fillText(text, canvas.width - 10, canvas.height / 2);
  } else if (align === 'center') {
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  } else {
    ctx.fillText(text, 10, canvas.height / 2);
  }
  
  // Convert to data URL
  return canvas.toDataURL('image/png');
};

// Generate clean, modern receipt PDF
export const generateReceipt = (data: {
  receiptNumber: string;
  date: string;
  studentName: string;
  studentId: string;
  grade: string;
  feeType: string;
  amount: number;
  schoolName: string;
  schoolLogo?: string;
}) => {
  try {
    // Create new PDF document in A4 format
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Enable right-to-left
    doc.setR2L(true);
    
    // Document dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add modern header with clean design
    doc.setFillColor(128, 0, 0); // Primary maroon color
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // Add receipt title in white
    const titleImg = createTextAsImage('إيصال دفع', 22, 'bold', '#FFFFFF', 'center');
    doc.addImage(titleImg, 'PNG', 0, 10, pageWidth, 10);
    
    // Add School logo on top left
    try {
      if (data.schoolLogo) {
        doc.addImage(data.schoolLogo, 'JPEG', 15, 35, 30, 30);
      }
    } catch (error) {
      console.error('Error adding logo image to PDF:', error);
    }
    
    // Add school name
    const schoolNameImg = createTextAsImage(data.schoolName, 18, 'bold', '#800000', 'center');
    doc.addImage(schoolNameImg, 'PNG', 0, 40, pageWidth, 10);
    
    // Add receipt details
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(15, 55, pageWidth - 30, 35, 3, 3, 'S');
    
    // Receipt number and date in right-aligned format
    const receiptNumLabelImg = createTextAsImage('رقم الإيصال:', 11, 'bold', '#800000');
    doc.addImage(receiptNumLabelImg, 'PNG', pageWidth - 60, 60, 40, 8);
    
    const receiptNumValueImg = createTextAsImage(data.receiptNumber, 11, 'normal', '#000000');
    doc.addImage(receiptNumValueImg, 'PNG', pageWidth - 100, 60, 40, 8);
    
    const dateLabelImg = createTextAsImage('التاريخ:', 11, 'bold', '#800000');
    doc.addImage(dateLabelImg, 'PNG', pageWidth - 60, 70, 40, 8);
    
    const dateValueImg = createTextAsImage(data.date, 11, 'normal', '#000000');
    doc.addImage(dateValueImg, 'PNG', pageWidth - 100, 70, 40, 8);
    
    // Student details section
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(15, 100, pageWidth - 30, 45, 3, 3, 'FD');
    
    const studentInfoTitleImg = createTextAsImage('معلومات الطالب', 14, 'bold', '#800000');
    doc.addImage(studentInfoTitleImg, 'PNG', pageWidth - 70, 105, 50, 8);
    
    // Student details
    const studentNameLabelImg = createTextAsImage('الاسم:', 11, 'bold', '#800000');
    doc.addImage(studentNameLabelImg, 'PNG', pageWidth - 60, 118, 40, 8);
    
    const studentNameValueImg = createTextAsImage(data.studentName, 11, 'normal', '#000000');
    doc.addImage(studentNameValueImg, 'PNG', pageWidth - 100, 118, 40, 8);
    
    const studentIdLabelImg = createTextAsImage('رقم الطالب:', 11, 'bold', '#800000');
    doc.addImage(studentIdLabelImg, 'PNG', pageWidth - 60, 128, 40, 8);
    
    const studentIdValueImg = createTextAsImage(data.studentId, 11, 'normal', '#000000');
    doc.addImage(studentIdValueImg, 'PNG', pageWidth - 100, 128, 40, 8);
    
    const gradeLabelImg = createTextAsImage('الصف:', 11, 'bold', '#800000');
    doc.addImage(gradeLabelImg, 'PNG', pageWidth - 60, 138, 40, 8);
    
    const gradeValueImg = createTextAsImage(data.grade, 11, 'normal', '#000000');
    doc.addImage(gradeValueImg, 'PNG', pageWidth - 100, 138, 40, 8);
    
    // Payment details section
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(15, 155, pageWidth - 30, 40, 3, 3, 'FD');
    
    const paymentInfoTitleImg = createTextAsImage('تفاصيل الدفع', 14, 'bold', '#800000');
    doc.addImage(paymentInfoTitleImg, 'PNG', pageWidth - 70, 160, 50, 8);
    
    const feeTypeLabelImg = createTextAsImage('نوع الرسوم:', 11, 'bold', '#800000');
    doc.addImage(feeTypeLabelImg, 'PNG', pageWidth - 60, 173, 40, 8);
    
    const feeTypeValueImg = createTextAsImage(data.feeType, 11, 'normal', '#000000');
    doc.addImage(feeTypeValueImg, 'PNG', pageWidth - 100, 173, 40, 8);
    
    const amountLabelImg = createTextAsImage('المبلغ المدفوع:', 12, 'bold', '#800000');
    doc.addImage(amountLabelImg, 'PNG', pageWidth - 60, 185, 40, 8);
    
    const amountValueImg = createTextAsImage(`${data.amount.toLocaleString()} ${CURRENCY}`, 12, 'bold', '#008000');
    doc.addImage(amountValueImg, 'PNG', pageWidth - 105, 185, 45, 8);
    
    // Add status section with a clean badge
    doc.setFillColor(230, 255, 230);
    doc.roundedRect(pageWidth/2 - 25, 205, 50, 15, 5, 5, 'F');
    
    const statusImg = createTextAsImage('تم الدفع', 12, 'bold', '#006600', 'center');
    doc.addImage(statusImg, 'PNG', pageWidth/2 - 25, 208, 50, 10);
    
    // Add signature section
    doc.line(30, 240, 100, 240);
    const signatureLabelImg = createTextAsImage('توقيع المستلم', 10, 'normal', '#000000', 'center');
    doc.addImage(signatureLabelImg, 'PNG', 30, 245, 70, 8);
    
    // Add footer
    doc.setFillColor(128, 0, 0);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    const footerImg = createTextAsImage('شكراً لتعاملكم معنا - نظام إدارة مالية المدارس', 10, 'normal', '#FFFFFF', 'center');
    doc.addImage(footerImg, 'PNG', 0, pageHeight - 10, pageWidth, 8);
    
    return doc;
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    // Create a simple error PDF
    const doc = new jsPDF();
    doc.text('Error generating receipt. Please try again.', 10, 10);
    return doc;
  }
};

// Generate student financial report with improved design
export const generateStudentReport = (data: {
  studentName: string;
  studentId: string;
  grade: string;
  fees: Array<{
    type: string;
    amount: number;
    paid: number;
    balance: number;
  }>;
  schoolName: string;
  schoolLogo?: string;
}) => {
  try {
    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set document to RTL mode
    doc.setR2L(true);
    
    // Document dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add modern header with primary color
    doc.setFillColor(128, 0, 0); // Primary color
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // Add report title in white
    const titleImg = createTextAsImage('تقرير مالي للطالب', 20, 'bold', '#FFFFFF', 'center');
    doc.addImage(titleImg, 'PNG', 0, 10, pageWidth, 10);
    
    // Add School logo
    try {
      if (data.schoolLogo) {
        doc.addImage(data.schoolLogo, 'JPEG', 15, 35, 30, 30);
      }
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
    
    // Add school name
    const schoolNameImg = createTextAsImage(data.schoolName, 16, 'bold', '#800000', 'center');
    doc.addImage(schoolNameImg, 'PNG', 0, 40, pageWidth, 10);
    
    // Student information section
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(15, 60, pageWidth - 30, 40, 3, 3, 'FD');
    
    // Add student information section title
    const studentInfoTitleImg = createTextAsImage('معلومات الطالب', 14, 'bold', '#800000');
    doc.addImage(studentInfoTitleImg, 'PNG', pageWidth - 70, 65, 50, 8);
    
    // Student details
    const studentNameLabelImg = createTextAsImage('الاسم:', 11, 'bold', '#800000');
    doc.addImage(studentNameLabelImg, 'PNG', pageWidth - 50, 75, 30, 8);
    
    const studentNameValueImg = createTextAsImage(data.studentName, 11, 'normal', '#000000');
    doc.addImage(studentNameValueImg, 'PNG', pageWidth - 100, 75, 50, 8);
    
    const gradeLabelImg = createTextAsImage('الصف:', 11, 'bold', '#800000');
    doc.addImage(gradeLabelImg, 'PNG', pageWidth - 50, 85, 30, 8);
    
    const gradeValueImg = createTextAsImage(data.grade, 11, 'normal', '#000000');
    doc.addImage(gradeValueImg, 'PNG', pageWidth - 100, 85, 50, 8);
    
    // Student ID on right side
    const studentIdLabelImg = createTextAsImage('رقم الطالب:', 11, 'bold', '#800000');
    doc.addImage(studentIdLabelImg, 'PNG', 90, 75, 40, 8);
    
    const studentIdValueImg = createTextAsImage(data.studentId, 11, 'normal', '#000000');
    doc.addImage(studentIdValueImg, 'PNG', 50, 75, 40, 8);
    
    // Financial details title
    const financialDetailsTitleImg = createTextAsImage('التفاصيل المالية:', 14, 'bold', '#800000');
    doc.addImage(financialDetailsTitleImg, 'PNG', pageWidth - 80, 110, 60, 8);
    
    // Table headers with cleaner design
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(15, 120, pageWidth - 30, 15, 2, 2, 'F');
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    
    const descriptionHeaderImg = createTextAsImage('البيان', 11, 'bold', '#800000');
    doc.addImage(descriptionHeaderImg, 'PNG', pageWidth - 45, 122, 30, 10);
    
    const totalAmountHeaderImg = createTextAsImage('المبلغ', 11, 'bold', '#800000');
    doc.addImage(totalAmountHeaderImg, 'PNG', pageWidth - 80, 122, 25, 10);
    
    const paidAmountHeaderImg = createTextAsImage('المدفوع', 11, 'bold', '#800000');
    doc.addImage(paidAmountHeaderImg, 'PNG', pageWidth - 115, 122, 25, 10);
    
    const balanceHeaderImg = createTextAsImage('المتبقي', 11, 'bold', '#800000');
    doc.addImage(balanceHeaderImg, 'PNG', pageWidth - 150, 122, 25, 10);
    
    // Calculate totals
    let totalAmount = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    
    // Add rows for each fee
    let y = 135;
    data.fees.forEach((fee, index) => {
      // Alternate row colors for better readability
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252);
      } else {
        doc.setFillColor(245, 245, 245);
      }
      doc.roundedRect(15, y, pageWidth - 30, 12, 1, 1, 'F');
      
      const typeImg = createTextAsImage(fee.type, 10, 'normal', '#000000');
      doc.addImage(typeImg, 'PNG', pageWidth - 45, y + 2, 30, 8);
      
      const amountImg = createTextAsImage(fee.amount.toLocaleString() + ' ' + CURRENCY, 10, 'normal', '#000000');
      doc.addImage(amountImg, 'PNG', pageWidth - 80, y + 2, 25, 8);
      
      const paidImg = createTextAsImage(fee.paid.toLocaleString() + ' ' + CURRENCY, 10, 'normal', '#008000');
      doc.addImage(paidImg, 'PNG', pageWidth - 115, y + 2, 25, 8);
      
      const balanceImg = createTextAsImage(fee.balance.toLocaleString() + ' ' + CURRENCY, 10, 'normal', fee.balance > 0 ? '#ff0000' : '#000000');
      doc.addImage(balanceImg, 'PNG', pageWidth - 150, y + 2, 25, 8);
      
      totalAmount += fee.amount;
      totalPaid += fee.paid;
      totalBalance += fee.balance;
      
      y += 12;
    });
    
    // Add totals row with highlighted background
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(15, y, pageWidth - 30, 15, 2, 2, 'F');
    
    const totalLabelImg = createTextAsImage('الإجمالي', 12, 'bold', '#800000');
    doc.addImage(totalLabelImg, 'PNG', pageWidth - 45, y + 3, 30, 8);
    
    const totalAmountValueImg = createTextAsImage(totalAmount.toLocaleString() + ' ' + CURRENCY, 12, 'bold', '#000000');
    doc.addImage(totalAmountValueImg, 'PNG', pageWidth - 80, y + 3, 25, 8);
    
    const totalPaidValueImg = createTextAsImage(totalPaid.toLocaleString() + ' ' + CURRENCY, 12, 'bold', '#008000');
    doc.addImage(totalPaidValueImg, 'PNG', pageWidth - 115, y + 3, 25, 8);
    
    const totalBalanceValueImg = createTextAsImage(totalBalance.toLocaleString() + ' ' + CURRENCY, 12, 'bold', totalBalance > 0 ? '#ff0000' : '#000000');
    doc.addImage(totalBalanceValueImg, 'PNG', pageWidth - 150, y + 3, 25, 8);
    
    // Add payment status box
    y += 25;
    
    // Determine payment status text and color
    let paymentStatus;
    let statusColor;
    let backgroundColor;
    if (totalBalance <= 0) {
      paymentStatus = 'مدفوع بالكامل';
      statusColor = '#008000'; // Green
      backgroundColor = '#E8F5E9'; // Light green background
    } else if (totalPaid > 0) {
      paymentStatus = 'مدفوع جزئياً';
      statusColor = '#FF8C00'; // Orange
      backgroundColor = '#FFF3E0'; // Light orange background
    } else {
      paymentStatus = 'غير مدفوع';
      statusColor = '#FF0000'; // Red
      backgroundColor = '#FFEBEE'; // Light red background
    }
    
    doc.setFillColor(...backgroundColor.match(/\w\w/g).map((c: string) => parseInt(c, 16)));
    doc.roundedRect(pageWidth/2 - 40, y, 80, 20, 5, 5, 'F');
    
    const paymentStatusLabelImg = createTextAsImage('حالة الدفع:', 12, 'bold', '#800000');
    doc.addImage(paymentStatusLabelImg, 'PNG', pageWidth/2 + 20, y + 6, 30, 8);
    
    const paymentStatusValueImg = createTextAsImage(paymentStatus, 12, 'bold', statusColor);
    doc.addImage(paymentStatusValueImg, 'PNG', pageWidth/2 - 30, y + 6, 40, 8);
    
    // Add footer
    doc.setFillColor(128, 0, 0);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    const footerImg = createTextAsImage('شكراً لتعاملكم معنا - نظام إدارة مالية المدارس', 10, 'normal', '#FFFFFF', 'center');
    doc.addImage(footerImg, 'PNG', 0, pageHeight - 10, pageWidth, 8);
    
    return doc;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    // Create a simple error PDF
    const doc = new jsPDF();
    doc.text('Error generating report. Please try again.', 10, 10);
    return doc;
  }
};

// Generate subscription invoice for admin control center with improved design
export const generateSubscriptionInvoice = (data: {
  invoiceNumber: string;
  date: string;
  schoolName: string;
  schoolId: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  amount: number;
  paid: boolean;
}) => {
  try {
    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set document to RTL mode
    doc.setR2L(true);
    
    // Document dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add modern header with primary color
    doc.setFillColor(128, 0, 0); // Primary color
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // Add invoice title in white
    const titleImg = createTextAsImage('فاتورة اشتراك', 20, 'bold', '#FFFFFF', 'center');
    doc.addImage(titleImg, 'PNG', 0, 10, pageWidth, 10);
    
    // Add system name
    const systemNameImg = createTextAsImage('نظام إدارة مالية المدارس', 16, 'bold', '#800000', 'center');
    doc.addImage(systemNameImg, 'PNG', 0, 40, pageWidth, 10);
    
    // Add current date
    const dateImg = createTextAsImage('التاريخ: ' + data.date, 11, 'normal', '#000000', 'center');
    doc.addImage(dateImg, 'PNG', 0, 50, pageWidth, 8);
    
    // Invoice Number box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(pageWidth/2 - 40, 60, 80, 15, 3, 3, 'F');
    
    const invoiceNumberImg = createTextAsImage('رقم الفاتورة: ' + data.invoiceNumber, 11, 'bold', '#800000', 'center');
    doc.addImage(invoiceNumberImg, 'PNG', pageWidth/2 - 40, 63, 80, 10);
    
    // School information section
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(15, 85, pageWidth - 30, 40, 3, 3, 'FD');
    
    // Add school information section title
    const schoolInfoTitleImg = createTextAsImage('معلومات المدرسة:', 14, 'bold', '#800000');
    doc.addImage(schoolInfoTitleImg, 'PNG', pageWidth - 80, 90, 60, 10);
    
    // Add school information
    const schoolNameLabelImg = createTextAsImage('اسم المدرسة:', 11, 'bold', '#800000');
    doc.addImage(schoolNameLabelImg, 'PNG', pageWidth - 60, 105, 40, 8);
    
    const schoolNameValueImg = createTextAsImage(data.schoolName, 11, 'normal', '#000000');
    doc.addImage(schoolNameValueImg, 'PNG', pageWidth - 110, 105, 50, 8);
    
    const schoolIdLabelImg = createTextAsImage('رقم المدرسة:', 11, 'bold', '#800000');
    doc.addImage(schoolIdLabelImg, 'PNG', pageWidth - 60, 115, 40, 8);
    
    const schoolIdValueImg = createTextAsImage(data.schoolId, 11, 'normal', '#000000');
    doc.addImage(schoolIdValueImg, 'PNG', pageWidth - 110, 115, 50, 8);
    
    // Subscription details section with clean design
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, 135, pageWidth - 30, 80, 3, 3, 'FD');
    
    // Add subscription details title
    const subscriptionDetailsTitleImg = createTextAsImage('تفاصيل الاشتراك:', 14, 'bold', '#800000');
    doc.addImage(subscriptionDetailsTitleImg, 'PNG', pageWidth - 80, 140, 60, 10);
    
    // Subscription dates
    const startDateLabelImg = createTextAsImage('تاريخ بداية الاشتراك:', 11, 'bold', '#800000');
    doc.addImage(startDateLabelImg, 'PNG', pageWidth - 80, 155, 60, 8);
    
    const startDateValueImg = createTextAsImage(data.subscriptionStart, 11, 'normal', '#000000');
    doc.addImage(startDateValueImg, 'PNG', pageWidth - 140, 155, 60, 8);
    
    const endDateLabelImg = createTextAsImage('تاريخ نهاية الاشتراك:', 11, 'bold', '#800000');
    doc.addImage(endDateLabelImg, 'PNG', pageWidth - 80, 170, 60, 8);
    
    const endDateValueImg = createTextAsImage(data.subscriptionEnd, 11, 'normal', '#000000');
    doc.addImage(endDateValueImg, 'PNG', pageWidth - 140, 170, 60, 8);
    
    // Amount in bold with highlight box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth/2 - 50, 185, 100, 20, 3, 3, 'F');
    
    const amountLabelImg = createTextAsImage('مبلغ الاشتراك:', 14, 'bold', '#800000');
    doc.addImage(amountLabelImg, 'PNG', pageWidth/2 + 10, 190, 40, 10);
    
    const amountValueImg = createTextAsImage(data.amount.toLocaleString() + ' ' + CURRENCY, 14, 'bold', '#000000');
    doc.addImage(amountValueImg, 'PNG', pageWidth/2 - 40, 190, 45, 10);
    
    // Add status box
    let statusColor;
    let statusBgColor;
    if (data.paid) {
      statusColor = '#008000'; // Green
      statusBgColor = '#E8F5E9'; // Light green background
    } else {
      statusColor = '#FF0000'; // Red
      statusBgColor = '#FFEBEE'; // Light red background
    }
    
    doc.setFillColor(...statusBgColor.match(/\w\w/g).map((c: string) => parseInt(c, 16)));
    doc.roundedRect(pageWidth/2 - 30, 225, 60, 20, 5, 5, 'F');
    
    const statusImg = createTextAsImage(data.paid ? 'مدفوع' : 'غير مدفوع', 14, 'bold', statusColor, 'center');
    doc.addImage(statusImg, 'PNG', pageWidth/2 - 30, 230, 60, 10);
    
    // Add payment instructions if not paid
    if (!data.paid) {
      doc.setFillColor(255, 248, 248);
      doc.roundedRect(15, 255, pageWidth - 30, 30, 3, 3, 'F');
      
      const instructionsImg = createTextAsImage('تعليمات الدفع:', 12, 'bold', '#800000');
      doc.addImage(instructionsImg, 'PNG', pageWidth - 70, 260, 50, 8);
      
      const accountImg = createTextAsImage('الرجاء تحويل المبلغ إلى الحساب البنكي رقم XXXX-XXXX-XXXX-XXXX', 10, 'normal', '#000000');
      doc.addImage(accountImg, 'PNG', 25, 270, pageWidth - 50, 8);
    } else {
      // Add thank you note
      const thanksImg = createTextAsImage('شكراً لاشتراكك في خدماتنا', 14, 'bold', '#800000', 'center');
      doc.addImage(thanksImg, 'PNG', 0, 260, pageWidth, 10);
    }
    
    // Add footer
    doc.setFillColor(128, 0, 0);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    const footerImg = createTextAsImage('© ' + new Date().getFullYear() + ' - نظام إدارة مالية المدارس - سلطنة عمان', 10, 'normal', '#FFFFFF', 'center');
    doc.addImage(footerImg, 'PNG', 0, pageHeight - 10, pageWidth, 8);
    
    return doc;
  } catch (error) {
    console.error('Error generating subscription invoice:', error);
    // Create a simple error PDF
    const doc = new jsPDF();
    doc.text('Error generating invoice. Please try again.', 10, 10);
    return doc;
  }
};

export default {
  generateReceipt,
  generateStudentReport,
  generateSubscriptionInvoice
};
 