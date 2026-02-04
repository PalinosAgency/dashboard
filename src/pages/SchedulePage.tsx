import { useEffect, useState } from "react";
import { 
  Calendar as CalendarIcon, Clock, CheckCircle, CalendarDays, 
  RefreshCw, Cloud, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { sql } from "@/lib/neon";

export default function SchedulePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    async function fetchData() {
        if (!user) return;
        try {
            // Buscando eventos futuros
            const res = await sql`
                SELECT * FROM agendamento 
                WHERE user_id = ${user.id} 
                ORDER BY start_time ASC
            `;
            setEvents(res);
        } catch (e) { console.error(e); }
    }
    fetchData();
  }, [user]);

  // Filtros de dados
  const eventsCount = events.length;
  const eventsTodayCount = events.filter(e => isSameDay(new Date(e.start_time), new Date())).length;
  const syncedCount = events.filter(e => e.google_event_id).length;
  
  // Eventos do dia selecionado
  const selectedEvents = events.filter(e => isSameDay(new Date(e.start_time), selectedDate));
  
  // Próximos eventos (limite 3)
  const upcomingEvents = events.filter(e => new Date(e.start_time) > new Date()).slice(0, 3);

  // Mock visual do Calendário (Dias 1-31)
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const startOffset = 3; 

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#040949]">Agenda</h1>
              <p className="text-slate-500 mt-1">Próximos compromissos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Sincronizado
          </div>
        </motion.div>

        {/* --- METRICS ROW --- */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {/* Total Agenda */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-violet-300 transition-colors"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Total na Agenda</span>
              <Clock className="h-5 w-5 text-violet-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-violet-600">{eventsCount}</span>
            </div>
          </motion.div>

          {/* Eventos Hoje */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-orange-300 transition-colors"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Eventos Hoje</span>
              <CalendarDays className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-orange-600">{eventsTodayCount}</span>
            </div>
          </motion.div>

          {/* Sincronizados */}
          <motion.div 
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-green-300 transition-colors"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Sincronizados</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-green-600">{syncedCount}</span>
            </div>
          </motion.div>
        </div>

        {/* --- UPCOMING EVENTS CARD --- */}
        <motion.div
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">Próximos Compromissos</h3>
          </div>

          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(event.start_time), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {event.google_event_id && (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* --- MAIN GRID (Calendar + Details) --- */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          
          {/* Mock Visual Calendar - Mantido Mock para visual, funcionalidade futura */}
          <motion.div
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 flex justify-center h-fit shadow-sm"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <div className="w-full max-w-[300px]">
              <div className="flex items-center justify-between mb-4">
                  <button className="p-1 hover:bg-slate-100 rounded-md"><ChevronLeft className="h-4 w-4 text-slate-500"/></button>
                  <span className="text-sm font-medium text-slate-900">Janeiro 2026</span>
                  <button className="p-1 hover:bg-slate-100 rounded-md"><ChevronRight className="h-4 w-4 text-slate-500"/></button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-slate-400">
                  <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {Array.from({length: startOffset}).map((_, i) => <div key={`empty-${i}`} />)}
                  {calendarDays.map((day) => {
                      const isSelected = day === selectedDate.getDate(); // Simples seleção visual
                      return (
                          <div 
                             key={day} 
                             onClick={() => {
                                 const newDate = new Date();
                                 newDate.setDate(day);
                                 setSelectedDate(newDate);
                             }}
                             className={`
                               h-9 w-9 flex items-center justify-center rounded-md cursor-pointer transition-colors
                               ${isSelected ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'hover:bg-slate-100 text-slate-700'}
                             `}
                          >
                              {day}
                          </div>
                      );
                  })}
              </div>
            </div>
          </motion.div>

          {/* Events List (Right Column) */}
          <motion.div
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:col-span-2 overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2 text-slate-900">
              <div className="w-1.5 h-6 bg-violet-500 rounded-full"></div>
              Eventos selecionados
            </h3>
            
            <div className="space-y-3">
              {events.slice(0, 5).map((event) => ( // Mostrando os primeiros 5 por padrão já que o calendário é mock
                <div
                  key={event.id}
                  className="group flex items-start gap-4 rounded-xl border border-slate-200 p-4 transition-all hover:shadow-sm bg-white border-l-4 border-l-violet-500"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="truncate font-semibold text-slate-900">{event.title}</h4>
                      {event.google_event_id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                          <Cloud className="h-3 w-3" /> Sync
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        {format(new Date(event.start_time), "HH:mm")} - {format(new Date(event.end_time), "HH:mm")}
                      </span>
                      <span>({format(new Date(event.start_time), "dd/MM")})</span>
                    </div>

                    {event.description && (
                      <p className="mt-2 text-sm text-slate-500 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}