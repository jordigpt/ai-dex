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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usamos Service Role para poder borrar/escribir todo
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. DEFINICIÓN DE CATÁLOGO DEFINITIVO
    const SKILLS = [
      { name: "Oferta & Copy", description: "Creación de valor, packaging y escritura persuasiva." },
      { name: "Ventas & Outreach", description: "Prospección, negociación y cierre." },
      { name: "Contenido & Distribución", description: "Atención, tráfico y marca personal." },
      { name: "Tech & Automatización", description: "Sistemas, herramientas y eficiencia." },
      { name: "Delivery & Servicio", description: "Entregables, satisfacción del cliente y retención." }
    ];

    const TRACKS = [
      { 
        name: "Microproductos", 
        description: "Productos digitales de bajo ticket, plantillas y cursos grabados." 
      },
      { 
        name: "Servicios High-Ticket", 
        description: "Agencia B2B, consultoría y servicios 'Done-For-You'." 
      },
      { 
        name: "Coaching & 1:1", 
        description: "Mentoría, asesoría personalizada y marca personal." 
      },
      { 
        name: "Agencia de Automatización", 
        description: "Implementación de IA, chatbots y workflows (n8n/Zapier) para empresas." 
      },
      { 
        name: "Creator Engine", 
        description: "Foco 100% en creación de contenido, audiencia y monetización por sponsors/afiliados." 
      }
    ];

    // Misiones Universales (Para todos)
    const UNIVERSAL_MISSIONS = [
      { title: "Definir tu Anti-Avatar", description: "Escribe 5 puntos de con QUIÉN NO quieres trabajar. Esto clarifica tu oferta más que definir a tu cliente ideal.", type: "side", difficulty: 2, xp: 25, skill: "Oferta & Copy" },
      { title: "Setup Financiero Básico", description: "Configura Stripe/LemonSqueezy/PayPal y haz una transacción de prueba de $1.", type: "main", difficulty: 2, xp: 25, skill: "Tech & Automatización" },
      { title: "La Regla de los 10 Mensajes", description: "Envía 10 mensajes (DMs o Emails) a personas que podrían beneficiarse de lo que sabes hacer. Sin venta, solo conexión.", type: "daily", difficulty: 1, xp: 10, skill: "Ventas & Outreach" },
      { title: "Planificación Nocturna", description: "Escribe las 3 tareas críticas para mañana antes de dormir. Reduce la fricción matutina.", type: "daily", difficulty: 1, xp: 10, skill: "Tech & Automatización" },
      { title: "Limpieza Digital", description: "Elimina 3 apps de tu teléfono que te roban tiempo o organiza tu escritorio por 15 min.", type: "daily", difficulty: 1, xp: 10, skill: "Tech & Automatización" }
    ];

    // Misiones Específicas
    const TRACK_MISSIONS = {
      "Microproductos": [
        { title: "El Problema de 1 Millón de Dólares", description: "Identifica un problema doloroso y urgente que puedas resolver con un PDF de 5 páginas.", type: "side", difficulty: 2, xp: 25, skill: "Oferta & Copy" },
        { title: "Esquema del Lead Magnet", description: "Crea el índice (Table of Contents) de tu producto gratuito o de bajo coste.", type: "main", difficulty: 2, xp: 25, skill: "Oferta & Copy" },
        { title: "Landing Page MVP", description: "Monta una página simple (Notion/Carrd) con: Promesa, 3 Beneficios y Botón de compra/descarga.", type: "main", difficulty: 3, xp: 60, skill: "Tech & Automatización" },
        { title: "3 Hooks de Contenido", description: "Escribe 3 ganchos para TikTok/Reels que ataquen directamente el problema que resuelve tu producto.", type: "daily", difficulty: 1, xp: 10, skill: "Contenido & Distribución" },
        { title: "Venta Beta", description: "Consigue que 1 persona te pague (o descargue) tu producto antes de terminarlo al 100%.", type: "main", difficulty: 4, xp: 120, skill: "Ventas & Outreach" }
      ],
      "Servicios High-Ticket": [
        { title: "Oferta Irresistible", description: "Redacta tu promesa: 'Ayudo a [Nicho] a lograr [Resultado] en [Tiempo] sin [Dolor]'.", type: "main", difficulty: 2, xp: 25, skill: "Oferta & Copy" },
        { title: "Lista de 50 Prospectos", description: "Busca 50 empresas/personas que encajen con tu servicio. Ponlos en un Excel/Notion.", type: "side", difficulty: 2, xp: 25, skill: "Ventas & Outreach" },
        { title: "El Loom de Valor", description: "Graba un video de 3-5 min auditando la situación de un prospecto y envíaselo gratis.", type: "daily", difficulty: 2, xp: 25, skill: "Ventas & Outreach" },
        { title: "Propuesta Estándar", description: "Crea una plantilla de propuesta PDF que puedas reutilizar. No reinventes la rueda cada vez.", type: "main", difficulty: 3, xp: 60, skill: "Oferta & Copy" },
        { title: "Case Study Express", description: "Escribe un documento de 1 página explicando cómo resolviste un problema similar en el pasado (o cómo lo harías).", type: "side", difficulty: 2, xp: 25, skill: "Contenido & Distribución" }
      ],
      "Coaching & 1:1": [
        { title: "Historia de Origen", description: "Escribe un post/guion contando tu historia de transformación. ¿Por qué eres el guía adecuado?", type: "main", difficulty: 2, xp: 25, skill: "Contenido & Distribución" },
        { title: "Estructura de Sesión", description: "Diseña el framework de tu llamada de coaching. ¿Qué pasa en el min 0, 15, 30 y 60?", type: "main", difficulty: 3, xp: 60, skill: "Delivery & Servicio" },
        { title: "Reactivación de Red", description: "Escribe a 5 ex-compañeros o amigos contando qué estás ofreciendo ahora.", type: "side", difficulty: 1, xp: 10, skill: "Ventas & Outreach" },
        { title: "Entrevista de Investigación", description: "Agenda una llamada de 15 min con alguien de tu nicho solo para preguntar sus dolores. No vendas.", type: "side", difficulty: 2, xp: 25, skill: "Oferta & Copy" },
        { title: "Publicar Prueba Social", description: "Sube una captura (anonimizada si es necesario) de alguien agradeciéndote por un consejo.", type: "daily", difficulty: 1, xp: 10, skill: "Contenido & Distribución" }
      ],
      "Agencia de Automatización": [
        { title: "Diagrama de Flujo", description: "Dibuja en papel o Whimsical el proceso actual de un cliente potencial vs. tu solución automatizada.", type: "side", difficulty: 2, xp: 25, skill: "Tech & Automatización" },
        { title: "Demo de Chatbot", description: "Configura un chatbot básico (Voiceflow/Manychat) que responda 3 preguntas frecuentes.", type: "main", difficulty: 3, xp: 60, skill: "Tech & Automatización" },
        { title: "Scraping de Leads", description: "Usa una herramienta (Apollo/Instant Data) para sacar 100 leads de e-commerce/inmobiliarias.", type: "side", difficulty: 2, xp: 25, skill: "Tech & Automatización" },
        { title: "Cálculo de ROI", description: "Crea una calculadora simple: 'Te ahorro X horas al mes = $Y dinero ahorrado'. Úsala en ventas.", type: "side", difficulty: 2, xp: 25, skill: "Ventas & Outreach" },
        { title: "Conectar Webhook", description: "Haz que un formulario envíe datos a Slack/Discord vía Webhook exitosamente.", type: "main", difficulty: 2, xp: 25, skill: "Tech & Automatización" }
      ],
      "Creator Engine": [
        { title: "Banco de Ideas", description: "Llena una nota con 20 ideas de contenido crudas. No juzgues, solo escribe.", type: "side", difficulty: 1, xp: 10, skill: "Contenido & Distribución" },
        { title: "Batch Recording", description: "Graba 3 videos cortos en una sola sesión de una hora.", type: "main", difficulty: 3, xp: 60, skill: "Contenido & Distribución" },
        { title: "Responder Comentarios", description: "Dedica 15 min a responder comentarios en tus posts o en posts de referentes de tu nicho.", type: "daily", difficulty: 1, xp: 10, skill: "Contenido & Distribución" },
        { title: "Optimización de Bio", description: "Reescribe tu biografía: Quién eres + De qué hablas + Prueba social/Link.", type: "side", difficulty: 1, xp: 10, skill: "Oferta & Copy" },
        { title: "Análisis de Virales", description: "Busca 3 videos virales en tu nicho y escribe por qué funcionaron (Hook, Retención, Payoff).", type: "side", difficulty: 2, xp: 25, skill: "Contenido & Distribución" }
      ]
    };

    console.log("[seed-db] Starting cleanup...");

    // 2. LIMPIEZA (Ojo: Esto borra misiones y tracks existentes para evitar duplicados)
    // Primero desvinculamos perfiles de tracks para no romper FKs
    await supabase.from('profiles').update({ track_id: null }).neq('user_id', '00000000-0000-0000-0000-000000000000');
    
    // Borramos datos dependientes primero
    await supabase.from('user_mission_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('mission_steps').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('missions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Borramos catálogo base
    await supabase.from('tracks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log("[seed-db] Cleanup done. Inserting new data...");

    // 3. INSERCIÓN DE SKILLS
    const skillMap = {};
    for (const skill of SKILLS) {
      const { data, error } = await supabase.from('skills').insert(skill).select().single();
      if (error) throw error;
      skillMap[skill.name] = data.id;
    }

    // 4. INSERCIÓN DE TRACKS
    const trackMap = {};
    for (const track of TRACKS) {
      const { data, error } = await supabase.from('tracks').insert(track).select().single();
      if (error) throw error;
      trackMap[track.name] = data.id;
    }

    // 5. INSERCIÓN DE MISIONES
    const missionsToInsert = [];

    // A. Universales
    UNIVERSAL_MISSIONS.forEach(m => {
      missionsToInsert.push({
        title: m.title,
        description: m.description,
        type: m.type,
        difficulty: m.difficulty,
        xp_reward: m.xp,
        skill_id: skillMap[m.skill],
        track_id: null, // Universal
        is_active: true
      });
    });

    // B. Por Track
    for (const [trackName, missions] of Object.entries(TRACK_MISSIONS)) {
      const trackId = trackMap[trackName];
      missions.forEach(m => {
        missionsToInsert.push({
          title: m.title,
          description: m.description,
          type: m.type,
          difficulty: m.difficulty,
          xp_reward: m.xp,
          skill_id: skillMap[m.skill],
          track_id: trackId,
          is_active: true
        });
      });
    }

    const { error: missionError } = await supabase.from('missions').insert(missionsToInsert);
    if (missionError) throw missionError;

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Database seeded successfully with normalized tracks and magic missions." 
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