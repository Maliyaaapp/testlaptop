import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, CreditCard, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import dataStore from '../../services/dataStore';

interface DashboardData {
  students: {
    total: number;
    byGrade: { grade: string; count: number }[];
  };
  fees: {
    total: number;
    paid: number;
    unpaid: number;
    overdue: number;
  };
  installments: {
    upcoming: { id: string; studentName: string; amount: number; dueDate: string }[];
  };
}

const SchoolDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data and subscribe to changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get students
        let students;
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          students = dataStore.getStudents(user.schoolId, user.gradeLevels);
        } else {
          students = dataStore.getStudents(user?.schoolId);
        }
        
        // Get fees
        let fees;
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          fees = dataStore.getFees(user.schoolId, undefined, user.gradeLevels);
        } else {
          fees = dataStore.getFees(user?.schoolId);
        }
        
        // Get installments
        let installments;
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          installments = dataStore.getInstallments(user.schoolId, undefined, undefined, user.gradeLevels);
        } else {
          installments = dataStore.getInstallments(user?.schoolId);
        }
        
        // Process students by grade
        const gradeMap = new Map<string, number>();
        students.forEach((student: any) => {
          const count = gradeMap.get(student.grade) || 0;
          gradeMap.set(student.grade, count + 1);
        });
        
        const byGrade = Array.from(gradeMap.entries()).map(([grade, count]) => ({
          grade,
          count
        }));
        
        // Calculate fee statistics
        const totalFees = fees.reduce((sum: number, fee: any) => sum + fee.amount, 0);
        const paidFees = fees.reduce((sum: number, fee: any) => sum + (fee.paid || 0), 0);
        const unpaidFees = totalFees - paidFees;
        
        // Get upcoming installments
        const upcomingInstallments = installments
          .filter((installment: any) => installment.status === 'upcoming')
          .slice(0, 5)
          .map((installment: any) => ({
            id: installment.id,
            studentName: installment.studentName,
            amount: installment.amount,
            dueDate: installment.dueDate
          }));
        
        // Prepare dashboard data
        const dashboardData: DashboardData = {
          students: {
            total: students.length,
            byGrade
          },
          fees: {
            total: totalFees,
            paid: paidFees,
            unpaid: unpaidFees,
            overdue: unpaidFees * 0.2 // Simulating overdue as 20% of unpaid
          },
          installments: {
            upcoming: upcomingInstallments
          }
        };
        
        setData(dashboardData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Subscribe to data store changes
    const unsubscribe = dataStore.subscribe(() => {
      fetchDashboardData();
    });
    
    return () => unsubscribe();
  }, [user]);

  if (isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate collection rate
  const collectionRate = data.fees.total > 0 ? Math.round((data.fees.paid / data.fees.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/school/students" className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-700">الطلبة</h2>
              <p className="text-3xl font-bold text-primary">{data.students.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
          <p className="text-gray-500">
            {user?.role === 'gradeManager' ? 'عدد الطلبة في الصفوف المسؤول عنها' : 'إجمالي عدد الطلبة المسجلين'}
          </p>
        </Link>
        
        <Link to="/school/fees" className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-700">الرسوم المالية</h2>
              <p className="text-3xl font-bold text-primary">
                {data.fees.total.toLocaleString()} ر.ع
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CreditCard size={24} className="text-green-600" />
            </div>
          </div>
          <p className="text-gray-500">
            {user?.role === 'gradeManager' ? 'إجمالي الرسوم للصفوف المسؤول عنها' : 'إجمالي الرسوم الدراسية'}
          </p>
        </Link>
        
        <Link to="/school/installments" className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-700">الأقساط القادمة</h2>
              <p className="text-3xl font-bold text-primary">{data.installments.upcoming.length}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
          <p className="text-gray-500">الأقساط المستحقة خلال الأيام القادمة</p>
        </Link>
        
        <Link to="/school/communications" className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-700">المراسلات</h2>
              <p className="text-3xl font-bold text-primary">{dataStore.getMessages(user?.schoolId).length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <MessageSquare size={24} className="text-purple-600" />
            </div>
          </div>
          <p className="text-gray-500">الإشعارات المرسلة خلال الشهر الحالي</p>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">نسبة التحصيل</h2>
          <div className="flex justify-between items-center text-sm mb-2">
            <span>المدفوع: {data.fees.paid.toLocaleString()} ر.ع</span>
            <span className="text-primary">{collectionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-primary h-4 rounded-full"
              style={{ width: `${collectionRate}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">المدفوع</p>
              <p className="text-lg font-bold text-green-600">
                {data.fees.paid.toLocaleString()} ر.ع
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">المتبقي</p>
              <p className="text-lg font-bold text-red-600">
                {data.fees.unpaid.toLocaleString()} ر.ع
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">المتأخر</p>
              <p className="text-lg font-bold text-yellow-600">
                {data.fees.overdue.toLocaleString()} ر.ع
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">الأقساط القادمة</h2>
          {data.installments.upcoming.length === 0 ? (
            <p className="text-gray-500 text-center py-6">لا توجد أقساط قادمة</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الطالب
                    </th>
                    <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الاستحقاق
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.installments.upcoming.map((installment) => (
                    <tr key={installment.id}>
                      <td className="py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-800">
                          {installment.studentName}
                        </div>
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <div className="text-gray-600">
                          {installment.amount.toLocaleString()} ر.ع
                        </div>
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <div className="text-gray-600">
                          {new Date(installment.dueDate).toLocaleDateString('ar-SA')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboard;
 