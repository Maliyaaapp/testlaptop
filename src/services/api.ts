//  Mock API service for school finance management system
import { WHATSAPP_API_URL } from '../utils/constants';

// Interface for API response
interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Initialize mock database from localStorage or use defaults
const initializeMockDb = () => {
  // Try to get schools from localStorage
  let schools = [];
  const savedSchools = localStorage.getItem('schools');
  if (savedSchools) {
    try {
      schools = JSON.parse(savedSchools);
    } catch (e) {
      console.error('Error parsing schools from localStorage:', e);
      schools = getDefaultSchools();
    }
  } else {
    schools = getDefaultSchools();
    localStorage.setItem('schools', JSON.stringify(schools));
  }
  
  // Try to get accounts from localStorage
  let accounts = [];
  const savedAccounts = localStorage.getItem('accounts');
  if (savedAccounts) {
    try {
      accounts = JSON.parse(savedAccounts);
    } catch (e) {
      console.error('Error parsing accounts from localStorage:', e);
    }
  }
  
  // Try to get students from localStorage
  let students = [];
  const savedStudents = localStorage.getItem('students');
  if (savedStudents) {
    try {
      students = JSON.parse(savedStudents);
    } catch (e) {
      console.error('Error parsing students from localStorage:', e);
    }
  }
  
  // Try to get fees from localStorage
  let fees = [];
  const savedFees = localStorage.getItem('fees');
  if (savedFees) {
    try {
      fees = JSON.parse(savedFees);
    } catch (e) {
      console.error('Error parsing fees from localStorage:', e);
    }
  }
  
  return {
    schools,
    accounts,
    students,
    fees,
    installments: [],
    messages: []
  };
};

// Default schools data
const getDefaultSchools = () => [
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
    logo: 'https://images.unsplash.com/photo-1680181013556-bcd12a4c5d23?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxPbWFuJTIwc2Nob29scyUyMGJ1aWxkaW5ncyUyMGFyY2hpdGVjdHVyZXxlbnwwfHx8fDE3NDU3MzkwMDB8MA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800'
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
    logo: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxPbWFuJTIwc2Nob29scyUyMGJ1aWxkaW5ncyUyMGFyY2hpdGVjdHVyZXxlbnwwfHx8fDE3NDU3MzkwMDB8MA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800'
  }
];

// Initialize mock database
const mockDb = initializeMockDb();

// Simulate API delay
const simulateDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Schools API
export const getSchools = async (): Promise<ApiResponse> => {
  await simulateDelay();
  return { success: true, data: mockDb.schools };
};

export const getSchool = async (id: string): Promise<ApiResponse> => {
  await simulateDelay();
  const school = mockDb.schools.find(s => s.id === id);
  return school 
    ? { success: true, data: school }
    : { success: false, error: 'مدرسة غير موجودة' };
};

export const createSchool = async (schoolData: any): Promise<ApiResponse> => {
  await simulateDelay();
  const newId = String(Date.now());
  const newSchool = {
    id: newId,
    ...schoolData,
    active: true
  };
  mockDb.schools.push(newSchool);
  
  // Update localStorage
  localStorage.setItem('schools', JSON.stringify(mockDb.schools));
  
  return { success: true, data: newSchool };
};

export const updateSchool = async (id: string, schoolData: any): Promise<ApiResponse> => {
  await simulateDelay();
  const index = mockDb.schools.findIndex(s => s.id === id);
  if (index === -1) {
    return { success: false, error: 'مدرسة غير موجودة' };
  }
  mockDb.schools[index] = { ...mockDb.schools[index], ...schoolData };
  
  // Update localStorage
  localStorage.setItem('schools', JSON.stringify(mockDb.schools));
  
  return { success: true, data: mockDb.schools[index] };
};

export const deleteSchool = async (id: string): Promise<ApiResponse> => {
  await simulateDelay();
  const index = mockDb.schools.findIndex(s => s.id === id);
  if (index === -1) {
    return { success: false, error: 'مدرسة غير موجودة' };
  }
  
  // Delete the school
  mockDb.schools.splice(index, 1);
  
  // Update localStorage
  localStorage.setItem('schools', JSON.stringify(mockDb.schools));
  
  return { success: true };
};

// Students API
export const getStudents = async (schoolId?: string, gradeLevel?: string | string[]): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get students from localStorage
  let students = [];
  const savedStudents = localStorage.getItem('students');
  if (savedStudents) {
    try {
      students = JSON.parse(savedStudents);
    } catch (e) {
      console.error('Error parsing students from localStorage:', e);
    }
  }
  
  // Apply filters
  let filteredStudents = students;
  
  if (schoolId) {
    filteredStudents = filteredStudents.filter(s => s.schoolId === schoolId);
  }
  
  if (gradeLevel) {
    if (Array.isArray(gradeLevel)) {
      filteredStudents = filteredStudents.filter(s => gradeLevel.includes(s.grade));
    } else {
      filteredStudents = filteredStudents.filter(s => s.grade === gradeLevel);
    }
  }
  
  return { success: true, data: filteredStudents };
};

export const createStudent = async (studentData: any): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing students
  let students = [];
  const savedStudents = localStorage.getItem('students');
  if (savedStudents) {
    try {
      students = JSON.parse(savedStudents);
    } catch (e) {
      console.error('Error parsing students from localStorage:', e);
    }
  }
  
  // Create new student
  const newId = String(Date.now());
  const newStudent = {
    id: newId,
    ...studentData
  };
  
  // Add to collection
  students.push(newStudent);
  
  // Update localStorage
  localStorage.setItem('students', JSON.stringify(students));
  
  return { success: true, data: newStudent };
};

export const importStudents = async (students: any[]): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing students
  let existingStudents = [];
  const savedStudents = localStorage.getItem('students');
  if (savedStudents) {
    try {
      existingStudents = JSON.parse(savedStudents);
    } catch (e) {
      console.error('Error parsing students from localStorage:', e);
    }
  }
  
  // Generate IDs for new students
  const newStudents = students.map(student => ({
    id: String(Date.now() + Math.floor(Math.random() * 1000)),
    ...student
  }));
  
  // Combine and save
  const updatedStudents = [...existingStudents, ...newStudents];
  localStorage.setItem('students', JSON.stringify(updatedStudents));
  
  return { success: true, data: newStudents };
};

export const exportStudentsTemplate = (): Blob => {
  const headers = ['اسم الطالب', 'رقم الطالب', 'الصف', 'اسم ولي الأمر', 'رقم الهاتف', 'النقل'];
  const csvContent = [
    headers.join(','),
    'أحمد محمد,S1001,الروضة الأولى KG1,محمد أحمد,+968 95123456,اتجاهين',
    'فاطمة خالد,S1002,التمهيدي KG2,خالد علي,+968 95123457,اتجاه واحد',
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

// Fees API
export const getFees = async (schoolId?: string, studentId?: string, gradeLevel?: string | string[]): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get fees from localStorage
  let fees = [];
  const savedFees = localStorage.getItem('fees');
  if (savedFees) {
    try {
      fees = JSON.parse(savedFees);
    } catch (e) {
      console.error('Error parsing fees from localStorage:', e);
    }
  }
  
  // Apply filters
  let filteredFees = fees;
  
  if (schoolId) {
    filteredFees = filteredFees.filter(f => f.schoolId === schoolId);
  }
  
  if (studentId) {
    filteredFees = filteredFees.filter(f => f.studentId === studentId);
  }
  
  if (gradeLevel) {
    // Get students in the grade(s)
    let students = [];
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      try {
        students = JSON.parse(savedStudents);
      } catch (e) {
        console.error('Error parsing students from localStorage:', e);
      }
    }
    
    let studentIds = [];
    if (Array.isArray(gradeLevel)) {
      studentIds = students
        .filter(s => gradeLevel.includes(s.grade))
        .map(s => s.id);
    } else {
      studentIds = students
        .filter(s => s.grade === gradeLevel)
        .map(s => s.id);
    }
    
    filteredFees = filteredFees.filter(f => studentIds.includes(f.studentId));
  }
  
  return { success: true, data: filteredFees };
};

export const createFee = async (feeData: any): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing fees
  let fees = [];
  const savedFees = localStorage.getItem('fees');
  if (savedFees) {
    try {
      fees = JSON.parse(savedFees);
    } catch (e) {
      console.error('Error parsing fees from localStorage:', e);
    }
  }
  
  // Create new fee
  const newId = String(Date.now());
  const newFee = {
    id: newId,
    ...feeData
  };
  
  // Add to collection
  fees.push(newFee);
  
  // Update localStorage
  localStorage.setItem('fees', JSON.stringify(fees));
  
  return { success: true, data: newFee };
};

export const importFees = async (fees: any[]): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing fees
  let existingFees = [];
  const savedFees = localStorage.getItem('fees');
  if (savedFees) {
    try {
      existingFees = JSON.parse(savedFees);
    } catch (e) {
      console.error('Error parsing fees from localStorage:', e);
    }
  }
  
  // Generate IDs for new fees
  const newFees = fees.map(fee => ({
    id: String(Date.now() + Math.floor(Math.random() * 1000)),
    ...fee
  }));
  
  // Combine and save
  const updatedFees = [...existingFees, ...newFees];
  localStorage.setItem('fees', JSON.stringify(updatedFees));
  
  return { success: true, data: newFees };
};

export const exportFeesTemplate = (): Blob => {
  const headers = ['رقم الطالب', 'نوع الرسوم', 'المبلغ', 'الخصم', 'تاريخ الاستحقاق'];
  const csvContent = [
    headers.join(','),
    'S1001,tuition,1000,0,2023-09-01',
    'S1001,transportation,300,0,2023-09-01',
    'S1002,tuition,1000,100,2023-09-01',
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

// Installments API
export const getInstallments = async (schoolId?: string, studentId?: string, gradeLevel?: string | string[]): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get installments from localStorage
  let installments = [];
  const savedInstallments = localStorage.getItem('installments');
  if (savedInstallments) {
    try {
      installments = JSON.parse(savedInstallments);
    } catch (e) {
      console.error('Error parsing installments from localStorage:', e);
    }
  }
  
  // Apply filters
  let filteredInstallments = installments;
  
  if (schoolId) {
    filteredInstallments = filteredInstallments.filter(i => i.schoolId === schoolId);
  }
  
  if (studentId) {
    filteredInstallments = filteredInstallments.filter(i => i.studentId === studentId);
  }
  
  if (gradeLevel) {
    // Get students in the grade(s)
    let students = [];
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      try {
        students = JSON.parse(savedStudents);
      } catch (e) {
        console.error('Error parsing students from localStorage:', e);
      }
    }
    
    let studentIds = [];
    if (Array.isArray(gradeLevel)) {
      studentIds = students
        .filter(s => gradeLevel.includes(s.grade))
        .map(s => s.id);
    } else {
      studentIds = students
        .filter(s => s.grade === gradeLevel)
        .map(s => s.id);
    }
    
    filteredInstallments = filteredInstallments.filter(i => studentIds.includes(i.studentId));
  }
  
  return { success: true, data: filteredInstallments };
};

// Create or update installment
export const saveInstallment = async (installmentData: any): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing installments
  let installments = [];
  const savedInstallments = localStorage.getItem('installments');
  if (savedInstallments) {
    try {
      installments = JSON.parse(savedInstallments);
    } catch (e) {
      console.error('Error parsing installments from localStorage:', e);
    }
  }
  
  let updatedInstallment;
  
  if (installmentData.id) {
    // Update existing installment
    const index = installments.findIndex(i => i.id === installmentData.id);
    if (index === -1) {
      return { success: false, error: 'القسط غير موجود' };
    }
    
    updatedInstallment = { ...installments[index], ...installmentData };
    installments[index] = updatedInstallment;
  } else {
    // Create new installment
    const newId = String(Date.now());
    updatedInstallment = {
      id: newId,
      ...installmentData
    };
    installments.push(updatedInstallment);
  }
  
  // Update localStorage
  localStorage.setItem('installments', JSON.stringify(installments));
  
  return { success: true, data: updatedInstallment };
};

// WhatsApp Integration
export const sendWhatsAppMessage = async (phone: string, message: string): Promise<ApiResponse> => {
  try {
    await simulateDelay(600);
    
    // In a real app, we would call the WhatsApp API via proxy
    console.log(`Sending WhatsApp message to ${phone}: ${message}`);
    
    // Simulate API call to WhatsApp via proxy
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { body: message }
    };
    
    // In a production app, we would make the actual API call:
    // const response = await fetch(`https://hooks.jdoodle.net/proxy?url=${WHATSAPP_API_URL}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    // const data = await response.json();
    
    // Save message to localStorage for history
    const savedMessages = localStorage.getItem('messages') || '[]';
    let messages = [];
    try {
      messages = JSON.parse(savedMessages);
    } catch (e) {
      console.error('Error parsing messages:', e);
    }
    
    const newMessage = {
      id: String(Date.now()),
      phone,
      message,
      sentAt: new Date().toISOString(),
      status: 'delivered'
    };
    
    messages.push(newMessage);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    return { 
      success: true, 
      data: { id: `whatsapp_message_${Date.now()}` }
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { 
      success: false, 
      error: 'حدث خطأ أثناء إرسال رسالة الواتساب' 
    };
  }
};

// Settings API
export const getSchoolSettings = async (schoolId: string): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Try to get settings from localStorage
  const savedSettings = localStorage.getItem(`school_settings_${schoolId}`);
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      return { success: true, data: settings };
    } catch (e) {
      console.error('Error parsing settings from localStorage:', e);
    }
  }
  
  // School from database
  const school = mockDb.schools.find(s => s.id === schoolId);
  
  // Default settings
  const defaultSettings = {
    name: school?.name || 'مدرسة جديدة',
    email: school?.email || 'info@school.edu.om',
    phone: school?.phone || '+968 24000000',
    address: school?.address || 'عنوان المدرسة، مسقط، عمان',
    logo: school?.logo || 'https://images.unsplash.com/photo-1466442929976-97f336a657be?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxPbWFuJTIwc2Nob29scyUyMGJ1aWxkaW5ncyUyMGFyY2hpdGVjdHVyZXxlbnwwfHx8fDE3NDU3MzkwMDB8MA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800',
    defaultInstallments: 4,
    tuitionFeeCategory: 'رسوم دراسية',
    transportationFeeOneWay: 150,
    transportationFeeTwoWay: 300
  };
  
  return { success: true, data: defaultSettings };
};

export const updateSchoolSettings = async (schoolId: string, settings: any): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Save settings to localStorage
  localStorage.setItem(`school_settings_${schoolId}`, JSON.stringify(settings));
  
  // Update school info in database if necessary
  const schoolIndex = mockDb.schools.findIndex(s => s.id === schoolId);
  if (schoolIndex !== -1) {
    mockDb.schools[schoolIndex] = {
      ...mockDb.schools[schoolIndex],
      name: settings.name,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      logo: settings.logo || mockDb.schools[schoolIndex].logo
    };
    
    // Update localStorage
    localStorage.setItem('schools', JSON.stringify(mockDb.schools));
  }
  
  return { success: true, data: settings };
};

// Accounts management
export const getAccounts = async (schoolId?: string): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get accounts from localStorage
  let accounts = [];
  const savedAccounts = localStorage.getItem('accounts');
  if (savedAccounts) {
    try {
      accounts = JSON.parse(savedAccounts);
      
      if (schoolId) {
        accounts = accounts.filter(a => a.schoolId === schoolId);
      }
    } catch (e) {
      console.error('Error parsing accounts from localStorage:', e);
    }
  }
  
  return { success: true, data: accounts };
};

export const createAccount = async (accountData: any): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing accounts
  let accounts = [];
  const savedAccounts = localStorage.getItem('accounts');
  if (savedAccounts) {
    try {
      accounts = JSON.parse(savedAccounts);
    } catch (e) {
      console.error('Error parsing accounts from localStorage:', e);
    }
  }
  
  // Create new account
  const newId = String(Date.now());
  const newAccount = {
    id: newId,
    ...accountData,
    lastLogin: null
  };
  
  // Add school information
  if (newAccount.schoolId) {
    const school = mockDb.schools.find(s => s.id === newAccount.schoolId);
    if (school) {
      newAccount.school = school.name;
      newAccount.schoolName = school.name;
      newAccount.schoolLogo = school.logo;
    }
  }
  
  // Add to collection
  accounts.push(newAccount);
  
  // Update localStorage
  localStorage.setItem('accounts', JSON.stringify(accounts));
  
  return { success: true, data: newAccount };
};

export const updateAccount = async (id: string, accountData: any): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing accounts
  let accounts = [];
  const savedAccounts = localStorage.getItem('accounts');
  if (savedAccounts) {
    try {
      accounts = JSON.parse(savedAccounts);
    } catch (e) {
      console.error('Error parsing accounts from localStorage:', e);
      return { success: false, error: 'خطأ في استرجاع الحسابات' };
    }
  }
  
  // Find account index
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) {
    return { success: false, error: 'الحساب غير موجود' };
  }
  
  // Update the account
  const updatedAccount = { ...accounts[index], ...accountData };
  
  // Update school information if school changed
  if (accountData.schoolId && accountData.schoolId !== accounts[index].schoolId) {
    const school = mockDb.schools.find(s => s.id === accountData.schoolId);
    if (school) {
      updatedAccount.school = school.name;
      updatedAccount.schoolName = school.name;
      updatedAccount.schoolLogo = school.logo;
    }
  }
  
  accounts[index] = updatedAccount;
  
  // Update localStorage
  localStorage.setItem('accounts', JSON.stringify(accounts));
  
  return { success: true, data: updatedAccount };
};

export const deleteAccount = async (id: string): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing accounts
  let accounts = [];
  const savedAccounts = localStorage.getItem('accounts');
  if (savedAccounts) {
    try {
      accounts = JSON.parse(savedAccounts);
    } catch (e) {
      console.error('Error parsing accounts from localStorage:', e);
      return { success: false, error: 'خطأ في استرجاع الحسابات' };
    }
  }
  
  // Find account index
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) {
    return { success: false, error: 'الحساب غير موجود' };
  }
  
  // Remove account
  accounts.splice(index, 1);
  
  // Update localStorage
  localStorage.setItem('accounts', JSON.stringify(accounts));
  
  return { success: true };
};

// Get all stored messages
export const getMessages = async (schoolId?: string): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get messages from localStorage
  let messages = [];
  const savedMessages = localStorage.getItem('messages');
  if (savedMessages) {
    try {
      messages = JSON.parse(savedMessages);
      
      if (schoolId) {
        messages = messages.filter(m => m.schoolId === schoolId);
      }
    } catch (e) {
      console.error('Error parsing messages from localStorage:', e);
    }
  }
  
  return { success: true, data: messages };
};

export default {
  getSchools,
  getSchool,
  createSchool,
  updateSchool,
  deleteSchool,
  getStudents,
  createStudent,
  importStudents,
  exportStudentsTemplate,
  getFees,
  createFee,
  importFees,
  exportFeesTemplate,
  getInstallments,
  saveInstallment,
  sendWhatsAppMessage,
  getSchoolSettings,
  updateSchoolSettings,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getMessages
};
 