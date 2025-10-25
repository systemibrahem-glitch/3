import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, CURRENCIES, SUBSCRIPTION_PLANS, getWhatsAppUrl, WHATSAPP_NUMBER, SUPPORT_EMAIL, APP_LOGO } from '@/const';
import { Settings as SettingsIcon, CreditCard, Bell, Globe, Palette, Shield, Database, MessageCircle, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Settings() {
  const { user, store, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    locale: 'ar',
    theme: 'light',
    default_currency: 'USD',
    notifications: {
      email: true,
      whatsapp: true,
      low_stock: true,
      overdue_invoices: true,
      payroll_approved: true,
    },
  });

  useEffect(() => {
    if (user) {
      setSettings({
        locale: user.locale || 'ar',
        theme: user.theme || 'light',
        default_currency: store?.settings?.default_currency || 'USD',
        notifications: {
          email: true,
          whatsapp: true,
          low_stock: true,
          overdue_invoices: true,
          payroll_approved: true,
        },
      });
    }
  }, [user, store]);

  async function handleSaveSettings() {
    if (!user || !store) return;

    setLoading(true);
    try {
      // Update user settings
      await updateUser({
        locale: settings.locale,
        theme: settings.theme,
      });

      // Update store settings
      const { error } = await supabase
        .from('stores')
        .update({
          settings: {
            ...store.settings,
            default_currency: settings.default_currency,
          }
        })
        .eq('id', store.id);

      if (error) throw error;

      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ في حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  }

  function getSubscriptionStatus() {
    if (!store) return { status: 'unknown', days: 0 };
    
    const now = new Date();
    const endDate = new Date(store.subscription_end_date);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) {
      return { status: 'expired', days: 0 };
    } else if (daysRemaining <= 7) {
      return { status: 'expiring', days: daysRemaining };
    } else {
      return { status: 'active', days: daysRemaining };
    }
  }

  const subscriptionStatus = getSubscriptionStatus();

  const settingSections = [
    {
      title: 'عام',
      icon: SettingsIcon,
      items: [
        {
          label: 'اللغة',
          description: 'اختر لغة الواجهة',
          type: 'select',
          key: 'locale',
          options: [
            { value: 'ar', label: 'العربية' },
            { value: 'en', label: 'English' },
            { value: 'tr', label: 'Türkçe' },
          ]
        },
        {
          label: 'المظهر',
          description: 'اختر مظهر التطبيق',
          type: 'select',
          key: 'theme',
          options: [
            { value: 'light', label: 'فاتح' },
            { value: 'dark', label: 'داكن' },
            { value: 'system', label: 'النظام' },
          ]
        },
        {
          label: 'العملة الافتراضية',
          description: 'العملة المستخدمة افتراضياً في النظام',
          type: 'select',
          key: 'default_currency',
          options: CURRENCIES.map(curr => ({ value: curr.code, label: `${curr.symbol} - ${curr.name}` }))
        }
      ]
    },
    {
      title: 'الإشعارات',
      icon: Bell,
      items: [
        {
          label: 'إشعارات البريد الإلكتروني',
          description: 'تلقي الإشعارات عبر البريد الإلكتروني',
          type: 'switch',
          key: 'notifications.email'
        },
        {
          label: 'إشعارات واتساب',
          description: 'تلقي الإشعارات عبر واتساب',
          type: 'switch',
          key: 'notifications.whatsapp'
        },
        {
          label: 'تنبيه نقص المخزون',
          description: 'تنبيه عند انخفاض المخزون عن الحد الأدنى',
          type: 'switch',
          key: 'notifications.low_stock'
        },
        {
          label: 'تنبيه الفواتير المتأخرة',
          description: 'تنبيه عند تأخر سداد الفواتير',
          type: 'switch',
          key: 'notifications.overdue_invoices'
        },
        {
          label: 'تنبيه اعتماد الرواتب',
          description: 'تنبيه عند اعتماد كشوف الرواتب',
          type: 'switch',
          key: 'notifications.payroll_approved'
        }
      ]
    }
  ];

  function renderSettingItem(item: any) {
    const value = item.key.split('.').reduce((obj: any, key: string) => obj?.[key], settings);

    switch (item.type) {
      case 'select':
        return (
          <Select value={value} onValueChange={(newValue) => {
            if (item.key.includes('.')) {
              const keys = item.key.split('.');
              setSettings(prev => ({
                ...prev,
                [keys[0]]: {
                  ...prev[keys[0] as keyof typeof prev],
                  [keys[1]]: newValue
                }
              }));
            } else {
              setSettings(prev => ({ ...prev, [item.key]: newValue }));
            }
          }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {item.options.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'switch':
        return (
          <Switch
            checked={value}
            onCheckedChange={(checked) => {
              const keys = item.key.split('.');
              setSettings(prev => ({
                ...prev,
                [keys[0]]: {
                  ...prev[keys[0] as keyof typeof prev],
                  [keys[1]]: checked
                }
              }));
            }}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <img src={APP_LOGO} alt="نظام إبراهيم للمحاسبة" className="w-16 h-16 object-contain" />
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">الإعدادات</h1>
          <p className="text-slate-600 dark:text-slate-400">إدارة إعدادات النظام والاشتراك</p>
        </div>
      </div>

      {/* Subscription Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">حالة الاشتراك</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {store?.subscription_plan && SUBSCRIPTION_PLANS[store.subscription_plan as keyof typeof SUBSCRIPTION_PLANS]?.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
              subscriptionStatus.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              subscriptionStatus.status === 'expiring' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {subscriptionStatus.status === 'active' ? `نشط (${subscriptionStatus.days} يوم)` :
               subscriptionStatus.status === 'expiring' ? `ينتهي قريباً (${subscriptionStatus.days} يوم)` :
               'منتهي الصلاحية'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ينتهي في: {new Date(store?.subscription_end_date || '').toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>
        
        {(subscriptionStatus.status === 'expired' || subscriptionStatus.status === 'expiring') && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                تجديد الاشتراك مطلوب
              </span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              يرجى التواصل معنا لتجديد اشتراكك والاستمرار في استخدام النظام
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => window.open(getWhatsAppUrl('أريد تجديد اشتراكي'), '_blank')}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                واتساب
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(`mailto:${SUPPORT_EMAIL}?subject=تجديد الاشتراك`, '_blank')}
              >
                <Mail className="w-4 h-4 ml-2" />
                بريد إلكتروني
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingSections.map((section, sectionIndex) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{section.title}</h2>
                </div>
                
                <div className="space-y-6">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.label}
                          </Label>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {item.description}
                          </p>
                        </div>
                        <div className="ml-4">
                          {renderSettingItem(item)}
                        </div>
                      </div>
                      {itemIndex < section.items.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Store Information */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">معلومات المتجر</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">اسم المتجر</Label>
            <p className="text-sm text-slate-900 dark:text-white mt-1">{store?.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">مالك المتجر</Label>
            <p className="text-sm text-slate-900 dark:text-white mt-1">{store?.owner_name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">البريد الإلكتروني</Label>
            <p className="text-sm text-slate-900 dark:text-white mt-1">{store?.email}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">رقم الهاتف</Label>
            <p className="text-sm text-slate-900 dark:text-white mt-1">{store?.phone || 'غير محدد'}</p>
          </div>
        </div>
      </Card>

      {/* Contact Support */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">الدعم الفني</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-slate-900 dark:text-white">واتساب</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              تواصل معنا عبر واتساب للحصول على الدعم الفني السريع
            </p>
            <Button 
              size="sm" 
              onClick={() => window.open(getWhatsAppUrl('أحتاج مساعدة في النظام'), '_blank')}
              className="bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="w-4 h-4 ml-2" />
              فتح واتساب
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-slate-900 dark:text-white">البريد الإلكتروني</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              أرسل لنا رسالة بريد إلكتروني للحصول على الدعم التفصيلي
            </p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(`mailto:${SUPPORT_EMAIL}?subject=طلب دعم فني`, '_blank')}
            >
              <Mail className="w-4 h-4 ml-2" />
              إرسال بريد إلكتروني
            </Button>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={loading}>
          {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
}
