import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Search, Trash2, Edit, Save, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export default function Notes() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchNotes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      toast({
        title: "Error cargando notas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSaveNote = async () => {
    if (!currentNote.content) {
      toast({ title: "La nota necesita contenido", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const noteData = {
        user_id: session.user.id,
        title: currentNote.title || "Sin título",
        content: currentNote.content,
        tags: currentNote.tags || [],
        updated_at: new Date().toISOString(),
      };

      if (currentNote.id) {
        // Update
        const { error } = await supabase
          .from("notes")
          .update(noteData)
          .eq("id", currentNote.id);
        if (error) throw error;
        toast({ title: "Nota actualizada" });
      } else {
        // Create
        const { error } = await supabase.from("notes").insert(noteData);
        if (error) throw error;
        toast({ title: "Nota creada" });
      }

      setIsDialogOpen(false);
      setCurrentNote({});
      fetchNotes();
    } catch (error: any) {
      toast({
        title: "Error guardando nota",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("¿Estás seguro de borrar esta nota?")) return;

    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Nota eliminada" });
      fetchNotes();
    } catch (error: any) {
      toast({
        title: "Error eliminando nota",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openNewNote = () => {
    setCurrentNote({ title: "", content: "", tags: [] });
    setIsDialogOpen(true);
  };

  const openEditNote = (note: Note) => {
    setCurrentNote(note);
    setIsDialogOpen(true);
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Idea Vault</h1>
            <p className="text-muted-foreground">Captura ideas, scripts y reflexiones.</p>
          </div>
          <Button onClick={openNewNote}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Nota
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar en tus notas..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <div className="mx-auto bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <StickyNote className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No hay notas aún</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No se encontraron resultados para tu búsqueda." : "Empieza a capturar tus ideas."}
            </p>
            {!searchTerm && (
              <Button variant="outline" onClick={openNewNote}>
                Crear primera nota
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold line-clamp-1">
                    {note.title || "Sin título"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(note.updated_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-2 border-t bg-gray-50/50">
                  <Button variant="ghost" size="sm" onClick={() => openEditNote(note)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{currentNote.id ? "Editar Nota" : "Nueva Nota"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Título (opcional)"
                  value={currentNote.title || ""}
                  onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                  className="font-medium text-lg"
                />
              </div>
              <div className="space-y-2">
                <Textarea
                  placeholder="Escribe tu idea aquí..."
                  value={currentNote.content || ""}
                  onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                  className="min-h-[200px] resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveNote} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}