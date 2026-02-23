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
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Users } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  display_name: string;
  track_name: string;
  level: number;
  xp: number;
  streak: number;
  last_active: string;
  created_at: string;
}

interface UsersManagerProps {
  users: UserData[];
  loading: boolean;
}

export function UsersManager({ users, loading }: UsersManagerProps) {
  
  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>Cargando directorio de agentes...</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuarios ({users.length})
                </CardTitle>
                <CardDescription>
                Lista completa de usuarios registrados y su progreso actual.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Track</TableHead>
                <TableHead className="text-center">Nivel</TableHead>
                <TableHead className="text-center">XP</TableHead>
                <TableHead className="text-center">Racha</TableHead>
                <TableHead className="text-right">Última Actividad</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios.
                    </TableCell>
                </TableRow>
                ) : (
                users.map((user) => (
                    <TableRow key={user.id}>
                    <TableCell>
                        <div className="font-medium">{user.display_name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="text-xs">
                            {user.track_name}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                        <span className="font-bold text-gray-700">{user.level}</span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                        {user.xp}
                    </TableCell>
                    <TableCell className="text-center">
                         {user.streak > 0 && (
                             <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                                🔥 {user.streak}
                             </Badge>
                         )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                        {user.last_active 
                            ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true, locale: es })
                            : "Nunca"
                        }
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}