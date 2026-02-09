import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
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
import { Filter } from "lucide-react";

interface MissionsManagerProps {
  missions: any[];
  tracks: any[];
}

export function MissionsManager({ missions, tracks }: MissionsManagerProps) {
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>("all");

  const filteredMissions = missions.filter((m) => {
    if (selectedTrackFilter === "all") return true;
    if (selectedTrackFilter === "universal") return m.track_id === null;
    return m.track_id === selectedTrackFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-sm border">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">Filtrar Misiones por Track:</span>
        <Select
          value={selectedTrackFilter}
          onValueChange={setSelectedTrackFilter}
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
          Mostrando {filteredMissions.length} misiones
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
              {filteredMissions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No se encontraron misiones con este filtro.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMissions.map((m) => (
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
        </CardContent>
      </Card>
    </div>
  );
}