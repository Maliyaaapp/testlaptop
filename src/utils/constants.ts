//   Constants for the School Finance Management System 

// Grade Levels for Oman education system
export const GRADE_LEVELS = [
  'الروضة الأولى KG1',
  'التمهيدي KG2',
  'الصف الأول',
  'الصف الثاني',
  'الصف الثالث',
  'الصف الرابع',
  'الصف الخامس',
  'الصف السادس',
  'الصف السابع',
  'الصف الثامن',
  'الصف التاسع',
  'الصف العاشر',
  'الصف الحادي عشر',
  'الصف الثاني عشر'
];

// Fee Types
export const FEE_TYPES = [
  { id: 'tuition', name: 'رسوم دراسية' },
  { id: 'transportation', name: 'نقل مدرسي' },
  { id: 'activities', name: 'أنشطة' },
  { id: 'uniform', name: 'زي مدرسي' },
  { id: 'books', name: 'كتب' },
  { id: 'other', name: 'رسوم أخرى' }
];

// Installment Plans
export const INSTALLMENT_PLANS = [
  { id: 1, name: 'دفعة واحدة' },
  { id: 2, name: 'دفعتين' },
  { id: 3, name: 'ثلاث دفعات' },
  { id: 4, name: 'أربع دفعات' },
  { id: 6, name: 'ست دفعات' },
  { id: 12, name: 'اثنا عشر دفعة' }
];

// Transportation Types
export const TRANSPORTATION_TYPES = [
  { id: 'none', name: 'لا يوجد' },
  { id: 'one-way', name: 'اتجاه واحد' },
  { id: 'two-way', name: 'اتجاهين' }
];

// Transportation Directions
export const TRANSPORTATION_DIRECTIONS = [
  { id: 'to-school', name: 'من المنزل إلى المدرسة' },
  { id: 'from-school', name: 'من المدرسة إلى المنزل' }
];

// Currency for Oman
export const CURRENCY = 'ر.ع';
export const CURRENCY_NAME = 'ريال عماني';

// Validation
export const PHONE_REGEX = /^(\+968|968)?([279]\d{7})$/;
export const PHONE_PREFIX = '+968';
export const PHONE_FORMAT = '+968 XXXXXXXX';

// Locations in Oman
export const LOCATIONS = [
  'مسقط',
  'صلالة',
  'صحار',
  'صور',
  'نزوى',
  'البريمي',
  'الرستاق',
  'إبراء',
  'بهلاء',
  'عبري',
  'الخابورة',
  'السويق',
  'بركاء',
  'ينقل',
  'مصيرة',
  'الدقم',
  'مدحاء',
  'الخوض',
  'العامرات',
  'بوشر',
  'مطرح',
  'السيب',
  'قريات'
];

// WhatsApp API Integration
export const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0/me/messages';

// Date formats
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATE_FORMAT_DISPLAY = 'dd/MM/yyyy';

//  Default School Images
export const DEFAULT_SCHOOL_IMAGES = [
  'https://images.unsplash.com/photo-1680181013556-bcd12a4c5d23?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ2MzMyODQwfDA&ixlib=rb-4.0.3&fit=fillmax&h=400&w=600',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ2MzMyODQwfDA&ixlib=rb-4.0.3&fit=fillmax&h=400&w=600',
  'https://images.unsplash.com/photo-1503676382389-4809596d5290?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ2MzMyODQwfDA&ixlib=rb-4.0.3&fit=fillmax&h=400&w=600',
  'https://images.unsplash.com/photo-1527576539890-dfa815648363?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ2MzMyODQwfDA&ixlib=rb-4.0.3&fit=fillmax&h=400&w=600',
  'https://images.unsplash.com/photo-1466442929976-97f336a657be?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw1fHxPbWFuJTIwc2Nob29sJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzQ2MzMyODQwfDA&ixlib=rb-4.0.3&fit=fillmax&h=400&w=600'
];
 

// Default School Image (first one)
export const DEFAULT_SCHOOL_IMAGE = DEFAULT_SCHOOL_IMAGES[0];

// Module access permissions
export const MODULE_PERMISSIONS = {
  DASHBOARD: 'dashboard',
  STUDENTS: 'students',
  FEES: 'fees',
  INSTALLMENTS: 'installments',
  COMMUNICATIONS: 'communications',
  SETTINGS: 'settings'
};

// Account roles
export const ACCOUNT_ROLES = {
  ADMIN: 'admin',
  SCHOOL_ADMIN: 'schoolAdmin',
  GRADE_MANAGER: 'gradeManager'
};

// Font families
export const ARABIC_FONTS = [
  'Tajawal',
  'Cairo',
  'Noto Kufi Arabic',
  'Amiri',
  'El Messiri',
  'Reem Kufi',
  'Scheherazade New',
  'Lateef'
];

// PDF themes
export const PDF_THEMES = [
  { id: 'default', name: 'الافتراضي', primaryColor: '#800000', textColor: '#333333' },
  { id: 'blue', name: 'أزرق', primaryColor: '#003366', textColor: '#333333' },
  { id: 'green', name: 'أخضر', primaryColor: '#006633', textColor: '#333333' },
  { id: 'purple', name: 'بنفسجي', primaryColor: '#330066', textColor: '#333333' },
  { id: 'orange', name: 'برتقالي', primaryColor: '#CC6600', textColor: '#333333' },
];
 