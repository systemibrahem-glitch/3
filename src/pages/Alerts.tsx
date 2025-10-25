import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Alert } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, AlertTriangle, CheckCircle, XCircle, Plus, Search, Edit, Trash2, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Alerts() {
  const { user, store } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  const [formData, setFormData] = useState({
    type: 'low_stock' as 'low_stock' | 'overdue_invoice' | 'budget_exceeded' | 'payroll_approved' | 'subscription_expiring' | 'custom',
    title: '',
    message: '',
    is_active: true,
    priority: 'medium' as 'low' | 'medium' | 'high',
    conditions: '',
    notification_methods: {
      email: false,
      whatsapp: false,
      in_app: true,
    },
  });

  const [settings, setSettings] = useState({
    low_stock_threshold: 5,
    overdue_invoice_days: 30,
    budget_warning_percentage: 80,
    subscription_warning_days: 7,
    auto_generate_alerts: true,
  });

  useEffect(() => {
    loadData();
    loadSettings();
  }, [store]);

  async function loadData() {
    if (!store) return;

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('حدث خطأ في تحميل التنبيهات');
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    if (!store) return;

    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', store.id)
        .eq('key', 'alert_settings')
        .single();

      if (data?.value) {
        setSettings({ ...settings, ...data.value });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!store || !user) return;

    try {
      const alertData = {
        ...formData,
        store_id: store.id,
        created_by: user.id,
        conditions: formData.conditions || null,
      };

      if (editingAlert) {
        const { error } = await supabase
          .from('alerts')
          .update(alertData)
          .eq('id', editingAlert.id);

        if (error) throw error;
        toast.success('تم تحديث التنبيه بنجاح');
      } else {
        const { error } = await supabase
          .from('alerts')
          .insert([alertData]);

        if (error) throw error;
        toast.success('تم إضافة التنبيه بنجاح');
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving alert:', error);
      toast.error('حدث خطأ في حفظ التنبيه');
    }
  }

  async function handleSettingsSave() {
    if (!store) return;

    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          store_id: store.id,
          key: 'alert_settings',
          value: settings,
        });

      if (error) throw error;
      toast.success('تم حفظ الإعدادات بنجاح');
      setSettingsDialogOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ في حفظ الإعدادات');
    }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    if (user.role !== 'owner') {
      toast.error('فقط مالك المتجر يمكنه حذف التنبيهات');
      return;
    }
    if (!confirm('هل أنت متأكد من حذف هذا التنبيه؟')) return;

    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف التنبيه بنجاح');
      loadData();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('حدث خطأ في حذف التنبيه');
    }
  }

  async function toggleAlertStatus(id: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(isActive ? 'تم تفعيل التنبيه' : 'تم إلغاء التنبيه');
      loadData();
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast.error('حدث خطأ في تغيير حالة التنبيه');
    }
  }

  function resetForm() {
    setFormData({
      type: 'low_stock',
      title: '',
      message: '',
      is_active: true,
      priority: 'medium',
      conditions: '',
      notification_methods: {
        email: false,
        whatsapp: false,
        in_app: true,
      },
    });
    setEditingAlert(null);
  }

  function openEditDialog(alert: Alert) {
    setEditingAlert(alert);
    setFormData({
      type: alert.type as any,
      title: alert.title,
      message: alert.message,
      is_active: alert.is_active,
      priority: alert.priority as any,
      conditions: alert.conditions || '',
      notification_methods: alert.notification_methods as any || {
        email: false,
        whatsapp: false,
        in_app: true,
      },
    });
    setDialogOpen(true);
  }

  function getAlertTypeLabel(type: string): string {
    const labels = {
      low_stock: 'مخزون منخفض',
      overdue_invoice: 'فاتورة متأخرة',
      budget_exceeded: 'تجاوز الميزانية',
      payroll_approved: 'راتب معتمد',
      subscription_expiring: 'انتهاء الاشتراك',
      custom: 'مخصص',
    };
    return labels[type as keyof typeof labels] || type;
  }

  function getPriorityColor(priority: string): string {
    const colors = {
      low: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      medium: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
      high: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  }

  function getPriorityLabel(priority: string): string {
    const labels = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
    };
    return labels[priority as keyof typeof labels] || priority;
  }

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active') return matchesSearch && alert.is_active;
    if (filterStatus === 'inactive') return matchesSearch && !alert.is_active;
    return matchesSearch;
  });

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.is_active).length,
    highPriority: alerts.filter(a => a.priority === 'high').length,
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">التنبيهات</h1>
          <p className="text-slate-600 dark:text-slate-400">إدارة التنبيهات والإشعارات الذكية</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="ml-2 h-5 w-5" />
                إعدادات التنبيهات
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="ml-2 h-5 w-5" />
                إضافة تنبيه
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إعدادات التنبيهات</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>حد المخزون المنخفض</Label>
                <Input
                  type="number"
                  value={settings.low_stock_threshold}
                  onChange={(e) => setSettings({ ...settings, low_stock_threshold: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>أيام تأخير الفاتورة</Label>
                <Input
                  type="number"
                  value={settings.overdue_invoice_days}
                  onChange={(e) => setSettings({ ...settings, overdue_invoice_days: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>نسبة تحذير الميزانية (%)</Label>
                <Input
                  type="number"
                  value={settings.budget_warning_percentage}
                  onChange={(e) => setSettings({ ...settings, budget_warning_percentage: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>أيام تحذير الاشتراك</Label>
                <Input
                  type="number"
                  value={settings.subscription_warning_days}
                  onChange={(e) => setSettings({ ...settings, subscription_warning_days: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-generate"
                checked={settings.auto_generate_alerts}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_generate_alerts: checked })}
              />
              <Label htmlFor="auto-generate">توليد التنبيهات تلقائياً</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSettingsSave}>
                حفظ الإعدادات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAlert ? 'تعديل تنبيه' : 'إضافة تنبيه جديد'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>نوع التنبيه *</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low_stock">مخزون منخفض</SelectItem>
                  <SelectItem value="overdue_invoice">فاتورة متأخرة</SelectItem>
                  <SelectItem value="budget_exceeded">تجاوز الميزانية</SelectItem>
                  <SelectItem value="payroll_approved">راتب معتمد</SelectItem>
                  <SelectItem value="subscription_expiring">انتهاء الاشتراك</SelectItem>
                  <SelectItem value="custom">مخصص</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>العنوان *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>الرسالة *</Label>
              <Input
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>الأولوية</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفض</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الشروط (اختياري)</Label>
              <Input
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                placeholder="مثال: current_stock < min_stock"
              />
            </div>

            <div className="space-y-4">
              <Label>طرق الإشعار</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email"
                    checked={formData.notification_methods.email}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notification_methods: { ...formData.notification_methods, email: checked }
                    })}
                  />
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="whatsapp"
                    checked={formData.notification_methods.whatsapp}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notification_methods: { ...formData.notification_methods, whatsapp: checked }
                    })}
                  />
                  <Label htmlFor="whatsapp">واتساب</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="in-app"
                    checked={formData.notification_methods.in_app}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notification_methods: { ...formData.notification_methods, in_app: checked }
                    })}
                  />
                  <Label htmlFor="in-app">داخل التطبيق</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is-active">التنبيه نشط</Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {editingAlert ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي التنبيهات</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">تنبيهات نشطة</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">أولوية عالية</p>
              <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="بحث في التنبيهات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التنبيهات</SelectItem>
              <SelectItem value="active">نشطة</SelectItem>
              <SelectItem value="inactive">غير نشطة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Bell className="w-6 h-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{alert.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{alert.message}</p>
                    <div className="flex gap-3 mt-2 text-sm text-slate-500 dark:text-slate-500">
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                        {getAlertTypeLabel(alert.type)}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${getPriorityColor(alert.priority)}`}>
                        {getPriorityLabel(alert.priority)}
                      </span>
                      {alert.conditions && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded">
                          {alert.conditions}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={(checked) => toggleAlertStatus(alert.id, checked)}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {alert.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(alert.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEditDialog(alert)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(alert.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
          {filteredAlerts.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              لا توجد تنبيهات
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
