-- Add attachment_url to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Create deposits storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deposits', 'deposits', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for deposits bucket

-- Allow authenticated users to upload files to deposits bucket
CREATE POLICY "Authenticated users can upload deposits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'deposits' AND auth.uid() = owner );

-- Allow users to view their own uploads (and admins to view all)
CREATE POLICY "Users can view their own deposits"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'deposits' AND (auth.uid() = owner OR EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid() AND role = 'admin'
)));
