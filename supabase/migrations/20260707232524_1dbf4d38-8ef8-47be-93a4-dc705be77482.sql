DROP POLICY IF EXISTS "Anyone can post reviews" ON public.reviews;
CREATE POLICY "Anyone can post valid reviews" ON public.reviews
FOR INSERT TO anon, authenticated
WITH CHECK (
  rating BETWEEN 1 AND 5
  AND char_length(trim(first_name)) BETWEEN 1 AND 50
  AND char_length(trim(body)) BETWEEN 1 AND 300
);