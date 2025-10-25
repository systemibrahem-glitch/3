import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { formatCurrency, CURRENCIES, APP_LOGO } from '@/const';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardStats {
  totalInvoicesIn: { [key: string]: number };
  totalInvoicesOut: { [key: string]: number };
  lowStockItems: number;
  totalEmployees: number;
  recentInvoicesIn: any[];
  recentInvoicesOut: any[];
  monthlyData: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const { store } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoicesIn: {},
    totalInvoicesOut: {},
    lowStockItems: 0,
    totalEmployees: 0,
    recentInvoicesIn: [],
    recentInvoicesOut: [],
    monthlyData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [store]);

  async function loadDashboardData() {
    if (!store) return;

    try {
      // Get invoices in totals by currency
      const { data: invoicesIn } = await supabase
        .from('invoices_in')
        .select('amount, currency')
        .eq('store_id', store.id)
        .eq('is_deleted', false);

      const totalInvoicesIn: { [key: string]: number } = {};
      invoicesIn?.forEach((inv) => {
        totalInvoicesIn[inv.currency] = (totalInvoicesIn[inv.currency] || 0) + Number(inv.amount);
      });

      // Get invoices out totals by currency
      const { data: invoicesOut } = await supabase
        .from('invoices_out')
        .select('amount, currency')
        .eq('store_id', store.id)
        .eq('is_deleted', false);

      const totalInvoicesOut: { [key: string]: number } = {};
      invoicesOut?.forEach((inv) => {
        totalInvoicesOut[inv.currency] = (totalInvoicesOut[inv.currency] || 0) + Number(inv.amount);
      });

      // Get low stock items
      const { data: lowStock } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('store_id', store.id)
        .filter('current_stock', 'lte', 'min_stock')
        .eq('is_active', true);

      // Get total employees
      const { data: employees } = await supabase
        .from('employees')
        .select('id')
        .eq('store_id', store.id)
        .eq('status', 'active');

      // Get recent invoices
      const { data: recentIn } = await supabase
        .from('invoices_in')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .limit(5);

      const { data: recentOut } = await supabase
        .from('invoices_out')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .limit(5);

      setStats({
        totalInvoicesIn,
        totalInvoicesOut,
        lowStockItems: lowStock?.length || 0,
        totalEmployees: employees?.length || 0,
        recentInvoicesIn: recentIn || [],
        recentInvoicesOut: recentOut || [],
        monthlyData: [],
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'إجمالي الواردات',
      values: stats.totalInvoicesIn,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'إجمالي الصادرات',
      values: stats.totalInvoicesOut,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'منتجات منخفضة المخزون',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      title: 'إجمالي الموظفين',
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <img src={APP_LOGO} alt="نظام إبراهيم للمحاسبة" className="w-16 h-16 object-contain" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            لوحة التحكم
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            نظرة عامة على أداء متجرك
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      {stat.title}
                    </p>
                    {stat.values ? (
                      <div className="space-y-1">
                        {Object.entries(stat.values).map(([currency, amount]) => {
                          const curr = CURRENCIES.find(c => c.code === currency);
                          return (
                            <p key={currency} className="text-xl font-bold text-slate-900 dark:text-white">
                              {formatCurrency(amount, currency)}
                            </p>
                          );
                        })}
                        {Object.keys(stat.values).length === 0 && (
                          <p className="text-xl font-bold text-slate-900 dark:text-white">
                            0
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stat.value}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Invoices In */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                آخر الواردات
              </h2>
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-3">
              {stats.recentInvoicesIn.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  لا توجد واردات حديثة
                </p>
              ) : (
                stats.recentInvoicesIn.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {invoice.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(invoice.date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Recent Invoices Out */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                آخر الصادرات
              </h2>
              <ArrowDownRight className="w-5 h-5 text-red-600" />
            </div>
            <div className="space-y-3">
              {stats.recentInvoicesOut.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  لا توجد صادرات حديثة
                </p>
              ) : (
                stats.recentInvoicesOut.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {invoice.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(invoice.date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-red-600">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

