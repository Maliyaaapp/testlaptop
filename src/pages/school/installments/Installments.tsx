import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Filter, CreditCard, Check, Clock, MessageSquare, Download, User, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { CURRENCY } from '../../../utils/constants';
import pdfPrinter from '../../../services/pdfPrinter';
import dataStore from '../../../services/dataStore';

interface Student {
  id: string;
  name: string;
  grade: string;
  installments: Installment[];
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
}

interface Installment {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: 'paid' | 'upcoming' | 'overdue';
  feeId: string;
  feeType: string;
  phone?: string;
}

const Installments = () => {
  const { user } = useAuth();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});
  const [displayMode, setDisplayMode] = useState<'student' | 'list'>('student');

  // Fetch data and subscribe to changes
  useEffect(() => {
    const fetchInstallments = () => {
      setIsLoading(true);
      try {
        let fetchedInstallments;
        
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          fetchedInstallments = dataStore.getInstallments(user.schoolId, undefined, undefined, user.gradeLevels);
        } else {
          fetchedInstallments = dataStore.getInstallments(user?.schoolId);
        }
        
        // Augment installments with student phone numbers for WhatsApp
        const augmentedInstallments = fetchedInstallments.map((installment: any) => {
          const student = dataStore.getStudent(installment.studentId);
          return {
            ...installment,
            phone: student?.phone || '',
          };
        });
        
        setInstallments(augmentedInstallments);
        
        // Group installments by student
        const studentMap = new Map<string, Student>();
        
        augmentedInstallments.forEach((installment: Installment) => {
          const { studentId, studentName, grade } = installment;
          
          if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
              id: studentId,
              name: studentName,
              grade,
              installments: [],
              totalAmount: 0,
              totalPaid: 0,
              totalDue: 0
            });
          }
          
          const student = studentMap.get(studentId)!;
          student.installments.push(installment);
          student.totalAmount += installment.amount;
          
          if (installment.paidDate) {
            student.totalPaid += installment.amount;
          } else {
            student.totalDue += installment.amount;
          }
        });
        
        // Convert to array and sort by name
        const studentArray = Array.from(studentMap.values());
        studentArray.sort((a, b) => a.name.localeCompare(b.name));
        
        setStudents(studentArray);
      } catch (error) {
        console.error('Error fetching installments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInstallments();
    
    // Subscribe to data store changes
    const unsubscribe = dataStore.subscribe(() => {
      fetchInstallments();
    });
    
    return () => unsubscribe();
  }, [user]);

  // Apply filters whenever installments or filter options change
  useEffect(() => {
    let filteredStuds = students;
    
    if (selectedGrade !== 'all') {
      filteredStuds = filteredStuds.filter((student) => student.grade === selectedGrade);
    }
    
    if (selectedStatus !== 'all') {
      filteredStuds = filteredStuds.filter((student) => {
        if (selectedStatus === 'paid') {
          return student.totalDue === 0 && student.totalPaid > 0;
        } else if (selectedStatus === 'unpaid') {
          return student.totalDue > 0;
        } else if (selectedStatus === 'overdue') {
          return student.installments.some(inst => inst.status === 'overdue');
        }
        return true;
      });
    }
    
    setFilteredStudents(filteredStuds);
  }, [selectedGrade, selectedStatus, students]);

  const toggleExpandStudent = (studentId: string) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const expandAllStudents = () => {
    const expanded: Record<string, boolean> = {};
    students.forEach(student => {
      expanded[student.id] = true;
    });
    setExpandedStudents(expanded);
  };

  const collapseAllStudents = () => {
    setExpandedStudents({});
  };

  const handleMarkAsPaid = (id: string) => {
    const installment = dataStore.getInstallment(id);
    if (!installment) return;
    
    // Update installment to mark as paid
    dataStore.saveInstallment({
      ...installment,
      paidDate: new Date().toISOString().split('T')[0],
      status: 'paid'
    });
  };
  
  const handlePrintReceipt = (id: string) => {
    try {
      const installment = dataStore.getInstallment(id);
      if (!installment) return;
      
      // Get student ID for the receipt
      const student = dataStore.getStudent(installment.studentId);
      if (!student) return;
      
      // Generate receipt data
      const receiptData = {
        receiptNumber: `IR-${installment.id.substring(0, 8)}`,
        date: new Date().toLocaleDateString('en-GB'), // Using Georgian date format
        studentName: installment.studentName,
        studentId: student.studentId,
        grade: installment.grade,
        feeType: getFeeTypeLabel(installment.feeType),
        amount: installment.amount,
        schoolName: user?.schoolName || 'مدرسة السلطان قابوس',
        schoolLogo: user?.schoolLogo
      };
      
      // Generate and print receipt using pdfPrinter
      pdfPrinter.printReceipt(receiptData);
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('حدث خطأ أثناء إنشاء الإيصال. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleSendReminder = async (id: string) => {
    const installment = dataStore.getInstallment(id);
    if (!installment) return;
    
    try {
      // Get student to get the phone number
      const student = dataStore.getStudent(installment.studentId);
      if (!student) {
        alert('لم يتم العثور على بيانات الطالب');
        return;
      }
      
      const message = `نفيدكم بأن القسط المستحق على الطالب ${installment.studentName} بمبلغ ${installment.amount} ${CURRENCY} مستحقة بتاريخ ${new Date(installment.dueDate).toLocaleDateString('en-GB')}، نرجو دفع المستحقات في اقرب فرصة ممكنة.`;
      
      // For demo, open WhatsApp web
      const encodedMessage = encodeURIComponent(message);
      const phone = student.phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      
      // Add message to history
      dataStore.saveMessage({
        id: '',
        studentId: installment.studentId,
        studentName: installment.studentName,
        grade: installment.grade,
        parentName: student.parentName,
        phone: student.phone,
        template: 'تذكير بالقسط',
        message,
        sentAt: new Date().toISOString(),
        status: 'delivered',
        schoolId: user?.schoolId || ''
      });
      
      alert(`تم إرسال تذكير عبر الواتساب للطالب ${installment.studentName}`);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      alert('حدث خطأ أثناء إرسال الرسالة');
    }
  };
  
  const handleExportInstallments = () => {
    const headers = ['الطالب', 'الصف', 'نوع الرسوم', 'المبلغ', 'تاريخ الاستحقاق', 'تاريخ الدفع', 'الحالة'];
    
    const csvRows = [
      headers.join(','),
      ...installments.map(installment => {
        return [
          installment.studentName,
          installment.grade,
          getFeeTypeLabel(installment.feeType),
          installment.amount,
          installment.dueDate, // Using Georgian date format directly
          installment.paidDate ? installment.paidDate : '-',
          getStatusLabel(installment.status)
        ].join(',');
      })
    ];
    
    // Create BOM for UTF-8
    const BOM = "\uFEFF";
    const csvContent = BOM + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'قائمة_الأقساط.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Print student financial report
  const handlePrintStudentReport = (studentId: string) => {
    try {
      const student = dataStore.getStudent(studentId);
      if (!student) return;
      
      const studentInstallments = installments.filter(i => i.studentId === studentId);
      
      if (studentInstallments.length === 0) {
        alert('لا توجد أقساط لهذا الطالب');
        return;
      }
      
      // Generate report data
      const reportData = {
        studentName: student.name,
        studentId: student.studentId,
        grade: student.grade,
        fees: studentInstallments.map(installment => ({
          type: `قسط: ${getFeeTypeLabel(installment.feeType)} - ${new Date(installment.dueDate).toLocaleDateString('en-GB')}`,
          amount: installment.amount,
          paid: installment.paidDate ? installment.amount : 0,
          balance: installment.paidDate ? 0 : installment.amount
        })),
        schoolName: user?.schoolName || 'مدرسة السلطان قابوس',
        schoolLogo: user?.schoolLogo
      };
      
      // Generate and print report using pdfPrinter
      pdfPrinter.printStudentReport(reportData);
    } catch (error) {
      console.error('Error generating student report:', error);
      alert('حدث خطأ أثناء إنشاء التقرير المالي للطالب');
    }
  };

  const getFeeTypeLabel = (type: string): string => {
    const feeTypes: Record<string, string> = {
      'tuition': 'رسوم دراسية',
      'transportation': 'نقل مدرسي',
      'activities': 'أنشطة',
      'uniform': 'زي مدرسي',
      'books': 'كتب',
      'other': 'رسوم أخرى'
    };
    
    return feeTypes[type] || type;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوع';
      case 'upcoming':
        return 'قادم';
      case 'overdue':
        return 'متأخر';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique grades for filter
  const grades = ['all', ...Array.from(new Set(students.map((student) => student.grade)))];

  // Sort installments chronologically
  const getSortedInstallments = (installments: Installment[]) => {
    return [...installments].sort((a, b) => {
      // First sort by status priority (overdue > upcoming > paid)
      const statusPriority = { overdue: 0, upcoming: 1, paid: 2 };
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الأقساط</h1>
        <Link to="/school/installments/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>إضافة قسط</span>
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="font-bold">عرض:</span>
          <div className="flex border rounded-md overflow-hidden">
            <button
              className={`px-4 py-2 ${displayMode === 'student' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setDisplayMode('student')}
            >
              حسب الطالب
            </button>
            <button
              className={`px-4 py-2 ${displayMode === 'list' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setDisplayMode('list')}
            >
              قائمة الأقساط
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-600" />
            <select
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="all">جميع الصفوف</option>
              {grades.filter((g) => g !== 'all').map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">جميع الحالات</option>
              <option value="paid">مدفوع</option>
              <option value="unpaid">غير مدفوع</option>
              <option value="overdue">متأخر</option>
            </select>
          </div>
          
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            onClick={handleExportInstallments}
            title="تصدير قائمة الأقساط كملف CSV"
          >
            <Download size={16} />
            <span>تصدير</span>
          </button>
        </div>
      </div>
      
      {/* Student View Mode */}
      {displayMode === 'student' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <User size={20} className="text-primary" />
              <h2 className="text-xl font-bold text-gray-800">الأقساط حسب الطالب</h2>
            </div>
            
            {filteredStudents.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-sm px-3 py-1 text-gray-600 hover:text-gray-800"
                  onClick={expandAllStudents}
                >
                  عرض الكل
                </button>
                <button
                  type="button"
                  className="text-sm px-3 py-1 text-gray-600 hover:text-gray-800"
                  onClick={collapseAllStudents}
                >
                  إخفاء الكل
                </button>
              </div>
            )}
          </div>
          
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا يوجد طلبة بالأقساط المحددة
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <div key={student.id} className="hover:bg-gray-50">
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleExpandStudent(student.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedStudents[student.id] ? (
                        <ChevronDown size={20} className="text-gray-600" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-600" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.grade}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 text-sm">
                      <div className="text-right">
                        <div className="text-gray-500">الإجمالي</div>
                        <div className="font-medium">{student.totalAmount.toLocaleString()} {CURRENCY}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-500">المدفوع</div>
                        <div className="font-medium text-green-600">{student.totalPaid.toLocaleString()} {CURRENCY}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-500">المتبقي</div>
                        <div className="font-medium text-red-600">{student.totalDue.toLocaleString()} {CURRENCY}</div>
                      </div>
                    </div>
                  </div>
                  
                  {expandedStudents[student.id] && (
                    <div className="bg-gray-50 p-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border rounded-lg bg-white">
                          <thead className="bg-gray-100">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                نوع الرسوم
                              </th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                المبلغ
                              </th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                تاريخ الاستحقاق
                              </th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                تاريخ الدفع
                              </th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                الحالة
                              </th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                الإجراءات
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {getSortedInstallments(student.installments).map((installment) => (
                              <tr key={installment.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-gray-900">{getFeeTypeLabel(installment.feeType)}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-gray-900 font-medium">{installment.amount.toLocaleString()} {CURRENCY}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-gray-500">
                                    {new Date(installment.dueDate).toLocaleDateString('en-GB')}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-gray-500">
                                    {installment.paidDate 
                                      ? new Date(installment.paidDate).toLocaleDateString('en-GB')
                                      : '-'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(installment.status)}`}>
                                    {getStatusLabel(installment.status)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <Link
                                      to={`/school/installments/${installment.id}`}
                                      className="text-primary hover:text-primary-dark"
                                      title="تعديل"
                                    >
                                      <Edit size={16} />
                                    </Link>
                                    
                                    {installment.status !== 'paid' && (
                                      <button
                                        type="button"
                                        onClick={() => handleMarkAsPaid(installment.id)}
                                        className="text-green-600 hover:text-green-800"
                                        title="تحديد كمدفوع"
                                      >
                                        <Check size={16} />
                                      </button>
                                    )}
                                    
                                    {installment.status === 'paid' && (
                                      <button
                                        type="button"
                                        onClick={() => handlePrintReceipt(installment.id)}
                                        className="text-gray-600 hover:text-gray-800"
                                        title="تنزيل الإيصال"
                                      >
                                        <Download size={16} />
                                      </button>
                                    )}
                                    
                                    {installment.status !== 'paid' && (
                                      <button
                                        type="button"
                                        onClick={() => handleSendReminder(installment.id)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="إرسال تذكير واتساب"
                                      >
                                        <MessageSquare size={16} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handlePrintStudentReport(student.id)}
                          className="btn btn-secondary flex items-center gap-2 text-sm"
                        >
                          <Download size={16} />
                          <span>تنزيل التقرير المالي</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* List View Mode */}
      {displayMode === 'list' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-gray-800">قائمة الأقساط</h2>
          </div>
          
          {installments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد أقساط مسجلة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الطالب
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الصف
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نوع الرسوم
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الاستحقاق
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الدفع
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {installments.map((installment) => (
                    <tr key={installment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{installment.studentName}</div>
                        <div className="text-gray-500 text-sm">{installment.studentId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{installment.grade}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{getFeeTypeLabel(installment.feeType)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">{installment.amount.toLocaleString()} {CURRENCY}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {new Date(installment.dueDate).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {installment.paidDate 
                            ? new Date(installment.paidDate).toLocaleDateString('en-GB')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(installment.status)}`}>
                          {getStatusLabel(installment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium flex items-center space-x-2 space-x-reverse">
                        <Link
                          to={`/school/installments/${installment.id}`}
                          className="text-primary hover:text-primary-dark"
                          title="تعديل"
                        >
                          <Edit size={18} />
                        </Link>
                        
                        {installment.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsPaid(installment.id)}
                            className="text-green-600 hover:text-green-800"
                            title="تحديد كمدفوع"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        
                        {installment.status === 'paid' && (
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(installment.id)}
                            className="text-gray-600 hover:text-gray-800"
                            title="تنزيل الإيصال"
                          >
                            <Download size={18} />
                          </button>
                        )}
                        
                        {installment.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleSendReminder(installment.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="إرسال تذكير واتساب"
                          >
                            <MessageSquare size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Installments;
 