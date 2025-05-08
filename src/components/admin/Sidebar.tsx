import  { Link, useLocation } from 'react-router-dom';
import { Home, Database, Users, LogOut, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuItems = [
    { path: '/admin', icon: <Home size={20} />, title: 'لوحة التحكم' },
    { path: '/admin/schools', icon: <Database size={20} />, title: 'المدارس' },
    { path: '/admin/accounts', icon: <Users size={20} />, title: 'الحسابات' },
    { path: '/admin/subscriptions', icon: <CreditCard size={20} />, title: 'الاشتراكات' }
  ];

  return (
    <div className="w-64 bg-primary text-white shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-primary-dark">
        <h1 className="text-xl font-bold text-center">مركز إدارة النظام</h1>
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
 