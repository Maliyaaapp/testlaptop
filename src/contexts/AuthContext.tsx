import  { createContext, useContext, useState, useEffect, ReactNode } from 'react'; 
import api from '../services/api';

// Extend Role to include 'admin'
type Role = 'admin' | 'schoolAdmin' | 'gradeManager';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  schoolId?: string;
  schoolName?: string;
  schoolLogo?: string;
  gradeLevels?: string[];
  username?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUserInfo: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        logout();
      }
    }
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    setIsAuthenticated(true);
    
    // Update the last login time for the account
    if (user.id && user.id !== 'admin') {
      let accounts = [];
      const savedAccounts = localStorage.getItem('accounts');
      if (savedAccounts) {
        try {
          accounts = JSON.parse(savedAccounts);
          const updatedAccounts = accounts.map((account: any) => {
            if (account.id === user.id) {
              return { ...account, lastLogin: new Date().toISOString() };
            }
            return account;
          });
          localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
        } catch (e) {
          console.error('Error updating account login time:', e);
        }
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };
  
  const updateUserInfo = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    // If user is an account, update account info in localStorage
    if (updatedUser.id && updatedUser.id !== 'admin') {
      let accounts = [];
      const savedAccounts = localStorage.getItem('accounts');
      if (savedAccounts) {
        try {
          accounts = JSON.parse(savedAccounts);
          const accountIndex = accounts.findIndex((a: any) => a.id === updatedUser.id);
          if (accountIndex >= 0) {
            // Update relevant fields in the account
            accounts[accountIndex] = {
              ...accounts[accountIndex],
              name: updatedUser.name,
              email: updatedUser.email,
              schoolName: updatedUser.schoolName,
              schoolLogo: updatedUser.schoolLogo,
              gradeLevels: updatedUser.gradeLevels
            };
            localStorage.setItem('accounts', JSON.stringify(accounts));
          }
        } catch (e) {
          console.error('Error updating account info:', e);
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
 