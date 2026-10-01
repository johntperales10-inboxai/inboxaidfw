-- Supabase's default privileges give anon/authenticated full table rights on new
-- public tables. RLS already blocks what the policies don't allow, but keep the
-- grants to exactly what the app uses as a second line of defense.
REVOKE ALL ON public.purchases FROM anon, authenticated;
GRANT SELECT ON public.purchases TO authenticated;

REVOKE ALL ON public.reviews FROM anon, authenticated;
GRANT SELECT, INSERT ON public.reviews TO anon, authenticated;
