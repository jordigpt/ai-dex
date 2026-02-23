import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";

interface MissionsManagerProps {
  missions: any[];
  tracks: any[];
}

const ITEMS_PER_PAGE = 20;

export function MissionsManager({ missions, tracks }: MissionsManagerProps) {
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Logic
  const filteredMissions = missions.filter((m) => {
    if (selectedTrackFilter === "all") return true;
    if (selectedTrackFilter === "universal") return m.track_id === null;
    return m.track_id === selectedTrackFilter;
  });

  // Reset pagination when filter changes
  const handleFilterChange = (value: string) => {
    setSelectedTrackFilter(value);
    setCurrentPage(1);
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredMissions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentMissions = filteredMissions.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-sm border">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">Filtrar Misiones por Track:</span>
        <Select
          value={selectedTrackFilter}
          onValueChange={handleFilterChange}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Seleccionar Track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Tracks</SelectItem>
            <SelectItem value="universal">Universales (Sin Track)</SelectItem>
            {tracks.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-gray-500">
          Total: {filteredMissions.length} misiones
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Misiones Activas</CardTitle>
          <CardDescription>
            Catálogo actual disponible para los usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Título</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Diff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No se encontraron misiones con este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentMissions.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.title}
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {m.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.track ? "default" : "secondary"}>
                          {m.track ? m.track.name : "Universal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.type}</Badge>
                      </TableCell>
                      <TableCell>{m.skill?.name || "-"}</TableCell>
                      <TableCell>{m.xp_reward}</TableCell>
                      <TableCell>{m.difficulty}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t py-4">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}