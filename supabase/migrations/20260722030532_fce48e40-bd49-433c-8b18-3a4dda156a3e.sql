CREATE TABLE public.purchases (
  email text PRIMARY KEY,
  source text NOT NULL DEFAULT 'gumroad',
  order_id text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own purchase" ON public.purchases
  FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')));
GRANT SELECT ON public.purchases TO authenticated;