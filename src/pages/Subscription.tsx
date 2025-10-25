import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SUBSCRIPTION_PLANS, getWhatsAppUrl, WHATSAPP_NUMBER, SUPPORT_EMAIL, getDaysRemaining, isSubscriptionExpired, isSubscriptionExpiring, APP_LOGO } from '@/const';
import { CreditCard, CheckCircle, XCircle, Clock, MessageCircle, Mail, Crown, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Subscription() {
  const { user, store, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  useEffect(() => {
    if (store) {
      // Auto-select current plan
      if (store.subscription_plan) {
        setSelectedPlan(store.subscription_plan);
      }
    }
  }, [store]);

  function getSubscriptionStatus() {
    if (!store) return { status: 'unknown', daysRemaining: 0, message: '' };

    const daysRemaining = getDaysRemaining(store.subscription_end_date);
    
    if (isSubscriptionExpired(store.subscription_end_date)) {
      return {
        status: 'expired',
        daysRemaining: 0,
        message: 'انتهت صلاحية الاشتراك. يرجى التجديد للاستمرار في استخدام النظام.'
      };
    }
    
    if (isSubscriptionExpiring(store.subscription_end_date)) {
      return {
        status: 'expiring',
        daysRemaining,
        message: `الاشتراك سينتهي خلال ${daysRemaining} أيام. يرجى التجديد قريباً.`
      };
    }
    
    return {
      status: 'active',
      daysRemaining,
      message: `الاشتراك نشط حتى ${new Date(store.subscription_end_date).toLocaleDateString('ar-SA')}`
    };
  }

  function getPlanFeatures(planType: string) {
    const features = {
      monthly: [
        'إدارة كاملة للمخزون',
        'نظام الفواتير والواردات/الصادرات',
        'إدارة الموظفين والرواتب',
        'التقارير الأساسية',
        'دعم العملات المتعددة',
        'التنبيهات والإشعارات',
        'دعم فني عبر الواتساب',
        'نسخ احتياطي يومي'
      ],
      '6months': [
        'جميع ميزات الشهري',
        'تقارير متقدمة',
        'تصدير PDF/Excel',
        'إدارة الشركاء المتقدمة',
        'نظام التنبيهات الذكي',
        'دعم أولوية عالية',
        'تحديثات مجانية',
        'خصم 17% على السعر'
      ],
      yearly: [
        'جميع الميزات المتقدمة',
        'تقارير مخصصة',
        'دعم متعدد اللغات',
        'إدارة متعددة المتاجر',
        'API متقدم',
        'دعم مخصص 24/7',
        'تحديثات فورية',
        'خصم 33% على السعر'
      ]
    };
    return features[planType as keyof typeof features] || [];
  }

  function getPlanIcon(planType: string) {
    switch (planType) {
      case 'monthly':
        return <Clock className="w-6 h-6" />;
      case '6months':
        return <Star className="w-6 h-6" />;
      case 'yearly':
        return <Crown className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  }

  function getPlanColor(planType: string) {
    switch (planType) {
      case 'monthly':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
      case '6months':
        return 'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800';
      case 'yearly':
        return 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800';
      default:
        return 'border-slate-200 bg-slate-50 dark:bg-slate-900/20 dark:border-slate-800';
    }
  }

  function handleUpgrade(planType: string) {
    const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) return;

    const message = `مرحباً، أريد ترقية اشتراكي إلى ${plan.name} (${plan.price}) لمدة ${plan.duration}.`;
    const whatsappUrl = getWhatsAppUrl(message);
    
    window.open(whatsappUrl, '_blank');
    toast.success('تم فتح الواتساب للتواصل مع الدعم');
  }

  function handleRenewal() {
    const message = `مرحباً، أريد تجديد اشتراكي الحالي (${store?.subscription_plan || 'غير محدد'}).`;
    const whatsappUrl = getWhatsAppUrl(message);
    
    window.open(whatsappUrl, '_blank');
    toast.success('تم فتح الواتساب للتواصل مع الدعم');
  }

  function handleContactSupport() {
    const message = `مرحباً، أحتاج مساعدة في نظام المحاسبة.`;
    const whatsappUrl = getWhatsAppUrl(message);
    
    window.open(whatsappUrl, '_blank');
    toast.success('تم فتح الواتساب للتواصل مع الدعم');
  }

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <img src={APP_LOGO} alt="نظام إبراهيم للمحاسبة" className="w-16 h-16 object-contain" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">الاشتراكات</h1>
          <p className="text-slate-600 dark:text-slate-400">إدارة اشتراكك وترقية الخدمات</p>
        </div>
      </div>

      {/* Current Subscription Status */}
      <Card className={`p-6 ${subscriptionStatus.status === 'expired' ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : subscriptionStatus.status === 'expiring' ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800' : 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${subscriptionStatus.status === 'expired' ? 'bg-red-100 dark:bg-red-900/30' : subscriptionStatus.status === 'expiring' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
            {subscriptionStatus.status === 'expired' ? (
              <XCircle className="w-6 h-6 text-red-600" />
            ) : subscriptionStatus.status === 'expiring' ? (
              <Clock className="w-6 h-6 text-amber-600" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              حالة الاشتراك الحالي
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {subscriptionStatus.message}
            </p>
            {store && (
              <div className="flex gap-2 mt-3">
                <Badge variant="outline">
                  {SUBSCRIPTION_PLANS[store.subscription_plan as keyof typeof SUBSCRIPTION_PLANS]?.name || 'غير محدد'}
                </Badge>
                <Badge variant="outline">
                  {store.is_active ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
            )}
          </div>
          {(subscriptionStatus.status === 'expired' || subscriptionStatus.status === 'expiring') && (
            <Button onClick={handleRenewal} className="bg-green-600 hover:bg-green-700">
              <CreditCard className="w-4 h-4 ml-2" />
              تجديد الاشتراك
            </Button>
          )}
        </div>
      </Card>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planType, plan], index) => (
          <motion.div
            key={planType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-6 h-full ${getPlanColor(planType)} ${store?.subscription_plan === planType ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="text-center">
                <div className={`inline-flex p-3 rounded-lg mb-4 ${getPlanColor(planType)}`}>
                  {getPlanIcon(planType)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    / {plan.duration}
                  </span>
                </div>
                <Badge variant="outline" className="mb-4">
                  {plan.duration}
                </Badge>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3 mb-6">
                {getPlanFeatures(planType).map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                {store?.subscription_plan === planType ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="w-4 h-4 ml-2" />
                    الخطة الحالية
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleUpgrade(planType)}
                    className="w-full"
                    variant={planType === 'yearly' ? 'default' : 'outline'}
                  >
                    <Zap className="w-4 h-4 ml-2" />
                    {store?.subscription_plan ? 'ترقية' : 'اختيار الخطة'}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Contact Information */}
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            تحتاج مساعدة؟
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            فريق الدعم متاح لمساعدتك في أي وقت. تواصل معنا عبر الواتساب أو البريد الإلكتروني.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleContactSupport} variant="outline">
              <MessageCircle className="w-4 h-4 ml-2" />
              واتساب الدعم
            </Button>
            <Button onClick={() => window.open(`mailto:${SUPPORT_EMAIL}`, '_blank')} variant="outline">
              <Mail className="w-4 h-4 ml-2" />
              البريد الإلكتروني
            </Button>
          </div>
          <div className="mt-4 text-sm text-slate-500 dark:text-slate-500">
            <p>رقم الواتساب: {WHATSAPP_NUMBER}</p>
            <p>البريد الإلكتروني: {SUPPORT_EMAIL}</p>
          </div>
        </div>
      </Card>

      {/* FAQ Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          الأسئلة الشائعة
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">
              كيف يمكنني ترقية اشتراكي؟
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              اختر الخطة المناسبة واضغط على "ترقية" ثم تواصل معنا عبر الواتساب لإتمام العملية.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">
              متى يتم تجديد الاشتراك؟
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              يتم التجديد تلقائياً في نهاية فترة الاشتراك الحالية. يمكنك تجديده يدوياً في أي وقت.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">
              هل يمكنني تغيير الخطة في أي وقت؟
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              نعم، يمكنك ترقية خطتك في أي وقت. سيتم احتساب الفرق المتبقي من الاشتراك الحالي.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">
              ماذا يحدث عند انتهاء الاشتراك؟
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ستحصل على فترة سماح لمدة 7 أيام لتجديد الاشتراك. بعدها سيتم تعطيل الوصول للنظام.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
