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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CreateMissionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tracks: any[];
  skills: any[];
  onCreate: (missionData: any) => Promise<void>;
}

export function CreateMissionDialog({
  isOpen,
  onOpenChange,
  tracks,
  skills,
  onCreate,
}: CreateMissionDialogProps) {
  const [creating, setCreating] = useState(false);
  const [newMission, setNewMission] = useState({
    title: "",
    description: "",
    type: "daily",
    difficulty: "1",
    xp_reward: "10",
    skill_id: "none",
    track_id: "none",
  });

  const handleSubmit = async () => {
    setCreating(true);
    try {
      await onCreate(newMission);
      // Reset form
      setNewMission({
        title: "",
        description: "",
        type: "daily",
        difficulty: "1",
        xp_reward: "10",
        skill_id: "none",
        track_id: "none",
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by parent, usually
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Misión</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Título</label>
            <Input
              value={newMission.title}
              onChange={(e) =>
                setNewMission({ ...newMission, title: e.target.value })
              }
              placeholder="Ej: Publicar primer post"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              value={newMission.description}
              onChange={(e) =>
                setNewMission({ ...newMission, description: e.target.value })
              }
              placeholder="Detalles de lo que el usuario debe hacer..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={newMission.type}
                onValueChange={(v) =>
                  setNewMission({ ...newMission, type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Quest</SelectItem>
                  <SelectItem value="side">Side Quest</SelectItem>
                  <SelectItem value="main">Main Quest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Dificultad (1-4)</label>
              <Select
                value={newMission.difficulty}
                onValueChange={(v) => {
                  const xpMap: Record<string, string> = {
                    "1": "10",
                    "2": "25",
                    "3": "60",
                    "4": "120",
                  };
                  setNewMission({
                    ...newMission,
                    difficulty: v,
                    xp_reward: xpMap[v] || "10",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Fácil - 10 XP)</SelectItem>
                  <SelectItem value="2">2 (Medio - 25 XP)</SelectItem>
                  <SelectItem value="3">3 (Difícil - 60 XP)</SelectItem>
                  <SelectItem value="4">4 (Épico - 120 XP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Track</label>
              <Select
                value={newMission.track_id}
                onValueChange={(v) =>
                  setNewMission({ ...newMission, track_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Universal (Para todos)</SelectItem>
                  {tracks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Skill</label>
              <Select
                value={newMission.skill_id}
                onValueChange={(v) =>
                  setNewMission({ ...newMission, skill_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {skills.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Misión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}