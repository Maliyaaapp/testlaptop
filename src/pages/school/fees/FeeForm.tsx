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

const FeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState<any>({
    studentId: '',
    feeType: 'tuition',
    description: '',
    amount: 0,
    discount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    installments: 1,
    schoolId: user?.schoolId || ''
  });
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<any>({
    defaultInstallments: 4,
    transportationFeeOneWay: 150,
    transportationFeeTwoWay: 300
  });
  
  // Flag to show transportation options
  const [showTransportationSettings, setShowTransportationSettings] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch school settings
        if (user?.schoolId) {
          const schoolSettings = dataStore.getSettings(user.schoolId);
          setSettings(schoolSettings);
          
          if (!isEditMode) {
            setFormData(prev => ({
              ...prev,
              installments: schoolSettings.defaultInstallments || 1
            }));
          }
        }
        
        // Fetch students
        let studentsList: Student[];
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          studentsList = dataStore.getStudents(user.schoolId, user.gradeLevels);
        } else {
          studentsList = dataStore.getStudents(user?.schoolId);
        }
        setStudents(studentsList);
        
        if (isEditMode && id) {
          // Fetch fee data
          const fee = dataStore.getFee(id);
          if (fee) {
            setFormData({
              studentId: fee.studentId,
              feeType: fee.feeType,
              description: fee.description || '',
              amount: fee.amount,
              discount: fee.discount,
              dueDate: fee.dueDate,
              transportationType: fee.transportationType,
              installments: 1, // We don't store this in the fee record
              schoolId: fee.schoolId
            });
            
            // Find the associated student
            const student = studentsList.find(s => s.id === fee.studentId);
            if (student) {
              setSelectedStudent(student);
            }
            
            // Check if this is a transportation fee
            if (fee.feeType === 'transportation') {
              setShowTransportationSettings(true);
            }
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
  
  // Handle transportation fee changes
  useEffect(() => {
    if (formData.feeType === 'transportation') {
      setShowTransportationSettings(true);
      
      // Auto-set transportation type based on student's settings if available
      if (selectedStudent && selectedStudent.transportation !== 'none') {
        setFormData(prev => ({
          ...prev,
          transportationType: selectedStudent.transportation,
          amount: selectedStudent.transportation === 'two-way' 
            ? settings.transportationFeeTwoWay
            : settings.transportationFeeOneWay
        }));
      } else if (!formData.transportationType) {
        // Default to one-way if not set
        setFormData(prev => ({
          ...prev,
          transportationType: 'one-way',
          amount: settings.transportationFeeOneWay
        }));
      }
    } else {
      setShowTransportationSettings(false);
      
      // Remove transportation type if not a transportation fee
      if (formData.transportationType) {
        const { transportationType, ...rest } = formData;
        setFormData(rest);
      }
    }
  }, [formData.feeType, selectedStudent, settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else if (name === 'feeType' && value === 'transportation' && selectedStudent) {
      // If selecting transportation fee, set the type and amount based on student's transportation
      const transportationType = selectedStudent.transportation !== 'none' 
        ? selectedStudent.transportation 
        : 'one-way';
      
      const transportationAmount = transportationType === 'two-way'
        ? settings.transportationFeeTwoWay
        : settings.transportationFeeOneWay;
      
      setFormData({
        ...formData,
        [name]: value,
        transportationType,
        amount: transportationAmount
      });
    } else if (name === 'transportationType') {
      // Update amount based on transportation type
      const transportationAmount = value === 'two-way'
        ? settings.transportationFeeTwoWay
        : settings.transportationFeeOneWay;
      
      setFormData({
        ...formData,
        [name]: value,
        amount: transportationAmount
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
      // If fee type is transportation, update type and amount based on student's settings
      ...(formData.feeType === 'transportation' && student.transportation !== 'none' ? {
        transportationType: student.transportation,
        amount: student.transportation === 'two-way' 
          ? settings.transportationFeeTwoWay
          : settings.transportationFeeOneWay
      } : {})
    });
    setShowStudentSelector(false);
  };

  const filteredStudents = students.filter(
    (student) => 
      student.name.includes(searchQuery) || 
      student.studentId.includes(searchQuery)
  );

  const updateTemplateVariables = (text: string) => {
    if (!selectedStudent) return text;
    
    // Replace variables in template
    return text
      .replace(/{{name}}/g, selectedStudent.name)
      .replace(/{{amount}}/g, formData.amount.toString())
      .replace(/{{date}}/g, new Date(formData.dueDate).toLocaleDateString('ar-SA'));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedStudent) {
      newErrors.studentId = 'يجب اختيار طالب';
    }
    
    if (!formData.feeType) {
      newErrors.feeType = 'نوع الرسوم مطلوب';
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
    }
    
    if (formData.discount < 0) {
      newErrors.discount = 'الخصم يجب أن يكون صفر أو أكبر';
    }
    
    if (formData.discount > formData.amount) {
      newErrors.discount = 'الخصم لا يمكن أن يكون أكبر من المبلغ';
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'تاريخ الاستحقاق مطلوب';
    }
    
    if (formData.feeType === 'transportation' && !formData.transportationType) {
      newErrors.transportationType = 'يجب اختيار نوع النقل';
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
      // Generate description for transportation fees if not provided
      let description = formData.description;
      if (formData.feeType === 'transportation' && !description.trim()) {
        const directionText = selectedStudent?.transportationDirection ? 
          (selectedStudent.transportationDirection === 'to-school' ? ' - إلى المدرسة' : ' - من المدرسة') : '';
          
        description = `رسوم النقل المدرسي - ${formData.transportationType === 'one-way' ? 'اتجاه واحد' + directionText : 'اتجاهين'}`;
      }
      
      // Prepare the fee data
      const feeData = {
        ...formData,
        description,
        id: isEditMode ? id : undefined,
        studentName: selectedStudent!.name,
        grade: selectedStudent!.grade,
      };
      
      // Save the fee data
      const savedFee = dataStore.saveFee(feeData as any);
      
      // If it's a new fee and installments > 1, create installment plan
      if (!isEditMode && formData.installments > 1) {
        dataStore.createInstallmentPlan(savedFee, formData.installments);
      }
      
      setIsSaving(false);
      navigate('/school/fees');
    } catch (error) {
      console.error('Error saving fee:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
      setIsSaving(false);
    }
  };

  const handleDownloadStudentReport = () => {
    if (!selectedStudent) return;
    
    try {
      // Fetch all fees for this student
      const studentFees = dataStore.getFees(user?.schoolId, selectedStudent.id);
      
      // Prepare data for report
      const reportData = {
        studentName: selectedStudent.name,
        studentId: selectedStudent.studentId,
        grade: selectedStudent.grade,
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
      
      // Generate PDF report
      pdfPrinter.printStudentReport(reportData);
    } catch (error) {
      console.error('Error generating student report:', error);
      alert('حدث خطأ أثناء إنشاء التقرير المالي للطالب');
    }
  };

  const getNetAmount = () => {
    return formData.amount - formData.discount;
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
            onClick={() => navigate('/school/fees')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowRight size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'تعديل الرسوم' : 'إضافة رسوم جديدة'}
          </h1>
        </div>
        
        {selectedStudent && (
          <button
            type="button"
            onClick={handleDownloadStudentReport}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download size={18} />
            <span>تنزيل التقرير المالي للطالب</span>
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-bold text-gray-800">بيانات الرسوم</h2>
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
                    {selectedStudent.transportation !== 'none' && (
                      <div className="text-xs text-primary mt-1">
                        النقل المدرسي: {selectedStudent.transportation === 'two-way' ? 'اتجاهين' : 
                          `اتجاه واحد ${selectedStudent.transportationDirection === 'to-school' ? 
                            '(إلى المدرسة)' : '(من المدرسة)'}`}
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    className="btn btn-secondary text-sm py-1"
                    onClick={() => setShowStudentSelector(true)}
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
              
              {showStudentSelector && (
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="feeType">
                  نوع الرسوم <span className="text-red-500">*</span>
                </label>
                <select
                  id="feeType"
                  name="feeType"
                  className={`input ${errors.feeType ? 'border-red-500' : ''}`}
                  value={formData.feeType}
                  onChange={handleChange}
                  required
                >
                  <option value="tuition">رسوم دراسية</option>
                  <option value="transportation">نقل مدرسي</option>
                  <option value="activities">أنشطة</option>
                  <option value="uniform">زي مدرسي</option>
                  <option value="books">كتب</option>
                  <option value="other">رسوم أخرى</option>
                </select>
                {errors.feeType && (
                  <p className="text-red-500 text-sm mt-1">{errors.feeType}</p>
                )}
              </div>
              
              {showTransportationSettings && (
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="transportationType">
                    نوع النقل <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="transportationType"
                    name="transportationType"
                    className={`input ${errors.transportationType ? 'border-red-500' : ''}`}
                    value={formData.transportationType || 'one-way'}
                    onChange={handleChange}
                    required={formData.feeType === 'transportation'}
                  >
                    <option value="one-way">اتجاه واحد ({settings.transportationFeeOneWay} {CURRENCY})</option>
                    <option value="two-way">اتجاهين ({settings.transportationFeeTwoWay} {CURRENCY})</option>
                  </select>
                  {errors.transportationType && (
                    <p className="text-red-500 text-sm mt-1">{errors.transportationType}</p>
                  )}
                  
                  {selectedStudent?.transportation !== 'none' && formData.transportationType !== selectedStudent?.transportation && (
                    <p className="text-yellow-500 text-sm mt-1">
                      تنبيه: نوع النقل المحدد مختلف عن إعدادات النقل للطالب ({selectedStudent.transportation === 'two-way' ? 'اتجاهين' : 'اتجاه واحد'})
                    </p>
                  )}
                </div>
              )}
              
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
                    required
                    disabled={formData.feeType === 'transportation'} // Disable for transportation fees
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
                <label className="block text-gray-700 mb-2" htmlFor="discount">
                  الخصم
                </label>
                <div className="relative">
                  <input
                    id="discount"
                    name="discount"
                    type="number"
                    className={`input pl-16 ${errors.discount ? 'border-red-500' : ''}`}
                    value={formData.discount}
                    onChange={handleChange}
                    min="0"
                    max={formData.amount}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center bg-gray-100 border-l border-gray-300 px-3 rounded-l-md">
                    {CURRENCY}
                  </div>
                </div>
                {errors.discount && (
                  <p className="text-red-500 text-sm mt-1">{errors.discount}</p>
                )}
              </div>
              
              {!isEditMode && (
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="installments">
                    خطة الأقساط
                  </label>
                  <select
                    id="installments"
                    name="installments"
                    className="input"
                    value={formData.installments}
                    onChange={handleChange}
                  >
                    <option value={1}>دفعة واحدة</option>
                    <option value={2}>دفعتين</option>
                    <option value={3}>ثلاث دفعات</option>
                    <option value={4}>أربع دفعات</option>
                    <option value={6}>ست دفعات</option>
                    <option value={12}>اثنا عشر دفعة</option>
                  </select>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="description">
                الوصف
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="input"
                value={formData.description}
                onChange={handleChange}
                placeholder={selectedStudent ? 
                  `رسوم ${getFeeTypeLabel(formData.feeType)} للطالب ${selectedStudent.name} للعام الدراسي 2023/2024` : 
                  "وصف الرسوم"}
              />
              {selectedStudent && formData.description && (
                <p className="text-xs text-gray-500 mt-1">
                  النص بعد استبدال المتغيرات: {updateTemplateVariables(formData.description)}
                </p>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-bold text-gray-800 mb-3">ملخص الرسوم</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>المبلغ الإجمالي:</span>
                  <span className="font-medium">{formData.amount.toLocaleString()} {CURRENCY}</span>
                </div>
                <div className="flex justify-between">
                  <span>الخصم:</span>
                  <span className="font-medium">{formData.discount.toLocaleString()} {CURRENCY}</span>
                </div>
                <div className="flex justify-between text-primary font-bold pt-2 border-t">
                  <span>المبلغ المستحق:</span>
                  <span>{getNetAmount().toLocaleString()} {CURRENCY}</span>
                </div>
                
                {!isEditMode && formData.installments > 1 && (
                  <div className="text-sm text-gray-500 mt-3 pt-2 border-t">
                    سيتم إنشاء {formData.installments} قسط بقيمة {Math.floor(getNetAmount() / formData.installments).toLocaleString()} {CURRENCY} لكل قسط.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/school/fees')}
              className="btn btn-secondary ml-3"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
              disabled={isSaving || !selectedStudent}
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

export default FeeForm;
 