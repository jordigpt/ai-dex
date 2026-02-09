import { Button } from "@/components/ui/button";
import { Loader2, Database, GitMerge, Plus, Target, Layers } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

interface AdminHeaderProps {
  consolidating: boolean;
  seeding: boolean;
  onConsolidate: () => void;
  onSeed: () => void;
  onOpenCreateMission: () => void;
  onOpenCreateTrack: () => void;
}

export function AdminHeader({
  consolidating,
  seeding,
  onConsolidate,
  onSeed,
  onOpenCreateMission,
  onOpenCreateTrack,
}: AdminHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Gestión de contenido y mantenimiento.</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <span className="text-sm font-semibold text-gray-500 mr-2">Contenido:</span>
          <Button onClick={onOpenCreateTrack} className="bg-gray-900 text-white hover:bg-gray-800">
            <Layers className="mr-2 h-4 w-4" /> Nuevo Track
          </Button>
          <Button onClick={onOpenCreateMission}>
            <Target className="mr-2 h-4 w-4" /> Nueva Misión
          </Button>
        </div>

        <div className="hidden md:block h-8 w-px bg-gray-200" />

        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
           <span className="text-sm font-semibold text-gray-500 mr-2">Mantenimiento:</span>
           <Button
            variant="outline"
            className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
            onClick={onConsolidate}
            disabled={consolidating || seeding}
          >
            {consolidating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GitMerge className="mr-2 h-4 w-4" />
            )}
            Consolidar
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" disabled={seeding || consolidating}>
                {seeding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                Reset DB
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¡Zona de Peligro!</AlertDialogTitle>
                <AlertDialogDescription>
                  Esto restaurará la base de datos al estado inicial (Seed). Se borrarán misiones personalizadas y progreso.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onSeed}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sí, restaurar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}