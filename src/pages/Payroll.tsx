import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Employee, EmployeeTransaction, Payroll } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency, CURRENCIES } from '@/const';
import { Plus, Search, Edit, Users, Calculator, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface PayrollSummary {
  employee: Employee;
  transactions: EmployeeTransaction[];
  grossSalary: number;
  totalAdvances: number;
  totalAbsences: number;
  totalDeductions: number;
  totalBonuses: number;
  totalOvertime: number;
  netSalary: number;
}

export default function Payroll() {
  const { user, store } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [transactionForm, setTransactionForm] = useState({
    employee_id: '',
    type: 'advance' as 'advance' | 'absence' | 'deduction' | 'bonus' | 'overtime',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [store, selectedPeriod]);

  async function loadData() {
    if (!store) return;

    try {
      const [employeesRes, payrollsRes] = await Promise.all([
        supabase
          .from('employees')
          .select('*')
          .eq('store_id', store.id)
          .eq('status', 'active')
          .order('name'),
        supabase
          .from('payroll')
          .select('*')
          .eq('store_id', store.id)
          .eq('period_month', selectedPeriod.month)
          .eq('period_year', selectedPeriod.year)
          .order('created_at', { ascending: false }),
      ]);

      if (employeesRes.data) setEmployees(employeesRes.data);
      if (payrollsRes.data) setPayrolls(payrollsRes.data);
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast.error('حدث خطأ في تحميل بيانات الرواتب');
    } finally {
      setLoading(false);
    }
  }

  async function calculatePayrollSummary(employee: Employee): Promise<PayrollSummary> {
    const { data: transactions } = await supabase
      .from('employee_transactions')
      .select('*')
      .eq('store_id', store!.id)
      .eq('employee_id', employee.id)
      .gte('date', `${selectedPeriod.year}-${selectedPeriod.month.toString().padStart(2, '0')}-01`)
      .lt('date', `${selectedPeriod.year}-${(selectedPeriod.month + 1).toString().padStart(2, '0')}-01`);

    const transactionsList = transactions || [];
    
    const grossSalary = employee.base_salary;
    const totalAdvances = transactionsList.filter(t => t.type === 'advance').reduce((sum, t) => sum + t.amount, 0);
    const totalAbsences = transactionsList.filter(t => t.type === 'absence').reduce((sum, t) => sum + t.amount, 0);
    const totalDeductions = transactionsList.filter(t => t.type === 'deduction').reduce((sum, t) => sum + t.amount, 0);
    const totalBonuses = transactionsList.filter(t => t.type === 'bonus').reduce((sum, t) => sum + t.amount, 0);
    const totalOvertime = transactionsList.filter(t => t.type === 'overtime').reduce((sum, t) => sum + t.amount, 0);
    
    const netSalary = grossSalary + totalBonuses + totalOvertime - totalAdvances - totalAbsences - totalDeductions;

    return {
      employee,
      transactions: transactionsList,
      grossSalary,
      totalAdvances,
      totalAbsences,
      totalDeductions,
      totalBonuses,
      totalOvertime,
      netSalary,
    };
  }

  async function generatePayroll(employee: Employee) {
    if (!store || !user) return;

    try {
      const summary = await calculatePayrollSummary(employee);
      
      const payrollData = {
        store_id: store.id,
        employee_id: employee.id,
        period_month: selectedPeriod.month,
        period_year: selectedPeriod.year,
        gross_salary: summary.grossSalary,
        total_advances: summary.totalAdvances,
        total_absences: summary.totalAbsences,
        total_deductions: summary.totalDeductions,
        total_bonuses: summary.totalBonuses,
        total_overtime: summary.totalOvertime,
        net_salary: summary.netSalary,
        currency: employee.currency,
        status: 'draft' as const,
        created_by: user.id,
      };

      const { error } = await supabase
        .from('payroll')
        .insert([payrollData]);

      if (error) throw error;
      toast.success('تم إنشاء كشف الراتب بنجاح');
      loadData();
    } catch (error) {
      console.error('Error generating payroll:', error);
      toast.error('حدث خطأ في إنشاء كشف الراتب');
    }
  }

  async function approvePayroll(payrollId: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('payroll')
        .update({ 
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', payrollId);

      if (error) throw error;
      toast.success('تم اعتماد كشف الراتب بنجاح');
      loadData();
    } catch (error) {
      console.error('Error approving payroll:', error);
      toast.error('حدث خطأ في اعتماد كشف الراتب');
    }
  }

  async function handleTransactionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!store || !user) return;

    try {
      const transactionData = {
        ...transactionForm,
        store_id: store.id,
        amount: parseFloat(transactionForm.amount),
        created_by: user.id,
      };

      const { error } = await supabase
        .from('employee_transactions')
        .insert([transactionData]);

      if (error) throw error;
      toast.success('تم إضافة المعاملة بنجاح');
      setTransactionDialogOpen(false);
      setTransactionForm({
        employee_id: '',
        type: 'advance',
        amount: '',
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('حدث خطأ في حفظ المعاملة');
    }
  }

  const filteredPayrolls = payrolls.filter((payroll) => {
    const employee = employees.find(e => e.id === payroll.employee_id);
    return employee?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: payrolls.length,
    draft: payrolls.filter(p => p.status === 'draft').length,
    approved: payrolls.filter(p => p.status === 'approved').length,
    paid: payrolls.filter(p => p.status === 'paid').length,
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">الرواتب</h1>
        <p className="text-slate-600 dark:text-slate-400">إدارة رواتب الموظفين</p>
      </div>
        <div className="flex gap-2">
          <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="ml-2 h-5 w-5" />
                إضافة معاملة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة معاملة جديدة</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الموظف *</Label>
                    <Select value={transactionForm.employee_id} onValueChange={(value) => setTransactionForm({ ...transactionForm, employee_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع المعاملة *</Label>
                    <Select value={transactionForm.type} onValueChange={(value: any) => setTransactionForm({ ...transactionForm, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advance">سلفة</SelectItem>
                        <SelectItem value="absence">غياب</SelectItem>
                        <SelectItem value="deduction">خصم</SelectItem>
                        <SelectItem value="bonus">مكافأة</SelectItem>
                        <SelectItem value="overtime">ساعات إضافية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المبلغ *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العملة *</Label>
                    <Select value={transactionForm.currency} onValueChange={(value) => setTransactionForm({ ...transactionForm, currency: value })}>
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
                  <Label>التاريخ *</Label>
                  <Input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Input
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Input
                    value={transactionForm.notes}
                    onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setTransactionDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    إضافة
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Period Selector */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <Label>الفترة:</Label>
          <Select value={selectedPeriod.month.toString()} onValueChange={(value) => setSelectedPeriod({ ...selectedPeriod, month: parseInt(value) })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod.year.toString()} onValueChange={(value) => setSelectedPeriod({ ...selectedPeriod, year: parseInt(value) })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي كشوف الرواتب</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">مسودة</p>
              <p className="text-2xl font-bold text-amber-600">{stats.draft}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">معتمد</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Calculator className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">مدفوع</p>
              <p className="text-2xl font-bold text-purple-600">{stats.paid}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payroll List */}
      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="بحث في كشوف الرواتب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredPayrolls.map((payroll, index) => {
            const employee = employees.find(e => e.id === payroll.employee_id);
            return (
              <motion.div
                key={payroll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {employee?.name.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{employee?.name || 'موظف غير معروف'}</h3>
                      <div className="flex gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
                        <span>فبراير {payroll.period_year}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          payroll.status === 'draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          payroll.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {payroll.status === 'draft' ? 'مسودة' : payroll.status === 'approved' ? 'معتمد' : 'مدفوع'}
                        </span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatCurrency(payroll.net_salary, payroll.currency)}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        الراتب الأساسي: {formatCurrency(payroll.gross_salary, payroll.currency)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {payroll.status === 'draft' && user?.role === 'owner' && (
                    <Button size="sm" onClick={() => approvePayroll(payroll.id)}>
                      اعتماد
                    </Button>
                  )}
                  <Button size="sm" variant="ghost">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
          {filteredPayrolls.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              لا توجد كشوف رواتب لهذه الفترة
            </div>
          )}
        </div>
      </Card>

      {/* Generate Payroll for Employees */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">إنشاء كشوف رواتب للموظفين</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => {
            const hasPayroll = payrolls.some(p => p.employee_id === employee.id);
            return (
              <div key={employee.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">{employee.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      الراتب الأساسي: {formatCurrency(employee.base_salary, employee.currency)}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => generatePayroll(employee)}
                    disabled={hasPayroll}
                  >
                    {hasPayroll ? 'تم الإنشاء' : 'إنشاء كشف'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

