import { useEffect, useState } from "react";
import { 
  Wallet, TrendingUp, TrendingDown, ArrowRight, Receipt, 
  Heart, Droplets, Moon, GraduationCap, Calendar, CheckCircle2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';
import { motion } from 'framer-motion';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangeSelector, DateRange, getDefaultDateRange } from "@/components/ui/date-range-selector";

// --- CORES PADRONIZADAS ---
const PIE_COLORS = [
  "hsl(217, 91%, 60%)", // Finance Blue
  "hsl(142, 71%, 45%)", // Health Green
  "hsl(25, 95%, 53%)",  // Training Orange
  "hsl(262, 83%, 58%)", // Schedule Purple
  "hsl(199, 89%, 48%)", // Academic Cyan
  "hsl(0, 84%, 60%)",   // Red
];

export default function Dashboard() {
  const { user } = useAuth();
  
  // Estado do Seletor de Data (Padrão: Últimos 30 dias)
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange(30));

  // Estado para dados reais
  const [metrics, setMetrics] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    waterToday: 0,
    sleepLast: 0,
    academicCount: 0, 
    eventsNext: 0,
    eventsSynced: 0
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [academicDistribution, setAcademicDistribution] = useState<any[]>([]);

  // Metas (Hardcoded por enquanto)
  const waterGoal = 2500;
  const sleepGoal = 8;

  useEffect(() => {
    async function fetchOverview() {
      if (!user) return;
      try {
        // Formatar datas
        const startDate = format(dateRange.from || new Date(), "yyyy-MM-dd");
        const endDate = format(dateRange.to || new Date(), "yyyy-MM-dd");
        
        const token = window.localStorage.getItem("auth_token_temp") || "";
        const res = await fetch(`/api/dashboard?start=${startDate}&end=${endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Falha ao buscar dashboard");
        const data = await res.json();

        const financeRes = data.finances || [];
        const income = financeRes.filter((f:any) => f.type === 'income').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0);
        const expenses = financeRes.filter((f:any) => f.type === 'expense').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0);
        
        // Agrupar despesas para o gráfico
        const catMap = new Map();
        financeRes.filter((f:any) => f.type === 'expense').forEach((f:any) => {
            const current = catMap.get(f.category) || 0;
            catMap.set(f.category, current + Number(f.amount));
        });
        const categoriesChart = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

        const academicRes = data.academicGrouped || [];
        const academicChartData = academicRes.map((item: any, index: number) => ({
          name: item.tags || 'Geral',
          value: Number(item.count),
          fill: PIE_COLORS[index % PIE_COLORS.length]
        }));
        const totalAcademic = academicChartData.reduce((acc: number, curr: any) => acc + curr.value, 0);

        setMetrics({
          balance: income - expenses,
          income,
          expenses,
          waterToday: data.health.waterToday || 0,
          sleepLast: data.health.sleepLast || 0,
          academicCount: totalAcademic,
          eventsNext: data.schedule.upcoming.length,
          eventsSynced: data.schedule.syncedCount
        });

        setTransactions(financeRes.slice(0, 5));
        setExpenseCategories(categoriesChart);
        setAcademicDistribution(academicChartData);

      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      }
    }
    fetchOverview();
  }, [user, dateRange]); // Recarrega sempre que o dateRange mudar

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const waterPct = Math.min((metrics.waterToday / waterGoal) * 100, 100);
  const sleepPct = Math.min((metrics.sleepLast / sleepGoal) * 100, 100);

  // Fallback para gráfico vazio
  const chartDataSafe = academicDistribution.length > 0 
    ? academicDistribution 
    : [{ name: 'Vazio', value: 1, fill: '#e2e8f0' }];

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
            <h1 className="text-3xl font-bold text-[#040949]">Bom dia, Usuário! 👋</h1>
            <p className="text-slate-500 capitalize mt-1">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          
          {/* SELETOR DE DATA RESTAURADO */}
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </motion.div>

        {/* --- SEÇÃO 1: FINANÇAS --- */}
        <section className="grid gap-6 lg:grid-cols-3">
          
          {/* CARD 1: Resumo Financeiro */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Resumo Financeiro</h3>
                  <p className="text-sm text-slate-500">Visão do período</p>
                </div>
              </div>
              <div className="rounded-full bg-slate-100 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-100">
              <p className="text-sm text-slate-500 mb-1">Saldo atual (no período)</p>
              <p className={`text-3xl font-bold ${metrics.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.balance)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-slate-500">Receitas</span>
                </div>
                <p className="text-lg font-bold text-green-600 truncate">{formatCurrency(metrics.income)}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-slate-500">Despesas</span>
                </div>
                <p className="text-lg font-bold text-red-600 truncate">{formatCurrency(metrics.expenses)}</p>
              </div>
            </div>
          </motion.div>

          {/* CARD 2: Gráfico de Despesas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Despesas por Categoria</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={70}
                      paddingAngle={2} dataKey="value"
                    >
                      {expenseCategories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
                {expenseCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-4">Sem dados no período</p>
                ) : (
                  expenseCategories.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <span className="text-slate-500 truncate max-w-[80px]">{item.name}</span>
                      </div>
                      <span className="font-medium text-xs">{formatCurrency(item.value)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">Total de despesas</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(metrics.expenses)}</p>
            </div>
          </motion.div>

          {/* CARD 3: Últimas Transações */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Receipt className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">Transações Recentes</h3>
              </div>
            </div>

            <div className="space-y-3">
              {transactions.length === 0 ? <p className="text-sm text-slate-400">Nenhuma transação no período.</p> :
              transactions.map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-slate-900">{tx.description || tx.category}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(tx.transaction_date), "dd/MM")} • {tx.category}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ml-2 ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* --- SEÇÃO 2: OUTRAS ÁREAS --- */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* CARD 4: Saúde */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0026f7]/10">
                  <Heart className="h-5 w-5 text-[#0026f7]" />
                </div>
                <h3 className="font-semibold text-lg">Saúde</h3>
              </div>
            </div>

            {/* Água */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-slate-700">Água hoje</span>
                </div>
                <span className="text-sm text-slate-500">{metrics.waterToday}ml / {waterGoal}ml</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${waterPct}%` }} />
              </div>
            </div>

            {/* Sono */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-slate-700">Último sono</span>
                </div>
                <span className="text-sm text-slate-500">{metrics.sleepLast}h / {sleepGoal}h</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${sleepPct}%` }} />
              </div>
            </div>
          </motion.div>

          {/* CARD 5: Acadêmico */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300 group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">Acadêmico</h3>
                  <p className="text-xs text-slate-500">Documentos do Período</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center h-[180px]">
              {/* Lado Esquerdo: Gráfico */}
              <div className="h-full w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataSafe}
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={60}
                      paddingAngle={4} cornerRadius={4}
                      dataKey="value" stroke="none"
                    >
                      {chartDataSafe.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-2xl font-bold">{metrics.academicCount}</tspan>
                                <tspan x={viewBox.cx} y={(viewBox.cy as number) + 16} className="fill-slate-500 text-[10px] uppercase tracking-wide font-medium">Itens</tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Lado Direito: Legenda */}
              <div className="flex flex-col justify-center gap-2 pr-2 overflow-y-auto max-h-[160px] custom-scrollbar">
                  {academicDistribution.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center">Nenhum documento.</p>
                  ) : (
                    academicDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-slate-500 text-xs font-medium truncate max-w-[70px]">{item.name}</span>
                        </div>
                        <span className="font-bold text-xs text-slate-700">{item.value}</span>
                    </div>
                    ))
                  )}
              </div>
            </div>
          </motion.div>

          {/* CARD 6: Agenda */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                  <Calendar className="h-5 w-5 text-violet-600" />
                </div>
                <h3 className="font-semibold text-lg">Eventos Futuros</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-violet-50 text-center">
                <p className="text-2xl font-bold text-violet-600">{metrics.eventsNext}</p>
                <p className="text-xs text-slate-500">Próximos</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-center">
                <p className="text-2xl font-bold text-green-600">{metrics.eventsSynced}</p>
                <p className="text-xs text-slate-500">Sincronizados</p>
              </div>
            </div>
          </motion.div>

        </section>
      </div>
    </DashboardLayout>
  );
}