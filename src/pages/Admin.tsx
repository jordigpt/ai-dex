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
import { Loader2, Plus, Save } from "lucide-react";
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
  const [missions, setMissions] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  
  // Create Mission State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMission, setNewMission] = useState({
    title: "",
    description: "",
    type: "daily",
    difficulty: "1",
    xp_reward: "10",
    skill_id: ""
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
      const { data: adminData, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .single();
      
      if (adminData) {
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
    // Fetch missions
    const { data: mData } = await supabase
      .from("missions")
      .select("*, skill:skills(name)")
      .order("created_at", { ascending: false });
    
    // Fetch skills
    const { data: sData } = await supabase
      .from("skills")
      .select("*");
      
    setMissions(mData || []);
    setSkills(sData || []);
    setLoading(false);
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
        skill_id: newMission.skill_id || null,
        is_active: true
      });

      if (error) throw error;

      toast({ title: "Misión creada" });
      setIsDialogOpen(false);
      setNewMission({
        title: "",
        description: "",
        type: "daily",
        difficulty: "1",
        xp_reward: "10",
        skill_id: ""
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Misión
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Misiones Activas ({missions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Diff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missions.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.type}</Badge>
                    </TableCell>
                    <TableCell>{m.skill?.name || '-'}</TableCell>
                    <TableCell>{m.xp_reward}</TableCell>
                    <TableCell>{m.difficulty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Misión</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label>Título</label>
                <Input 
                  value={newMission.title} 
                  onChange={(e) => setNewMission({...newMission, title: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <label>Descripción</label>
                <Textarea 
                  value={newMission.description} 
                  onChange={(e) => setNewMission({...newMission, description: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label>Tipo</label>
                  <Select 
                    value={newMission.type} 
                    onValueChange={(v) => setNewMission({...newMission, type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="side">Side Quest</SelectItem>
                      <SelectItem value="main">Main Quest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                   <label>Dificultad (1-4)</label>
                   <Select 
                    value={newMission.difficulty} 
                    onValueChange={(v) => {
                       // Auto set XP based on difficulty
                       const xpMap: Record<string, string> = { "1": "10", "2": "25", "3": "60", "4": "120" };
                       setNewMission({...newMission, difficulty: v, xp_reward: xpMap[v] || "10"})
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Fácil)</SelectItem>
                      <SelectItem value="2">2 (Medio)</SelectItem>
                      <SelectItem value="3">3 (Difícil)</SelectItem>
                      <SelectItem value="4">4 (Épico)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <label>Skill</label>
                <Select 
                    value={newMission.skill_id} 
                    onValueChange={(v) => setNewMission({...newMission, skill_id: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar Skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {skills.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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