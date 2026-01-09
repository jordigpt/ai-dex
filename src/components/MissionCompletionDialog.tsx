import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trophy, Upload, Link as LinkIcon, X, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface MissionCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (evidence: string, reflection: string) => Promise<void>;
  missionTitle: string;
  xpReward: number;
}

export function MissionCompletionDialog({
  isOpen,
  onClose,
  onConfirm,
  missionTitle,
  xpReward,
}: MissionCompletionDialogProps) {
  const { toast } = useToast();
  const [reflection, setReflection] = useState("");
  const [evidenceType, setEvidenceType] = useState<"link" | "file">("link");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${new Date().getTime()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('evidence').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Error subiendo archivo",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let finalEvidenceUrl = evidenceLink;

    if (evidenceType === "file" && file) {
      const url = await handleFileUpload(file);
      if (!url) {
        setIsSubmitting(false);
        return; // Stop if upload failed
      }
      finalEvidenceUrl = url;
    }

    await onConfirm(finalEvidenceUrl, reflection);
    setIsSubmitting(false);
    onClose();
    
    // Reset fields
    setReflection("");
    setEvidenceLink("");
    setFile(null);
    setEvidenceType("link");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Completar Misión</DialogTitle>
          <DialogDescription>
            Reclama tus <span className="font-bold text-primary">{xpReward} XP</span> por completar: <br/>
            <span className="font-medium text-foreground">"{missionTitle}"</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-700 flex gap-2">
            <Trophy className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Tips de Bonus:</p>
              <ul className="list-disc list-inside text-xs mt-1">
                <li>+10% XP si escribes una reflexión (&gt;10 letras)</li>
                <li>+15% XP si añades evidencia (link o captura)</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reflection">Reflexión (Opcional)</Label>
            <Textarea
              id="reflection"
              placeholder="¿Qué aprendiste? ¿Qué fue difícil?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Evidencia (Opcional)</Label>
            <div className="flex gap-2 mb-2">
              <Button 
                type="button" 
                variant={evidenceType === "link" ? "default" : "outline"} 
                size="sm"
                onClick={() => setEvidenceType("link")}
                className="flex-1"
              >
                <LinkIcon className="w-4 h-4 mr-2" /> Link
              </Button>
              <Button 
                type="button" 
                variant={evidenceType === "file" ? "default" : "outline"} 
                size="sm"
                onClick={() => setEvidenceType("file")}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" /> Subir Imagen
              </Button>
            </div>

            {evidenceType === "link" ? (
              <Input
                id="evidence-link"
                placeholder="https://github.com/..."
                value={evidenceLink}
                onChange={(e) => setEvidenceLink(e.target.value)}
              />
            ) : (
              <div className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <Check className="w-5 h-5" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 z-10"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-muted-foreground">Arrastra o haz clic para subir</p>
                    <p className="text-xs text-gray-400">PNG, JPG hasta 2MB</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || (evidenceType === "file" && !file && isUploading)}>
            {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? "Subiendo..." : "Completar Misión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}