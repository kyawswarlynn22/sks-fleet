-- Add customer_address column to preorders table
ALTER TABLE public.preorders 
ADD COLUMN customer_address text;