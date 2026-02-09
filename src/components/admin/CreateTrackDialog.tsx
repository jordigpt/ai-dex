import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface CreateTrackDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (trackData: { name: string; description: string }) => Promise<void>;
}

export function CreateTrackDialog({
  isOpen,
  onOpenChange,
  onCreate,
}: CreateTrackDialogProps) {
  const [creating, setCreating] = useState(false);
  const [newTrack, setNewTrack] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async () => {
    if (!newTrack.name) return;
    setCreating(true);
    try {
      await onCreate(newTrack);
      setNewTrack({ name: "", description: "" });
      onOpenChange(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Track</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Nombre del Track</label>
            <Input
              value={newTrack.name}
              onChange={(e) =>
                setNewTrack({ ...newTrack, name: e.target.value })
              }
              placeholder="Ej: Marketing Avanzado"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              value={newTrack.description}
              onChange={(e) =>
                setNewTrack({ ...newTrack, description: e.target.value })
              }
              placeholder="¿De qué trata esta carrera?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={creating || !newTrack.name}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Track
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}