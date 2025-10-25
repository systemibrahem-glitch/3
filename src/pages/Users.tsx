import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { USER_ROLES, PERMISSIONS } from '@/const';
import { Plus, Search, Edit, Trash2, Users as UsersIcon, Shield, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Users() {
  const { user: currentUser, store } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'employee' as 'owner' | 'manager' | 'accountant' | 'data_entry' | 'warehouse_keeper' | 'employee',
    permissions: {} as Record<string, boolean>,
    is_active: true,
    locale: 'ar',
    theme: 'light',
  });

  useEffect(() => {
    loadUsers();
  }, [store]);

  async function loadUsers() {
    if (!store) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('حدث خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!store || !currentUser) return;

    // Only owner can create/edit users
    if (currentUser.role !== 'owner') {
      toast.error('فقط مالك المتجر يمكنه إدارة المستخدمين');
      return;
    }

    try {
      // Note: Password hashing should be done server-side for security
      // For now, we'll send the password to be hashed on the server
      const userData = {
        ...formData,
        store_id: store.id,
        password: formData.password || '123456', // Server will hash this
        created_by: currentUser.id,
      };

      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update(userData)
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('تم تحديث المستخدم بنجاح');
      } else {
        const { error } = await supabase
          .from('users')
          .insert([userData]);

        if (error) throw error;
        toast.success('تم إضافة المستخدم بنجاح');
      }

      setDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('حدث خطأ في حفظ المستخدم');
    }
  }

  async function handleDelete(userId: string) {
    if (!currentUser) return;
    
    // Only owner can delete users
    if (currentUser.role !== 'owner') {
      toast.error('فقط مالك المتجر يمكنه حذف المستخدمين');
      return;
    }

    // Cannot delete self
    if (userId === currentUser.id) {
      toast.error('لا يمكنك حذف حسابك الخاص');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;
      toast.success('تم حذف المستخدم بنجاح');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('حدث خطأ في حذف المستخدم');
    }
  }

  function resetForm() {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      password: '',
      role: 'employee',
      permissions: {},
      is_active: true,
      locale: 'ar',
      theme: 'light',
    });
    setEditingUser(null);
  }

  function openEditDialog(user: User) {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      full_name: user.full_name,
      password: '',
      role: user.role,
      permissions: user.permissions || {},
      is_active: user.is_active,
      locale: user.locale,
      theme: user.theme,
    });
    setDialogOpen(true);
  }

  function handlePermissionChange(permission: string, checked: boolean) {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: checked,
      },
    });
  }

  function getRolePermissions(role: string): Record<string, boolean> {
    const rolePermissions: Record<string, Record<string, boolean>> = {
      owner: {
        view_dashboard: true,
        view_invoices: true,
        create_invoice: true,
        edit_invoice: true,
        delete_invoice: true,
        view_inventory: true,
        manage_inventory: true,
        view_employees: true,
        manage_employees: true,
        view_payroll: true,
        manage_payroll: true,
        view_reports: true,
        export_reports: true,
        manage_users: true,
        manage_permissions: true,
        manage_settings: true,
      },
      manager: {
        view_dashboard: true,
        view_invoices: true,
        create_invoice: true,
        edit_invoice: true,
        delete_invoice: false,
        view_inventory: true,
        manage_inventory: true,
        view_employees: true,
        manage_employees: true,
        view_payroll: true,
        manage_payroll: true,
        view_reports: true,
        export_reports: true,
        manage_users: false,
        manage_permissions: false,
        manage_settings: false,
      },
      accountant: {
        view_dashboard: true,
        view_invoices: true,
        create_invoice: true,
        edit_invoice: true,
        delete_invoice: false,
        view_inventory: true,
        manage_inventory: false,
        view_employees: true,
        manage_employees: false,
        view_payroll: true,
        manage_payroll: true,
        view_reports: true,
        export_reports: true,
        manage_users: false,
        manage_permissions: false,
        manage_settings: false,
      },
      data_entry: {
        view_dashboard: true,
        view_invoices: true,
        create_invoice: true,
        edit_invoice: false,
        delete_invoice: false,
        view_inventory: true,
        manage_inventory: false,
        view_employees: false,
        manage_employees: false,
        view_payroll: false,
        manage_payroll: false,
        view_reports: false,
        export_reports: false,
        manage_users: false,
        manage_permissions: false,
        manage_settings: false,
      },
      warehouse_keeper: {
        view_dashboard: true,
        view_invoices: false,
        create_invoice: false,
        edit_invoice: false,
        delete_invoice: false,
        view_inventory: true,
        manage_inventory: true,
        view_employees: false,
        manage_employees: false,
        view_payroll: false,
        manage_payroll: false,
        view_reports: false,
        export_reports: false,
        manage_users: false,
        manage_permissions: false,
        manage_settings: false,
      },
      employee: {
        view_dashboard: true,
        view_invoices: false,
        create_invoice: false,
        edit_invoice: false,
        delete_invoice: false,
        view_inventory: false,
        manage_inventory: false,
        view_employees: false,
        manage_employees: false,
        view_payroll: false,
        manage_payroll: false,
        view_reports: false,
        export_reports: false,
        manage_users: false,
        manage_permissions: false,
        manage_settings: false,
      },
    };

    return rolePermissions[role] || {};
  }

  function applyRolePermissions(role: string) {
    const permissions = getRolePermissions(role);
    setFormData({
      ...formData,
      role: role as any,
      permissions,
    });
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    owners: users.filter(u => u.role === 'owner').length,
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">المستخدمين</h1>
          <p className="text-slate-600 dark:text-slate-400">إدارة مستخدمي النظام والصلاحيات</p>
        </div>
        {currentUser?.role === 'owner' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="ml-2 h-5 w-5" />
                إضافة مستخدم
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المستخدم *</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الاسم الكامل *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{editingUser ? 'كلمة مرور جديدة (اترك فارغ للاحتفاظ بالحالية)' : 'كلمة المرور *'}</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>الدور *</Label>
                    <Select value={formData.role} onValueChange={applyRolePermissions}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(USER_ROLES).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>اللغة</Label>
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
                  </div>
                  <div className="space-y-2">
                    <Label>المظهر</Label>
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
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                    />
                    <Label htmlFor="is_active">حساب نشط</Label>
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">الصلاحيات</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(PERMISSIONS).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={formData.permissions[key] || false}
                          onCheckedChange={(checked) => handlePermissionChange(key, checked as boolean)}
                        />
                        <Label htmlFor={key} className="text-sm">{value}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'تحديث' : 'إضافة'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <UsersIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">مستخدمين نشطين</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <UsersIcon className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">غير نشطين</p>
              <p className="text-2xl font-bold text-slate-600">{stats.inactive}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">مالكين</p>
              <p className="text-2xl font-bold text-purple-600">{stats.owners}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users List */}
      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="بحث في المستخدمين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأدوار</SelectItem>
              {Object.entries(USER_ROLES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {user.full_name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{user.full_name}</h3>
                    <div className="flex gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
                      <span>@{user.username}</span>
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">{USER_ROLES[user.role as keyof typeof USER_ROLES]}</span>
                      {user.email && <span>{user.email}</span>}
                    </div>
                  </div>
                  <div className="text-left">
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {user.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      آخر دخول: {user.last_login ? new Date(user.last_login).toLocaleDateString('ar-SA') : 'لم يسجل دخول'}
                    </p>
                  </div>
                </div>
              </div>
              {currentUser?.role === 'owner' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEditDialog(user)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  {user.id !== currentUser.id && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              لا يوجد مستخدمين
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
