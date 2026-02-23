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

    // === PASO 0: AUTO-CORRECCIÓN DE NOMBRES DE TRACKS ===
    // Esto asegura que si el usuario tiene "Agencia / Automatización", se renombre a "Agencia de Automatización"
    // ANTES de intentar insertar las misiones, para que las encuentre.
    console.log("Iniciando auto-corrección de tracks...");
    const RENAMES = [
      { bad: 'Agencia / Automatización', good: 'Agencia de Automatización' },
      { bad: 'Agencia Automatización', good: 'Agencia de Automatización' },
      { bad: 'Microproductos', good: 'Micro-productos' },
      { bad: '1:1 / Coaching', good: 'Sesiones 1:1 / Coaching' }
    ];

    for (const item of RENAMES) {
      // Buscamos si existe el track con el nombre "malo"
      const { data: badTracks } = await supabase.from('tracks').select('id').eq('name', item.bad);
      
      if (badTracks && badTracks.length > 0) {
        // Buscamos si ya existe el "bueno"
        const { data: goodTracks } = await supabase.from('tracks').select('id').eq('name', item.good);
        
        if (goodTracks && goodTracks.length > 0) {
           // Si AMBOS existen, movemos las cosas al bueno y borramos el malo (mini-consolidación)
           const goodId = goodTracks[0].id;
           for (const badTrack of badTracks) {
              await supabase.from('missions').update({ track_id: goodId }).eq('track_id', badTrack.id);
              await supabase.from('profiles').update({ track_id: goodId }).eq('track_id', badTrack.id);
              await supabase.from('tracks').delete().eq('id', badTrack.id);
           }
        } else {
           // Si solo existe el malo, simplemente lo renombramos
           for (const badTrack of badTracks) {
              await supabase.from('tracks').update({ name: item.good }).eq('id', badTrack.id);
           }
        }
      }
    }


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
        name: "Micro-productos", 
        description: "Productos digitales de bajo ticket, plantillas y cursos grabados." 
      },
      { 
        name: "Servicios / Consultoría", 
        description: "Agencia B2B, consultoría y servicios 'Done-For-You'." 
      },
      { 
        name: "Sesiones 1:1 / Coaching", 
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
      "Micro-productos": [
        { title: "El Problema de 1 Millón de Dólares", description: "Identifica un problema doloroso y urgente que puedas resolver con un PDF de 5 páginas.", type: "side", difficulty: 2, xp: 25, skill: "Oferta & Copy" },
        { title: "Esquema del Lead Magnet", description: "Crea el índice (Table of Contents) de tu producto gratuito o de bajo coste.", type: "main", difficulty: 2, xp: 25, skill: "Oferta & Copy" },
        { title: "Landing Page MVP", description: "Monta una página simple (Notion/Carrd) con: Promesa, 3 Beneficios y Botón de compra/descarga.", type: "main", difficulty: 3, xp: 60, skill: "Tech & Automatización" },
        { title: "3 Hooks de Contenido", description: "Escribe 3 ganchos para TikTok/Reels que ataquen directamente el problema que resuelve tu producto.", type: "daily", difficulty: 1, xp: 10, skill: "Contenido & Distribución" },
        { title: "Venta Beta", description: "Consigue que 1 persona te pague (o descargue) tu producto antes de terminarlo al 100%.", type: "main", difficulty: 4, xp: 120, skill: "Ventas & Outreach" },
        { title: "Lanzamiento a Lista de Espera", description: "Envía el email de apertura de carrito a los leads que has captado. Es hora de la verdad.", type: "main", difficulty: 3, xp: 60, skill: "Ventas & Outreach" },
        { title: "Objetivo: $100 Facturados", description: "Consigue tus primeros $100 acumulados vendiendo tu micro-producto. Valida que el mercado quiere lo que ofreces.", type: "main", difficulty: 4, xp: 120, skill: "Ventas & Outreach" }
      ],
      "Servicios / Consultoría": [
        { title: "Oferta Irresistible", description: "Redacta tu promesa: 'Ayudo a [Nicho] a lograr [Resultado] en [Tiempo] sin [Dolor]'.", type: "main", difficulty: 2, xp: 25, skill: "Oferta & Copy" },
        { title: "Lista de 50 Prospectos", description: "Busca 50 empresas/personas que encajen con tu servicio. Ponlos en un Excel/Notion.", type: "side", difficulty: 2, xp: 25, skill: "Ventas & Outreach" },
        { title: "El Loom de Valor", description: "Graba un video de 3-5 min auditando la situación de un prospecto y envíaselo gratis.", type: "daily", difficulty: 2, xp: 25, skill: "Ventas & Outreach" },
        { title: "Propuesta Estándar", description: "Crea una plantilla de propuesta PDF que puedas reutilizar. No reinventes la rueda cada vez.", type: "main", difficulty: 3, xp: 60, skill: "Oferta & Copy" },
        { title: "Case Study Express", description: "Escribe un documento de 1 página explicando cómo resolviste un problema similar en el pasado (o cómo lo harías).", type: "side", difficulty: 2, xp: 25, skill: "Contenido & Distribución" },
        { title: "Enviar Factura #1", description: "Emite y envía tu primera factura real a un cliente comprometido. Usa Stripe, PayPal o transferencia.", type: "main", difficulty: 3, xp: 60, skill: "Tech & Automatización" },
        { title: "Dinero en el Banco", description: "Confirma la recepción de tu primer pago por servicios high-ticket. La validación definitiva.", type: "main", difficulty: 4, xp: 120, skill: "Ventas & Outreach" }
      ],
      "Sesiones 1:1 / Coaching": [
        { title: "Historia de Origen", description: "Escribe un post/guion contando tu historia de transformación. ¿Por qué eres el guía adecuado?", type: "main", difficulty: 2, xp: 25, skill: "Contenido & Distribución" },
        { title: "Estructura de Sesión", description: "Diseña el framework de tu llamada de coaching. ¿Qué pasa en el min 0, 15, 30 y 60?", type: "main", difficulty: 3, xp: 60, skill: "Delivery & Servicio" },
        { title: "Reactivación de Red", description: "Escribe a 5 ex-compañeros o amigos contando qué estás ofreciendo ahora.", type: "side", difficulty: 1, xp: 10, skill: "Ventas & Outreach" },
        { title: "Entrevista de Investigación", description: "Agenda una llamada de 15 min con alguien de tu nicho solo para preguntar sus dolores. No vendas.", type: "side", difficulty: 2, xp: 25, skill: "Oferta & Copy" },
        { title: "Publicar Prueba Social", description: "Sube una captura (anonimizada si es necesario) de alguien agradeciéndote por un consejo.", type: "daily", difficulty: 1, xp: 10, skill: "Contenido & Distribución" },
        { title: "Venta de Pack 4 Sesiones", description: "Convierte una sesión única en un compromiso de un mes (4 sesiones). Aumenta tu LTV.", type: "main", difficulty: 4, xp: 120, skill: "Ventas & Outreach" },
        { title: "High-Ticket Closer", description: "Cierra un programa de coaching de alto valor (> $500) y recibe el pago.", type: "main", difficulty: 4, xp: 120, skill: "Ventas & Outreach" }
      ],
      "Creator Engine": [
        { title: "Banco de Ideas", description: "Llena una nota con 20 ideas de contenido crudas. No juzgues, solo escribe.", type: "side", difficulty: 1, xp: 10, skill: "Contenido & Distribución" },
        { title: "Batch Recording", description: "Graba 3 videos cortos en una sola sesión de una hora.", type: "main", difficulty: 3, xp: 60, skill: "Contenido & Distribución" },
        { title: "Responder Comentarios", description: "Dedica 15 min a responder comentarios en tus posts o en posts de referentes de tu nicho.", type: "daily", difficulty: 1, xp: 10, skill: "Contenido & Distribución" },
        { title: "Optimización de Bio", description: "Reescribe tu biografía: Quién eres + De qué hablas + Prueba social/Link.", type: "side", difficulty: 1, xp: 10, skill: "Oferta & Copy" },
        { title: "Análisis de Virales", description: "Busca 3 videos virales en tu nicho y escribe por qué funcionaron (Hook, Retención, Payoff).", type: "side", difficulty: 2, xp: 25, skill: "Contenido & Distribución" },
        { title: "Definir 3 Pilares", description: "Define tus 3 temas principales. Ejemplo: IA, Productividad, Negocios. Esto da foco a tu audiencia.", type: "side", difficulty: 2, xp: 25, skill: "Contenido & Distribución" },
        { title: "Lista de 20 Hooks", description: "Escribe 20 frases de inicio que detengan el scroll. Usa fórmulas como 'Cómo X sin Y' o 'El error #1'.", type: "side", difficulty: 2, xp: 25, skill: "Contenido & Distribución" },
        { title: "Calendario de 14 Días", description: "Planifica los títulos y formatos de contenido para las próximas 2 semanas. Elimina la decisión diaria.", type: "main", difficulty: 3, xp: 60, skill: "Contenido & Distribución" },
        { title: "Script DM de Diagnóstico", description: "Crea un guion para DM que identifique el problema del prospecto sin vender. Ej: '¿Estás intentando escalar X o solo empezando?'", type: "side", difficulty: 2, xp: 25, skill: "Ventas & Outreach" },
        { title: "Iniciar 5 Conversaciones", description: "Responde a 5 historias o comentarios con preguntas genuinas para abrir conversaciones.", type: "daily", difficulty: 1, xp: 10, skill: "Ventas & Outreach" },
        { title: "SOP de Producción Semanal", description: "Escribe el paso a paso de tu proceso creativo: Idea -> Guion -> Grabación -> Edición -> Publicación.", type: "side", difficulty: 2, xp: 25, skill: "Tech & Automatización" },
        { title: "Ritual de Planificación", description: "Dedica 10 minutos a revisar qué contenido sale mañana y preparar los assets necesarios.", type: "daily", difficulty: 1, xp: 10, skill: "Tech & Automatización" },
        { title: "Librería de Assets", description: "Organiza tus carpetas: Logos, Fotos, B-Roll, Música. Ten todo a un clic de distancia.", type: "side", difficulty: 2, xp: 25, skill: "Tech & Automatización" },
        { title: "Repurpose 1 a 3", description: "Toma tu mejor video/post y conviértelo en: 1 Tweet, 1 Story y 1 Email/LinkedIn post.", type: "side", difficulty: 2, xp: 25, skill: "Contenido & Distribución" },
        { title: "Checklist de Publicación", description: "Crea una lista de chequeo pre-publicación: ¿Tiene subtítulos? ¿Audio limpio? ¿Link en bio actualizado?", type: "side", difficulty: 2, xp: 25, skill: "Tech & Automatización" },
        { title: "Streak de 7 Días", description: "Publica contenido durante 7 días consecutivos sin fallar. La consistencia es el rey.", type: "main", difficulty: 3, xp: 60, skill: "Contenido & Distribución" },
        { title: "Primera Comisión de Afiliado", description: "Genera una venta a través de un link de afiliado de una herramienta que recomiendes y uses.", type: "main", difficulty: 3, xp: 60, skill: "Ventas & Outreach" },
        { title: "Cierre por DM / Sponsor", description: "Consigue tu primera venta propia, cliente o acuerdo de patrocinio puramente a través de chat privado.", type: "main", difficulty: 4, xp: 120, skill: "Ventas & Outreach" }
      ],

      // ============================================
      // TRACK DE AGENCIA DE AUTOMATIZACIÓN (RENOVADO)
      // ============================================
      "Agencia de Automatización": [
        // --- FASE 1: FUNDAMENTOS & TECH (Main Quest Inicial) ---
        { title: "Nicho & Dolor Específico", description: "No digas 'Hago automatizaciones'. Di: 'Ayudo a Inmobiliarias a cualificar leads en WhatsApp'. Define tu nicho hoy.", type: "main", difficulty: 2, xp: 25, skill: "Oferta & Copy" },
        { title: "Tu Stack Tecnológico", description: "Elige tus armas: Make vs n8n. OpenAI vs Anthropic. Airtable vs Supabase. Crea cuentas en tu stack elegido.", type: "side", difficulty: 1, xp: 10, skill: "Tech & Automatización" },
        { title: "Diagrama del 'Caballo de Troya'", description: "Dibuja un proceso simple (ej: Lead Magnet -> Email -> CRM) que puedas regalar o vender muy barato para entrar en un cliente.", type: "main", difficulty: 2, xp: 25, skill: "Tech & Automatización" },
        
        // --- FASE 2: CONSTRUCCIÓN DE ACTIVOS (Main Quest Media) ---
        { title: "Demo de Chatbot/Workflow", description: "Construye un prototipo funcional que resuelva UN problema (ej: agendar citas). Graba un video usándolo.", type: "main", difficulty: 3, xp: 60, skill: "Tech & Automatización" },
        { title: "Calculadora de Costes Fantasma", description: "Crea un Excel/Sheet simple que calcule: (Horas perdidas x Sueldo hora) = Dinero quemado al mes. Herramienta de venta brutal.", type: "side", difficulty: 2, xp: 25, skill: "Ventas & Outreach" },
        { title: "Landing/PDF de 'Antes vs Después'", description: "Crea un documento visual simple. Izquierda: Caos, Excel manual, estrés. Derecha: Tu sistema, paz, dashboards.", type: "main", difficulty: 2, xp: 25, skill: "Oferta & Copy" },
        
        // --- SIDE QUESTS TÉCNICAS (Para ganar credibilidad) ---
        { title: "Maestría en Webhooks", description: "Conecta dos apps que no tengan integración nativa usando un Webhook y un HTTP Request. La base de todo.", type: "side", difficulty: 2, xp: 25, skill: "Tech & Automatización" },
        { title: "El 'Error Handler'", description: "Configura un módulo de manejo de errores en Make/n8n que te envíe un email/Slack si el bot falla. Profesionalidad pura.", type: "side", difficulty: 3, xp: 60, skill: "Tech & Automatización" },
        { title: "Scraping de Leads B2B", description: "Usa Apollo, Instant Data Scraper o Clay para obtener una lista de 50 empresas en tu nicho con emails verificados.", type: "side", difficulty: 2, xp: 25, skill: "Tech & Automatización" },
        
        // --- DAILY QUESTS (Hábitos de Agencia) ---
        { title: "Outreach 'Puedo arreglar eso'", description: "Busca empresas con procesos rotos (ej: formularios lentos) y mándales un video de cómo lo arreglarías.", type: "daily", difficulty: 2, xp: 25, skill: "Ventas & Outreach" },
        { title: "Mantenimiento Preventivo", description: "Entra a tus escenarios de Make/n8n y revisa los logs de ejecución. ¿Algún fallo silencioso?", type: "daily", difficulty: 1, xp: 10, skill: "Tech & Automatización" },
        { title: "Networking Táctico", description: "Comenta en 3 posts de dueños de negocio en LinkedIn/Twitter aportando una visión de eficiencia/sistemas.", type: "daily", difficulty: 1, xp: 10, skill: "Contenido & Distribución" },
        { title: "10 DMs de Valor", description: "Envía 10 mensajes a tu lista de scraping preguntando si tienen X problema (sin vender la solución aun).", type: "daily", difficulty: 1, xp: 10, skill: "Ventas & Outreach" },
        
        // --- FASE 3: MONETIZACIÓN & CIERRE (Main Quest Final) ---
        { title: "La Reunión de Discovery", description: "Agenda y ejecuta una llamada donde NO vendas. Solo diagnostica el coste de su ineficiencia usando tu calculadora.", type: "main", difficulty: 3, xp: 60, skill: "Ventas & Outreach" },
        { title: "Propuesta de ROI Infinito", description: "Envía una propuesta donde el precio sea irrelevante comparado con el dinero que van a ahorrar/ganar.", type: "main", difficulty: 3, xp: 60, skill: "Oferta & Copy" },
        { title: "Cierre del Cliente Beta", description: "Consigue tu primer 'SÍ'. Cobra aunque sea un precio reducido a cambio de un testimonio en video.", type: "main", difficulty: 4, xp: 120, skill: "Ventas & Outreach" },
        
        // --- FASE 4: EL SANTO GRIAL (Facturación Real) ---
        { title: "Cobrar Setup Fee (> $500)", description: "Recibe el pago inicial por la implementación. Valida que tu tiempo y expertise tienen valor de mercado.", type: "main", difficulty: 4, xp: 120, skill: "Ventas & Outreach" },
        { title: "El Contrato de Retainer (MRR)", description: "Firma un acuerdo de mantenimiento mensual. Aquí es donde una agencia se vuelve un negocio real y estable.", type: "main", difficulty: 4, xp: 120, skill: "Ventas & Outreach" },
        { title: "Upsell de Funcionalidad", description: "Ofrece una característica extra (ej: dashboard de analítica) a un cliente actual por un pago único adicional.", type: "side", difficulty: 3, xp: 60, skill: "Ventas & Outreach" }
      ]
    };

    let insertedCount = 0;
    let skippedCount = 0;

    console.log("[seed-db] Starting smart sync...");

    // 2. SKILLS
    const skillMap = {};
    const { data: existingSkills } = await supabase.from('skills').select('id, name');
    const existingSkillMap = existingSkills ? Object.fromEntries(existingSkills.map(s => [s.name, s.id])) : {};

    for (const skill of SKILLS) {
      if (existingSkillMap[skill.name]) {
         skillMap[skill.name] = existingSkillMap[skill.name];
      } else {
         const { data, error } = await supabase.from('skills').insert(skill).select().single();
         if (error) { console.error("Skill error", error); continue; }
         skillMap[skill.name] = data.id;
      }
    }

    // 3. TRACKS
    // Refrescamos tracks después de la auto-corrección
    const trackMap = {};
    const { data: existingTracks } = await supabase.from('tracks').select('id, name');
    const existingTrackMap = existingTracks ? Object.fromEntries(existingTracks.map(t => [t.name, t.id])) : {};

    for (const track of TRACKS) {
       if (existingTrackMap[track.name]) {
          trackMap[track.name] = existingTrackMap[track.name];
       } else {
          const { data, error } = await supabase.from('tracks').insert(track).select().single();
          if (error) { console.error("Track error", error); continue; }
          trackMap[track.name] = data.id;
       }
    }

    // 4. MISIONES
    const { data: existingMissions } = await supabase.from('missions').select('title, track_id');
    const existingMissionSet = new Set(
       existingMissions?.map(m => `${m.title}-${m.track_id || 'null'}`) || []
    );

    const missionsToInsert = [];

    // A. Universales
    UNIVERSAL_MISSIONS.forEach(m => {
      const key = `${m.title}-null`;
      if (!existingMissionSet.has(key)) {
        missionsToInsert.push({
          title: m.title,
          description: m.description,
          type: m.type,
          difficulty: m.difficulty,
          xp_reward: m.xp,
          skill_id: skillMap[m.skill],
          track_id: null,
          is_active: true
        });
      } else {
        skippedCount++;
      }
    });

    // B. Por Track
    for (const [trackName, missions] of Object.entries(TRACK_MISSIONS)) {
      const trackId = trackMap[trackName];
      if (!trackId) continue;

      missions.forEach(m => {
        const key = `${m.title}-${trackId}`;
        if (!existingMissionSet.has(key)) {
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
        } else {
          skippedCount++;
        }
      });
    }

    if (missionsToInsert.length > 0) {
       const chunkSize = 50;
       for (let i = 0; i < missionsToInsert.length; i += chunkSize) {
          const chunk = missionsToInsert.slice(i, i + chunkSize);
          const { error: missionError } = await supabase.from('missions').insert(chunk);
          if (missionError) console.error("Mission insert error", missionError);
          else insertedCount += chunk.length;
       }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Sync completado. ${insertedCount} misiones nuevas. ${skippedCount} existentes. Tracks corregidos.`,
      stats: { inserted: insertedCount, skipped: skippedCount }
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