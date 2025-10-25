import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, CURRENCIES } from '@/const';
import { Download, FileText, BarChart3, TrendingUp, TrendingDown, Users, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportData {
  invoicesIn: any[];
  invoicesOut: any[];
  employees: any[];
  inventoryItems: any[];
  payrolls: any[];
}

export default function Reports() {
  const { user, store } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
    invoicesIn: [],
    invoicesOut: [],
    employees: [],
    inventoryItems: [],
    payrolls: [],
  });

  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    currency: 'all',
    reportType: 'daily',
  });

  useEffect(() => {
    loadReportData();
  }, [store, filters]);

  async function loadReportData() {
    if (!store) return;

    setLoading(true);
    try {
      const [invoicesInRes, invoicesOutRes, employeesRes, inventoryRes, payrollsRes] = await Promise.all([
        supabase
          .from('invoices_in')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_deleted', false)
          .gte('date', filters.dateFrom)
          .lte('date', filters.dateTo),
        supabase
          .from('invoices_out')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_deleted', false)
          .gte('date', filters.dateFrom)
          .lte('date', filters.dateTo),
        supabase
          .from('employees')
          .select('*')
          .eq('store_id', store.id),
        supabase
          .from('inventory_items')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_active', true),
        supabase
          .from('payroll')
          .select('*')
          .eq('store_id', store.id)
          .gte('created_at', filters.dateFrom)
          .lte('created_at', filters.dateTo),
      ]);

      setReportData({
        invoicesIn: invoicesInRes.data || [],
        invoicesOut: invoicesOutRes.data || [],
        employees: employeesRes.data || [],
        inventoryItems: inventoryRes.data || [],
        payrolls: payrollsRes.data || [],
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('حدث خطأ في تحميل بيانات التقرير');
    } finally {
      setLoading(false);
    }
  }

  function calculateTotals() {
    const invoicesInTotal = reportData.invoicesIn.reduce((acc, inv) => {
      acc[inv.currency] = (acc[inv.currency] || 0) + Number(inv.amount);
      return acc;
    }, {} as Record<string, number>);

    const invoicesOutTotal = reportData.invoicesOut.reduce((acc, inv) => {
      acc[inv.currency] = (acc[inv.currency] || 0) + Number(inv.amount);
      return acc;
    }, {} as Record<string, number>);

    const payrollTotal = reportData.payrolls.reduce((acc, payroll) => {
      acc[payroll.currency] = (acc[payroll.currency] || 0) + Number(payroll.net_salary);
      return acc;
    }, {} as Record<string, number>);

    return { invoicesInTotal, invoicesOutTotal, payrollTotal };
  }

  function exportToPDF(reportType: string) {
    const doc = new jsPDF();
    const { invoicesInTotal, invoicesOutTotal, payrollTotal } = calculateTotals();

    // Header
    doc.setFontSize(20);
    doc.text('نظام إبراهيم للمحاسبة', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text(`تقرير ${getReportTitle(reportType)}`, 105, 35, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`من ${filters.dateFrom} إلى ${filters.dateTo}`, 105, 45, { align: 'center' });

    let yPosition = 60;

    if (reportType === 'daily' || reportType === 'financial') {
      // Invoices In
      doc.setFontSize(14);
      doc.text('الواردات', 20, yPosition);
      yPosition += 10;

      const invoicesInData = reportData.invoicesIn.map(inv => [
        inv.description,
        inv.date,
        formatCurrency(inv.amount, inv.currency),
        inv.category || '-'
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['البيان', 'التاريخ', 'المبلغ', 'التصنيف']],
        body: invoicesInData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // Invoices Out
      doc.setFontSize(14);
      doc.text('الصادرات', 20, yPosition);
      yPosition += 10;

      const invoicesOutData = reportData.invoicesOut.map(inv => [
        inv.description,
        inv.date,
        formatCurrency(inv.amount, inv.currency),
        inv.category || '-'
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['البيان', 'التاريخ', 'المبلغ', 'التصنيف']],
        body: invoicesOutData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [220, 53, 69] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // Summary
      doc.setFontSize(14);
      doc.text('ملخص مالي', 20, yPosition);
      yPosition += 10;

      const summaryData = [];
      Object.keys({ ...invoicesInTotal, ...invoicesOutTotal }).forEach(currency => {
        const inTotal = invoicesInTotal[currency] || 0;
        const outTotal = invoicesOutTotal[currency] || 0;
        const profit = outTotal - inTotal;
        summaryData.push([
          currency,
          formatCurrency(inTotal, currency),
          formatCurrency(outTotal, currency),
          formatCurrency(profit, currency)
        ]);
      });

      (doc as any).autoTable({
        startY: yPosition,
        head: [['العملة', 'إجمالي الواردات', 'إجمالي الصادرات', 'الربح/الخسارة']],
        body: summaryData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [40, 167, 69] }
      });
    }

    if (reportType === 'payroll') {
      // Payroll Report
      doc.setFontSize(14);
      doc.text('تقرير الرواتب', 20, yPosition);
      yPosition += 10;

      const payrollData = reportData.payrolls.map(payroll => {
        const employee = reportData.employees.find(e => e.id === payroll.employee_id);
        return [
          employee?.name || 'غير معروف',
          payroll.period_month + '/' + payroll.period_year,
          formatCurrency(payroll.gross_salary, payroll.currency),
          formatCurrency(payroll.net_salary, payroll.currency),
          payroll.status === 'approved' ? 'معتمد' : payroll.status === 'paid' ? 'مدفوع' : 'مسودة'
        ];
      });

      (doc as any).autoTable({
        startY: yPosition,
        head: [['اسم الموظف', 'الفترة', 'الراتب الأساسي', 'الراتب الصافي', 'الحالة']],
        body: payrollData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [255, 193, 7] }
      });
    }

    if (reportType === 'inventory') {
      // Inventory Report
      doc.setFontSize(14);
      doc.text('تقرير المخزون', 20, yPosition);
      yPosition += 10;

      const inventoryData = reportData.inventoryItems.map(item => [
        item.name,
        item.sku || '-',
        item.current_stock.toString(),
        item.min_stock.toString(),
        item.current_stock <= item.min_stock ? 'منخفض' : 'متوفر',
        item.price ? formatCurrency(item.price, item.currency || 'USD') : '-'
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['اسم المنتج', 'الكود', 'الكمية الحالية', 'الحد الأدنى', 'الحالة', 'السعر']],
        body: inventoryData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [108, 117, 125] }
      });
    }

    doc.save(`تقرير_${getReportTitle(reportType)}_${filters.dateFrom}_${filters.dateTo}.pdf`);
    toast.success('تم تصدير التقرير بنجاح');
  }

  function exportToExcel(reportType: string) {
    const { invoicesInTotal, invoicesOutTotal, payrollTotal } = calculateTotals();
    const workbook = XLSX.utils.book_new();

    if (reportType === 'daily' || reportType === 'financial') {
      // Invoices In Sheet
      const invoicesInData = reportData.invoicesIn.map(inv => ({
        'البيان': inv.description,
        'التاريخ': inv.date,
        'المبلغ': inv.amount,
        'العملة': inv.currency,
        'التصنيف': inv.category || '-'
      }));
      const invoicesInSheet = XLSX.utils.json_to_sheet(invoicesInData);
      XLSX.utils.book_append_sheet(workbook, invoicesInSheet, 'الواردات');

      // Invoices Out Sheet
      const invoicesOutData = reportData.invoicesOut.map(inv => ({
        'البيان': inv.description,
        'التاريخ': inv.date,
        'المبلغ': inv.amount,
        'العملة': inv.currency,
        'التصنيف': inv.category || '-'
      }));
      const invoicesOutSheet = XLSX.utils.json_to_sheet(invoicesOutData);
      XLSX.utils.book_append_sheet(workbook, invoicesOutSheet, 'الصادرات');

      // Summary Sheet
      const summaryData = Object.keys({ ...invoicesInTotal, ...invoicesOutTotal }).map(currency => ({
        'العملة': currency,
        'إجمالي الواردات': invoicesInTotal[currency] || 0,
        'إجمالي الصادرات': invoicesOutTotal[currency] || 0,
        'الربح/الخسارة': (invoicesOutTotal[currency] || 0) - (invoicesInTotal[currency] || 0)
      }));
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'الملخص المالي');
    }

    if (reportType === 'payroll') {
      const payrollData = reportData.payrolls.map(payroll => {
        const employee = reportData.employees.find(e => e.id === payroll.employee_id);
        return {
          'اسم الموظف': employee?.name || 'غير معروف',
          'الفترة': `${payroll.period_month}/${payroll.period_year}`,
          'الراتب الأساسي': payroll.gross_salary,
          'السلف': payroll.total_advances,
          'الخصومات': payroll.total_deductions,
          'المكافآت': payroll.total_bonuses,
          'الراتب الصافي': payroll.net_salary,
          'العملة': payroll.currency,
          'الحالة': payroll.status === 'approved' ? 'معتمد' : payroll.status === 'paid' ? 'مدفوع' : 'مسودة'
        };
      });
      const payrollSheet = XLSX.utils.json_to_sheet(payrollData);
      XLSX.utils.book_append_sheet(workbook, payrollSheet, 'الرواتب');
    }

    if (reportType === 'inventory') {
      const inventoryData = reportData.inventoryItems.map(item => ({
        'اسم المنتج': item.name,
        'الكود': item.sku || '-',
        'الوصف': item.description || '-',
        'الوحدة': item.unit,
        'الكمية الحالية': item.current_stock,
        'الحد الأدنى': item.min_stock,
        'السعر': item.price || 0,
        'العملة': item.currency || 'USD',
        'التصنيف': item.category || '-',
        'الحالة': item.current_stock <= item.min_stock ? 'منخفض' : 'متوفر'
      }));
      const inventorySheet = XLSX.utils.json_to_sheet(inventoryData);
      XLSX.utils.book_append_sheet(workbook, inventorySheet, 'المخزون');
    }

    XLSX.writeFile(workbook, `تقرير_${getReportTitle(reportType)}_${filters.dateFrom}_${filters.dateTo}.xlsx`);
    toast.success('تم تصدير التقرير بنجاح');
  }

  function getReportTitle(reportType: string): string {
    const titles = {
      daily: 'الحركة اليومية',
      financial: 'المالي',
      payroll: 'الرواتب',
      inventory: 'المخزون'
    };
    return titles[reportType as keyof typeof titles] || 'عام';
  }

  const { invoicesInTotal, invoicesOutTotal, payrollTotal } = calculateTotals();

  const reportCards = [
    {
      title: 'تقرير الحركة اليومية',
      description: 'تقرير شامل للواردات والصادرات',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      reportType: 'daily'
    },
    {
      title: 'تقرير مالي',
      description: 'تحليل الأرباح والخسائر',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      reportType: 'financial'
    },
    {
      title: 'تقرير الرواتب',
      description: 'كشوف رواتب الموظفين',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      reportType: 'payroll'
    },
    {
      title: 'تقرير المخزون',
      description: 'حالة المخزون والمنتجات',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      reportType: 'inventory'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">التقارير</h1>
        <p className="text-slate-600 dark:text-slate-400">تقارير مالية وإحصائيات مفصلة</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">فلترة البيانات</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>من تاريخ</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>إلى تاريخ</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>العملة</Label>
            <Select value={filters.currency} onValueChange={(value) => setFilters({ ...filters, currency: value })}>
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label>نوع التقرير</Label>
            <Select value={filters.reportType} onValueChange={(value) => setFilters({ ...filters, reportType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">الحركة اليومية</SelectItem>
                <SelectItem value="financial">المالي</SelectItem>
                <SelectItem value="payroll">الرواتب</SelectItem>
                <SelectItem value="inventory">المخزون</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي الواردات</p>
              <div className="space-y-1">
                {Object.entries(invoicesInTotal).map(([currency, amount]) => (
                  <p key={currency} className="text-lg font-bold text-green-600">
                    {formatCurrency(amount, currency)}
                  </p>
                ))}
                {Object.keys(invoicesInTotal).length === 0 && (
                  <p className="text-lg font-bold text-slate-900 dark:text-white">0</p>
                )}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي الصادرات</p>
              <div className="space-y-1">
                {Object.entries(invoicesOutTotal).map(([currency, amount]) => (
                  <p key={currency} className="text-lg font-bold text-red-600">
                    {formatCurrency(amount, currency)}
                  </p>
                ))}
                {Object.keys(invoicesOutTotal).length === 0 && (
                  <p className="text-lg font-bold text-slate-900 dark:text-white">0</p>
                )}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي الرواتب</p>
              <div className="space-y-1">
                {Object.entries(payrollTotal).map(([currency, amount]) => (
                  <p key={currency} className="text-lg font-bold text-purple-600">
                    {formatCurrency(amount, currency)}
                  </p>
                ))}
                {Object.keys(payrollTotal).length === 0 && (
                  <p className="text-lg font-bold text-slate-900 dark:text-white">0</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{card.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{card.description}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => exportToPDF(card.reportType)}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 ml-2" />
                    PDF
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => exportToExcel(card.reportType)}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 ml-2" />
                    Excel
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">عدد فواتير الوارد</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{reportData.invoicesIn.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">عدد فواتير الصادر</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{reportData.invoicesOut.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">عدد الموظفين</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{reportData.employees.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">عدد المنتجات</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{reportData.inventoryItems.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
