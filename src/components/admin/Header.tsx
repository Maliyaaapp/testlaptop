import  { Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 h-16 z-30">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-gray-600 cursor-pointer" />
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-2 rounded-full">
              <User size={16} />
            </div>
            <span className="font-medium">{user?.name}</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-primary">نظام إدارة مالية المدارس - سلطنة عمان</div>
      </div>
    </header>
  );
};

export default Header;
 