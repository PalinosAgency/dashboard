import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dumbbell, CalendarDays, ChevronDown, ChevronUp, Clock, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthLogProps {
  data: { 
    item: string; 
    description: string | null;
    date: string; 
    value?: number;
    unit?: string | null;
  }[];
}

export function HealthLog({ data }: HealthLogProps) {
  const [showAll, setShowAll] = useState(false);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
        <Dumbbell className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm font-medium">Nenhuma atividade registrada</p>
      </div>
    );
  }

  const displayedData = showAll ? data : data.slice(0, 5);

  return (
    <div className="space-y-3">
      {displayedData.map((workout, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="flex flex-col min-w-0">
                <p className="font-semibold text-foreground truncate">{workout.item}</p>
                {/* Exibe descrição se existir */}
                {workout.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {workout.description}
                  </p>
                )}
              </div>

              {/* Badge Dinâmica: Mostra valor + unidade */}
              {workout.value && workout.value > 0 && (
                <span className="shrink-0 text-xs font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-md flex items-center gap-1">
                  {(workout.unit === 'km' || workout.unit === 'm') ? <Ruler className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {workout.value} {workout.unit || 'min'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              <span className="capitalize">
                {format(parseISO(workout.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>
      ))}

      {data.length > 5 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-primary"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>Mostrar menos <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Ver todas as atividades ({data.length}) <ChevronDown className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}