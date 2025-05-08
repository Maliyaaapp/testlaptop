import  { useState, useEffect, useRef } from 'react';
import { Send, Filter, MessageSquare, RefreshCw, AlertCircle, Download } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { CURRENCY } from '../../../utils/constants';
import dataStore from '../../../services/dataStore';
import api from '../../../services/api';

// Define all interfaces to ensure type safety
interface Student {
  id: string;
  name: string;
  grade: string;
  parentName: string;
  phone: string;
}

interface Fee {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  balance: number;
  feeType: string;
}

interface Installment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface Message {
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

interface MessageTemplate {
  id: string;
  name: string;
  message: string;
}

const Communications = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  
  // Add grades array
  const grades = ['all', 'الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس', 'الصف السابع', 'الصف الثامن', 'الصف التاسع', 'الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر'];
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and selection state
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Message composition state
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [previewAmount, setPreviewAmount] = useState(250);
  const [previewDate, setPreviewDate] = useState(new Date().toISOString().split('T')[0]);
  
  const messagePreviewRef = useRef<HTMLDivElement>(null);
  
  // Predefined message templates
  const messageTemplates: MessageTemplate[] = [
    {
      id: '1',
      name: 'تذكير بموعد القسط',
      message: 'نفيدكم بأن القسط المستحق على الطالب {{name}} بمبلغ {{amount}} ر.ع مستحقة بتاريخ {{date}}، نرجو دفع المستحقات في اقرب فرصة ممكنة وشكراً.'
    },
    {
      id: '2',
      name: 'إشعار بتأخر سداد',
      message: 'نفيدكم بأن القسط المستحق على الطالب {{name}} بمبلغ {{amount}} ر.ع قد تأخر سداده، نرجو دفع المستحقات في اقرب فرصة ممكنة.'
    },
    {
      id: '3',
      name: 'تأكيد استلام الدفعة',
      message: 'شكراً لسداد الدفعة المستحقة للطالب {{name}} بمبلغ {{amount}} ر.ع بتاريخ {{date}}.'
    },
    {
      id: '4',
      name: 'معلومات عامة',
      message: 'عزيزي ولي أمر الطالب {{name}}، نود إعلامكم بأن هناك معلومات هامة. للاستفسار يرجى التواصل على هاتف المدرسة.'
    }
  ];
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch students based on user role
        let studentsList;
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          studentsList = dataStore.getStudents(user.schoolId, user.gradeLevels);
        } else {
          studentsList = dataStore.getStudents(user?.schoolId);
        }
        
        setStudents(studentsList);
        setFilteredStudents(studentsList);
        
        // Fetch messages
        const messagesList = dataStore.getMessages(user?.schoolId);
        setMessages(messagesList);
        
        // Fetch fees and installments for context data
        let feesList;
        let installmentsList;
        
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          feesList = dataStore.getFees(user.schoolId, undefined, user.gradeLevels);
          installmentsList = dataStore.getInstallments(user.schoolId, undefined, undefined, user.gradeLevels);
        } else {
          feesList = dataStore.getFees(user?.schoolId);
          installmentsList = dataStore.getInstallments(user?.schoolId);
        }
        
        setFees(feesList);
        setInstallments(installmentsList);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Subscribe to data store changes
    const unsubscribe = dataStore.subscribe(() => {
      try {
        // Re-fetch data when store changes
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          setStudents(dataStore.getStudents(user.schoolId, user.gradeLevels));
          setFees(dataStore.getFees(user.schoolId, undefined, user.gradeLevels));
          setInstallments(dataStore.getInstallments(user.schoolId, undefined, undefined, user.gradeLevels));
        } else {
          setStudents(dataStore.getStudents(user?.schoolId));
          setFees(dataStore.getFees(user?.schoolId));
          setInstallments(dataStore.getInstallments(user?.schoolId));
        }
        
        setMessages(dataStore.getMessages(user?.schoolId));
      } catch (err) {
        console.error('Error updating data:', err);
      }
    });
    
    return () => unsubscribe();
  }, [user]);
  
  // Apply grade filter
  useEffect(() => {
    if (selectedGrade === 'all') {
      setFilteredStudents(students);
    } else {
      setFilteredStudents(students.filter(student => student.grade === selectedGrade));
    }
  }, [selectedGrade, students]);
  
  // Handle selectAll changes
  useEffect(() => {
    if (selectAll) {
      setSelectedStudents(filteredStudents.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  }, [selectAll, filteredStudents]);
  
  // Handle selecting a message template
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = messageTemplates.find(t => t.id === templateId);
      if (template) {
        setMessageText(template.message);
      }
    } else {
      setMessageText('');
    }
  };
  
  // Handle student selection
  const handleStudentSelection = (id: string) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(studentId => studentId !== id));
      setSelectAll(false);
    } else {
      setSelectedStudents([...selectedStudents, id]);
      
      // Check if all students are now selected
      if (selectedStudents.length + 1 === filteredStudents.length) {
        setSelectAll(true);
      }
    }
  };
  
  // Handle sending messages
  const handleSendMessages = async () => {
    if (selectedStudents.length === 0 || !messageText) {
      setError('الرجاء اختيار طلبة ورسالة للإرسال');
      return;
    }
    
    setIsSending(true);
    setError(null);
    
    try {
      // Process each selected student
      for (const studentId of selectedStudents) {
        const student = students.find(s => s.id === studentId);
        
        if (!student) continue;
        
        // Create message with replaced variables
        let finalMessage = messageText;
        finalMessage = finalMessage.replace(/{{name}}/g, student.name);
        finalMessage = finalMessage.replace(/{{amount}}/g, `${previewAmount} ${CURRENCY}`);
        finalMessage = finalMessage.replace(/{{date}}/g, new Date(previewDate).toLocaleDateString('ar-SA'));
        
        // Create new message object
        const newMessage: Message = {
          id: crypto.randomUUID(),
          studentId: student.id,
          studentName: student.name,
          grade: student.grade,
          parentName: student.parentName,
          phone: student.phone,
          template: selectedTemplate ? messageTemplates.find(t => t.id === selectedTemplate)?.name || '' : 'رسالة مخصصة',
          message: finalMessage,
          sentAt: new Date().toISOString(),
          status: 'pending',
          schoolId: user?.schoolId || ''
        };
        
        // Add message to dataStore
        dataStore.saveMessage(newMessage);
        
        // TODO: Integrate with actual SMS service
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      }
      
      setIsSending(false);
      setSelectedStudents([]);
      setSelectAll(false);
      setMessageText('');
      setSelectedTemplate('');
      
    } catch (err) {
      console.error('Error sending messages:', err);
      setError('حدث خطأ أثناء إرسال الرسائل. يرجى المحاولة مرة أخرى.');
      setIsSending(false);
    }
  };
  
  // Generate message preview
  const getMessagePreview = () => {
    if (!selectedStudents.length || !messageText) return '';
    
    const student = students.find(s => s.id === selectedStudents[0]);
    if (!student) return '';
    
    let preview = messageText;
    preview = preview.replace(/{{name}}/g, student.name);
    preview = preview.replace(/{{amount}}/g, `${previewAmount} ${CURRENCY}`);
    preview = preview.replace(/{{date}}/g, new Date(previewDate).toLocaleDateString('ar-SA'));
    
    return preview;
  };
  
  // Scroll to message preview
  const scrollToPreview = () => {
    if (messagePreviewRef.current) {
      messagePreviewRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Export messages to CSV
  const handleExportMessages = () => {
    if (messages.length === 0) {
      alert('لا توجد رسائل للتصدير');
      return;
    }
    
    const headers = ['اسم الطالب', 'الصف', 'رقم الهاتف', 'نوع الرسالة', 'تاريخ الإرسال', 'الحالة'];
    
    const csvRows = [
      headers.join(','),
      ...messages.map(message => {
        return [
          message.studentName,
          message.grade,
          message.phone,
          message.template,
          new Date(message.sentAt).toLocaleString('en-GB'),
          getStatusLabel(message.status)
        ].join(',');
      })
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Create BOM for UTF-8
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'سجل_المراسلات.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Format status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'تم التسليم';
      case 'failed':
        return 'فشل';
      case 'pending':
        return 'قيد الإرسال';
      default:
        return status;
    }
  };
  
  // Format status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Loading indicator
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">المراسلات وإشعارات الواتساب</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message History Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" />
                <h2 className="text-xl font-bold text-gray-800">سجل المراسلات</h2>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  onClick={handleExportMessages}
                  title="تصدير السجل"
                >
                  <Download size={16} />
                  <span>تصدير</span>
                </button>
                
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  onClick={() => setMessages(dataStore.getMessages(user?.schoolId))}
                  title="تحديث"
                >
                  <RefreshCw size={16} />
                  <span>تحديث</span>
                </button>
              </div>
            </div>
            
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                لا توجد رسائل في السجل
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الطالب
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الصف
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        نوع الرسالة
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ الإرسال
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages.map((message) => (
                      <tr key={message.id || message.sentAt} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{message.studentName}</div>
                          <div className="text-xs text-gray-500">{message.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{message.grade}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{message.template}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">
                            {new Date(message.sentAt).toLocaleString('en-GB')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(message.status)}`}>
                            {getStatusLabel(message.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Message Composer Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-xl font-bold text-gray-800">إرسال رسالة جديدة</h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">اختر القالب:</label>
                <select
                  className="input w-full"
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                >
                  <option value="">-- اختر قالب الرسالة --</option>
                  {messageTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">نص الرسالة:</label>
                <textarea
                  className="input w-full"
                  rows={5}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  المتغيرات: {'{{name}}'} لاسم الطالب, {'{{amount}}'} للمبلغ, {'{{date}}'} للتاريخ
                </p>
              </div>
              
              {messageText && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-700">معاينة متغيرات الرسالة:</label>
                    <button
                      type="button"
                      className="text-primary text-sm"
                      onClick={scrollToPreview}
                    >
                      معاينة
                    </button>
                  </div>
                  
                  <div className="flex gap-2 items-center mb-2">
                    <label className="text-gray-700 whitespace-nowrap">المبلغ:</label>
                    <input
                      type="number"
                      className="input"
                      value={previewAmount}
                      onChange={(e) => setPreviewAmount(Number(e.target.value))}
                      min="0"
                    />
                    <span>{CURRENCY}</span>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <label className="text-gray-700 whitespace-nowrap">التاريخ:</label>
                    <input
                      type="date"
                      className="input"
                      value={previewDate}
                      onChange={(e) => setPreviewDate(e.target.value)}
                    />
                  </div>
                  
                  {selectedStudents.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md" ref={messagePreviewRef}>
                      <div className="font-bold text-gray-700 mb-2">معاينة الرسالة:</div>
                      <div className="text-gray-600 whitespace-pre-wrap">
                        {getMessagePreview()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">اختر الطلبة</h2>
              
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-600" />
                <select
                  className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  <option value="all">جميع الصفوف</option>
                  {grades.filter(g => g !== 'all').map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectAll}
                  onChange={(e) => setSelectAll(e.target.checked)}
                  className="h-4 w-4 text-primary rounded focus:ring-primary"
                />
                <label htmlFor="select-all" className="mr-2 text-gray-700">
                  اختيار الكل ({filteredStudents.length})
                </label>
              </div>
              
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    لا يوجد طلبة في هذا الصف
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="flex items-center p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleStudentSelection(student.id)}
                          className="h-4 w-4 text-primary rounded focus:ring-primary"
                        />
                        <label
                          htmlFor={`student-${student.id}`}
                          className="mr-2 text-gray-700 cursor-pointer flex-1"
                        >
                          <div>{student.name}</div>
                          <div className="text-xs text-gray-500">{student.grade} - {student.phone}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <button
                  type="button"
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                  disabled={isSending || selectedStudents.length === 0 || !messageText}
                  onClick={handleSendMessages}
                >
                  <Send size={18} />
                  <span>
                    {isSending ? 'جاري الإرسال...' : `إرسال إلى ${selectedStudents.length} طالب`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Communications;
 