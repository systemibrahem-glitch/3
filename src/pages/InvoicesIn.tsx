import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { InvoiceIn, Partner } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency, CURRENCIES } from '@/const';
import { Plus, Search, Trash2, Edit, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function InvoicesIn() {
  const { user, store } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceIn[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [editingInvoice, setEditingInvoice] = useState<InvoiceIn | null>(null);

  const [formData, setFormData] = useState({
    invoice_number: '',
    amount: '',
    currency: 'USD',
    description: '',
    date: new Date().toISOString().split('T')[0],
    vendor_id: '',
    category: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [store]);

  async function loadData() {
    if (!store) return;

    try {
      const [invoicesRes, partnersRes] = await Promise.all([
        supabase
          .from('invoices_in')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_deleted', false)
          .order('date', { ascending: false }),
        supabase
          .from('partners')
          .select('*')
          .eq('store_id', store.id)
          .in('type', ['vendor', 'both'])
          .eq('is_active', true),
      ]);

      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (partnersRes.data) setPartners(partnersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!store || !user) return;

    try {
      const invoiceData = {
        ...formData,
        store_id: store.id,
        amount: parseFloat(formData.amount),
        vendor_id: formData.vendor_id || null,
        created_by: user.id,
      };

      if (editingInvoice) {
        const { error } = await supabase
          .from('invoices_in')
          .update(invoiceData)
          .eq('id', editingInvoice.id);

        if (error) throw error;
        toast.success('تم تحديث الفاتورة بنجاح');
      } else {
        const { error } = await supabase
          .from('invoices_in')
          .insert([invoiceData]);

        if (error) throw error;
        toast.success('تم إضافة الفاتورة بنجاح');
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('حدث خطأ في حفظ الفاتورة');
    }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    
    // Only owner can delete
    if (user.role !== 'owner') {
      toast.error('فقط مالك المتجر يمكنه حذف الفواتير');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

    try {
      const { error } = await supabase
        .from('invoices_in')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString(),
          deleted_by: user.id 
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف الفاتورة بنجاح');
      loadData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('حدث خطأ في حذف الفاتورة');
    }
  }

  function resetForm() {
    setFormData({
      invoice_number: '',
      amount: '',
      currency: 'USD',
      description: '',
      date: new Date().toISOString().split('T')[0],
      vendor_id: '',
      category: '',
      notes: '',
    });
    setEditingInvoice(null);
  }

  function openEditDialog(invoice: InvoiceIn) {
    setEditingInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number || '',
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      description: invoice.description,
      date: invoice.date,
      vendor_id: invoice.vendor_id || '',
      category: invoice.category || '',
      notes: invoice.notes || '',
    });
    setDialogOpen(true);
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurrency = filterCurrency === 'all' || invoice.currency === filterCurrency;
    return matchesSearch && matchesCurrency;
  });

  const totalByCurrency = filteredInvoices.reduce((acc, invoice) => {
    acc[invoice.currency] = (acc[invoice.currency] || 0) + Number(invoice.amount);
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">الواردات</h1>
          <p className="text-slate-600 dark:text-slate-400">إدارة فواتير الواردات والمشتريات</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-5 w-5" />
              إضافة فاتورة وارد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingInvoice ? 'تعديل فاتورة' : 'إضافة فاتورة وارد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الفاتورة</Label>
                  <Input
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    placeholder="اختياري"
                  />
                </div>
                <div className="space-y-2">
                  <Label>التاريخ *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المبلغ *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>العملة *</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} - {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>البيان *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المورد</Label>
                  <Select value={formData.vendor_id} onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المورد" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
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
                  {editingInvoice ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="بحث في الفواتير..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع العملات</SelectItem>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} - {curr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4 flex gap-4 flex-wrap">
          {Object.entries(totalByCurrency).map(([currency, total]) => (
            <div key={currency} className="px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">الإجمالي: </span>
              <span className="font-bold text-green-600">{formatCurrency(total, currency)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {filteredInvoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{invoice.description}</h3>
                    <div className="flex gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {invoice.invoice_number && <span>#{invoice.invoice_number}</span>}
                      <span>{new Date(invoice.date).toLocaleDateString('ar-SA')}</span>
                      {invoice.category && <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">{invoice.category}</span>}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(invoice.amount, invoice.currency)}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEditDialog(invoice)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(invoice.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
          {filteredInvoices.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              لا توجد فواتير وارد
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

