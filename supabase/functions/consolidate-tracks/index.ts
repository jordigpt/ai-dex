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

    // Lista ampliada de fusiones según tus indicaciones
    const MERGES = [
      // Corrección Microproductos
      { from: 'Microproductos', to: 'Micro-productos' },
      { from: 'Micro productos', to: 'Micro-productos' },
      
      // Corrección Agencia
      { from: 'Agencia Automatización', to: 'Agencia de Automatización' },
      { from: 'Agencia / Automatización', to: 'Agencia de Automatización' },
      { from: 'Automatizaciones / Agencia', to: 'Agencia de Automatización' },
      { from: 'Automatización Agencia', to: 'Agencia de Automatización' },
      
      // Corrección Coaching
      { from: '1:1 / Coaching', to: 'Sesiones 1:1 / Coaching' },
      { from: 'Coaching', to: 'Sesiones 1:1 / Coaching' }
    ];
    
    const results = [];

    for (const merge of MERGES) {
      // 1. Buscar IDs de Origen (Malos)
      // Usamos ilike para case-insensitive
      const { data: badTracks } = await supabase
        .from('tracks')
        .select('id, name')
        .ilike('name', merge.from);

      if (!badTracks || badTracks.length === 0) {
        // No hay nada que corregir para este patrón
        continue;
      }

      // 2. Buscar ID del Destino (Bueno)
      // IMPORTANTE: Buscamos también con ilike para asegurar que lo encontramos si existe con dif mayúsculas
      let { data: goodTracksFound } = await supabase
        .from('tracks')
        .select('id, name')
        .ilike('name', merge.to); // "Micro-productos" vs "Micro-Productos"

      let goodTrack = goodTracksFound && goodTracksFound.length > 0 ? goodTracksFound[0] : null;
      let goodId = goodTrack?.id;

      // Si no existe el destino, tenemos que convertir uno de los malos en el bueno
      if (!goodId) {
        const trackToRename = badTracks[0];
        console.log(`Target ${merge.to} not found. Renaming ${trackToRename.name}...`);
        
        const { data: renamed, error: renameError } = await supabase
          .from('tracks')
          .update({ name: merge.to })
          .eq('id', trackToRename.id)
          .select()
          .single();
          
        if (renameError) {
          // Si falla el renombre (ej: unique constraint que no vimos), logueamos y saltamos
          console.error(`Error renaming track ${trackToRename.name}: ${renameError.message}`);
          results.push(`Error: Could not rename ${trackToRename.name} to ${merge.to}`);
          continue;
        }

        goodId = renamed.id;
        results.push(`Created target: ${merge.to} (Renamed from ${trackToRename.name})`);
        
        // Lo sacamos de la lista de "badTracks" para no procesarlo como "malo" abajo
        // Filtramos por ID para ser seguros
        const index = badTracks.findIndex(t => t.id === goodId);
        if (index > -1) {
            badTracks.splice(index, 1);
        }
      }

      // 3. Mover Misiones y Perfiles de los restantes Malos al Bueno
      for (const badTrack of badTracks) {
        if (badTrack.id === goodId) continue; // Safety check

        console.log(`Merging ${badTrack.name} (${badTrack.id}) into ${merge.to} (${goodId})...`);

        // A. Mover Misiones
        const { error: mError } = await supabase
          .from('missions')
          .update({ track_id: goodId })
          .eq('track_id', badTrack.id);
        
        if (mError) {
            results.push(`Failed to move missions for ${badTrack.name}: ${mError.message}`);
            continue;
        }

        // B. Mover Perfiles (Usuarios)
        const { error: pError } = await supabase
          .from('profiles')
          .update({ track_id: goodId })
          .eq('track_id', badTrack.id);

        if (pError) {
            results.push(`Failed to move profiles for ${badTrack.name}: ${pError.message}`);
            continue;
        }

        // C. Borrar el Track Malo
        const { error: dError } = await supabase
          .from('tracks')
          .delete()
          .eq('id', badTrack.id);

        if (dError) {
            results.push(`Failed to delete track ${badTrack.name}: ${dError.message}`);
        } else {
            results.push(`Merged: ${badTrack.name} -> ${merge.to}`);
        }
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
    // Devolvemos 400 pero con JSON claro
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})