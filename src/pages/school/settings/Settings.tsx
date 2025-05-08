import  { useState, useEffect, useRef } from 'react';
import { Save, Upload } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { CURRENCY, INSTALLMENT_PLANS, DEFAULT_SCHOOL_IMAGES } from '../../../utils/constants';
import api from '../../../services/api';

interface SchoolSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  defaultInstallments: number;
  tuitionFeeCategory: string;
  transportationFeeOneWay: number;
  transportationFeeTwoWay: number;
}

const Settings = () => {
  const { user, updateUserInfo } = useAuth();
  const [settings, setSettings] = useState<SchoolSettings>({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
    defaultInstallments: 4,
    tuitionFeeCategory: 'رسوم دراسية',
    transportationFeeOneWay: 150,
    transportationFeeTwoWay: 300
  });
  
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [availableLogos, setAvailableLogos] = useState<string[]>(DEFAULT_SCHOOL_IMAGES);
  const [showLogoSelector, setShowLogoSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch settings for the current user's school
    const fetchSettings = async () => {
      if (user?.schoolId) {
        try {
          const response = await api.getSchoolSettings(user.schoolId);
          if (response.success) {
            setSettings(response.data);
            setLogoPreview(response.data.logo || DEFAULT_SCHOOL_IMAGES[0]);
          }
        } catch (error) {
          console.error('Error fetching school settings:', error);
        }
      } else {
        // If no schoolId, use default values set in the initial state
        setLogoPreview(DEFAULT_SCHOOL_IMAGES[0]);
      }
      setIsLoading(false);
    };
    
    fetchSettings();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setSettings({
        ...settings,
        [name]: parseFloat(value)
      });
    } else {
      setSettings({
        ...settings,
        [name]: value
      });
    }
  };

  const handleLogoUpload = () => {
    setShowLogoSelector(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.match('image.*')) {
        alert('يرجى اختيار ملف صورة صالح');
        return;
      }
      
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        setSettings({
          ...settings,
          logo: result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const selectLogo = (logoUrl: string) => {
    setLogoPreview(logoUrl);
    setSettings({
      ...settings,
      logo: logoUrl
    });
    setShowLogoSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (user?.schoolId) {
        const response = await api.updateSchoolSettings(user.schoolId, settings);
        if (response.success) {
          // Update user context with new school info if user is schoolAdmin
          if (user.role === 'schoolAdmin' && updateUserInfo) {
            updateUserInfo({
              ...user,
              schoolName: settings.name,
              schoolLogo: settings.logo || logoPreview
            });
          }
          
          alert('تم حفظ الإعدادات بنجاح');
        } else {
          alert(response.error || 'حدث خطأ أثناء حفظ الإعدادات');
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
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
      <h1 className="text-2xl font-bold text-gray-800">إعدادات النظام</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-800">إعدادات المدرسة</h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  اسم المدرسة
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="input"
                  value={settings.name}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  value={settings.email}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="phone">
                  رقم الهاتف
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="input"
                  value={settings.phone}
                  onChange={handleChange}
                />
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
                    <span>اختيار شعار</span>
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
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_SCHOOL_IMAGES[1];
                        }}
                      />
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
                  value={settings.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-800">إعدادات الرسوم</h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="defaultInstallments">
                  عدد الأقساط الافتراضي
                </label>
                <select
                  id="defaultInstallments"
                  name="defaultInstallments"
                  className="input"
                  value={settings.defaultInstallments}
                  onChange={handleChange}
                >
                  {INSTALLMENT_PLANS.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="tuitionFeeCategory">
                  اسم فئة الرسوم الدراسية
                </label>
                <input
                  id="tuitionFeeCategory"
                  name="tuitionFeeCategory"
                  type="text"
                  className="input"
                  value={settings.tuitionFeeCategory}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="transportationFeeOneWay">
                  رسوم النقل (اتجاه واحد)
                </label>
                <div className="relative">
                  <input
                    id="transportationFeeOneWay"
                    name="transportationFeeOneWay"
                    type="number"
                    className="input pl-16"
                    value={settings.transportationFeeOneWay}
                    onChange={handleChange}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center bg-gray-100 border-l border-gray-300 px-3 rounded-l-md">
                    {CURRENCY}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="transportationFeeTwoWay">
                  رسوم النقل (اتجاهين)
                </label>
                <div className="relative">
                  <input
                    id="transportationFeeTwoWay"
                    name="transportationFeeTwoWay"
                    type="number"
                    className="input pl-16"
                    value={settings.transportationFeeTwoWay}
                    onChange={handleChange}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center bg-gray-100 border-l border-gray-300 px-3 rounded-l-md">
                    {CURRENCY}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
            disabled={isSaving}
          >
            <Save size={18} />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
          </button>
        </div>
      </form>
      
      {/* Logo Selector Dialog */}
      {showLogoSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">اختيار شعار المدرسة</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {availableLogos.map((logo, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-2 cursor-pointer transition-all ${logoPreview === logo ? 'border-primary-dark shadow-md ring-2 ring-primary ring-opacity-50' : 'hover:border-primary'}`}
                  onClick={() => selectLogo(logo)}
                >
                  <img 
                    src={logo} 
                    alt={`شعار ${index + 1}`} 
                    className="w-full h-32 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_SCHOOL_IMAGES[1];
                    }}
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              <label className="block text-gray-700">
                أو قم برفع شعار مخصص:
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary"
                />
              </label>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLogoSelector(false)}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowLogoSelector(false)}
                >
                  تأكيد الاختيار
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
 