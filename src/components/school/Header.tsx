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
        <div className="flex items-center gap-4">
          {user?.schoolLogo && (
            <img 
              src={user.schoolLogo} 
              alt={user.schoolName || ''} 
              className="h-10 w-10 object-cover rounded-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ1NzQ1NDA5fDA&ixlib=rb-4.0.3&fit=fillmax&h=400&w=600';
              }}
            />
          )}
          <div className="flex flex-col items-end">
            <div className="text-2xl font-bold text-primary">نظام إدارة مالية المدارس</div>
            {user?.schoolName && (
              <div className="text-sm text-gray-600">{user.schoolName}</div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
 