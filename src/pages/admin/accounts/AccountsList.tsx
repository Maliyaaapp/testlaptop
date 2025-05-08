import  { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash, Key, Users } from 'lucide-react';
import dataStore from '../../../services/dataStore';

interface Account {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  schoolId: string;
  school: string;
  gradeLevels?: string[];
  lastLogin: string;
}

const AccountsList = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, id: string, name: string}>({
    show: false,
    id: '',
    name: ''
  });
  const [resetPassword, setResetPassword] = useState<{show: boolean, id: string, name: string, email: string}>({
    show: false,
    id: '',
    name: '',
    email: ''
  });
  const [newPassword, setNewPassword] = useState<string>('');

  useEffect(() => {
    // Load accounts directly from dataStore
    const loadAccounts = () => {
      setIsLoading(true);
      const accountsList = dataStore.getAccounts();
      setAccounts(accountsList);
      setIsLoading(false);
    };
    
    // Load accounts initially
    loadAccounts();
    
    // Subscribe to data store changes
    const unsubscribe = dataStore.subscribe(() => {
      loadAccounts();
    });
    
    return () => unsubscribe();
  }, []);

  const handleAddAccount = () => {
    navigate('/admin/accounts/new');
  };
  
  const handleEditAccount = (id: string) => {
    navigate(`/admin/accounts/${id}`);
  };
  
  const handleDeleteAccount = (id: string, name: string) => {
    setDeleteConfirmation({
      show: true,
      id,
      name
    });
  };
  
  const confirmDelete = () => {
    // Delete account directly from dataStore
    dataStore.deleteAccount(deleteConfirmation.id);
    setDeleteConfirmation({ show: false, id: '', name: '' });
  };
  
  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, id: '', name: '' });
  };
  
  const handleResetPassword = (id: string, name: string, email: string) => {
    setResetPassword({
      show: true,
      id,
      name,
      email
    });
    // Generate a random password
    const randomPassword = Math.random().toString(36).slice(-8);
    setNewPassword(randomPassword);
  };
  
  const confirmResetPassword = () => {
    // Update account password directly in dataStore
    const account = dataStore.getAccount(resetPassword.id);
    if (account) {
      account.password = newPassword;
      dataStore.saveAccount(account);
    }
    
    setResetPassword({ show: false, id: '', name: '', email: '' });
    alert(`تم إعادة تعيين كلمة المرور للحساب ${resetPassword.name}`);
  };
  
  const cancelResetPassword = () => {
    setResetPassword({ show: false, id: '', name: '', email: '' });
    setNewPassword('');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'schoolAdmin':
        return 'مدير مدرسة';
      case 'gradeManager':
        return 'مدير صف';
      default:
        return role;
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الحسابات</h1>
        <button
          onClick={handleAddAccount}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          <span>إضافة حساب</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <Users size={20} className="text-primary" />
          <h2 className="text-xl font-bold text-gray-800">قائمة الحسابات</h2>
        </div>
        
        {accounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا توجد حسابات مسجلة في النظام
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    البريد الإلكتروني
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم المستخدم
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الدور
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المدرسة
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    آخر تسجيل دخول
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{account.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{account.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{account.username || account.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {getRoleLabel(account.role)}
                        {account.gradeLevels && account.gradeLevels.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {account.gradeLevels.length > 1 
                              ? `${account.gradeLevels.length} صفوف` 
                              : account.gradeLevels[0]}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{account.school}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {account.lastLogin ? new Date(account.lastLogin).toLocaleString('ar-SA') : 'لم يسجل الدخول بعد'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEditAccount(account.id)}
                          className="text-primary hover:text-primary-dark"
                          title="تعديل"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(account.id, account.name, account.email)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="إعادة تعيين كلمة المرور"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account.id, account.name)}
                          className="text-red-600 hover:text-red-800"
                          title="حذف"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد من حذف حساب "{deleteConfirmation.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelDelete}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn bg-red-600 text-white hover:bg-red-700"
                onClick={confirmDelete}
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reset Password Dialog */}
      {resetPassword.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">إعادة تعيين كلمة المرور</h3>
            <p className="text-gray-600 mb-4">
              أنت على وشك إعادة تعيين كلمة المرور للحساب:
            </p>
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="font-medium">{resetPassword.name}</p>
              <p className="text-gray-500 text-sm">{resetPassword.email}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="newPassword">
                كلمة المرور الجديدة
              </label>
              <div className="flex">
                <input
                  id="newPassword"
                  type="text"
                  className="input flex-1"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-secondary mr-2"
                  onClick={() => {
                    const randomPassword = Math.random().toString(36).slice(-8);
                    setNewPassword(randomPassword);
                  }}
                >
                  توليد
                </button>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelResetPassword}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmResetPassword}
                disabled={!newPassword}
              >
                تأكيد إعادة التعيين
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsList;
 