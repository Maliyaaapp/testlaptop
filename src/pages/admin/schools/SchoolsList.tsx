import  { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash, Database } from 'lucide-react';
import dataStore from '../../../services/dataStore';

interface School {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  active: boolean;
  subscriptionStart: string;
  subscriptionEnd: string;
}

const SchoolsList = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, id: string, name: string}>({
    show: false,
    id: '',
    name: ''
  });

  useEffect(() => {
    // Fetch schools data directly from dataStore
    const loadSchools = () => {
      setIsLoading(true);
      const schoolsList = dataStore.getSchools();
      setSchools(schoolsList);
      setIsLoading(false);
    };
    
    loadSchools();
    
    // Subscribe to data store changes
    const unsubscribe = dataStore.subscribe(() => {
      loadSchools();
    });
    
    return () => unsubscribe();
  }, []);

  const handleAddSchool = () => {
    navigate('/admin/schools/new');
  };
  
  const handleDeleteSchool = (id: string, name: string) => {
    setDeleteConfirmation({
      show: true,
      id,
      name
    });
  };
  
  const confirmDelete = () => {
    // Delete the school directly from dataStore
    dataStore.deleteSchool(deleteConfirmation.id);
    setDeleteConfirmation({ show: false, id: '', name: '' });
  };
  
  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, id: '', name: '' });
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
        <h1 className="text-2xl font-bold text-gray-800">إدارة المدارس</h1>
        <button 
          onClick={handleAddSchool}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          <span>إضافة مدرسة</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <Database size={20} className="text-primary" />
          <h2 className="text-xl font-bold text-gray-800">قائمة المدارس</h2>
        </div>
        
        {schools.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا توجد مدارس مسجلة في النظام
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم المدرسة
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    معلومات الاتصال
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الموقع
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الاشتراك
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{school.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{school.email}</div>
                      <div className="text-gray-500">{school.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{school.location}</div>
                      <div className="text-gray-500 text-xs">{school.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        school.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {school.active ? 'نشطة' : 'غير نشطة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      <div>{new Date(school.subscriptionStart).toLocaleDateString('ar-SA')}</div>
                      <div>إلى: {new Date(school.subscriptionEnd).toLocaleDateString('ar-SA')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Link
                          to={`/admin/schools/${school.id}`}
                          className="text-primary hover:text-primary-dark"
                          title="تعديل"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteSchool(school.id, school.name)}
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
              هل أنت متأكد من حذف المدرسة "{deleteConfirmation.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
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
    </div>
  );
};

export default SchoolsList;
 