import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { USER_ROLES, APP_LOGO } from '@/const';
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Profile() {
  const { user, store, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    locale: 'ar',
    theme: 'light',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        full_name: user.full_name,
        email: user.email || '',
        locale: user.locale,
        theme: user.theme,
      });
    }
  }, [user]);

  async function handleSave() {
    if (!user) return;

    setLoading(true);
    try {
      await updateUser({
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        locale: formData.locale,
        theme: formData.theme,
      });

      toast.success('تم تحديث الملف الشخصي بنجاح');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('حدث خطأ في تحديث الملف الشخصي');
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    if (user) {
      setFormData({
        username: user.username,
        full_name: user.full_name,
        email: user.email || '',
        locale: user.locale,
        theme: user.theme,
      });
    }
    setEditing(false);
  }

  function getRoleLabel(role: string): string {
    return USER_ROLES[role as keyof typeof USER_ROLES] || role;
  }

  function getRoleColor(role: string): string {
    const colors = {
      owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      accountant: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      data_entry: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      warehouse_keeper: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      employee: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
    };
    return colors[role as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <img src={APP_LOGO} alt="نظام إبراهيم للمحاسبة" className="w-16 h-16 object-contain" />
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">الملف الشخصي</h1>
          <p className="text-slate-600 dark:text-slate-400">إدارة معلوماتك الشخصية وإعدادات الحساب</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl mb-4">
                {user?.full_name.charAt(0)}
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {user?.full_name}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                @{user?.username}
              </p>
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getRoleColor(user?.role || '')}`}>
                {getRoleLabel(user?.role || '')}
              </span>
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">البريد الإلكتروني</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {user?.email || 'غير محدد'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">تاريخ الانضمام</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">آخر دخول</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {user?.last_login ? new Date(user.last_login).toLocaleDateString('ar-SA') : 'لم يسجل دخول'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">معلومات الحساب</h2>
              </div>
              {!editing ? (
                <Button onClick={() => setEditing(true)} variant="outline">
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleCancel} variant="outline">
                    <X className="w-4 h-4 ml-2" />
                    إلغاء
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="w-4 h-4 ml-2" />
                    {loading ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المستخدم</Label>
                  {editing ? (
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-white py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                      {user?.username}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  {editing ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-white py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                      {user?.full_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                {editing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-white py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    {user?.email || 'غير محدد'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اللغة</Label>
                  {editing ? (
                    <Select value={formData.locale} onValueChange={(value) => setFormData({ ...formData, locale: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="tr">Türkçe</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-white py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                      {formData.locale === 'ar' ? 'العربية' : formData.locale === 'en' ? 'English' : 'Türkçe'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>المظهر</Label>
                  {editing ? (
                    <Select value={formData.theme} onValueChange={(value) => setFormData({ ...formData, theme: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">فاتح</SelectItem>
                        <SelectItem value="dark">داكن</SelectItem>
                        <SelectItem value="system">النظام</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-white py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                      {formData.theme === 'light' ? 'فاتح' : formData.theme === 'dark' ? 'داكن' : 'النظام'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Store Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">معلومات المتجر</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div>
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">العنوان</Label>
              <p className="text-sm text-slate-900 dark:text-white mt-1">{store?.address || 'غير محدد'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">تاريخ الإنشاء</Label>
              <p className="text-sm text-slate-900 dark:text-white mt-1">
                {store?.created_at ? new Date(store.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Security Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">ملاحظة أمنية</h3>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            إذا كنت تريد تغيير كلمة المرور أو تعديل الصلاحيات، يرجى التواصل مع مالك المتجر أو الدعم الفني.
            جميع التغييرات الحساسة تتطلب موافقة إدارية.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
