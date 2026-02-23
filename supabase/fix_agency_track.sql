-- 1. CORREGIR EL NOMBRE DEL TRACK
-- Si tienes un track con el nombre viejo, lo actualizamos.
UPDATE public.tracks
SET name = 'Agencia de Automatización'
WHERE name IN ('Agencia / Automatización', 'Agencia Automatización', 'Automatizaciones / Agencia');

-- Si no existe, lo creamos (por seguridad)
INSERT INTO public.tracks (name, description)
SELECT 'Agencia de Automatización', 'Implementación de IA, chatbots y workflows (n8n/Zapier) para empresas.'
WHERE NOT EXISTS (SELECT 1 FROM public.tracks WHERE name = 'Agencia de Automatización');

-- 2. BLOQUE LÓGICO PARA INSERTAR MISIONES
DO $$
DECLARE
    v_track_id uuid;
    v_skill_tech uuid;
    v_skill_sales uuid;
    v_skill_offer uuid;
    v_skill_content uuid;
BEGIN
    -- Obtener ID del Track (ahora seguro existe)
    SELECT id INTO v_track_id FROM public.tracks WHERE name = 'Agencia de Automatización' LIMIT 1;
    
    -- Obtener o Crear IDs de Skills necesarias
    
    -- Tech & Automatización
    SELECT id INTO v_skill_tech FROM public.skills WHERE name = 'Tech & Automatización';
    IF v_skill_tech IS NULL THEN
        INSERT INTO public.skills (name, description) VALUES ('Tech & Automatización', 'Sistemas, herramientas y eficiencia.') RETURNING id INTO v_skill_tech;
    END IF;

    -- Ventas & Outreach
    SELECT id INTO v_skill_sales FROM public.skills WHERE name = 'Ventas & Outreach';
    IF v_skill_sales IS NULL THEN
        INSERT INTO public.skills (name, description) VALUES ('Ventas & Outreach', 'Prospección, negociación y cierre.') RETURNING id INTO v_skill_sales;
    END IF;

    -- Oferta & Copy
    SELECT id INTO v_skill_offer FROM public.skills WHERE name = 'Oferta & Copy';
    IF v_skill_offer IS NULL THEN
        INSERT INTO public.skills (name, description) VALUES ('Oferta & Copy', 'Creación de valor, packaging y escritura persuasiva.') RETURNING id INTO v_skill_offer;
    END IF;

    -- Contenido & Distribución
    SELECT id INTO v_skill_content FROM public.skills WHERE name = 'Contenido & Distribución';
    IF v_skill_content IS NULL THEN
        INSERT INTO public.skills (name, description) VALUES ('Contenido & Distribución', 'Atención, tráfico y marca personal.') RETURNING id INTO v_skill_content;
    END IF;

    -- 3. INSERTAR MISIONES (Verificando que no existan para no duplicar)

    -- FASE 1: FUNDAMENTOS
    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Nicho & Dolor Específico', 'No digas ''Hago automatizaciones''. Di: ''Ayudo a Inmobiliarias a cualificar leads en WhatsApp''. Define tu nicho hoy.', 'main', 2, 25, v_skill_offer, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Nicho & Dolor Específico' AND track_id = v_track_id);

    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Tu Stack Tecnológico', 'Elige tus armas: Make vs n8n. OpenAI vs Anthropic. Airtable vs Supabase. Crea cuentas en tu stack elegido.', 'side', 1, 10, v_skill_tech, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Tu Stack Tecnológico' AND track_id = v_track_id);

    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Diagrama del ''Caballo de Troya''', 'Dibuja un proceso simple (ej: Lead Magnet -> Email -> CRM) que puedas regalar o vender muy barato para entrar en un cliente.', 'main', 2, 25, v_skill_tech, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Diagrama del ''Caballo de Troya''' AND track_id = v_track_id);

    -- FASE 2: CONSTRUCCIÓN
    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Demo de Chatbot/Workflow', 'Construye un prototipo funcional que resuelva UN problema (ej: agendar citas). Graba un video usándolo.', 'main', 3, 60, v_skill_tech, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Demo de Chatbot/Workflow' AND track_id = v_track_id);

    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Calculadora de Costes Fantasma', 'Crea un Excel/Sheet simple que calcule: (Horas perdidas x Sueldo hora) = Dinero quemado al mes. Herramienta de venta brutal.', 'side', 2, 25, v_skill_sales, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Calculadora de Costes Fantasma' AND track_id = v_track_id);

    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Landing/PDF de ''Antes vs Después''', 'Crea un documento visual simple. Izquierda: Caos, Excel manual, estrés. Derecha: Tu sistema, paz, dashboards.', 'main', 2, 25, v_skill_offer, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Landing/PDF de ''Antes vs Después''' AND track_id = v_track_id);

    -- SIDE QUESTS
    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Maestría en Webhooks', 'Conecta dos apps que no tengan integración nativa usando un Webhook y un HTTP Request. La base de todo.', 'side', 2, 25, v_skill_tech, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Maestría en Webhooks' AND track_id = v_track_id);

    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'El ''Error Handler''', 'Configura un módulo de manejo de errores en Make/n8n que te envíe un email/Slack si el bot falla. Profesionalidad pura.', 'side', 3, 60, v_skill_tech, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'El ''Error Handler''' AND track_id = v_track_id);

    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Scraping de Leads B2B', 'Usa Apollo, Instant Data Scraper o Clay para obtener una lista de 50 empresas en tu nicho con emails verificados.', 'side', 2, 25, v_skill_tech, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Scraping de Leads B2B' AND track_id = v_track_id);

    -- DAILY
    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Outreach ''Puedo arreglar eso''', 'Busca empresas con procesos rotos (ej: formularios lentos) y mándales un video de cómo lo arreglarías.', 'daily', 2, 25, v_skill_sales, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Outreach ''Puedo arreglar eso''' AND track_id = v_track_id);

    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Mantenimiento Preventivo', 'Entra a tus escenarios de Make/n8n y revisa los logs de ejecución. ¿Algún fallo silencioso?', 'daily', 1, 10, v_skill_tech, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Mantenimiento Preventivo' AND track_id = v_track_id);
    
    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT '10 DMs de Valor', 'Envía 10 mensajes a tu lista de scraping preguntando si tienen X problema (sin vender la solución aun).', 'daily', 1, 10, v_skill_sales, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = '10 DMs de Valor' AND track_id = v_track_id);

    -- FASE 3 & 4
    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'La Reunión de Discovery', 'Agenda y ejecuta una llamada donde NO vendas. Solo diagnostica el coste de su ineficiencia usando tu calculadora.', 'main', 3, 60, v_skill_sales, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'La Reunión de Discovery' AND track_id = v_track_id);

    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Propuesta de ROI Infinito', 'Envía una propuesta donde el precio sea irrelevante comparado con el dinero que van a ahorrar/ganar.', 'main', 3, 60, v_skill_offer, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Propuesta de ROI Infinito' AND track_id = v_track_id);

    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Cierre del Cliente Beta', 'Consigue tu primer ''SÍ''. Cobra aunque sea un precio reducido a cambio de un testimonio en video.', 'main', 4, 120, v_skill_sales, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Cierre del Cliente Beta' AND track_id = v_track_id);
    
    INSERT INTO public.missions (title, description, type, difficulty, xp_reward, skill_id, track_id, is_active)
    SELECT 'Cobrar Setup Fee (> $500)', 'Recibe el pago inicial por la implementación. Valida que tu tiempo y expertise tienen valor de mercado.', 'main', 4, 120, v_skill_sales, v_track_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Cobrar Setup Fee (> $500)' AND track_id = v_track_id);

END $$;