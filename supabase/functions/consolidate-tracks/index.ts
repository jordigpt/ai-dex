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

    // Lista de correcciones: { from: 'Nombre Incorrecto', to: 'Nombre Correcto' }
    const MERGES = [
      { from: 'Microproductos', to: 'Micro-productos' },
      { from: 'Automatizaciones / Agencia', to: 'Agencia de Automatización' },
      { from: 'Agencia / Automatización', to: 'Agencia de Automatización' },
      { from: '1:1 / Coaching', to: 'Sesiones 1:1 / Coaching' }
    ];
    
    // Asegurarnos que existan los targets primero (si no existen, los creamos)
    // Pero idealmente ya existen o los renombramos.
    
    const results = [];

    for (const merge of MERGES) {
      // 1. Buscar ID del Origen (Malo)
      const { data: badTracks } = await supabase
        .from('tracks')
        .select('id, name')
        .ilike('name', merge.from); // case insensitive match

      if (!badTracks || badTracks.length === 0) {
        results.push(`Skipped: No source found for ${merge.from}`);
        continue;
      }

      // 2. Buscar ID del Destino (Bueno)
      let { data: goodTrack } = await supabase
        .from('tracks')
        .select('id')
        .eq('name', merge.to)
        .maybeSingle();

      // Si no existe el destino, renombramos el primero de los malos y usamos ese como destino
      if (!goodTrack) {
        console.log(`Target ${merge.to} not found. Renaming ${badTracks[0].name}...`);
        
        const { data: renamed, error: renameError } = await supabase
          .from('tracks')
          .update({ name: merge.to })
          .eq('id', badTracks[0].id)
          .select()
          .single();
          
        if (renameError) throw renameError;
        goodTrack = renamed;
        
        // Removemos el que acabamos de renombrar de la lista de "malos" para no borrarlo luego
        badTracks.shift(); 
      }

      const goodId = goodTrack.id;

      // 3. Mover Misiones y Perfiles de los Malos al Bueno
      for (const badTrack of badTracks) {
        if (badTrack.id === goodId) continue; // Safety check

        console.log(`Merging ${badTrack.name} (${badTrack.id}) into ${merge.to} (${goodId})...`);

        // Mover Misiones
        await supabase
          .from('missions')
          .update({ track_id: goodId })
          .eq('track_id', badTrack.id);

        // Mover Perfiles (Usuarios)
        await supabase
          .from('profiles')
          .update({ track_id: goodId })
          .eq('track_id', badTrack.id);

        // Borrar el Track Malo
        await supabase
          .from('tracks')
          .delete()
          .eq('id', badTrack.id);
          
        results.push(`Merged: ${badTrack.name} -> ${merge.to}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("[consolidate-tracks] error", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})