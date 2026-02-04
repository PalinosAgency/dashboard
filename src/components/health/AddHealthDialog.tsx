import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { sql } from "@/lib/neon"; // Usando Neon para manter consistência com o resto do projeto

const categories = [
  { value: "Agua", label: "Água", icon: "💧", defaultUnit: "ml" },
  { value: "Sono", label: "Sono", icon: "😴", defaultUnit: "h" },
  { value: "Peso", label: "Peso", icon: "⚖️", defaultUnit: "kg" },
  { value: "Treino", label: "Atividade", icon: "💪", defaultUnit: "min" },
];

interface AddHealthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddHealthDialog({ open, onOpenChange, onSuccess }: AddHealthDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [category, setCategory] = useState<"Agua" | "Sono" | "Peso" | "Treino">("Agua");
  const [value, setValue] = useState("");
  const [item, setItem] = useState(""); // Nome da atividade
  const [description, setDescription] = useState(""); // Descrição extra
  const [unit, setUnit] = useState("ml"); // Unidade dinâmica
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));

  // Ao mudar a categoria, define a unidade padrão sugerida
  const handleCategoryChange = (val: typeof category) => {
    setCategory(val);
    const cat = categories.find(c => c.value === val);
    if (cat) setUnit(cat.defaultUnit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Inserção usando SQL (Neon)
      await sql`
        INSERT INTO health (user_id, category, value, item, description, unit, calendario)
        VALUES (
          ${user.id}, 
          ${category}, 
          ${parseFloat(value) || 0}, 
          ${category === "Treino" ? item : null}, 
          ${description || null},
          ${unit},
          ${new Date(date).toISOString()}
        )
      `;

      toast({ title: "Sucesso!", description: "Registro adicionado." });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o registro.",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCategory("Agua");
    setValue("");
    setItem("");
    setDescription("");
    setUnit("ml");
    setDate(new Date().toISOString().slice(0, 16));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo registro de saúde</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v: any) => handleCategoryChange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data e hora</Label>
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* Se for Treino, pede Nome da Atividade */}
          {category === "Treino" && (
            <div className="space-y-2">
              <Label>Atividade</Label>
              <Input
                type="text"
                placeholder="Ex: Corrida, Musculação..."
                value={item}
                onChange={(e) => setItem(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input
                type="text"
                placeholder="Ex: min, km, kg"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição / Notas (Opcional)</Label>
            <Input
              type="text"
              placeholder="Detalhes adicionais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : "Adicionar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}