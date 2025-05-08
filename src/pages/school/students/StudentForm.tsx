import  { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { GRADE_LEVELS, TRANSPORTATION_TYPES, CURRENCY } from '../../../utils/constants';
import { formatPhoneNumber } from '../../../utils/validation';
import dataStore from '../../../services/dataStore';

interface StudentFormData {
  name: string;
  studentId: string;
  grade: string;
  parentName: string;
  parentEmail: string;
  phone: string;
  whatsapp: string;
  address: string;
  transportation: 'none' | 'one-way' | 'two-way';
  transportationDirection?: 'to-school' | 'from-school';
  transportationFee?: number;
  customTransportationFee?: boolean;
  schoolId: string;
}

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    studentId: '',
    grade: user?.role === 'gradeManager' && user?.gradeLevels?.length ? user.gradeLevels[0] : '',
    parentName: '',
    parentEmail: '',
    phone: '+968 ',
    whatsapp: '+968 ',
    address: '',
    transportation: 'none',
    schoolId: user?.schoolId || ''
  });
  
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<any>({
    transportationFeeOneWay: 150,
    transportationFeeTwoWay: 300
  });

  useEffect(() => {
    if (isEditMode && id) {
      // Fetch student data
      const student = dataStore.getStudent(id);
      if (student) {
        setFormData({
          name: student.name,
          studentId: student.studentId,
          grade: student.grade,
          parentName: student.parentName,
          parentEmail: student.parentEmail || '',
          phone: student.phone,
          whatsapp: student.whatsapp || student.phone,
          address: student.address || '',
          transportation: student.transportation,
          transportationDirection: student.transportationDirection,
          transportationFee: student.transportationFee,
          customTransportationFee: student.customTransportationFee,
          schoolId: student.schoolId
        });
      } else {
        navigate('/school/students');
      }
    } else {
      // Initialize new student form with defaults
      setFormData(prev => ({
        ...prev,
        studentId: dataStore.generateStudentId(user?.schoolId || '', prev.grade)
      }));
    }
    
    // Get school settings
    if (user?.schoolId) {
      const schoolSettings = dataStore.getSettings(user.schoolId);
      setSettings(schoolSettings);
    }
    
    setIsLoading(false);
  }, [id, isEditMode, navigate, user]);

  // Set transportation fee based on type
  useEffect(() => {
    if (formData.transportation !== 'none' && !formData.customTransportationFee) {
      setFormData(prev => ({
        ...prev,
        transportationFee: prev.transportation === 'one-way' 
          ? settings.transportationFeeOneWay 
          : settings.transportationFeeTwoWay
      }));
    }
  }, [formData.transportation, settings, formData.customTransportationFee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name === 'phone' || name === 'whatsapp') {
      setFormData({
        ...formData,
        [name]: formatPhoneNumber(value)
      });
    } else if (name === 'grade' && !isEditMode) {
      // Generate new student ID when grade changes for new students
      setFormData({
        ...formData,
        grade: value,
        studentId: dataStore.generateStudentId(user?.schoolId || '', value)
      });
    } else if (type === "checkbox" && name === "customTransportationFee") {
      setFormData({
        ...formData,
        customTransportationFee: (e.target as HTMLInputElement).checked
      });
    } else if (type === "checkbox" && name === "transportation") {
      // Handle transportation checkbox
      setFormData({
        ...formData,
        transportation: (e.target as HTMLInputElement).checked ? 'one-way' : 'none',
        transportationFee: (e.target as HTMLInputElement).checked ? settings.transportationFeeOneWay : undefined,
        customTransportationFee: false
      });
    } else if (name === 'transportationFee') {
      setFormData({
        ...formData,
        transportationFee: parseFloat(value) || 0,
        customTransportationFee: true
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear any existing error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم الطالب مطلوب';
    }
    
    if (!formData.studentId.trim()) {
      newErrors.studentId = 'رقم الطالب مطلوب';
    }
    
    if (!formData.grade) {
      newErrors.grade = 'الصف الدراسي مطلوب';
    }
    
    if (!formData.parentName.trim()) {
      newErrors.parentName = 'اسم ولي الأمر مطلوب';
    }
    
    if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = 'البريد الإلكتروني غير صحيح';
    }
    
    if (!formData.phone || formData.phone === '+968 ') {
      newErrors.phone = 'رقم الهاتف مطلوب';
    }
    
    if (formData.transportation === 'one-way' && !formData.transportationDirection) {
      newErrors.transportationDirection = 'يرجى تحديد اتجاه النقل';
    }
    
    if (formData.transportation !== 'none' && formData.transportationFee !== undefined && formData.transportationFee <= 0) {
      newErrors.transportationFee = 'يجب أن يكون مبلغ النقل أكبر من صفر';
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
      // Save student data
      const studentData = {
        ...formData,
        id: isEditMode ? id : undefined,
      };
      
      const savedStudent = dataStore.saveStudent(studentData as any);
      
      // If transportation is selected, create transportation fee automatically
      if (formData.transportation !== 'none' && !isEditMode) {
        const transportationAmount = formData.transportationFee || 
          (formData.transportation === 'one-way' 
            ? settings.transportationFeeOneWay 
            : settings.transportationFeeTwoWay);
          
        const feeData = {
          studentId: savedStudent.id || '',
          feeType: 'transportation',
          description: `رسوم النقل - ${formData.transportation === 'one-way' ? 'اتجاه واحد' : 'اتجاهين'}${formData.transportationDirection ? ` - ${formData.transportationDirection === 'to-school' ? 'إلى المدرسة' : 'من المدرسة'}` : ''}`,
          amount: transportationAmount,
          discount: 0,
          paid: 0,
          balance: transportationAmount,
          status: 'unpaid',
          dueDate: new Date().toISOString().split('T')[0],
          schoolId: user?.schoolId || '',
          transportationType: formData.transportation
        };
        
        dataStore.saveFee(feeData as any);
      }
      
      setIsSaving(false);
      navigate('/school/students');
    } catch (error) {
      console.error('Error saving student:', error);
      setIsSaving(false);
      alert('حدث خطأ أثناء حفظ بيانات الطالب');
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter grades based on user role
  const availableGrades = user?.role === 'gradeManager' && user?.gradeLevels ? 
    user.gradeLevels : 
    GRADE_LEVELS;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/school/students')}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowRight size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-bold text-gray-800">بيانات الطالب</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                اسم الطالب <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="studentId">
                رقم الطالب <span className="text-red-500">*</span>
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                className={`input ${errors.studentId ? 'border-red-500' : ''}`}
                value={formData.studentId}
                onChange={handleChange}
              />
              {errors.studentId && <p className="text-red-500 text-sm mt-1">{errors.studentId}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="grade">
                الصف الدراسي <span className="text-red-500">*</span>
              </label>
              <select
                id="grade"
                name="grade"
                className={`input ${errors.grade ? 'border-red-500' : ''}`}
                value={formData.grade}
                onChange={handleChange}
                disabled={user?.role === 'gradeManager' && user?.gradeLevels?.length === 1}
              >
                <option value="">-- اختر الصف --</option>
                {availableGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              {errors.grade && <p className="text-red-500 text-sm mt-1">{errors.grade}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="parentName">
                اسم ولي الأمر <span className="text-red-500">*</span>
              </label>
              <input
                id="parentName"
                name="parentName"
                type="text"
                className={`input ${errors.parentName ? 'border-red-500' : ''}`}
                value={formData.parentName}
                onChange={handleChange}
              />
              {errors.parentName && <p className="text-red-500 text-sm mt-1">{errors.parentName}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="parentEmail">
                البريد الإلكتروني
              </label>
              <input
                id="parentEmail"
                name="parentEmail"
                type="email"
                className={`input ${errors.parentEmail ? 'border-red-500' : ''}`}
                value={formData.parentEmail}
                onChange={handleChange}
              />
              {errors.parentEmail && <p className="text-red-500 text-sm mt-1">{errors.parentEmail}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="phone">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`input ${errors.phone ? 'border-red-500' : ''}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="+968 XXXXXXXX"
              />
              {errors.phone ? (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">الصيغة: +968 XXXXXXXX</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="whatsapp">
                رقم الواتساب
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                className="input"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+968 XXXXXXXX"
              />
              <p className="text-xs text-gray-500 mt-1">الصيغة: +968 XXXXXXXX</p>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">
                خدمة النقل المدرسي
              </label>
              
              <div className="p-4 bg-gray-50 rounded-md space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="transportationEnabled"
                    name="transportation"
                    className="h-4 w-4 text-primary rounded focus:ring-primary"
                    checked={formData.transportation !== 'none'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        transportation: e.target.checked ? 'one-way' : 'none',
                        transportationDirection: e.target.checked ? 'to-school' : undefined,
                        customTransportationFee: false
                      });
                    }}
                  />
                  <label htmlFor="transportationEnabled" className="mr-2 text-gray-700">
                    تفعيل خدمة النقل المدرسي
                  </label>
                </div>
                
                {formData.transportation !== 'none' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="transportationType">
                        نوع النقل
                      </label>
                      <select
                        id="transportationType"
                        name="transportation"
                        className="input"
                        value={formData.transportation}
                        onChange={handleChange}
                      >
                        <option value="one-way">اتجاه واحد</option>
                        <option value="two-way">اتجاهين</option>
                      </select>
                    </div>
                    
                    {formData.transportation === 'one-way' && (
                      <div>
                        <label className="block text-gray-700 mb-2" htmlFor="transportationDirection">
                          اتجاه النقل <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="transportationDirection"
                          name="transportationDirection"
                          className={`input ${errors.transportationDirection ? 'border-red-500' : ''}`}
                          value={formData.transportationDirection || ''}
                          onChange={handleChange}
                        >
                          <option value="">-- اختر الاتجاه --</option>
                          <option value="to-school">من المنزل إلى المدرسة</option>
                          <option value="from-school">من المدرسة إلى المنزل</option>
                        </select>
                        {errors.transportationDirection && (
                          <p className="text-red-500 text-sm mt-1">{errors.transportationDirection}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="checkbox"
                          id="customTransportationFee"
                          name="customTransportationFee"
                          className="h-4 w-4 text-primary rounded focus:ring-primary"
                          checked={!!formData.customTransportationFee}
                          onChange={handleChange}
                        />
                        <label htmlFor="customTransportationFee" className="text-gray-700">
                          تعيين رسوم مخصصة للنقل
                        </label>
                      </div>
                      
                      {formData.customTransportationFee && (
                        <div>
                          <label className="block text-gray-700 mb-2" htmlFor="transportationFee">
                            رسوم النقل المخصصة
                          </label>
                          <div className="relative">
                            <input
                              id="transportationFee"
                              name="transportationFee"
                              type="number"
                              className={`input pl-16 ${errors.transportationFee ? 'border-red-500' : ''}`}
                              value={formData.transportationFee || 0}
                              onChange={handleChange}
                              min="0"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center bg-gray-100 border-l border-gray-300 px-3 rounded-l-md">
                              {CURRENCY}
                            </div>
                          </div>
                          {errors.transportationFee && (
                            <p className="text-red-500 text-sm mt-1">{errors.transportationFee}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="p-3 bg-white rounded border border-gray-200 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">الرسوم المترتبة:</span>
                          <span className="font-bold text-primary">
                            {formData.transportationFee !== undefined ? formData.transportationFee : 
                              (formData.transportation === 'one-way' 
                                ? settings.transportationFeeOneWay 
                                : settings.transportationFeeTwoWay)
                            } {CURRENCY}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          سيتم إنشاء رسوم النقل تلقائياً للطالب بعد الحفظ
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2" htmlFor="address">
                العنوان
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                className="input"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/school/students')}
              className="btn btn-secondary ml-3"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
              disabled={isSaving}
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

export default StudentForm;
 