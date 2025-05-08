import  { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { School } from 'lucide-react';
import { DEFAULT_SCHOOL_IMAGES } from '../../utils/constants';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // Can be email or username
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  // Load accounts from localStorage for authentication
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    // Load accounts from localStorage
    const savedAccounts = localStorage.getItem('accounts');
    if (savedAccounts) {
      try {
        const parsedAccounts = JSON.parse(savedAccounts);
        setAccounts(parsedAccounts);
      } catch (e) {
        console.error('Error parsing accounts from localStorage:', e);
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // First check for admin account
      if ((identifier === 'admin@example.com' || identifier === 'admin') && password === 'admin123') {
        const adminUser = { 
          id: 'admin', 
          name: 'مدير النظام', 
          email: 'admin@example.com', 
          username: 'admin',
          role: 'admin' as const
        };
        
        const token = 'mock-admin-jwt-token';
        login(token, adminUser);
        return;
      }
      
      // Then check for custom accounts from admin control center
      const user = accounts.find(u => 
        u.email === identifier || 
        (u.username && u.username === identifier)
      );
      
      if (user) {
        // For demo purposes, we're using fixed passwords if none was set
        const userPassword = user.password || (user.role === 'schoolAdmin' ? 'school123' : 'grade123');
        
        if (password === userPassword) {
          const token = `mock-jwt-token-${user.id}`;
          
          // Update last login time
          const updatedAccounts = accounts.map(account => {
            if (account.id === user.id) {
              return { ...account, lastLogin: new Date().toISOString() };
            }
            return account;
          });
          localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
          
          login(token, user);
          return;
        }
      }
      
      // Fallback to standard mock accounts
      const mockUsers = [
        { id: '2', name: 'مدرسة السلطان قابوس', email: 'school@example.com', username: 'school', password: 'school123', role: 'schoolAdmin' as const, schoolId: '1', schoolName: 'مدرسة السلطان قابوس', schoolLogo: DEFAULT_SCHOOL_IMAGES[0] },
        { id: '3', name: 'مدير الروضة الأولى', email: 'kg1@example.com', username: 'kg1', password: 'grade123', role: 'gradeManager' as const, schoolId: '1', gradeLevels: ['الروضة الأولى KG1'], schoolName: 'مدرسة السلطان قابوس', schoolLogo: DEFAULT_SCHOOL_IMAGES[0] }
      ];
      
      const standardUser = mockUsers.find(u => 
        (u.email === identifier || u.username === identifier) && 
        u.password === password
      );
      
      if (!standardUser) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
      
      const { password: _, ...userWithoutPassword } = standardUser;
      const token = 'mock-jwt-token';
      
      login(token, userWithoutPassword);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-primary text-white p-3 rounded-full">
              <School size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary">نظام إدارة مالية المدارس</h1>
          <p className="text-gray-600 mt-2">سلطنة عمان</p>
          <p className="text-gray-600 mt-1">سجّل دخولك للوصول إلى لوحة التحكم</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="identifier">
              البريد الإلكتروني أو اسم المستخدم
            </label>
            <input
              id="identifier"
              type="text"
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-bold text-sm text-gray-700 mb-2">بيانات تسجيل الدخول للاختبار:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>مدير النظام:</strong> admin / admin123</p>
            <p><strong>مدير المدرسة:</strong> school / school123</p>
            <p><strong>مدير الصف:</strong> kg1 / grade123</p>
            {accounts.length > 0 && (
              <p className="mt-2 text-primary">* يمكنك أيضًا تسجيل الدخول باستخدام الحسابات التي تم إنشاؤها في لوحة التحكم</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
 