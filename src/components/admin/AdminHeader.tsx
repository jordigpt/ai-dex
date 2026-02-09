import { Button } from "@/components/ui/button";
import { Loader2, Database, GitMerge, Plus } from "lucide-react";
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

interface AdminHeaderProps {
  consolidating: boolean;
  seeding: boolean;
  onConsolidate: () => void;
  onSeed: () => void;
  onOpenCreateDialog: () => void;
}

export function AdminHeader({
  consolidating,
  seeding,
  onConsolidate,
  onSeed,
  onOpenCreateDialog,
}: AdminHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Gestión de contenido del juego.</p>
      </div>
      <div className="flex flex-wrap gap-2">
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
          Consolidar Tracks
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={seeding || consolidating}>
              {seeding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Reiniciar Catálogo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción BORRARÁ todas las misiones, tracks y skills actuales y
                las reemplazará por el catálogo unificado y limpio. Las
                asignaciones de los usuarios se perderán.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={onSeed}
                className="bg-red-600 hover:bg-red-700"
              >
                Sí, restaurar todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button onClick={onOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Misión
        </Button>
      </div>
    </div>
  );
}