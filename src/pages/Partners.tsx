import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Partner } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, Users, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Partners() {
  const { user, store } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'customer' as 'customer' | 'vendor' | 'both',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    notes: '',
  });

  useEffect(() => {
    loadPartners();
  }, [store]);

  async function loadPartners() {
    if (!store) return;

    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      if (data) setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('حدث خطأ في تحميل الشركاء');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!store || !user) return;

    try {
      const partnerData = {
        ...formData,
        store_id: store.id,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        tax_number: formData.tax_number || null,
        notes: formData.notes || null,
        created_by: user.id,
      };

      if (editingPartner) {
        const { error } = await supabase
          .from('partners')
          .update(partnerData)
          .eq('id', editingPartner.id);

        if (error) throw error;
        toast.success('تم تحديث الشريك بنجاح');
      } else {
        const { error } = await supabase
          .from('partners')
          .insert([partnerData]);

        if (error) throw error;
        toast.success('تم إضافة الشريك بنجاح');
      }

      setDialogOpen(false);
      resetForm();
      loadPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      toast.error('حدث خطأ في حفظ الشريك');
    }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    
    if (user.role !== 'owner') {
      toast.error('فقط مالك المتجر يمكنه حذف الشركاء');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا الشريك؟')) return;

    try {
      const { error } = await supabase
        .from('partners')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف الشريك بنجاح');
      loadPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('حدث خطأ في حذف الشريك');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      type: 'customer',
      phone: '',
      email: '',
      address: '',
      tax_number: '',
      notes: '',
    });
    setEditingPartner(null);
  }

  function openEditDialog(partner: Partner) {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      type: partner.type,
      phone: partner.phone || '',
      email: partner.email || '',
      address: partner.address || '',
      tax_number: partner.tax_number || '',
      notes: partner.notes || '',
    });
    setDialogOpen(true);
  }

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || partner.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: partners.length,
    customers: partners.filter(p => p.type === 'customer').length,
    vendors: partners.filter(p => p.type === 'vendor').length,
    both: partners.filter(p => p.type === 'both').length,
  };

  function getTypeLabel(type: string): string {
    const labels = {
      customer: 'عميل',
      vendor: 'مورد',
      both: 'عميل ومورد'
    };
    return labels[type as keyof typeof labels] || type;
  }

  function getTypeColor(type: string): string {
    const colors = {
      customer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      vendor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      both: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return colors[type as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">الشركاء</h1>
          <p className="text-slate-600 dark:text-slate-400">إدارة العملاء والموردين</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-5 w-5" />
              إضافة شريك
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPartner ? 'تعديل شريك' : 'إضافة شريك جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الشريك *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع الشريك *</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">عميل</SelectItem>
                      <SelectItem value="vendor">مورد</SelectItem>
                      <SelectItem value="both">عميل ومورد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>الرقم الضريبي</Label>
                <Input
                  value={formData.tax_number}
                  onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingPartner ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي الشركاء</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">عملاء</p>
              <p className="text-2xl font-bold text-blue-600">{stats.customers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">موردين</p>
              <p className="text-2xl font-bold text-green-600">{stats.vendors}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">عميل ومورد</p>
              <p className="text-2xl font-bold text-purple-600">{stats.both}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Partners List */}
      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="بحث في الشركاء..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="customer">عملاء</SelectItem>
              <SelectItem value="vendor">موردين</SelectItem>
              <SelectItem value="both">عميل ومورد</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filteredPartners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {partner.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{partner.name}</h3>
                    <div className="flex gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
                      <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(partner.type)}`}>
                        {getTypeLabel(partner.type)}
                      </span>
                      {partner.tax_number && <span>ضريبي: {partner.tax_number}</span>}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {partner.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{partner.phone}</span>
                        </div>
                      )}
                      {partner.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{partner.email}</span>
                        </div>
                      )}
                      {partner.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{partner.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    {partner.notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {partner.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEditDialog(partner)}>
                  <Edit className="w-4 h-4" />
                </Button>
                {user?.role === 'owner' && (
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(partner.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
          {filteredPartners.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              لا يوجد شركاء
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
