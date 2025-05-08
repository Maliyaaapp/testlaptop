import  { Link, useLocation } from 'react-router-dom';
import { Home, Users, CreditCard, Clock, MessageSquare, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuItems = [
    { path: '/school', icon: <Home size={20} />, title: 'لوحة التحكم' },
    { path: '/school/students', icon: <Users size={20} />, title: 'الطلبة' },
    { path: '/school/fees', icon: <CreditCard size={20} />, title: 'الرسوم' },
    { path: '/school/installments', icon: <Clock size={20} />, title: 'الأقساط' },
    { path: '/school/communications', icon: <MessageSquare size={20} />, title: 'المراسلات' },
    { path: '/school/settings', icon: <Settings size={20} />, title: 'الإعدادات' },
  ];

  const isGradeManager = user?.role === 'gradeManager';

  return (
    <div className="w-64 bg-primary text-white shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-primary-dark">
        <h1 className="text-xl font-bold text-center">بوابة الإدارة المالية</h1>
        {isGradeManager && user?.gradeLevels && (
          <div className="mt-2 text-sm text-center bg-primary-dark p-1 rounded">
            مدير صف: {user.gradeLevels.join(' / ')}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-white text-primary font-bold'
                    : 'text-white hover:bg-primary-dark'
                }`}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-4 border-t border-primary-dark">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2 text-white hover:bg-primary-dark rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
 