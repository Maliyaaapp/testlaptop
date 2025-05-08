import  { GRADE_LEVELS, DEFAULT_SCHOOL_IMAGES } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

// Interfaces
export interface School {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  active: boolean;
  subscriptionStart: string;
  subscriptionEnd: string;
  logo: string;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  role: 'admin' | 'schoolAdmin' | 'gradeManager';
  schoolId: string;
  schoolName?: string;
  schoolLogo?: string;
  gradeLevels?: string[];
  lastLogin?: string;
}

export interface Student {
  id: string;
  name: string;
  studentId: string;
  grade: string;
  parentName: string;
  parentEmail?: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  transportation: 'none' | 'one-way' | 'two-way';
  transportationDirection?: 'to-school' | 'from-school';
  transportationFee?: number;
  customTransportationFee?: boolean;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Fee {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  feeType: string;
  description?: string;
  amount: number;
  discount: number;
  paid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid';
  dueDate: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  transportationType?: 'one-way' | 'two-way';
}

export interface Installment {
  id: string;
  feeId: string;
  studentId: string;
  studentName: string;
  grade: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: 'paid' | 'upcoming' | 'overdue';
  note?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  feeType: string;
}

export interface Message {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  parentName: string;
  phone: string;
  template: string;
  message: string;
  sentAt: string;
  status: 'delivered' | 'failed' | 'pending';
  schoolId: string;
}

export interface Settings {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  defaultInstallments: number;
  tuitionFeeCategory: string;
  transportationFeeOneWay: number;
  transportationFeeTwoWay: number;
}

// Type for event handlers
type Listener = () => void;

// DataStore singleton
class DataStore {
  private listeners: Listener[] = [];
  private initialized = false;

  // Initialize the store with default data if not already present in localStorage
  initialize(): void {
    if (this.initialized) return;

    // Check schools
    if (!localStorage.getItem('schools')) {
      localStorage.setItem('schools', JSON.stringify(this.getDefaultSchools()));
    }

    // Check if accounts exist, if not add default accounts
    const savedAccounts = localStorage.getItem('accounts');
    if (!savedAccounts || JSON.parse(savedAccounts).length === 0) {
      const defaultAccounts = this.getDefaultAccounts();
      localStorage.setItem('accounts', JSON.stringify(defaultAccounts));
    }

    // Initialize an empty messages array if it doesn't exist
    if (!localStorage.getItem('messages')) {
      localStorage.setItem('messages', JSON.stringify([]));
    }

    // Set initialized flag
    this.initialized = true;
  }

  // Default data generators
  private getDefaultSchools(): School[] {
    return [
      {
        id: '1',
        name: 'مدرسة السلطان قابوس',
        email: 'info@sqschool.edu.om',
        phone: '+968 24123456',
        address: 'شارع السلطان قابوس، مسقط، عمان',
        location: 'مسقط',
        active: true,
        subscriptionStart: '2023-01-01',
        subscriptionEnd: '2024-12-31',
        logo: DEFAULT_SCHOOL_IMAGES[0]
      },
      {
        id: '2',
        name: 'المدرسة العالمية - مسقط',
        email: 'info@mis.edu.om',
        phone: '+968 24789123',
        address: 'الخوض، السيب، مسقط، عمان',
        location: 'مسقط',
        active: true,
        subscriptionStart: '2023-01-15',
        subscriptionEnd: '2024-11-15',
        logo: DEFAULT_SCHOOL_IMAGES[1]
      }
    ];
  }

  private getDefaultAccounts(): Account[] {
    return [
      {
        id: '1',
        name: 'أحمد الهاشمي',
        email: 'ahmed@sqschool.edu.om',
        username: 'ahmed',
        password: 'school123',
        role: 'schoolAdmin',
        schoolId: '1',
        schoolName: 'مدرسة السلطان قابوس',
        schoolLogo: DEFAULT_SCHOOL_IMAGES[0],
        lastLogin: '2023-07-15T10:30:00'
      },
      {
        id: '2',
        name: 'سارة البلوشي',
        email: 'sara@sqschool.edu.om',
        username: 'sara',
        password: 'grade123',
        role: 'gradeManager',
        schoolId: '1',
        schoolName: 'مدرسة السلطان قابوس',
        schoolLogo: DEFAULT_SCHOOL_IMAGES[0],
        gradeLevels: ['الروضة الأولى KG1', 'التمهيدي KG2'],
        lastLogin: '2023-07-14T14:20:00'
      }
    ];
  }

  // Event subscription
  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all subscribers
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Schools
  getSchools(): School[] {
    try {
      const schools = localStorage.getItem('schools');
      return schools ? JSON.parse(schools) : [];
    } catch (e) {
      console.error('Error loading schools:', e);
      return [];
    }
  }

  getSchool(id: string): School | null {
    const schools = this.getSchools();
    return schools.find(s => s.id === id) || null;
  }

  saveSchool(school: School): School {
    const schools = this.getSchools();
    const isNew = !school.id;
    
    if (isNew) {
      // Create new school
      const newSchool = {
        ...school,
        id: uuidv4()
      };
      schools.push(newSchool);
    } else {
      // Update existing school
      const index = schools.findIndex(s => s.id === school.id);
      if (index >= 0) {
        schools[index] = school;
      } else {
        throw new Error('School not found');
      }
    }
    
    localStorage.setItem('schools', JSON.stringify(schools));
    this.notifyListeners();
    return isNew ? schools[schools.length - 1] : school;
  }

  deleteSchool(id: string): void {
    const schools = this.getSchools();
    const updatedSchools = schools.filter(s => s.id !== id);
    localStorage.setItem('schools', JSON.stringify(updatedSchools));
    this.notifyListeners();
  }

  // Accounts
  getAccounts(schoolId?: string): Account[] {
    try {
      const accounts = localStorage.getItem('accounts');
      const parsed = accounts ? JSON.parse(accounts) : [];
      
      if (schoolId) {
        return parsed.filter((a: Account) => a.schoolId === schoolId);
      }
      
      return parsed;
    } catch (e) {
      console.error('Error loading accounts:', e);
      return [];
    }
  }

  getAccount(id: string): Account | null {
    const accounts = this.getAccounts();
    return accounts.find(a => a.id === id) || null;
  }

  saveAccount(account: Account): Account {
    const accounts = this.getAccounts();
    const isNew = !account.id;
    
    // Add school information if available
    if (account.schoolId) {
      const school = this.getSchool(account.schoolId);
      if (school) {
        account.schoolName = school.name;
        account.schoolLogo = school.logo;
      }
    }
    
    if (isNew) {
      // Create new account
      const newAccount = {
        ...account,
        id: uuidv4(),
        lastLogin: account.lastLogin || null
      };
      accounts.push(newAccount);
    } else {
      // Update existing account
      const index = accounts.findIndex(a => a.id === account.id);
      if (index >= 0) {
        // Keep the password if not provided
        if (!account.password && accounts[index].password) {
          account.password = accounts[index].password;
        }
        accounts[index] = account;
      } else {
        throw new Error('Account not found');
      }
    }
    
    localStorage.setItem('accounts', JSON.stringify(accounts));
    this.notifyListeners();
    return isNew ? accounts[accounts.length - 1] : account;
  }

  deleteAccount(id: string): void {
    const accounts = this.getAccounts();
    const updatedAccounts = accounts.filter(a => a.id !== id);
    localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
    this.notifyListeners();
  }

  // Students
  getStudents(schoolId?: string, gradeLevels?: string | string[]): Student[] {
    try {
      const students = localStorage.getItem('students');
      let parsed = students ? JSON.parse(students) : [];
      
      // Filter by school
      if (schoolId) {
        parsed = parsed.filter((s: Student) => s.schoolId === schoolId);
      }
      
      // Filter by grade level(s)
      if (gradeLevels) {
        if (Array.isArray(gradeLevels)) {
          parsed = parsed.filter((s: Student) => gradeLevels.includes(s.grade));
        } else {
          parsed = parsed.filter((s: Student) => s.grade === gradeLevels);
        }
      }
      
      return parsed;
    } catch (e) {
      console.error('Error loading students:', e);
      return [];
    }
  }

  getStudent(id: string): Student | null {
    const students = this.getStudents();
    return students.find(s => s.id === id) || null;
  }

  saveStudent(student: Student): Student {
    const students = this.getStudents();
    const isNew = !student.id;
    const now = new Date().toISOString();
    
    if (isNew) {
      // Create new student
      const newStudent = {
        ...student,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now
      };
      students.push(newStudent);
    } else {
      // Update existing student
      const index = students.findIndex(s => s.id === student.id);
      if (index >= 0) {
        students[index] = {
          ...student,
          updatedAt: now
        };
      } else {
        throw new Error('Student not found');
      }
    }
    
    localStorage.setItem('students', JSON.stringify(students));
    this.notifyListeners();
    return isNew ? students[students.length - 1] : {
      ...student,
      updatedAt: now
    };
  }

  deleteStudent(id: string): void {
    const students = this.getStudents();
    const updatedStudents = students.filter(s => s.id !== id);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    this.notifyListeners();
  }

  // Fees
  getFees(schoolId?: string, studentId?: string, gradeLevels?: string | string[]): Fee[] {
    try {
      const fees = localStorage.getItem('fees');
      let parsed = fees ? JSON.parse(fees) : [];
      
      // Filter by school
      if (schoolId) {
        parsed = parsed.filter((f: Fee) => f.schoolId === schoolId);
      }
      
      // Filter by student
      if (studentId) {
        parsed = parsed.filter((f: Fee) => f.studentId === studentId);
      }
      
      // Filter by grade level(s)
      if (gradeLevels) {
        if (Array.isArray(gradeLevels)) {
          parsed = parsed.filter((f: Fee) => gradeLevels.includes(f.grade));
        } else {
          parsed = parsed.filter((f: Fee) => f.grade === gradeLevels);
        }
      }
      
      return parsed;
    } catch (e) {
      console.error('Error loading fees:', e);
      return [];
    }
  }

  getFee(id: string): Fee | null {
    const fees = this.getFees();
    return fees.find(f => f.id === id) || null;
  }

  saveFee(fee: Fee): Fee {
    const fees = this.getFees();
    const isNew = !fee.id;
    const now = new Date().toISOString();
    
    // Get student info to ensure it's included
    if (fee.studentId) {
      const student = this.getStudent(fee.studentId);
      if (student) {
        fee.studentName = student.name;
        fee.grade = student.grade;
      }
    }
    
    // Calculate balance
    fee.balance = fee.amount - fee.discount - (fee.paid || 0);
    
    // Set status based on payment
    if (fee.balance <= 0) {
      fee.status = 'paid';
    } else if ((fee.paid || 0) > 0) {
      fee.status = 'partial';
    } else {
      fee.status = 'unpaid';
    }
    
    if (isNew) {
      // Create new fee
      const newFee = {
        ...fee,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now
      };
      fees.push(newFee);
    } else {
      // Update existing fee
      const index = fees.findIndex(f => f.id === fee.id);
      if (index >= 0) {
        fees[index] = {
          ...fee,
          updatedAt: now
        };
      } else {
        throw new Error('Fee not found');
      }
    }
    
    localStorage.setItem('fees', JSON.stringify(fees));
    this.notifyListeners();
    return isNew ? fees[fees.length - 1] : {
      ...fee,
      updatedAt: now
    };
  }

  deleteFee(id: string): void {
    const fees = this.getFees();
    const updatedFees = fees.filter(f => f.id !== id);
    localStorage.setItem('fees', JSON.stringify(updatedFees));
    
    // Delete related installments
    const installments = this.getInstallments();
    const updatedInstallments = installments.filter(i => i.feeId !== id);
    localStorage.setItem('installments', JSON.stringify(updatedInstallments));
    
    this.notifyListeners();
  }

  // Installments
  getInstallments(schoolId?: string, studentId?: string, feeId?: string, gradeLevels?: string | string[]): Installment[] {
    try {
      const installments = localStorage.getItem('installments');
      let parsed = installments ? JSON.parse(installments) : [];
      
      // Filter by school
      if (schoolId) {
        parsed = parsed.filter((i: Installment) => i.schoolId === schoolId);
      }
      
      // Filter by student
      if (studentId) {
        parsed = parsed.filter((i: Installment) => i.studentId === studentId);
      }
      
      // Filter by fee
      if (feeId) {
        parsed = parsed.filter((i: Installment) => i.feeId === feeId);
      }
      
      // Filter by grade level(s)
      if (gradeLevels) {
        if (Array.isArray(gradeLevels)) {
          parsed = parsed.filter((i: Installment) => gradeLevels.includes(i.grade));
        } else {
          parsed = parsed.filter((i: Installment) => i.grade === gradeLevels);
        }
      }
      
      // Update status for each installment based on current date and paid status
      parsed = parsed.map((installment: Installment) => {
        if (installment.paidDate) {
          return { ...installment, status: 'paid' };
        } else {
          const today = new Date();
          const dueDate = new Date(installment.dueDate);
          
          if (dueDate < today) {
            return { ...installment, status: 'overdue' };
          } else {
            return { ...installment, status: 'upcoming' };
          }
        }
      });
      
      return parsed;
    } catch (e) {
      console.error('Error loading installments:', e);
      return [];
    }
  }

  getInstallment(id: string): Installment | null {
    const installments = this.getInstallments();
    return installments.find(i => i.id === id) || null;
  }

  saveInstallment(installment: Installment): Installment {
    const installments = this.getInstallments();
    const isNew = !installment.id;
    const now = new Date().toISOString();
    
    // Get student info if needed
    if (installment.studentId && !installment.studentName) {
      const student = this.getStudent(installment.studentId);
      if (student) {
        installment.studentName = student.name;
        installment.grade = student.grade;
      }
    }
    
    // Get fee type if needed
    if (installment.feeId && !installment.feeType) {
      const fee = this.getFee(installment.feeId);
      if (fee) {
        installment.feeType = fee.feeType;
      }
    }
    
    // Update status based on payment date and due date
    if (installment.paidDate) {
      installment.status = 'paid';
    } else {
      const today = new Date();
      const dueDate = new Date(installment.dueDate);
      
      if (dueDate < today) {
        installment.status = 'overdue';
      } else {
        installment.status = 'upcoming';
      }
    }
    
    if (isNew) {
      // Create new installment
      const newInstallment = {
        ...installment,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now
      };
      installments.push(newInstallment);
      
      // Update fee paid amount if this is a new payment
      if (installment.paidDate && installment.feeId) {
        const fee = this.getFee(installment.feeId);
        if (fee) {
          fee.paid = (fee.paid || 0) + installment.amount;
          fee.balance = fee.amount - fee.discount - fee.paid;
          
          // Update status
          if (fee.balance <= 0) {
            fee.status = 'paid';
          } else if (fee.paid > 0) {
            fee.status = 'partial';
          }
          
          this.saveFee(fee);
        }
      }
    } else {
      // Update existing installment
      const index = installments.findIndex(i => i.id === installment.id);
      if (index >= 0) {
        const oldInstallment = installments[index];
        const updatedInstallment = {
          ...installment,
          updatedAt: now
        };
        installments[index] = updatedInstallment;
        
        // Update fee paid amount if payment status changed
        if ((!oldInstallment.paidDate && installment.paidDate) || 
            (oldInstallment.paidDate && !installment.paidDate)) {
          const fee = this.getFee(installment.feeId);
          if (fee) {
            if (installment.paidDate) {
              // Payment added
              fee.paid = (fee.paid || 0) + installment.amount;
            } else {
              // Payment removed
              fee.paid = (fee.paid || 0) - installment.amount;
              if (fee.paid < 0) fee.paid = 0;
            }
            
            fee.balance = fee.amount - fee.discount - fee.paid;
            
            // Update status
            if (fee.balance <= 0) {
              fee.status = 'paid';
            } else if (fee.paid > 0) {
              fee.status = 'partial';
            } else {
              fee.status = 'unpaid';
            }
            
            this.saveFee(fee);
          }
        }
      } else {
        throw new Error('Installment not found');
      }
    }
    
    localStorage.setItem('installments', JSON.stringify(installments));
    this.notifyListeners();
    return isNew ? installments[installments.length - 1] : {
      ...installment,
      updatedAt: now
    };
  }

  deleteInstallment(id: string): void {
    const installments = this.getInstallments();
    const installment = this.getInstallment(id);
    
    // Update fee paid amount if deleting a paid installment
    if (installment && installment.paidDate && installment.feeId) {
      const fee = this.getFee(installment.feeId);
      if (fee) {
        fee.paid = (fee.paid || 0) - installment.amount;
        if (fee.paid < 0) fee.paid = 0;
        
        fee.balance = fee.amount - fee.discount - fee.paid;
        
        // Update status
        if (fee.balance <= 0) {
          fee.status = 'paid';
        } else if (fee.paid > 0) {
          fee.status = 'partial';
        } else {
          fee.status = 'unpaid';
        }
        
        this.saveFee(fee);
      }
    }
    
    const updatedInstallments = installments.filter(i => i.id !== id);
    localStorage.setItem('installments', JSON.stringify(updatedInstallments));
    this.notifyListeners();
  }

  // Messages
  getMessages(schoolId?: string, studentId?: string): Message[] {
    try {
      const messages = localStorage.getItem('messages');
      let parsed = messages ? JSON.parse(messages) : [];
      
      // Filter by school
      if (schoolId) {
        parsed = parsed.filter((m: Message) => m.schoolId === schoolId);
      }
      
      // Filter by student
      if (studentId) {
        parsed = parsed.filter((m: Message) => m.studentId === studentId);
      }
      
      return parsed;
    } catch (e) {
      console.error('Error loading messages:', e);
      return [];
    }
  }

  saveMessage(message: Message): Message {
    try {
      const messages = this.getMessages();
      const newMessage = {
        ...message,
        id: message.id || uuidv4(),
        sentAt: message.sentAt || new Date().toISOString()
      };
      
      messages.push(newMessage);
      localStorage.setItem('messages', JSON.stringify(messages));
      this.notifyListeners();
      return newMessage;
    } catch (e) {
      console.error('Error saving message:', e);
      throw e;
    }
  }

  // Settings
  getSettings(schoolId: string): Settings {
    try {
      const savedSettings = localStorage.getItem(`school_settings_${schoolId}`);
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
      
      // Default settings
      const school = this.getSchool(schoolId);
      return {
        name: school?.name || 'مدرسة جديدة',
        email: school?.email || 'info@school.edu.om',
        phone: school?.phone || '+968 24000000',
        address: school?.address || 'عنوان المدرسة، مسقط، عمان',
        logo: school?.logo || DEFAULT_SCHOOL_IMAGES[1],
        defaultInstallments: 4,
        tuitionFeeCategory: 'رسوم دراسية',
        transportationFeeOneWay: 150,
        transportationFeeTwoWay: 300
      };
    } catch (e) {
      console.error('Error loading settings:', e);
      return {
        name: 'مدرسة جديدة',
        email: 'info@school.edu.om',
        phone: '+968 24000000',
        address: 'عنوان المدرسة، مسقط، عمان',
        logo: DEFAULT_SCHOOL_IMAGES[1],
        defaultInstallments: 4,
        tuitionFeeCategory: 'رسوم دراسية',
        transportationFeeOneWay: 150,
        transportationFeeTwoWay: 300
      };
    }
  }

  saveSettings(schoolId: string, settings: Settings): Settings {
    localStorage.setItem(`school_settings_${schoolId}`, JSON.stringify(settings));
    
    // Update school info
    const school = this.getSchool(schoolId);
    if (school) {
      school.name = settings.name;
      school.email = settings.email;
      school.phone = settings.phone;
      school.address = settings.address;
      school.logo = settings.logo;
      this.saveSchool(school);
      
      // Update all accounts with this school
      const accounts = this.getAccounts(schoolId);
      accounts.forEach(account => {
        account.schoolName = settings.name;
        account.schoolLogo = settings.logo;
        this.saveAccount(account);
      });
    }
    
    this.notifyListeners();
    return settings;
  }

  // Helper function to generate student ID
  generateStudentId(schoolId: string, grade: string): string {
    const students = this.getStudents(schoolId);
    const gradePrefix = grade.includes('KG') ? 'KG' : 'S';
    const count = students.length + 1;
    return `${gradePrefix}${count.toString().padStart(4, '0')}`;
  }

  // Helper to create a default installment plan for a fee
  createInstallmentPlan(fee: Fee, numberOfInstallments: number): void {
    if (numberOfInstallments <= 0) return;
    
    const installmentAmount = Math.floor((fee.amount - fee.discount) / numberOfInstallments);
    const remainder = (fee.amount - fee.discount) % numberOfInstallments;
    
    const dueDate = new Date(fee.dueDate);
    const monthInterval = 12 / numberOfInstallments;
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const currentAmount = i === 0 ? installmentAmount + remainder : installmentAmount;
      const currentDueDate = new Date(dueDate);
      currentDueDate.setMonth(dueDate.getMonth() + Math.floor(i * monthInterval));
      
      const installment: Omit<Installment, 'id' | 'createdAt' | 'updatedAt'> = {
        feeId: fee.id,
        studentId: fee.studentId,
        studentName: fee.studentName,
        grade: fee.grade,
        amount: currentAmount,
        dueDate: currentDueDate.toISOString().split('T')[0],
        paidDate: null,
        status: 'upcoming',
        note: `القسط ${i + 1} من ${numberOfInstallments} - ${fee.description || getFeeTypeLabel(fee.feeType)}`,
        schoolId: fee.schoolId,
        feeType: fee.feeType
      };
      
      this.saveInstallment(installment as Installment);
    }
  }
}

// Helper function to get fee type label
function getFeeTypeLabel(type: string): string {
  const feeTypes: Record<string, string> = {
    'tuition': 'رسوم دراسية',
    'transportation': 'نقل مدرسي',
    'activities': 'أنشطة',
    'uniform': 'زي مدرسي',
    'books': 'كتب',
    'other': 'رسوم أخرى'
  };
  
  return feeTypes[type] || type;
}

// Export singleton instance
const dataStore = new DataStore();
dataStore.initialize(); // Initialize the store
export default dataStore;
 