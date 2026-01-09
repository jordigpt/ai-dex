import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trophy } from "lucide-react";

interface MissionCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (evidence: string, reflection: string) => Promise<void>;
  missionTitle: string;
  xpReward: number;
}

export function MissionCompletionDialog({
  isOpen,
  onClose,
  onConfirm,
  missionTitle,
  xpReward,
}: MissionCompletionDialogProps) {
  const [reflection, setReflection] = useState("");
  const [evidence, setEvidence] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onConfirm(evidence, reflection);
    setIsSubmitting(false);
    onClose();
    // Reset fields
    setReflection("");
    setEvidence("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Completar Misión</DialogTitle>
          <DialogDescription>
            Estás a punto de reclamar <span className="font-bold text-primary">{xpReward} XP</span> por: <br/>
            <span className="font-medium text-foreground">"{missionTitle}"</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-700 flex gap-2">
            <Trophy className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Tips de Bonus:</p>
              <ul className="list-disc list-inside text-xs mt-1">
                <li>+10% XP si escribes una reflexión (&gt;10 letras)</li>
                <li>+15% XP si añades un link de evidencia</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reflection">Reflexión (Opcional)</Label>
            <Textarea
              id="reflection"
              placeholder="¿Qué aprendiste? ¿Qué fue difícil?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="evidence">Evidencia / Link (Opcional)</Label>
            <Input
              id="evidence"
              placeholder="https://github.com/..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Completar Misión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}