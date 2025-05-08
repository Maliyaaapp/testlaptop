import  { useState, useEffect } from 'react';
import { Plus, CreditCard, Printer, Download, Edit, MessageSquare, Calendar, AlertCircle, Trash } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { CURRENCY } from '../../../utils/constants';
import { generateSubscriptionInvoice } from '../../../services/pdf';
import dataStore from '../../../services/dataStore';
import SubscriptionForm from './SubscriptionForm';

interface School {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Subscription {
  id: string;
  schoolId: string;
  schoolName: string;
  contactEmail: string;
  contactPhone: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  amount: number;
  paid: boolean;
  paymentDate?: string;
  status: 'active' | 'expired' | 'pending';
  createdAt: string;
}

const SubscriptionsList = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  // For WhatsApp notifications
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notifySchoolId, setNotifySchoolId] = useState('');
  const [notifySchoolName, setNotifySchoolName] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  useEffect(() => {
    // Load subscriptions and schools
    const loadData = () => {
      setIsLoading(true);
      
      // Get schools
      const schoolsList = dataStore.getSchools();
      setSchools(schoolsList);
      
      // Load existing subscriptions from localStorage
      const savedSubscriptions = localStorage.getItem('subscriptions');
      if (savedSubscriptions) {
        try {
          const parsedSubscriptions = JSON.parse(savedSubscriptions);
          setSubscriptions(parsedSubscriptions);
        } catch (e) {
          console.error('Error parsing subscriptions:', e);
          
          // Generate sample subscriptions if none exist
          const generatedSubscriptions = generateSampleSubscriptions(schoolsList);
          setSubscriptions(generatedSubscriptions);
          
          // Save to localStorage
          localStorage.setItem('subscriptions', JSON.stringify(generatedSubscriptions));
        }
      } else {
        // Generate sample subscriptions if none exist
        const generatedSubscriptions = generateSampleSubscriptions(schoolsList);
        setSubscriptions(generatedSubscriptions);
        
        // Save to localStorage
        localStorage.setItem('subscriptions', JSON.stringify(generatedSubscriptions));
      }
      
      setIsLoading(false);
    };
    
    loadData();
    
    // Subscribe to data store changes
    const unsubscribe = dataStore.subscribe(() => {
      const updatedSchools = dataStore.getSchools();
      setSchools(updatedSchools);
      
      // Update subscriptions with new school names if changed
      const updatedSubscriptions = subscriptions.map(sub => {
        const school = updatedSchools.find(s => s.id === sub.schoolId);
        if (school && school.name !== sub.schoolName) {
          return { ...sub, schoolName: school.name };
        }
        return sub;
      });
      
      setSubscriptions(updatedSubscriptions);
      localStorage.setItem('subscriptions', JSON.stringify(updatedSubscriptions));
    });
    
    return () => unsubscribe();
  }, []);

  // Generate sample subscriptions for demo purposes
  const generateSampleSubscriptions = (schools: School[]): Subscription[] => {
    return schools.map((school) => {
      // Random subscription period (6-12 months)
      const monthsDuration = Math.floor(Math.random() * 6) + 6;
      
      // Random start date in the past 6 months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // End date based on start date and duration
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + monthsDuration);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Random amount between 500 and 2000
      const amount = Math.floor(Math.random() * 1500) + 500;
      
      // 70% chance of being paid
      const paid = Math.random() > 0.3;
      
      // Payment date (if paid)
      let paymentDate = undefined;
      if (paid) {
        const paymentDateObj = new Date(startDate);
        paymentDateObj.setDate(paymentDateObj.getDate() + Math.floor(Math.random() * 14)); // Paid within 14 days
        paymentDate = paymentDateObj.toISOString().split('T')[0];
      }
      
      // Status
      let status: 'active' | 'expired' | 'pending' = 'active';
      const now = new Date();
      if (endDate < now) {
        status = 'expired';
      } else if (!paid) {
        status = 'pending';
      }
      
      return {
        id: `sub_${school.id}`,
        schoolId: school.id,
        schoolName: school.name,
        contactEmail: school.email,
        contactPhone: school.phone,
        subscriptionStart: startDateStr,
        subscriptionEnd: endDateStr,
        amount,
        paid,
        paymentDate,
        status,
        createdAt: new Date(startDate).setDate(startDate.getDate() - 3).toString()
      };
    });
  };

  const handleAddSubscription = () => {
    setSelectedSubscription(null);
    setShowAddForm(true);
  };
  
  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowAddForm(true);
  };

  const handleMarkAsPaid = (id: string) => {
    const updatedSubscriptions = subscriptions.map(sub => {
      if (sub.id === id) {
        return {
          ...sub,
          paid: true,
          paymentDate: new Date().toISOString().split('T')[0],
          status: sub.status === 'pending' ? 'active' : sub.status
        };
      }
      return sub;
    });
    
    setSubscriptions(updatedSubscriptions);
    localStorage.setItem('subscriptions', JSON.stringify(updatedSubscriptions));
  };

  const handleGenerateInvoice = (subscription: Subscription) => {
    try {
      // Generate invoice PDF
      const invoiceData = {
        invoiceNumber: `INV-${subscription.id.slice(-6)}`,
        date: new Date().toLocaleDateString('en-GB'), // Georgian date
        schoolName: subscription.schoolName,
        schoolId: subscription.schoolId,
        subscriptionStart: subscription.subscriptionStart,
        subscriptionEnd: subscription.subscriptionEnd,
        amount: subscription.amount,
        paid: subscription.paid
      };
      
      const doc = generateSubscriptionInvoice(invoiceData);
      
      // Save PDF for download without opening in new tab
      const pdfData = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfData);
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = `فاتورة_اشتراك_${subscription.schoolName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Error generating subscription invoice:', error);
      alert('حدث خطأ أثناء إنشاء فاتورة الاشتراك. يرجى المحاولة مرة أخرى.');
    }
  };
  
  const openSendReminderDialog = (subscription: Subscription) => {
    // Prepare for WhatsApp notification
    setNotifySchoolId(subscription.schoolId);
    setNotifySchoolName(subscription.schoolName);
    setNotifyPhone(subscription.contactPhone);
    
    // Subscription expiry notification template
    const daysLeft = getDaysLeft(subscription.subscriptionEnd);
    let message = '';
    
    if (daysLeft < 0) {
      message = `عزيزي مدير مدرسة ${subscription.schoolName}، نود إعلامكم بأن اشتراك مدرستكم في نظام إدارة المالية قد انتهى منذ ${Math.abs(daysLeft)} يوم. الرجاء التواصل معنا لتجديد الاشتراك.`;
    } else if (daysLeft <= 30) {
      message = `عزيزي مدير مدرسة ${subscription.schoolName}، نود إعلامكم بأن اشتراك مدرستكم في نظام إدارة المالية سينتهي بعد ${daysLeft} يوم. الرجاء تجديد الاشتراك قبل انتهاء الفترة الحالية.`;
    } else {
      message = `عزيزي مدير مدرسة ${subscription.schoolName}، نود إعلامكم بأن اشتراك مدرستكم في نظام إدارة المالية ساري حتى تاريخ ${new Date(subscription.subscriptionEnd).toLocaleDateString('en-GB')}. لديكم ${daysLeft} يوم متبقية على الاشتراك الحالي.`;
    }
    
    if (!subscription.paid) {
      message += `\n\nكما نود تذكيركم بأن فاتورة الاشتراك بمبلغ ${subscription.amount.toLocaleString()} ${CURRENCY} غير مدفوعة. الرجاء سداد الفاتورة في أقرب وقت.`;
    }
    
    setNotifyMessage(message);
    setShowNotifyDialog(true);
  };
  
  // Calculate days left until subscription expires
  const getDaysLeft = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Send WhatsApp notification
  const sendWhatsAppNotification = async () => {
    if (!notifyPhone || !notifyMessage) return;
    
    setIsSendingNotification(true);
    
    try {
      // In a real app, this would use api.sendWhatsAppMessage
      // For demo, we'll open WhatsApp web
      const encodedMessage = encodeURIComponent(notifyMessage);
      const phone = notifyPhone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      
      // Record the notification
      const subscription = subscriptions.find(sub => sub.schoolId === notifySchoolId);
      if (subscription) {
        // Save notification to messages collection
        dataStore.saveMessage({
          id: '',
          studentId: 'admin',
          studentName: 'إدارة النظام',
          grade: 'مدير المدرسة',
          parentName: notifySchoolName,
          phone: notifyPhone,
          template: 'إشعار اشتراك',
          message: notifyMessage,
          sentAt: new Date().toISOString(),
          status: 'delivered',
          schoolId: notifySchoolId
        });
      }
      
      alert(`تم إرسال إشعار إلى المدرسة ${notifySchoolName}`);
      setShowNotifyDialog(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setIsSendingNotification(false);
    }
  };
  
  // Save new or edited subscription
  const saveSubscription = (subscription: Subscription) => {
    let updatedSubscriptions;
    
    if (selectedSubscription) {
      // Update existing subscription
      updatedSubscriptions = subscriptions.map(sub => 
        sub.id === subscription.id ? subscription : sub
      );
    } else {
      // Add new subscription
      const newId = `sub_${Date.now()}`;
      const newSubscription = {
        ...subscription,
        id: newId,
        createdAt: new Date().toISOString()
      };
      updatedSubscriptions = [...subscriptions, newSubscription];
    }
    
    setSubscriptions(updatedSubscriptions);
    localStorage.setItem('subscriptions', JSON.stringify(updatedSubscriptions));
    setShowAddForm(false);
  };
  
  // Delete subscription
  const deleteSubscription = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) {
      const updatedSubscriptions = subscriptions.filter(sub => sub.id !== id);
      setSubscriptions(updatedSubscriptions);
      localStorage.setItem('subscriptions', JSON.stringify(updatedSubscriptions));
    }
  };
  
  // Export subscriptions to CSV
  const exportSubscriptions = () => {
    const headers = ['المدرسة', 'البريد الإلكتروني', 'رقم الهاتف', 'تاريخ البداية', 'تاريخ الانتهاء', 'المبلغ', 'الحالة'];
    
    const csvRows = [
      headers.join(','),
      ...subscriptions.map(subscription => {
        return [
          subscription.schoolName,
          subscription.contactEmail,
          subscription.contactPhone,
          subscription.subscriptionStart,
          subscription.subscriptionEnd,
          subscription.amount,
          getStatusLabel(subscription.status)
        ].join(',');
      })
    ];
    
    // Create BOM for UTF-8
    const BOM = "\uFEFF";
    const csvContent = BOM + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'اشتراكات_المدارس.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get status label in Arabic
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'expired':
        return 'منتهي';
      case 'pending':
        return 'قيد الانتظار';
      default:
        return status;
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Show subscription form if adding or editing
  if (showAddForm) {
    return (
      <SubscriptionForm
        subscription={selectedSubscription}
        schools={schools}
        onSave={saveSubscription}
        onCancel={() => setShowAddForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">إدارة اشتراكات المدارس</h1>
        <div className="flex gap-2">
          <button
            onClick={exportSubscriptions}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download size={18} />
            <span>تصدير البيانات</span>
          </button>
          <button
            onClick={handleAddSubscription}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            <span>إضافة اشتراك</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">إجمالي الاشتراكات</h3>
            <p className="text-2xl font-bold text-primary">
              {subscriptions.reduce((sum, sub) => sum + sub.amount, 0).toLocaleString()} {CURRENCY}
            </p>
          </div>
          <div className="bg-primary text-white p-3 rounded-full">
            <CreditCard size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">المبالغ المحصلة</h3>
            <p className="text-2xl font-bold text-green-600">
              {subscriptions.filter(sub => sub.paid).reduce((sum, sub) => sum + sub.amount, 0).toLocaleString()} {CURRENCY}
            </p>
          </div>
          <div className="bg-green-500 text-white p-3 rounded-full">
            <CreditCard size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">المبالغ المستحقة</h3>
            <p className="text-2xl font-bold text-red-600">
              {subscriptions.filter(sub => !sub.paid).reduce((sum, sub) => sum + sub.amount, 0).toLocaleString()} {CURRENCY}
            </p>
          </div>
          <div className="bg-red-500 text-white p-3 rounded-full">
            <CreditCard size={24} />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <CreditCard size={20} className="text-primary" />
          <h2 className="text-xl font-bold text-gray-800">قائمة الاشتراكات</h2>
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا توجد اشتراكات مسجلة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المدرسة
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    فترة الاشتراك
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    حالة الدفع
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    حالة الاشتراك
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => {
                  const daysLeft = getDaysLeft(subscription.subscriptionEnd);
                  return (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{subscription.schoolName}</div>
                        <div className="text-sm text-gray-500">{subscription.contactEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {subscription.subscriptionStart} إلى {subscription.subscriptionEnd}
                        </div>
                        {daysLeft > 0 && daysLeft <= 30 && (
                          <div className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                            <Calendar size={12} />
                            <span>متبقي {daysLeft} يوم</span>
                          </div>
                        )}
                        {daysLeft <= 0 && (
                          <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle size={12} />
                            <span>منتهي منذ {Math.abs(daysLeft)} يوم</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">{subscription.amount.toLocaleString()} {CURRENCY}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          subscription.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {subscription.paid ? 'مدفوع' : 'غير مدفوع'}
                        </span>
                        {subscription.paymentDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            تاريخ الدفع: {subscription.paymentDate}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                          {getStatusLabel(subscription.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium flex items-center space-x-2 space-x-reverse">
                        <button
                          type="button"
                          onClick={() => handleGenerateInvoice(subscription)}
                          className="text-gray-600 hover:text-gray-800"
                          title="تنزيل الفاتورة"
                        >
                          <Download size={18} />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleEditSubscription(subscription)}
                          className="text-primary hover:text-primary-dark"
                          title="تعديل الاشتراك"
                        >
                          <Edit size={18} />
                        </button>
                        
                        {!subscription.paid && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsPaid(subscription.id)}
                            className="text-green-600 hover:text-green-800"
                            title="تحديد كمدفوع"
                          >
                            <CreditCard size={18} />
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => openSendReminderDialog(subscription)}
                          className="text-blue-600 hover:text-blue-800"
                          title="إرسال إشعار واتساب"
                        >
                          <MessageSquare size={18} />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => deleteSubscription(subscription.id)}
                          className="text-red-600 hover:text-red-800"
                          title="حذف"
                        >
                          <Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Expiry Alert Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-yellow-50 border-b flex items-center gap-2">
          <AlertCircle size={20} className="text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-800">تنبيهات انتهاء الاشتراكات</h2>
        </div>
        
        <div className="p-4">
          <div className="space-y-4">
            {subscriptions
              .filter(sub => {
                const daysLeft = getDaysLeft(sub.subscriptionEnd);
                return daysLeft <= 30; // Show subscriptions expiring within 30 days or already expired
              })
              .map(subscription => {
                const daysLeft = getDaysLeft(subscription.subscriptionEnd);
                return (
                  <div key={`alert-${subscription.id}`} className={`p-4 rounded-lg ${daysLeft <= 0 ? 'bg-red-50' : 'bg-yellow-50'}`}>
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800">{subscription.schoolName}</h3>
                        <p className={`text-sm ${daysLeft <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {daysLeft <= 0 
                            ? `منتهي منذ ${Math.abs(daysLeft)} يوم (${subscription.subscriptionEnd})` 
                            : `ينتهي خلال ${daysLeft} يوم (${subscription.subscriptionEnd})`}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary py-1 px-3 flex items-center gap-1"
                        onClick={() => openSendReminderDialog(subscription)}
                      >
                        <MessageSquare size={16} />
                        <span>إرسال تذكير</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              
            {!subscriptions.some(sub => getDaysLeft(sub.subscriptionEnd) <= 30) && (
              <div className="p-6 text-center text-gray-500">
                لا توجد اشتراكات على وشك الانتهاء في الثلاثين يوماً القادمة
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* WhatsApp Notification Dialog */}
      {showNotifyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">إرسال إشعار لمدرسة {notifySchoolName}</h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">رقم الهاتف</label>
              <input
                type="text"
                className="input"
                value={notifyPhone}
                onChange={(e) => setNotifyPhone(e.target.value)}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">نص الرسالة</label>
              <textarea
                rows={6}
                className="input"
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowNotifyDialog(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-primary flex items-center gap-2"
                onClick={sendWhatsAppNotification}
                disabled={isSendingNotification}
              >
                <MessageSquare size={16} />
                <span>
                  {isSendingNotification ? 'جاري الإرسال...' : 'إرسال عبر الواتساب'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;
 