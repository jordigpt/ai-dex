import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Unlock, ExternalLink, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface DexCard {
  id: string;
  title: string;
  description: string;
  unlock_rule: { type: string; value: number };
  links: { label: string; url: string }[];
}

export default function Dex() {
  const { toast } = useToast();
  const [cards, setCards] = useState<DexCard[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Get All Cards
        const { data: allCards, error: cardsError } = await supabase
          .from("dex_cards")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (cardsError) throw cardsError;

        // 2. Get User Unlocks
        const { data: unlocks, error: unlockError } = await supabase
          .from("user_dex_unlocks")
          .select("dex_card_id")
          .eq("user_id", session.user.id);

        if (unlockError) throw unlockError;

        setCards(allCards || []);
        setUnlockedIds(new Set(unlocks?.map((u) => u.dex_card_id) || []));

      } catch (error: any) {
        toast({
          title: "Error cargando DEX",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getLockReason = (rule: { type: string; value: number }) => {
    if (rule.type === 'level') return `Nivel ${rule.value}`;
    if (rule.type === 'streak') return `Racha de ${rule.value} días`;
    return 'Bloqueado';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">DEX</h1>
          <p className="text-muted-foreground">Recursos, guías y herramientas desbloqueables.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const isUnlocked = unlockedIds.has(card.id);

            return (
              <Card 
                key={card.id} 
                className={`transition-all ${!isUnlocked ? 'bg-gray-50 opacity-80 border-dashed' : 'hover:shadow-md'}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {isUnlocked ? (
                         <Unlock className="h-5 w-5 text-green-600" />
                      ) : (
                         <Lock className="h-5 w-5 text-gray-400" />
                      )}
                      {card.title}
                    </CardTitle>
                    {!isUnlocked && (
                       <Badge variant="secondary" className="text-xs">
                          Requiere {getLockReason(card.unlock_rule)}
                       </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    {card.description}
                  </CardDescription>
                  
                  {isUnlocked ? (
                    <div className="space-y-2">
                      {card.links && Array.isArray(card.links) && card.links.map((link, idx) => (
                        <a 
                           key={idx} 
                           href={link.url} 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center text-sm text-blue-600 hover:underline bg-blue-50 p-2 rounded"
                        >
                           <ExternalLink className="h-4 w-4 mr-2" />
                           {link.label}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-20 bg-gray-100 rounded text-gray-400 text-sm">
                       <BookOpen className="h-4 w-4 mr-2" />
                       Contenido Bloqueado
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}