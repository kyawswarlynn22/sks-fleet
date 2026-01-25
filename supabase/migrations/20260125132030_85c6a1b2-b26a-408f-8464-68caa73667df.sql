-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true);

-- Allow public to upload payment proof images
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow public to view payment proofs
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Add payment_proof_url column to preorders table
ALTER TABLE public.preorders
ADD COLUMN payment_proof_url text;