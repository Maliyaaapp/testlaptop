import  { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowRight, Search, Download } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { CURRENCY } from '../../../utils/constants';
import dataStore from '../../../services/dataStore';
import pdfPrinter from '../../../services/pdfPrinter';

interface Student {
  id: string;
  name: string;
  studentId: string;
  grade: string;
}

interface Fee {
  id: string;
  feeType: string;
  amount: number;
  balance: number;
}

interface InstallmentFormData {
  studentId: string;
  feeId: string;
  amount: number;
  dueDate: string;
  note: string;
  paidDate: string | null;
  schoolId: string;
}

const InstallmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState<InstallmentFormData>({
    studentId: '',
    feeId: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    note: '',
    paidDate: null,
    schoolId: user?.schoolId || ''
  });
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentFees, setStudentFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch students
        let studentsList: Student[];
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          studentsList = dataStore.getStudents(user.schoolId, user.gradeLevels);
        } else {
          studentsList = dataStore.getStudents(user?.schoolId);
        }
        setStudents(studentsList);
        
        if (isEditMode && id) {
          // Fetch installment data
          const installment = dataStore.getInstallment(id);
          if (installment) {
            setFormData({
              studentId: installment.studentId,
              feeId: installment.feeId,
              amount: installment.amount,
              dueDate: installment.dueDate,
              note: installment.note || '',
              paidDate: installment.paidDate,
              schoolId: installment.schoolId
            });
            
            setIsPaid(!!installment.paidDate);
            
            // Find the student
            const student = studentsList.find(s => s.id === installment.studentId);
            if (student) {
              setSelectedStudent(student);
              
              // Fetch student fees
              const fees = dataStore.getFees(user?.schoolId, student.id);
              setStudentFees(fees);
            }
          } else {
            navigate('/school/installments');
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode, navigate, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'amount') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else if (name === 'paid') {
      setIsPaid((e.target as HTMLInputElement).checked);
      setFormData({
        ...formData,
        paidDate: (e.target as HTMLInputElement).checked ? new Date().toISOString().split('T')[0] : null
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear any errors when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      ...formData,
      studentId: student.id,
      feeId: ''
    });
    
    // Fetch student fees
    const fees = dataStore.getFees(user?.schoolId, student.id);
    setStudentFees(fees);
    
    setShowStudentSelector(false);
  };

  const handleSelectFee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const feeId = e.target.value;
    setFormData({
      ...formData,
      feeId
    });
    
    // Set default amount from the selected fee's balance
    const selectedFee = studentFees.find(fee => fee.id === feeId);
    if (selectedFee) {
      setFormData(prev => ({
        ...prev,
        feeId,
        amount: Math.min(selectedFee.balance, selectedFee.balance)
      }));
    }
  };

  const filteredStudents = students.filter(
    (student) => 
      student.name.includes(searchQuery) || 
      student.studentId.includes(searchQuery)
  );

  const getFeeTypeLabel = (type: string) => {
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

  const updateInstallmentNote = () => {
    if (!selectedStudent || !formData.feeId) return formData.note;
    
    const selectedFee = studentFees.find(fee => fee.id === formData.feeId);
    if (selectedFee) {
      return `القسط المستحق للطالب ${selectedStudent.name} من ${getFeeTypeLabel(selectedFee.feeType)} المستحق بتاريخ ${new Date(formData.dueDate).toLocaleDateString('ar-SA')}`;
    }
    
    return formData.note;
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedStudent) {
      newErrors.studentId = 'يجب اختيار طالب';
    }
    
    if (!formData.feeId) {
      newErrors.feeId = 'يجب اختيار الرسوم';
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
    }
    
    const selectedFee = studentFees.find(fee => fee.id === formData.feeId);
    if (selectedFee && formData.amount > selectedFee.balance && !isEditMode) {
      newErrors.amount = `المبلغ لا يمكن أن يكون أكبر من الرصيد المتبقي (${selectedFee.balance} ${CURRENCY})`;
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'تاريخ الاستحقاق مطلوب';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Get student and fee info
      let studentName = '';
      let grade = '';
      let feeType = '';
      
      if (selectedStudent) {
        studentName = selectedStudent.name;
        grade = selectedStudent.grade;
      }
      
      const selectedFee = studentFees.find(fee => fee.id === formData.feeId);
      if (selectedFee) {
        feeType = selectedFee.feeType;
      }
      
      // Prepare installment data
      const installmentData = {
        ...formData,
        id: isEditMode ? id : undefined,
        studentName,
        grade,
        feeType,
        status: formData.paidDate ? 'paid' : 'upcoming'
      };
      
      // Save installment
      dataStore.saveInstallment(installmentData as any);
      
      setIsSaving(false);
      navigate('/school/installments');
    } catch (error) {
      console.error('Error saving installment:', error);
      alert('حدث خطأ أثناء حفظ بيانات القسط');
      setIsSaving(false);
    }
  };
  
  const handlePrintReceipt = () => {
    if (!isPaid || !selectedStudent || !id) return;
    
    const installment = dataStore.getInstallment(id);
    if (!installment) return;
    
    try {
      // Generate PDF receipt
      const receiptData = {
        receiptNumber: `IR-${installment.id.substring(0, 8)}`,
        date: new Date().toLocaleDateString('en-GB'), // Using Georgian date format
        studentName: installment.studentName,
        studentId: selectedStudent.studentId,
        grade: installment.grade,
        feeType: getFeeTypeLabel(installment.feeType),
        amount: installment.amount,
        schoolName: user?.schoolName || 'مدرسة السلطان قابوس',
        schoolLogo: user?.schoolLogo
      };
      
      // Print receipt using pdfPrinter
      pdfPrinter.printReceipt(receiptData);
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('حدث خطأ أثناء إنشاء الإيصال. يرجى المحاولة مرة أخرى.');
    }
  };

  const selectedFee = studentFees.find(fee => fee.id === formData.feeId);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/school/installments')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowRight size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'تعديل القسط' : 'إضافة قسط جديد'}
          </h1>
        </div>
        
        {isEditMode && isPaid && (
          <button
            type="button"
            onClick={handlePrintReceipt}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download size={18} />
            <span>تنزيل الإيصال</span>
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-bold text-gray-800">بيانات القسط</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-gray-700 mb-2">
                الطالب <span className="text-red-500">*</span>
              </label>
              
              {selectedStudent ? (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border">
                  <div>
                    <div className="font-medium">{selectedStudent.name}</div>
                    <div className="text-sm text-gray-500">
                      {selectedStudent.studentId} - {selectedStudent.grade}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    className="btn btn-secondary text-sm py-1"
                    onClick={() => setShowStudentSelector(true)}
                    disabled={isEditMode} // Disable changing student in edit mode
                  >
                    تغيير
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    className="btn btn-secondary w-full flex items-center justify-center gap-2"
                    onClick={() => setShowStudentSelector(true)}
                  >
                    <Search size={16} />
                    <span>اختيار طالب</span>
                  </button>
                  {errors.studentId && (
                    <p className="text-red-500 text-sm mt-1">{errors.studentId}</p>
                  )}
                </div>
              )}
              
              {showStudentSelector && !isEditMode && (
                <div className="absolute z-10 mt-2 w-full bg-white border rounded-md shadow-lg p-3">
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="بحث عن طالب..."
                      className="input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <div className="p-2 text-center text-gray-500">
                        لا توجد نتائج
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {filteredStudents.map((student) => (
                          <li key={student.id}>
                            <button
                              type="button"
                              className="w-full text-right p-2 hover:bg-gray-50 transition-colors rounded"
                              onClick={() => handleSelectStudent(student)}
                            >
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-gray-500">
                                {student.studentId} - {student.grade}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="btn btn-secondary text-sm py-1"
                      onClick={() => setShowStudentSelector(false)}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {selectedStudent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="feeId">
                    الرسوم <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="feeId"
                    name="feeId"
                    className={`input ${errors.feeId ? 'border-red-500' : ''}`}
                    value={formData.feeId}
                    onChange={handleSelectFee}
                    required
                    disabled={isEditMode} // Disable changing fee in edit mode
                  >
                    <option value="">-- اختر الرسوم --</option>
                    {studentFees.map((fee) => (
                      <option key={fee.id} value={fee.id}>
                        {getFeeTypeLabel(fee.feeType)} - المتبقي: {fee.balance.toLocaleString()} {CURRENCY}
                      </option>
                    ))}
                  </select>
                  {errors.feeId && (
                    <p className="text-red-500 text-sm mt-1">{errors.feeId}</p>
                  )}
                  
                  {studentFees.length === 0 && (
                    <p className="text-yellow-500 text-sm mt-1">
                      لا توجد رسوم لهذا الطالب. يرجى إضافة رسوم أولاً.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="dueDate">
                    تاريخ الاستحقاق <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    className={`input ${errors.dueDate ? 'border-red-500' : ''}`}
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                  {errors.dueDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="amount">
                    المبلغ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      className={`input pl-16 ${errors.amount ? 'border-red-500' : ''}`}
                      value={formData.amount}
                      onChange={handleChange}
                      min="0"
                      max={isEditMode ? undefined : selectedFee?.balance}
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center bg-gray-100 border-l border-gray-300 px-3 rounded-l-md">
                      {CURRENCY}
                    </div>
                  </div>
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>
                
                <div>
                  <label className="flex items-center p-2">
                    <input
                      type="checkbox"
                      name="paid"
                      checked={isPaid}
                      onChange={handleChange}
                      className="h-5 w-5 text-primary rounded"
                    />
                    <span className="mr-2 text-gray-700">تم الدفع</span>
                  </label>
                  
                  {isPaid && (
                    <div className="mt-2">
                      <label className="block text-gray-700 mb-2" htmlFor="paidDate">
                        تاريخ الدفع
                      </label>
                      <input
                        id="paidDate"
                        name="paidDate"
                        type="date"
                        className="input"
                        value={formData.paidDate || ''}
                        onChange={(e) => setFormData({...formData, paidDate: e.target.value})}
                      />
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2" htmlFor="note">
                    ملاحظات
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    rows={3}
                    className="input"
                    value={formData.note || updateInstallmentNote() || ''}
                    onChange={handleChange}
                    placeholder={selectedFee ? 
                      `القسط المستحق للطالب ${selectedStudent.name} من ${getFeeTypeLabel(selectedFee.feeType)}` : 
                      "ملاحظات حول القسط"}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/school/installments')}
              className="btn btn-secondary ml-3"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
              disabled={isSaving || !selectedStudent || !formData.feeId}
            >
              <Save size={18} />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstallmentForm;
 