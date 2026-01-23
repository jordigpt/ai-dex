import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Admin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data State
  const [missions, setMissions] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);

  // Filter State
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>("all");
  
  // Create Mission State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMission, setNewMission] = useState({
    title: "",
    description: "",
    type: "daily",
    difficulty: "1",
    xp_reward: "10",
    skill_id: "none",
    track_id: "none"
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check admin table
      const { data: adminData } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      // Also allow if email matches hardcoded admin (fallback)
      const isEmailAdmin = session.user.email === "jordithecreative@gmail.com";

      if (adminData || isEmailAdmin) {
        setIsAdmin(true);
        fetchData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Not admin");
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch missions with relations
      const { data: mData } = await supabase
        .from("missions")
        .select("*, skill:skills(name), track:tracks(name)")
        .order("created_at", { ascending: false });
      
      // Fetch skills
      const { data: sData } = await supabase
        .from("skills")
        .select("*")
        .order("name");

      // Fetch tracks
      const { data: tData } = await supabase
        .from("tracks")
        .select("*")
        .order("name");
        
      setMissions(mData || []);
      setSkills(sData || []);
      setTracks(tData || []);
    } catch (error: any) {
      toast({ title: "Error loading data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMission = async () => {
    setCreating(true);
    try {
      const { error } = await supabase.from("missions").insert({
        title: newMission.title,
        description: newMission.description,
        type: newMission.type,
        difficulty: parseInt(newMission.difficulty),
        xp_reward: parseInt(newMission.xp_reward),
        skill_id: newMission.skill_id === "none" ? null : newMission.skill_id,
        track_id: newMission.track_id === "none" ? null : newMission.track_id,
        is_active: true
      });

      if (error) throw error;

      toast({ title: "Misión creada" });
      setIsDialogOpen(false);
      // Reset form
      setNewMission({
        title: "",
        description: "",
        type: "daily",
        difficulty: "1",
        xp_reward: "10",
        skill_id: "none",
        track_id: "none"
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // Filter missions
  const filteredMissions = missions.filter(m => {
    if (selectedTrackFilter === "all") return true;
    if (selectedTrackFilter === "universal") return m.track_id === null;
    return m.track_id === selectedTrackFilter;
  });

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-muted-foreground">No tienes permisos de administrador.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Gestión de contenido del juego.</p>
          </div>
          <div className="flex gap-2">
             <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Misión
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-sm border">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filtrar por Track:</span>
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
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
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
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron misiones con este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMissions.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.title}
                        <div className="text-xs text-muted-foreground line-clamp-1">{m.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.track ? "default" : "secondary"}>
                          {m.track ? m.track.name : "Universal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.type}</Badge>
                      </TableCell>
                      <TableCell>{m.skill?.name || '-'}</TableCell>
                      <TableCell>{m.xp_reward}</TableCell>
                      <TableCell>{m.difficulty}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Misión</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Título</label>
                <Input 
                  value={newMission.title} 
                  onChange={(e) => setNewMission({...newMission, title: e.target.value})} 
                  placeholder="Ej: Publicar primer post"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Descripción</label>
                <Textarea 
                  value={newMission.description} 
                  onChange={(e) => setNewMission({...newMission, description: e.target.value})} 
                  placeholder="Detalles de lo que el usuario debe hacer..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select 
                    value={newMission.type} 
                    onValueChange={(v) => setNewMission({...newMission, type: v})}
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
                       const xpMap: Record<string, string> = { "1": "10", "2": "25", "3": "60", "4": "120" };
                       setNewMission({...newMission, difficulty: v, xp_reward: xpMap[v] || "10"})
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
                      onValueChange={(v) => setNewMission({...newMission, track_id: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar Track" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Universal (Para todos)</SelectItem>
                        {tracks.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Skill</label>
                  <Select 
                      value={newMission.skill_id} 
                      onValueChange={(v) => setNewMission({...newMission, skill_id: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar Skill" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        {skills.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
               <Button onClick={handleCreateMission} disabled={creating}>
                 {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Guardar Misión
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}