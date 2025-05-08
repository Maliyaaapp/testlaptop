import  { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash, Filter, CreditCard, MessageSquare, Download, Upload, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { FEE_TYPES, CURRENCY } from '../../../utils/constants';
import dataStore from '../../../services/dataStore';
import pdfPrinter from '../../../services/pdfPrinter';

interface Fee {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  feeType: string;
  transportationType?: 'one-way' | 'two-way';
  amount: number;
  paid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid';
  dueDate: string;
  phone?: string;
}

interface CSVStudent {
  name: string;
  studentId: string;
  grade: string;
  parentName: string;
  phone: string;
  transportation: string;
}

const Fees = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [filteredFees, setFilteredFees] = useState<Fee[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // For student-based view
  const [students, setStudents] = useState<{id: string, name: string, grade: string}[]>([]);
  const [displayMode, setDisplayMode] = useState<'list' | 'student'>('list');
  
  // Add summary stats
  const [feesSummary, setFeesSummary] = useState({
    totalFees: 0,
    transportationFees: 0,
    otherFees: 0
  });

  // Fetch data and subscribe to changes
  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      try {
        let fetchedFees;
        let fetchedStudents;
        
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          fetchedFees = dataStore.getFees(user.schoolId, undefined, user.gradeLevels);
          fetchedStudents = dataStore.getStudents(user.schoolId, user.gradeLevels);
        } else {
          fetchedFees = dataStore.getFees(user?.schoolId);
          fetchedStudents = dataStore.getStudents(user?.schoolId);
        }
        
        // Augment fees with student phone numbers for WhatsApp
        const augmentedFees = fetchedFees.map((fee: any) => {
          const student = dataStore.getStudent(fee.studentId);
          return {
            ...fee,
            phone: student?.phone || '',
          };
        });
        
        setFees(augmentedFees);
        
        // Calculate summary statistics
        let totalFees = 0;
        let transportationFees = 0;
        let otherFees = 0;
        
        augmentedFees.forEach((fee: Fee) => {
          totalFees += fee.amount;
          if (fee.feeType === 'transportation') {
            transportationFees += fee.amount;
          } else {
            otherFees += fee.amount;
          }
        });
        
        setFeesSummary({
          totalFees,
          transportationFees,
          otherFees
        });
        
        // Format student data
        const formattedStudents = fetchedStudents.map((student: any) => ({
          id: student.id,
          name: student.name,
          grade: student.grade
        }));
        
        setStudents(formattedStudents);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Subscribe to data store changes
    const unsubscribe = dataStore.subscribe(() => {
      fetchData();
    });
    
    return () => unsubscribe();
  }, [user]);

  // Apply filters whenever fees or filter options change
  useEffect(() => {
    let result = fees;
    
    if (selectedGrade !== 'all') {
      result = result.filter((fee) => fee.grade === selectedGrade);
    }
    
    if (selectedType !== 'all') {
      result = result.filter((fee) => fee.feeType === selectedType);
    }
    
    if (selectedStatus !== 'all') {
      result = result.filter((fee) => fee.status === selectedStatus);
    }
    
    if (selectedStudent !== 'all') {
      result = result.filter((fee) => fee.studentId === selectedStudent);
    }
    
    setFilteredFees(result);
  }, [selectedGrade, selectedType, selectedStatus, selectedStudent, fees]);

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الرسوم؟')) {
      dataStore.deleteFee(id);
    }
  };

  const handlePrintReceipt = (id: string) => {
    // Find the fee to generate receipt for
    const fee = fees.find(f => f.id === id);
    if (!fee) return;
    
    // Generate and print receipt
    const receiptData = {
      receiptNumber: `R-${fee.id.substring(0, 8)}`,
      date: new Date().toLocaleDateString('en-GB'), // Using Georgian date format
      studentName: fee.studentName,
      studentId: fee.studentId,
      grade: fee.grade,
      feeType: getFeeTypeLabel(fee.feeType) + (fee.transportationType ? 
        ` (${fee.transportationType === 'one-way' ? 'اتجاه واحد' : 'اتجاهين'})` : ''),
      amount: fee.paid,
      schoolName: user?.schoolName || 'مدرسة السلطان قابوس',
      schoolLogo: user?.schoolLogo
    };
    
    try {
      // Print receipt using browser's print functionality
      pdfPrinter.printReceipt(receiptData);
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('حدث خطأ أثناء إنشاء الإيصال. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleSendWhatsApp = async (id: string) => {
    // Find the fee to send message about
    const fee = fees.find(f => f.id === id);
    if (!fee) return;
    
    try {
      // Get student to get the phone number
      const student = dataStore.getStudent(fee.studentId);
      if (!student) {
        alert('لم يتم العثور على بيانات الطالب');
        return;
      }
      
      const message = `تذكير: الرسوم المستحقة للطالب ${fee.studentName} بمبلغ ${fee.balance} ${CURRENCY} من ${user?.schoolName || 'المدرسة'}`;
      
      // For demo, open WhatsApp web
      const encodedMessage = encodeURIComponent(message);
      const phone = student.phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      
      // Add message to history
      dataStore.saveMessage({
        id: '',
        studentId: fee.studentId,
        studentName: fee.studentName,
        grade: fee.grade,
        parentName: student.parentName,
        phone: student.phone,
        template: 'تذكير بالرسوم',
        message,
        sentAt: new Date().toISOString(),
        status: 'delivered',
        schoolId: user?.schoolId || ''
      });
      
      alert(`تم إرسال إشعار دفع عبر الواتساب للطالب ${fee.studentName}`);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      alert('حدث خطأ أثناء إرسال الرسالة');
    }
  };
  
  const handlePrintStudentReport = (studentId: string) => {
    const student = dataStore.getStudent(studentId);
    if (!student) return;
    
    const studentFees = fees.filter(f => f.studentId === studentId);
    
    const reportData = {
      studentName: student.name,
      studentId: student.studentId,
      grade: student.grade,
      fees: studentFees.map(fee => ({
        type: getFeeTypeLabel(fee.feeType) + (fee.transportationType ? 
          ` (${fee.transportationType === 'one-way' ? 'اتجاه واحد' : 'اتجاهين'})` : ''),
        amount: fee.amount,
        paid: fee.paid,
        balance: fee.balance
      })),
      schoolName: user?.schoolName || 'مدرسة السلطان قابوس',
      schoolLogo: user?.schoolLogo
    };
    
    try {
      // Print report using browser's print functionality
      pdfPrinter.printStudentReport(reportData);
    } catch (error) {
      console.error('Error generating student report:', error);
      alert('حدث خطأ أثناء إنشاء التقرير المالي للطالب');
    }
  };
  
  const handleImportFees = () => {
    setImportDialogOpen(true);
  };
  
  const parseCSV = (text: string): Array<any> => {
    // Function to parse CSV with proper handling of UTF-8
    const lines = text.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const entry: any = {};
      
      headers.forEach((header, index) => {
        if (index < values.length) {
          entry[header] = values[index];
        }
      });
      
      result.push(entry);
    }
    
    return result;
  };
  
  const handleImportFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvText = event.target?.result as string;
        const parsedData = parseCSV(csvText);
        
        if (parsedData.length === 0) {
          alert('لم يتم العثور على بيانات صالحة في الملف');
          return;
        }
        
        // Check if it's a student import or fee import based on headers
        const isStudentImport = parsedData[0].hasOwnProperty('اسم الطالب') || 
                               parsedData[0].hasOwnProperty('name');
        
        if (isStudentImport) {
          // Process student import
          const students: CSVStudent[] = parsedData.map(row => {
            return {
              name: row['اسم الطالب'] || row['name'] || '',
              studentId: row['رقم الطالب'] || row['studentId'] || `S${Math.floor(1000 + Math.random() * 9000)}`,
              grade: row['الصف'] || row['grade'] || 'الصف الأول',
              parentName: row['اسم ولي الأمر'] || row['parentName'] || '',
              phone: row['رقم الهاتف'] || row['phone'] || '+968 99999999',
              transportation: row['النقل'] || row['transportation'] || 'none'
            };
          });
          
          // Save students to dataStore
          for (const student of students) {
            if (!student.name) continue;
            
            dataStore.saveStudent({
              id: '',
              name: student.name,
              studentId: student.studentId,
              grade: student.grade,
              parentName: student.parentName,
              phone: student.phone,
              transportation: (student.transportation.includes('اتجاهين') || 
                              student.transportation === 'two-way') ? 'two-way' : 
                              (student.transportation.includes('اتجاه واحد') || 
                               student.transportation === 'one-way') ? 'one-way' : 'none',
              schoolId: user?.schoolId || ''
            } as any);
          }
          
          alert(`تم استيراد ${students.length} طالب بنجاح`);
        } else {
          // Process fee import
          const importedFees = parsedData.map(row => {
            const studentId = row['رقم الطالب'] || row['studentId'] || '';
            const student = dataStore.getStudents(user?.schoolId).find(s => s.studentId === studentId);
            
            if (!student) return null;
            
            const feeType = row['نوع الرسوم'] || row['feeType'] || 'tuition';
            const amount = parseFloat(row['المبلغ'] || row['amount']) || 0;
            const discount = parseFloat(row['الخصم'] || row['discount'] || '0');
            const dueDate = row['تاريخ الاستحقاق'] || row['dueDate'] || new Date().toISOString().split('T')[0];
            
            return {
              studentId: student.id,
              feeType: feeType,
              description: `رسوم مستوردة - ${student.name}`,
              amount: amount,
              discount: discount,
              paid: 0,
              balance: amount - discount,
              status: 'unpaid',
              dueDate: dueDate,
              studentName: student.name,
              grade: student.grade,
              schoolId: user?.schoolId || ''
            };
          }).filter(Boolean);
          
          // Save fees to dataStore
          for (const fee of importedFees) {
            if (!fee) continue;
            dataStore.saveFee(fee as any);
          }
          
          alert(`تم استيراد ${importedFees.length} رسوم بنجاح`);
        }
        
      } catch (error) {
        console.error('Error processing CSV file:', error);
        alert('حدث خطأ أثناء معالجة الملف. تأكد من تنسيق الملف وترميزه UTF-8');
      }
      
      setImportDialogOpen(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  };
  
  const handleExportFeesTemplate = () => {
    const headers = ['رقم الطالب', 'نوع الرسوم', 'المبلغ', 'الخصم', 'تاريخ الاستحقاق'];
    const csvContent = [
      headers.join(','),
      'S1001,tuition,1000,0,2023-09-01',
      'S1001,transportation,300,0,2023-09-01',
      'S1002,tuition,1000,100,2023-09-01',
    ].join('\n');
    
    // Create BOM for UTF-8
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'قالب_استيراد_الرسوم.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleExportFees = () => {
    const headers = ['رقم الطالب', 'اسم الطالب', 'الصف', 'نوع الرسوم', 'المبلغ', 'المدفوع', 'المتبقي', 'الحالة', 'تاريخ الاستحقاق'];
    
    const csvRows = [
      headers.join(','),
      ...filteredFees.map(fee => {
        return [
          fee.studentId,
          fee.studentName,
          fee.grade,
          getFeeTypeLabel(fee.feeType) + (fee.transportationType ? ` (${fee.transportationType === 'one-way' ? 'اتجاه واحد' : 'اتجاهين'})` : ''),
          fee.amount,
          fee.paid,
          fee.balance,
          getStatusLabel(fee.status),
          fee.dueDate // Using Georgia date format directly from database
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
    a.download = 'قائمة_الرسوم.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFeeTypeLabel = (type: string) => {
    const feeType = FEE_TYPES.find(t => t.id === type);
    return feeType ? feeType.name : type;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوع';
      case 'partial':
        return 'مدفوع جزئياً';
      case 'unpaid':
        return 'غير مدفوع';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique grades for filter
  const grades = ['all', ...Array.from(new Set(fees.map((fee) => fee.grade)))];

  // Group fees by student
  const getStudentFeesData = () => {
    const studentMap = new Map();
    
    fees.forEach(fee => {
      if (!studentMap.has(fee.studentId)) {
        studentMap.set(fee.studentId, {
          id: fee.studentId,
          name: fee.studentName,
          grade: fee.grade,
          totalAmount: 0,
          totalPaid: 0,
          totalBalance: 0,
          totalTransportation: 0,
          totalOtherFees: 0,
          fees: []
        });
      }
      
      const studentData = studentMap.get(fee.studentId);
      studentData.totalAmount += fee.amount;
      studentData.totalPaid += fee.paid;
      studentData.totalBalance += fee.balance;
      
      // Track transportation fees separately
      if (fee.feeType === 'transportation') {
        studentData.totalTransportation += fee.amount;
      } else {
        studentData.totalOtherFees += fee.amount;
      }
      
      studentData.fees.push(fee);
    });
    
    return Array.from(studentMap.values());
  };

  const studentFeesData = getStudentFeesData();

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
        <h1 className="text-2xl font-bold text-gray-800">إدارة الرسوم المالية</h1>
        <Link to="/school/fees/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>إضافة رسوم</span>
        </Link>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-lg font-bold text-gray-800 mb-2">إجمالي الرسوم</div>
          <div className="text-2xl font-bold text-primary">{feesSummary.totalFees.toLocaleString()} {CURRENCY}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-lg font-bold text-gray-800 mb-2">رسوم النقل</div>
          <div className="text-2xl font-bold text-blue-600">{feesSummary.transportationFees.toLocaleString()} {CURRENCY}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-lg font-bold text-gray-800 mb-2">الرسوم الأخرى</div>
          <div className="text-2xl font-bold text-green-600">{feesSummary.otherFees.toLocaleString()} {CURRENCY}</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="font-bold">عرض:</span>
          <div className="flex border rounded-md overflow-hidden">
            <button
              className={`px-4 py-2 ${displayMode === 'list' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setDisplayMode('list')}
            >
              قائمة الرسوم
            </button>
            <button
              className={`px-4 py-2 ${displayMode === 'student' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setDisplayMode('student')}
            >
              حسب الطالب
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            onClick={handleImportFees}
            title="استيراد الرسوم من ملف CSV"
          >
            <Upload size={16} />
            <span>استيراد</span>
          </button>
          
          <div className="flex">
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors border-r border-gray-300"
              onClick={handleExportFeesTemplate}
              title="تنزيل قالب استيراد الرسوم"
            >
              <Download size={16} />
              <span>قالب</span>
            </button>
            
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              onClick={handleExportFees}
              title="تصدير قائمة الرسوم"
            >
              <Download size={16} />
              <span>تصدير</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="grade-filter" className="font-medium">الصف:</label>
            <select
              id="grade-filter"
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary min-w-[150px]"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="all">جميع الصفوف</option>
              {grades.filter(g => g !== 'all').map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="type-filter" className="font-medium">نوع الرسوم:</label>
            <select
              id="type-filter"
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary min-w-[150px]"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">جميع الأنواع</option>
              {FEE_TYPES.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="font-medium">الحالة:</label>
            <select
              id="status-filter"
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary min-w-[150px]"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">جميع الحالات</option>
              <option value="paid">مدفوع</option>
              <option value="partial">مدفوع جزئياً</option>
              <option value="unpaid">غير مدفوع</option>
            </select>
          </div>
          
          {displayMode === 'list' && (
            <div className="flex items-center gap-2">
              <label htmlFor="student-filter" className="font-medium">الطالب:</label>
              <select
                id="student-filter"
                className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary min-w-[200px]"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="all">جميع الطلبة</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      
      {/* Fees List View */}
      {displayMode === 'list' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-gray-800">قائمة الرسوم</h2>
          </div>
          
          {filteredFees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد رسوم مطابقة للفلترة
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
                      المدفوع
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المتبقي
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الاستحقاق
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{fee.studentName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{fee.grade}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {getFeeTypeLabel(fee.feeType)}
                          {fee.transportationType && (
                            <span className={`text-xs block ${fee.feeType === 'transportation' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                              {fee.transportationType === 'one-way' ? 'اتجاه واحد' : 'اتجاهين'} - {fee.amount.toLocaleString()} {CURRENCY}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">{fee.amount.toLocaleString()} {CURRENCY}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-green-600 font-medium">{fee.paid.toLocaleString()} {CURRENCY}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-red-600 font-medium">{fee.balance.toLocaleString()} {CURRENCY}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                          {getStatusLabel(fee.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {new Date(fee.dueDate).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <Link
                            to={`/school/fees/${fee.id}`}
                            className="text-primary hover:text-primary-dark"
                            title="تعديل"
                          >
                            <Edit size={18} />
                          </Link>
                          
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(fee.id)}
                            className="text-gray-600 hover:text-gray-800"
                            title="تنزيل الإيصال"
                          >
                            <Download size={18} />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(fee.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="إرسال رسالة واتساب"
                          >
                            <MessageSquare size={18} />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDelete(fee.id)}
                            className="text-red-600 hover:text-red-800"
                            title="حذف"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Student-based View */}
      {displayMode === 'student' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
            <User size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-gray-800">الرسوم حسب الطالب</h2>
          </div>
          
          {studentFeesData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا يوجد طلبة بالفلتر المحدد
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {studentFeesData
                .filter(student => selectedGrade === 'all' || student.grade === selectedGrade)
                .map(student => (
                  <div key={student.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gray-50 p-3 border-b">
                      <h3 className="font-bold text-lg">{student.name}</h3>
                      <p className="text-sm text-gray-500">{student.grade}</p>
                    </div>
                    
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">إجمالي الرسوم:</span>
                        <span className="font-medium">{student.totalAmount.toLocaleString()} {CURRENCY}</span>
                      </div>
                      
                      {/* Transportation fees */}
                      {student.totalTransportation > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">رسوم النقل:</span>
                          <span className="font-medium text-blue-600">{student.totalTransportation.toLocaleString()} {CURRENCY}</span>
                        </div>
                      )}
                      
                      {/* Other fees */}
                      <div className="flex justify-between">
                        <span className="text-gray-600">الرسوم الأخرى:</span>
                        <span className="font-medium text-gray-800">{student.totalOtherFees.toLocaleString()} {CURRENCY}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">المدفوع:</span>
                        <span className="font-medium text-green-600">{student.totalPaid.toLocaleString()} {CURRENCY}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المتبقي:</span>
                        <span className="font-medium text-red-600">{student.totalBalance.toLocaleString()} {CURRENCY}</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                          <div 
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${student.totalAmount ? (student.totalPaid / student.totalAmount * 100) : 0}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-left">
                          {student.totalAmount ? Math.round(student.totalPaid / student.totalAmount * 100) : 0}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t p-3 flex justify-end space-x-2 space-x-reverse">
                      <button
                        type="button"
                        onClick={() => handlePrintStudentReport(student.id)}
                        className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary-dark"
                      >
                        تنزيل التقرير
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
      
      {/* Import Dialog */}
      {importDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">استيراد الرسوم</h3>
            <p className="text-gray-600 mb-4">
              قم بتحميل ملف CSV يحتوي على بيانات الرسوم أو الطلبة. يمكنك تنزيل قالب الاستيراد أولاً.
            </p>
            
            <div className="mb-4">
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={handleExportFeesTemplate}
              >
                تنزيل قالب الاستيراد
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">
                اختر ملف CSV (مع ترميز UTF-8):
              </label>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleImportFileSelected}
                className="w-full p-2 border border-gray-300 rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                تأكد من حفظ الملف بترميز UTF-8 لدعم اللغة العربية
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setImportDialogOpen(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;
 