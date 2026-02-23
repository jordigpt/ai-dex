-- Crear tabla de dependencias entre skills
CREATE TABLE IF NOT EXISTS public.skill_dependencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    child_skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_skill_id, child_skill_id)
);

-- Habilitar RLS
ALTER TABLE public.skill_dependencies ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Public read access for dependencies" ON public.skill_dependencies
FOR SELECT TO authenticated USING (true);

-- Solo admins pueden modificar (asumiendo que existe la función is_admin)
CREATE POLICY "Admins can modify dependencies" ON public.skill_dependencies
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Actualizar tabla skills con nuevos campos
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS impact_description TEXT;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';