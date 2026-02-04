import { useEffect, useState } from "react";
import { 
  Wallet, TrendingUp, TrendingDown, ArrowLeftRight, 
  PieChart as PieChartIcon, Search, Filter,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, ReferenceLine, PieChart, Pie, Cell 
} from 'recharts';
import { motion } from 'framer-motion';
import { format } from "date-fns";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { sql } from "@/lib/neon";
import { DateRangeSelector, DateRange, getDefaultDateRange } from "@/components/ui/date-range-selector";

// --- CORES ---
const PIE_COLORS = [
  "hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(25, 95%, 53%)", 
  "hsl(262, 83%, 58%)", "hsl(199, 89%, 48%)", "hsl(0, 84%, 60%)"
];

export default function FinancesPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange(30));
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({ income: 0, expenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [barData, setBarData] = useState<any[]>([]);

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  useEffect(() => {
    async function fetchData() {
        if (!user) return;
        setLoading(true);
        try {
            const startDate = format(dateRange.from, "yyyy-MM-dd");
            const endDate = format(dateRange.to, "yyyy-MM-dd");

            const res = await sql`
                SELECT * FROM finances 
                WHERE user_id = ${user.id} 
                AND transaction_date >= ${startDate} 
                AND transaction_date <= ${endDate}
                ORDER BY transaction_date DESC
            `;

            // Totais
            const inc = res.filter((t:any) => t.type === 'income').reduce((acc:number, t:any) => acc + Number(t.amount), 0);
            const exp = res.filter((t:any) => t.type === 'expense').reduce((acc:number, t:any) => acc + Number(t.amount), 0);
            
            // Pizza (Categorias)
            const catMap = new Map();
            res.filter((t:any) => t.type === 'expense').forEach((t:any) => {
                catMap.set(t.category, (catMap.get(t.category) || 0) + Number(t.amount));
            });
            const pieChart = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

            // Barras (Fluxo Diário)
            const dayMap = new Map();
            res.forEach((t:any) => {
                const day = format(new Date(t.transaction_date), 'dd/MM');
                if (!dayMap.has(day)) dayMap.set(day, { dateLabel: day, income: 0, expense: 0 });
                const entry = dayMap.get(day);
                if (t.type === 'income') entry.income += Number(t.amount);
                else entry.expense += Number(t.amount);
            });
            const barChart = Array.from(dayMap.values()).reverse(); // Reverter para ordem cronológica se o SQL vier DESC

            setMetrics({ income: inc, expenses: exp, balance: inc - exp });
            setTransactions(res);
            setPieData(pieChart);
            setBarData(barChart);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [user, dateRange]);

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans text-slate-900">
        
        {/* --- HEADER --- */}
        <motion.div 
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-[#040949]">Finanças</h1>
            <p className="text-slate-500 mt-1">Gerencie seu fluxo</p>
          </div>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </motion.div>

        {/* --- METRICS ROW --- */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {/* Saldo Atual */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between h-32 hover:border-blue-300 transition-colors"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Saldo atual</span>
              <Wallet className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-bold ${metrics.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.balance)}
              </span>
            </div>
          </motion.div>

          {/* Total Entradas */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between h-32 hover:border-green-300 transition-colors"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total de entradas</span>
              <TrendingUp className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-green-600">{formatCurrency(metrics.income)}</span>
            </div>
          </motion.div>

          {/* Total Saídas */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between h-32 hover:border-blue-300 transition-colors"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total de saídas</span>
              <TrendingDown className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.expenses)}</span>
            </div>
          </motion.div>
        </div>

        {/* --- CHARTS ROW --- */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Transaction Flow Chart */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ArrowLeftRight className="h-5 w-5 text-blue-600" />
              Fluxo de Transação
            </h3>
            <div className="h-[300px] w-full"> 
               <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
                  <XAxis dataKey="dateLabel" className="text-xs" tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px", color: "#64748b" }} />
                  <ReferenceLine y={0} stroke="#e2e8f0" />
                  <Bar dataKey="income" name="Receitas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expense" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Category Pie Chart */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              Gastos por categoria
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={85}
                    paddingAngle={2} dataKey="value" stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Legend 
                    verticalAlign="bottom" height={36} iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px", color: "#64748b" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* --- TRANSACTIONS CARD --- */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-semibold text-lg text-slate-900">Histórico de Transações</h3>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar..." 
                    className="pl-8 h-10 w-full sm:w-[200px] border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-0">
            <div className="divide-y divide-slate-100">
              {transactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-default">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`p-2 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {t.type === 'income' ? <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </div>
                    
                    <div className="min-w-0"> 
                      <p className="font-medium truncate max-w-[150px] sm:max-w-xs text-slate-900">{t.description || "Sem descrição"}</p>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {t.category} • {format(new Date(t.transaction_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`font-bold text-sm sm:text-base whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/50">
              <button className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Ver todas as transações <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}