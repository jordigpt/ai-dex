// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', 
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    console.log("[seed-db] Iniciando actualización del Skill Tree...");

    // 1. DEFINICIÓN DEL ÁRBOL COMPLETO (Main -> Subs)
    // Structure: Parent Name -> Array of Children
    const SKILL_TREE_DATA = [
      // RAIZ: OFERTA & COPY
      {
        name: "Oferta & Copy",
        description: "Creación de valor, packaging y escritura persuasiva.",
        category: "Marketing",
        children: [
          {
            name: "Diseño de Avatar",
            description: "Definición profunda del cliente ideal y anti-avatar.",
            category: "Marketing",
            children: [
              { name: "Investigación de Mercado", description: "Validación de dolores y deseos reales.", category: "Marketing" }
            ]
          },
          {
            name: "Copywriting Básico",
            description: "Estructuras PAS, AIDA y escritura clara.",
            category: "Marketing",
            children: [
               { name: "Hooks Virales", description: "El arte de detener el scroll en 3 segundos.", category: "Marketing" },
               { name: "Storytelling", description: "Narrativa para conectar emocionalmente.", category: "Marketing" }
            ]
          },
          {
             name: "Pricing Psychology",
             description: "Estrategias de precios, anclaje y valor percibido.",
             category: "Marketing"
          }
        ]
      },

      // RAIZ: VENTAS
      {
        name: "Ventas & Outreach",
        description: "Prospección, negociación y cierre.",
        category: "Sales",
        children: [
          {
            name: "Cold Outreach",
            description: "El arte de iniciar conversaciones con desconocidos.",
            category: "Sales",
            children: [
               { name: "Cold Email", description: "Sistemas de email en frío y entregabilidad.", category: "Sales" },
               { name: "Social Selling", description: "Venta por DM en LinkedIn/IG/Twitter.", category: "Sales" }
            ]
          },
          {
            name: "Discovery Call",
            description: "Cualificación y diagnóstico del problema.",
            category: "Sales",
            children: [
               { name: "Manejo de Objeciones", description: "Transformar un 'No' en un 'Tal vez' o 'Sí'.", category: "Sales" },
               { name: "Closing", description: "Técnicas de cierre y pedir el dinero.", category: "Sales" }
            ]
          }
        ]
      },

      // RAIZ: CONTENIDO
      {
         name: "Contenido & Distribución",
         description: "Atención, tráfico y marca personal.",
         category: "Content",
         children: [
            {
               name: "Video Short-Form",
               description: "Dominio de Reels, TikTok y Shorts.",
               category: "Content",
               children: [
                  { name: "Edición Básica", description: "Cortar, ritmos y subtítulos dinámicos.", category: "Content" }
               ]
            },
            {
               name: "Marca Personal",
               description: "Identidad visual, voz y autoridad.",
               category: "Content",
               children: [
                  { name: "Networking", description: "Creación de alianzas con otros creadores.", category: "Content" }
               ]
            }
         ]
      },

      // RAIZ: TECH
      {
         name: "Tech & Automatización",
         description: "Sistemas, herramientas y eficiencia.",
         category: "Tech",
         children: [
            {
               name: "No-Code Basics",
               description: "Fundamentos de bases de datos y lógica.",
               category: "Tech",
               children: [
                  { name: "Webhooks & APIs", description: "Conectar herramientas entre sí.", category: "Tech" },
                  { name: "AI Prompting", description: "Ingeniería de prompts para productividad.", category: "Tech" }
               ]
            },
            {
               name: "Funnel Building",
               description: "Construcción de landing pages y embudos.",
               category: "Tech"
            }
         ]
      },

      // RAIZ: DELIVERY
      {
         name: "Delivery & Servicio",
         description: "Entregables, satisfacción del cliente y retención.",
         category: "Business",
         children: [
            {
               name: "Client Onboarding",
               description: "La experiencia de los primeros 7 días.",
               category: "Business"
            },
            {
               name: "Sistematización",
               description: "Crear SOPs para delegar.",
               category: "Business",
               children: [
                  { name: "Team Management", description: "Contratación y liderazgo básico.", category: "Business" }
               ]
            }
         ]
      }
    ];

    let skillsCreated = 0;
    let depsCreated = 0;

    // Helper recursivo para crear el árbol
    async function processNode(node: any, parentId: string | null = null) {
      // 1. Insert/Get Skill
      let skillId = null;
      
      // Check exist
      const { data: existing } = await supabase.from('skills').select('id').eq('name', node.name).maybeSingle();
      
      if (existing) {
         skillId = existing.id;
      } else {
         const { data: newSkill, error } = await supabase.from('skills').insert({
            name: node.name,
            description: node.description,
            category: node.category
         }).select().single();
         
         if (error) {
            console.error(`Error creating skill ${node.name}:`, error);
            return;
         }
         skillId = newSkill.id;
         skillsCreated++;
      }

      // 2. Create Dependency if parent exists
      if (parentId && skillId) {
         // Check dependency exists
         const { data: existingDep } = await supabase.from('skill_dependencies')
            .select('id')
            .eq('parent_skill_id', parentId)
            .eq('child_skill_id', skillId)
            .maybeSingle();
         
         if (!existingDep) {
            await supabase.from('skill_dependencies').insert({
               parent_skill_id: parentId,
               child_skill_id: skillId
            });
            depsCreated++;
         }
      }

      // 3. Process Children
      if (node.children && node.children.length > 0) {
         for (const child of node.children) {
            await processNode(child, skillId);
         }
      }
    }

    // Ejecutar procesamiento
    for (const rootNode of SKILL_TREE_DATA) {
       await processNode(rootNode, null);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Árbol generado. Skills nuevas: ${skillsCreated}. Conexiones nuevas: ${depsCreated}.`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("[seed-db] error", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})