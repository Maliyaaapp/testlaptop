import  { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowRight, Plus, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { GRADE_LEVELS } from '../../../utils/constants';
import api from '../../../services/api';

interface School {
  id: string;
  name: string;
  logo?: string;
}

interface AccountFormData {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  schoolId: string;
  gradeLevels: string[];
}

const AccountForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'schoolAdmin',
    schoolId: '',
    gradeLevels: []
  });
  
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch schools for the dropdown
        const schoolsResponse = await api.getSchools();
        if (schoolsResponse.success) {
          setSchools(schoolsResponse.data);
        }
        
        if (isEditMode && id) {
          // Fetch account data
          const accounts = await api.getAccounts();
          if (accounts.success) {
            const account = accounts.data.find((a: any) => a.id === id);
            
            if (account) {
              setFormData({
                name: account.name || '',
                email: account.email || '',
                username: account.username || account.email || '',
                password: '',
                role: account.role || 'schoolAdmin',
                schoolId: account.schoolId || '',
                gradeLevels: account.gradeLevels || []
              });
            } else {
              navigate('/admin/accounts');
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear errors when field is modified
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleGradeLevelChange = (gradeLevel: string) => {
    const isSelected = formData.gradeLevels.includes(gradeLevel);
    
    if (isSelected) {
      // Remove grade level
      setFormData({
        ...formData,
        gradeLevels: formData.gradeLevels.filter(gl => gl !== gradeLevel)
      });
    } else {
      // Add grade level
      setFormData({
        ...formData,
        gradeLevels: [...formData.gradeLevels, gradeLevel]
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    }
    
    if (!isEditMode && !formData.password.trim()) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (!isEditMode && formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    
    if (!formData.schoolId) {
      newErrors.schoolId = 'المدرسة مطلوبة';
    }
    
    if (formData.role === 'gradeManager' && formData.gradeLevels.length === 0) {
      newErrors.gradeLevels = 'يجب اختيار صف واحد على الأقل';
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
      // Get school details to include in the account
      const selectedSchool = schools.find(school => school.id === formData.schoolId);
      
      // Prepare account data
      const accountData = {
        ...formData,
        school: selectedSchool?.name || '',
        schoolName: selectedSchool?.name || '',
        schoolLogo: selectedSchool?.logo || ''
      };
      
      let response;
      
      if (isEditMode && id) {
        // Update existing account
        response = await api.updateAccount(id, accountData);
      } else {
        // Create new account
        response = await api.createAccount(accountData);
      }
      
      if (response.success) {
        setIsSaving(false);
        navigate('/admin/accounts');
      } else {
        alert(response.error || 'حدث خطأ أثناء حفظ الحساب');
        setIsSaving(false);
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert('حدث خطأ أثناء حفظ الحساب');
      setIsSaving(false);
    }
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
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/accounts')}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowRight size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد'}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-bold text-gray-800">بيانات الحساب</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="email">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="username">
                اسم المستخدم <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className={`input ${errors.username ? 'border-red-500' : ''}`}
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                يمكن استخدام اسم المستخدم أو البريد الإلكتروني لتسجيل الدخول
              </p>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="password">
                {isEditMode ? 'كلمة المرور (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور'}
                {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`input ${errors.password ? 'border-red-500' : ''}`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="role">
                الدور <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                className="input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="schoolAdmin">مدير مدرسة</option>
                <option value="gradeManager">مدير صف</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="schoolId">
                المدرسة <span className="text-red-500">*</span>
              </label>
              <select
                id="schoolId"
                name="schoolId"
                className={`input ${errors.schoolId ? 'border-red-500' : ''}`}
                value={formData.schoolId}
                onChange={handleChange}
              >
                <option value="">-- اختر المدرسة --</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              {errors.schoolId && (
                <p className="text-red-500 text-sm mt-1">{errors.schoolId}</p>
              )}
            </div>
            
            {formData.role === 'gradeManager' && (
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">
                  الصفوف الدراسية <span className="text-red-500">*</span>
                </label>
                <div className={`p-3 border rounded-md ${errors.gradeLevels ? 'border-red-500' : 'border-gray-300'}`}>
                  {formData.gradeLevels.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.gradeLevels.map((grade) => (
                        <div key={grade} className="bg-primary-light/10 px-3 py-1 rounded-full flex items-center gap-1">
                          <span className="text-primary text-sm">{grade}</span>
                          <button
                            type="button"
                            onClick={() => handleGradeLevelChange(grade)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 mb-3">لم يتم اختيار أي صف</div>
                  )}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {GRADE_LEVELS.map((grade) => (
                      <div 
                        key={grade}
                        className={`px-3 py-2 border rounded-md text-sm cursor-pointer transition-colors ${
                          formData.gradeLevels.includes(grade) 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-white hover:bg-gray-50 border-gray-300'
                        }`}
                        onClick={() => handleGradeLevelChange(grade)}
                      >
                        {grade}
                      </div>
                    ))}
                  </div>
                </div>
                {errors.gradeLevels && (
                  <p className="text-red-500 text-sm mt-1">{errors.gradeLevels}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/accounts')}
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

export default AccountForm;
 