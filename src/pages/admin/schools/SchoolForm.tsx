import  { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowRight, Upload } from 'lucide-react';
import { LOCATIONS } from '../../../utils/constants';
import api from '../../../services/api';

interface SchoolFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  active: boolean;
  subscriptionStart: string;
  subscriptionEnd: string;
  logo: string;
}

const SchoolForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    email: '',
    phone: '+968 ',
    address: '',
    location: 'مسقط',
    active: true,
    subscriptionStart: new Date().toISOString().split('T')[0],
    subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    logo: ''
  });
  
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (isEditMode) {
        try {
          // Fetch school data
          const response = await api.getSchool(id!);
          if (response.success) {
            setFormData(response.data);
            if (response.data.logo) {
              setLogoPreview(response.data.logo);
            }
          } else {
            navigate('/admin/schools');
          }
        } catch (error) {
          console.error('Error fetching school:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Clear errors when field is modified
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    if (type === 'checkbox') {
      const checkboxTarget = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkboxTarget.checked
      });
    } else if (name === 'phone') {
      // Format phone number
      let phoneValue = value;
      if (!phoneValue.startsWith('+968') && !phoneValue.startsWith('968')) {
        phoneValue = '+968 ' + phoneValue.replace(/^\+968\s?/, '');
      }
      setFormData({
        ...formData,
        [name]: phoneValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleLogoUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.match('image.*')) {
        setErrors({
          ...errors,
          logo: 'يرجى اختيار ملف صورة صالح'
        });
        return;
      }
      
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        setFormData({
          ...formData,
          logo: result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = 'اسم المدرسة مطلوب';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    if (!formData.phone.trim() || formData.phone === '+968 ') {
      newErrors.phone = 'رقم الهاتف مطلوب';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'العنوان مطلوب';
    }
    
    if (!formData.location) {
      newErrors.location = 'المحافظة/الولاية مطلوبة';
    }
    
    if (!formData.subscriptionStart) {
      newErrors.subscriptionStart = 'تاريخ بداية الاشتراك مطلوب';
    }
    
    if (!formData.subscriptionEnd) {
      newErrors.subscriptionEnd = 'تاريخ انتهاء الاشتراك مطلوب';
    }
    
    // Check subscription dates
    if (formData.subscriptionStart && formData.subscriptionEnd) {
      const startDate = new Date(formData.subscriptionStart);
      const endDate = new Date(formData.subscriptionEnd);
      
      if (endDate < startDate) {
        newErrors.subscriptionEnd = 'تاريخ انتهاء الاشتراك يجب أن يكون بعد تاريخ البداية';
      }
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
      let response;
      if (isEditMode && id) {
        response = await api.updateSchool(id, formData);
      } else {
        response = await api.createSchool(formData);
      }
      
      if (response.success) {
        setIsSaving(false);
        navigate('/admin/schools');
      } else {
        alert(response.error || 'حدث خطأ أثناء حفظ البيانات');
        setIsSaving(false);
      }
    } catch (error) {
      console.error('Error saving school:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
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
          onClick={() => navigate('/admin/schools')}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowRight size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'تعديل بيانات المدرسة' : 'إضافة مدرسة جديدة'}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-bold text-gray-800">بيانات المدرسة</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                اسم المدرسة <span className="text-red-500">*</span>
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
              <label className="block text-gray-700 mb-2" htmlFor="location">
                المحافظة/الولاية <span className="text-red-500">*</span>
              </label>
              <select
                id="location"
                name="location"
                className={`input ${errors.location ? 'border-red-500' : ''}`}
                value={formData.location}
                onChange={handleChange}
              >
                <option value="">-- اختر المحافظة/الولاية --</option>
                {LOCATIONS.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="subscriptionStart">
                تاريخ بداية الاشتراك <span className="text-red-500">*</span>
              </label>
              <input
                id="subscriptionStart"
                name="subscriptionStart"
                type="date"
                className={`input ${errors.subscriptionStart ? 'border-red-500' : ''}`}
                value={formData.subscriptionStart}
                onChange={handleChange}
              />
              {errors.subscriptionStart && (
                <p className="text-red-500 text-sm mt-1">{errors.subscriptionStart}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="subscriptionEnd">
                تاريخ انتهاء الاشتراك <span className="text-red-500">*</span>
              </label>
              <input
                id="subscriptionEnd"
                name="subscriptionEnd"
                type="date"
                className={`input ${errors.subscriptionEnd ? 'border-red-500' : ''}`}
                value={formData.subscriptionEnd}
                onChange={handleChange}
              />
              {errors.subscriptionEnd && (
                <p className="text-red-500 text-sm mt-1">{errors.subscriptionEnd}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">
                شعار المدرسة
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleLogoUpload}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Upload size={16} />
                  <span>رفع شعار</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {logoPreview && (
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="معاينة شعار المدرسة" 
                      className="h-16 w-auto object-contain border rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview('');
                        setFormData({
                          ...formData,
                          logo: ''
                        });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              {errors.logo && (
                <p className="text-red-500 text-sm mt-1">{errors.logo}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2" htmlFor="address">
                العنوان <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                className={`input ${errors.address ? 'border-red-500' : ''}`}
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center space-x-3 space-x-reverse">
                <input
                  name="active"
                  type="checkbox"
                  className="h-5 w-5 text-primary rounded focus:ring-primary"
                  checked={formData.active}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      active: e.target.checked
                    });
                  }}
                />
                <span className="text-gray-700">المدرسة نشطة</span>
              </label>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/schools')}
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

export default SchoolForm;
 