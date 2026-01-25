-- Add RLS policy to allow public/anonymous inserts to preorders table
CREATE POLICY "Public can create preorders"
ON public.preorders
FOR INSERT
TO anon
WITH CHECK (true);

-- Add RLS policy to allow public to view routes for the booking form
CREATE POLICY "Public can view routes"
ON public.routes
FOR SELECT
TO anon
USING (true);