import  { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash, Upload, Download, Filter, Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { TRANSPORTATION_TYPES, GRADE_LEVELS, CURRENCY } from '../../../utils/constants';
import dataStore from '../../../services/dataStore';

interface Student {
  id: string;
  name: string;
  studentId: string;
  grade: string;
  parentName: string;
  phone: string;
  transportation: 'none' | 'one-way' | 'two-way';
  transportationDirection?: 'to-school' | 'from-school';
}

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedTransport, setSelectedTransport] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<any>({
    transportationFeeOneWay: 150,
    transportationFeeTwoWay: 300
  });

  // Subscribe to data store changes
  useEffect(() => {
    const fetchStudents = () => {
      setIsLoading(true);
      let fetchedStudents;
      
      if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
        fetchedStudents = dataStore.getStudents(user.schoolId, user.gradeLevels);
      } else {
        fetchedStudents = dataStore.getStudents(user?.schoolId);
      }
      
      setStudents(fetchedStudents);
      setIsLoading(false);
    };
    
    // Get school settings
    if (user?.schoolId) {
      const schoolSettings = dataStore.getSettings(user.schoolId);
      setSettings(schoolSettings);
    }
    
    fetchStudents();
    
    // Subscribe to data store changes
    const unsubscribe = dataStore.subscribe(() => {
      fetchStudents();
    });
    
    return () => unsubscribe();
  }, [user]);

  // Apply filters whenever students, selected grade or transport changes
  useEffect(() => {
    let result = students;
    
    if (selectedGrade !== 'all') {
      result = result.filter((student) => student.grade === selectedGrade);
    }
    
    if (selectedTransport !== 'all') {
      result = result.filter((student) => {
        if (selectedTransport === 'none') {
          return student.transportation === 'none';
        } else if (selectedTransport === 'one-way') {
          return student.transportation === 'one-way';
        } else if (selectedTransport === 'two-way') {
          return student.transportation === 'two-way';
        } else if (selectedTransport === 'any') {
          return student.transportation !== 'none';
        }
        return true;
      });
    }
    
    setFilteredStudents(result);
  }, [selectedGrade, selectedTransport, students]);

  const handleFilter = (grade: string) => {
    setSelectedGrade(grade);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      dataStore.deleteStudent(id);
    }
  };

  const handleImportStudents = () => {
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
        
        // Process new students from CSV
        const newStudents = parsedData.map(row => {
          // Parse transportation
          let transportationType = 'none';
          let transportationDirection = undefined;
          
          const transportValue = (row['النقل'] || row['transportation'] || '').toLowerCase();
          
          if (transportValue.includes('اتجاهين') || transportValue === 'two-way') {
            transportationType = 'two-way';
          } else if (transportValue.includes('اتجاه واحد') || transportValue === 'one-way') {
            transportationType = 'one-way';
            
            // Check for direction
            if (transportValue.includes('إلى المدرسة') || transportValue.includes('to-school')) {
              transportationDirection = 'to-school';
            } else if (transportValue.includes('من المدرسة') || transportValue.includes('from-school')) {
              transportationDirection = 'from-school';
            }
          }
          
          return {
            name: row['اسم الطالب'] || row['name'] || '',
            studentId: row['رقم الطالب'] || row['studentId'] || `S${Math.floor(1000 + Math.random() * 9000)}`,
            grade: row['الصف'] || row['grade'] || 'الصف الأول',
            parentName: row['اسم ولي الأمر'] || row['parentName'] || '',
            phone: row['رقم الهاتف'] || row['phone'] || '+968 99999999',
            transportation: transportationType,
            transportationDirection: transportationDirection
          };
        });
        
        // Save students to dataStore
        for (const student of newStudents) {
          if (!student.name) continue;
          
          // Check if user is grade manager and student's grade is in their allowed grades
          if (user?.role === 'gradeManager' && user?.gradeLevels && !user.gradeLevels.includes(student.grade)) {
            continue; // Skip students not in allowed grades
          }
          
          const savedStudent = dataStore.saveStudent({
            id: '',
            name: student.name,
            studentId: student.studentId,
            grade: student.grade,
            parentName: student.parentName,
            phone: student.phone,
            transportation: student.transportation,
            transportationDirection: student.transportationDirection,
            schoolId: user?.schoolId || ''
          } as any);
          
          // Create transportation fee if needed
          if (student.transportation !== 'none') {
            const transportationAmount = student.transportation === 'one-way' 
              ? settings.transportationFeeOneWay 
              : settings.transportationFeeTwoWay;
              
            const feeData = {
              studentId: savedStudent.id,
              feeType: 'transportation',
              description: `رسوم النقل - ${student.transportation === 'one-way' ? 'اتجاه واحد' : 'اتجاهين'}${student.transportationDirection ? ` - ${student.transportationDirection === 'to-school' ? 'إلى المدرسة' : 'من المدرسة'}` : ''}`,
              amount: transportationAmount,
              discount: 0,
              paid: 0,
              balance: transportationAmount,
              status: 'unpaid',
              dueDate: new Date().toISOString().split('T')[0],
              schoolId: user?.schoolId || '',
              transportationType: student.transportation
            };
            
            dataStore.saveFee(feeData as any);
          }
        }
        
        alert(`تم استيراد ${newStudents.length} طالب بنجاح`);
        
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

  const handleExportStudentsTemplate = () => {
    const headers = ['اسم الطالب', 'رقم الطالب', 'الصف', 'اسم ولي الأمر', 'رقم الهاتف', 'النقل'];
    const csvContent = [
      headers.join(','),
      'أحمد محمد,S1001,الروضة الأولى KG1,محمد أحمد,+968 95123456,اتجاهين',
      'فاطمة خالد,S1002,التمهيدي KG2,خالد علي,+968 95123457,اتجاه واحد - إلى المدرسة',
      'علي حسن,S1003,الصف الأول,حسن علي,+968 95123458,اتجاه واحد - من المدرسة',
      'محمد سالم,S1004,الصف الثاني,سالم محمد,+968 95123459,لا يوجد',
    ].join('\n');
    
    // Create BOM for UTF-8
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'قالب_استيراد_الطلبة.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleExportStudents = () => {
    const headers = ['اسم الطالب', 'رقم الطالب', 'الصف', 'اسم ولي الأمر', 'رقم الهاتف', 'النقل'];
    
    const csvRows = [
      headers.join(','),
      ...filteredStudents.map(student => {
        // Format transportation value
        let transportationStr = '';
        if (student.transportation === 'none') {
          transportationStr = 'لا يوجد';
        } else if (student.transportation === 'one-way') {
          transportationStr = `اتجاه واحد${student.transportationDirection ? ` - ${student.transportationDirection === 'to-school' ? 'إلى المدرسة' : 'من المدرسة'}` : ''}`;
        } else {
          transportationStr = 'اتجاهين';
        }
        
        return [
          student.name,
          student.studentId,
          student.grade,
          student.parentName,
          student.phone,
          transportationStr
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
    a.download = 'قائمة_الطلبة.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTransportationLabel = (student: Student) => {
    if (student.transportation === 'none') {
      return 'لا يوجد';
    } else if (student.transportation === 'one-way') {
      return `اتجاه واحد${student.transportationDirection ? ` - ${student.transportationDirection === 'to-school' ? 'إلى المدرسة' : 'من المدرسة'}` : ''}`;
    } else {
      return 'اتجاهين';
    }
  };

  // Get unique grades for filter
  const grades = ['all', ...Array.from(new Set(students.map((student) => student.grade)))];

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
        <h1 className="text-2xl font-bold text-gray-800">إدارة الطلبة</h1>
        <Link to="/school/students/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>إضافة طالب</span>
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-gray-800">قائمة الطلبة</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-600" />
              <select
                className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                value={selectedGrade}
                onChange={(e) => handleFilter(e.target.value)}
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
                value={selectedTransport}
                onChange={(e) => setSelectedTransport(e.target.value)}
              >
                <option value="all">جميع أنواع النقل</option>
                <option value="any">يستخدم النقل</option>
                <option value="none">بدون نقل</option>
                <option value="one-way">اتجاه واحد</option>
                <option value="two-way">اتجاهين</option>
              </select>
            </div>
            
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              onClick={handleImportStudents}
              title="استيراد الطلبة من ملف CSV"
            >
              <Upload size={16} />
              <span>استيراد</span>
            </button>
            
            <div className="flex">
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors border-r border-gray-300"
                onClick={handleExportStudentsTemplate}
                title="تنزيل قالب استيراد الطلبة"
              >
                <Download size={16} />
                <span>قالب</span>
              </button>
              
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                onClick={handleExportStudents}
                title="تصدير قائمة الطلبة كملف CSV"
              >
                <Download size={16} />
                <span>تصدير</span>
              </button>
            </div>
          </div>
        </div>
        
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا يوجد طلبة مسجلين
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرقم
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم الطالب
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الصف
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ولي الأمر
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الهاتف
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النقل
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{student.studentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{student.grade}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{student.parentName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{student.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-gray-500 ${student.transportation !== 'none' ? 'font-semibold' : ''}`}>
                        {getTransportationLabel(student)}
                        {student.transportation !== 'none' && (
                          <div className="text-xs text-primary">
                            {student.transportation === 'one-way' 
                              ? `${settings.transportationFeeOneWay} ${CURRENCY}` 
                              : `${settings.transportationFeeTwoWay} ${CURRENCY}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium flex items-center space-x-2 space-x-reverse">
                      <Link
                        to={`/school/students/${student.id}`}
                        className="text-primary hover:text-primary-dark"
                        title="تعديل"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-800"
                        title="حذف"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Import Students Dialog */}
      {importDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">استيراد الطلبة</h3>
            <p className="text-gray-600 mb-4">
              قم بتحميل ملف CSV يحتوي على بيانات الطلبة. يمكنك تنزيل قالب الاستيراد أولاً.
            </p>
            
            <div className="mb-4">
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={handleExportStudentsTemplate}
              >
                تنزيل قالب الاستيراد
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">
                اختر ملف CSV/Excel (مع ترميز UTF-8):
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                ref={fileInputRef}
                onChange={handleImportFileSelected}
                className="w-full p-2 border border-gray-300 rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                تأكد من حفظ الملف بترميز UTF-8 لدعم اللغة العربية
              </p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded mb-4 text-sm">
              <p className="font-semibold text-blue-800 mb-1">
                اختيارات النقل المدرسي:
              </p>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>لا يوجد - لعدم تفعيل النقل المدرسي</li>
                <li>اتجاهين - للنقل ذهاباً وإياباً</li>
                <li>اتجاه واحد - إلى المدرسة - للنقل من المنزل إلى المدرسة فقط</li>
                <li>اتجاه واحد - من المدرسة - للنقل من المدرسة إلى المنزل فقط</li>
              </ul>
              <p className="mt-2 text-blue-800">
                سيتم إنشاء رسوم النقل تلقائياً للطلبة المسجلين بخدمة النقل.
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

export default Students;
 