import { useEffect, useState } from "react";
import { 
  GraduationCap, Brain, CalendarClock, CheckCircle2, Clock, 
  Pencil, FileText, BookOpen, CalendarCheck, Trash2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { sql } from "@/lib/neon";

export default function AcademicPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuração Visual dos Tipos
  const typeConfig: any = {
    prova: { label: "Prova", color: "text-red-600", bg: "bg-red-100", icon: FileText },
    trabalho: { label: "Trabalho", color: "text-orange-600", bg: "bg-orange-100", icon: CalendarCheck },
    leitura: { label: "Leitura", color: "text-blue-600", bg: "bg-blue-100", icon: BookOpen },
    estudo: { label: "Estudo", color: "text-green-600", bg: "bg-green-100", icon: GraduationCap },
    default: { label: "Geral", color: "text-slate-600", bg: "bg-slate-100", icon: GraduationCap },
  };

  useEffect(() => {
    async function fetchData() {
        if (!user) return;
        setLoading(true);
        try {
            const data = await sql`SELECT * FROM academic WHERE user_id = ${user.id} ORDER BY created_at DESC`;
            setItems(data.map((d:any) => ({
                ...d,
                tag: d.tags ? d.tags.toLowerCase() : 'default' // Garante que a tag bata com o config
            })));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    }
    fetchData();
  }, [user]);

  // Cálculos dinâmicos baseados nos dados
  const totalActivities = items.length;
  const studySessions = items.filter(i => i.tag === 'estudo').length;
  // Assumindo que datas futuras seriam baseadas em 'created_at' ou outra coluna de data
  // Como o mock usava isFuture, aqui faremos uma simulação simples
  const upcomingExams = items.filter(i => i.tag === 'prova').length;
  
  // Agrupamento para TagsOverview
  const tagCountsMap = items.reduce((acc:any, curr:any) => {
      const tag = curr.tag;
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
  }, {});

  const tagCounts = Object.entries(tagCountsMap).map(([tag, count]) => {
      // Mapear visual para a lista de distribuição
      let icon = GraduationCap;
      let color = 'bg-slate-500';
      
      if(tag === 'estudo') { icon = GraduationCap; color = 'bg-green-500'; }
      if(tag === 'trabalho') { icon = CalendarCheck; color = 'bg-orange-500'; }
      if(tag === 'leitura') { icon = BookOpen; color = 'bg-blue-500'; }
      if(tag === 'prova') { icon = Pencil; color = 'bg-red-500'; }

      return { tag, label: typeConfig[tag]?.label || tag, count, icon, color, iconColor: 'text-white' };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans text-slate-900">
        
        {/* --- HEADER --- */}
        <motion.div 
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#040949]">Acadêmico</h1>
              <p className="text-slate-500 mt-1">Planejamento, estudos e provas</p>
            </div>
          </div>
        </motion.div>

        {/* --- METRICS ROW --- */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {/* Sessões Estudo */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-green-300 transition-colors"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Sessões Estudo</span>
              <Brain className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-green-600">{studySessions}</span>
            </div>
          </motion.div>

          {/* Provas Futuras */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-red-300 transition-colors"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Provas</span>
              <CalendarClock className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-red-600">{upcomingExams}</span>
            </div>
          </motion.div>

          {/* Total Atividades */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Total Atividades</span>
              <CheckCircle2 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-700">{totalActivities}</span>
            </div>
          </motion.div>
        </div>

        {/* --- CONTENT GRID --- */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          
          {/* COLUNA ESQUERDA: TagsOverview (Distribuição) */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-fit"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Distribuição</h3>
            <div className="space-y-4">
              {tagCounts.map((item: any) => {
                const totalDocs = totalActivities || 1;
                const percentage = (item.count / totalDocs) * 100;
                
                return (
                  <div key={item.tag} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color} ${item.iconColor}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-slate-700 text-sm">{item.label}</span>
                      </div>
                      <span className="text-sm text-slate-500">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* COLUNA DIREITA: AcademicList (Cronograma) */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 overflow-hidden"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Cronograma de Atividades</h3>
            <div className="space-y-3 pr-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {items.map((item) => {
                const config = typeConfig[item.tag] || typeConfig.default;
                const Icon = config.icon;
                
                return (
                  <div
                    key={item.id}
                    className="group flex items-start gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:shadow-sm"
                  >
                    {/* Ícone do Tipo */}
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
                      <Icon className={`h-6 w-6 ${config.color}`} />
                    </div>

                    {/* Conteúdo */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="truncate font-semibold text-slate-900">{item.doc_name}</h4>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>

                      {item.summary && (
                        <p className="mt-2 text-sm text-slate-500 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                          {item.summary}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </DashboardLayout>
  );
}