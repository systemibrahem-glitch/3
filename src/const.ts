export const COOKIE_NAME = 'session';
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'نظام إبراهيم للمحاسبة';

export const APP_LOGO = import.meta.env.VITE_APP_LOGO || '/logo.png';

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // For now, return a simple login page URL
  return '/login';
};

export const WHATSAPP_NUMBER = '+963994054027';
export const SUPPORT_EMAIL = 'systemibrahem@gmail.com';

export const SUBSCRIPTION_PLANS = {
  trial: { name: 'تجربة مجانية', duration: 30, price: 0 },
  monthly: { name: 'شهري', duration: 30, price: 5 },
  '6months': { name: '6 أشهر', duration: 180, price: 30 },
  yearly: { name: 'سنوي', duration: 365, price: 40 },
} as const;

export const CURRENCIES = [
  { code: 'TRY', name: 'الليرة التركية', symbol: '₺' },
  { code: 'SYP', name: 'الليرة السورية', symbol: 'ل.س' },
  { code: 'USD', name: 'الدولار الأمريكي', symbol: '$' },
] as const;

export const USER_ROLES = {
  owner: 'مالك المتجر',
  manager: 'مدير',
  accountant: 'محاسب',
  data_entry: 'مدخل بيانات',
  warehouse_keeper: 'أمين مستودع',
  employee: 'موظف',
} as const;

export const PERMISSIONS = {
  view_dashboard: 'عرض لوحة التحكم',
  view_invoices: 'عرض الفواتير',
  create_invoice: 'إنشاء فاتورة',
  edit_invoice: 'تعديل فاتورة',
  delete_invoice: 'حذف فاتورة',
  view_inventory: 'عرض المخزون',
  manage_inventory: 'إدارة المخزون',
  view_employees: 'عرض الموظفين',
  manage_employees: 'إدارة الموظفين',
  view_payroll: 'عرض الرواتب',
  manage_payroll: 'إدارة الرواتب',
  view_reports: 'عرض التقارير',
  export_reports: 'تصدير التقارير',
  manage_users: 'إدارة المستخدمين',
  manage_permissions: 'إدارة الصلاحيات',
  manage_settings: 'إدارة الإعدادات',
} as const;

export function getWhatsAppUrl(message: string = '') {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, '')}?text=${encodedMessage}`;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  if (!currency) return `${amount}`;
  
  return `${amount.toLocaleString('ar-SA', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })} ${currency.symbol}`;
}

export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isSubscriptionExpired(endDate: string): boolean {
  return getDaysRemaining(endDate) <= 0;
}

export function isSubscriptionExpiring(endDate: string, daysThreshold: number = 7): boolean {
  const days = getDaysRemaining(endDate);
  return days > 0 && days <= daysThreshold;
}