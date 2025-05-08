import  { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Auth Components
import Login from './pages/auth/Login';

// Admin Components
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import SchoolsList from './pages/admin/schools/SchoolsList';
import SchoolForm from './pages/admin/schools/SchoolForm';
import AdminAccountsList from './pages/admin/accounts/AccountsList';
import AdminAccountForm from './pages/admin/accounts/AccountForm';
import SubscriptionsList from './pages/admin/subscriptions/SubscriptionsList';

// School Components
import SchoolLayout from './layouts/SchoolLayout';
import SchoolDashboard from './pages/school/Dashboard';
import Students from './pages/school/students/Students';
import StudentForm from './pages/school/students/StudentForm';
import Fees from './pages/school/fees/Fees';
import FeeForm from './pages/school/fees/FeeForm';
import Installments from './pages/school/installments/Installments';
import InstallmentForm from './pages/school/installments/InstallmentForm';
import Communications from './pages/school/communications/Communications';
import Settings from './pages/school/settings/Settings';

const App = () => {
  const { isAuthenticated, user } = useAuth();

  const ProtectedRoute = ({ children, roles }: { children: JSX.Element, roles?: string[] }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    if (roles && user && !roles.includes(user.role)) {
      return user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/school" />;
    }

    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : (user?.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/school" />)} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="schools" element={<SchoolsList />} />
        <Route path="schools/new" element={<SchoolForm />} />
        <Route path="schools/:id" element={<SchoolForm />} />
        <Route path="accounts" element={<AdminAccountsList />} />
        <Route path="accounts/new" element={<AdminAccountForm />} />
        <Route path="accounts/:id" element={<AdminAccountForm />} />
        <Route path="subscriptions" element={<SubscriptionsList />} />
      </Route>

      {/* School Routes */}
      <Route path="/school" element={
        <ProtectedRoute roles={['schoolAdmin', 'gradeManager']}>
          <SchoolLayout />
        </ProtectedRoute>
      }>
        <Route index element={<SchoolDashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/new" element={<StudentForm />} />
        <Route path="students/:id" element={<StudentForm />} />
        <Route path="fees" element={<Fees />} />
        <Route path="fees/new" element={<FeeForm />} />
        <Route path="fees/:id" element={<FeeForm />} />
        <Route path="installments" element={<Installments />} />
        <Route path="installments/new" element={<InstallmentForm />} />
        <Route path="installments/:id" element={<InstallmentForm />} />
        <Route path="communications" element={<Communications />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/school') : '/login'} />} />
    </Routes>
  );
};

export default App;
 