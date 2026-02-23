import { Button } from "@/components/ui/button";
import { Loader2, GitMerge, Target, Layers, RefreshCw } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">Gestión de contenido y mantenimiento del sistema.</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col xl:flex-row gap-6 justify-between xl:items-center">
        {/* Sección Contenido */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gestión de Contenido</span>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onOpenCreateTrack} className="bg-gray-900 text-white hover:bg-gray-800">
              <Layers className="mr-2 h-4 w-4" /> Nuevo Track
            </Button>
            <Button onClick={onOpenCreateMission} variant="secondary" className="border border-gray-200">
              <Target className="mr-2 h-4 w-4" /> Nueva Misión
            </Button>
          </div>
        </div>

        <div className="hidden xl:block h-12 w-px bg-gray-100" />
        <div className="block xl:hidden h-px w-full bg-gray-100" />

        {/* Sección Mantenimiento */}
        <div className="flex flex-col gap-3">
           <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones de Mantenimiento</span>
           <div className="flex flex-wrap gap-3">
             <Button
              variant="outline"
              className="border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 w-full sm:w-auto justify-start"
              onClick={onConsolidate}
              disabled={consolidating || seeding}
            >
              {consolidating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GitMerge className="mr-2 h-4 w-4" />
              )}
              1. Consolidar Tracks
            </Button>

            <Button 
              variant="outline" 
              className="border-green-200 bg-green-50/50 hover:bg-green-100 text-green-700 w-full sm:w-auto justify-start" 
              onClick={onSeed}
              disabled={seeding || consolidating}
            >
              {seeding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              2. Sincronizar Misiones
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}