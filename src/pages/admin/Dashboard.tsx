import  { useState, useEffect } from 'react';
import { Database, School, Users, CreditCard } from 'lucide-react';
import dataStore from '../../services/dataStore';

interface SchoolData {
  id: string;
  name: string;
  active: boolean;
  students: number;
  fees: number;
  collectionRate: number;
}

const AdminDashboard = () => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    totalAccounts: 0,
    totalFees: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data and subscribe to changes
  useEffect(() => {
    const loadDashboardData = () => {
      setIsLoading(true);
      
      // Get schools from dataStore
      const schoolsList = dataStore.getSchools();
      
      // Get accounts count
      const accountsList = dataStore.getAccounts();
      
      // Process school data with student and fee counts
      const processedSchools = schoolsList.map(school => {
        const schoolStudents = dataStore.getStudents(school.id);
        const schoolFees = dataStore.getFees(school.id);
        
        const totalFees = schoolFees.reduce((sum, fee) => sum + fee.amount, 0);
        const paidFees = schoolFees.reduce((sum, fee) => sum + fee.paid, 0);
        const collectionRate = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0;
        
        return {
          id: school.id,
          name: school.name,
          active: school.active,
          students: schoolStudents.length,
          fees: totalFees,
          collectionRate
        };
      });
      
      // Calculate total stats
      const totalStudents = processedSchools.reduce((sum, school) => sum + school.students, 0);
      const totalFees = processedSchools.reduce((sum, school) => sum + school.fees, 0);
      
      setSchools(processedSchools);
      setStats({
        totalSchools: schoolsList.length,
        activeSchools: schoolsList.filter(s => s.active).length,
        totalAccounts: accountsList.length,
        totalFees
      });
      
      setIsLoading(false);
    };
    
    // Load data initially
    loadDashboardData();
    
    // Subscribe to data store changes
    const unsubscribe = dataStore.subscribe(() => {
      loadDashboardData();
    });
    
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم الرئيسية</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-700">المدارس</h2>
              <p className="text-3xl font-bold text-primary">{stats.totalSchools}</p>
            </div>
            <div className="bg-primary-light/10 p-3 rounded-full">
              <Database size={24} className="text-primary" />
            </div>
          </div>
          <p className="text-gray-500">
            {stats.activeSchools} مدرسة نشطة من {stats.totalSchools}
          </p>
        </div>
        
        <div className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-700">الحسابات</h2>
              <p className="text-3xl font-bold text-primary">{stats.totalAccounts}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
          <p className="text-gray-500">إجمالي حسابات المستخدمين في النظام</p>
        </div>
        
        <div className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-700">الطلبة</h2>
              <p className="text-3xl font-bold text-primary">
                {schools.reduce((sum, school) => sum + school.students, 0)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <School size={24} className="text-green-600" />
            </div>
          </div>
          <p className="text-gray-500">إجمالي الطلبة في جميع المدارس</p>
        </div>
        
        <div className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-700">إجمالي الرسوم</h2>
              <p className="text-3xl font-bold text-primary">
                {stats.totalFees.toLocaleString()} ر.ع
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <CreditCard size={24} className="text-yellow-600" />
            </div>
          </div>
          <p className="text-gray-500">إجمالي الرسوم المستحقة</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">المدارس المشتركة</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم المدرسة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عدد الطلبة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجمالي الرسوم
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نسبة التحصيل
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schools.length > 0 ? (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{school.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        school.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {school.active ? 'نشطة' : 'غير نشطة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {school.students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {school.fees.toLocaleString()} ر.ع
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${school.collectionRate}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-600 mt-1 block">{school.collectionRate}%</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    لا توجد مدارس مسجلة في النظام
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
 