-- Add certificate_url column to employee_qualifications
ALTER TABLE public.employee_qualifications
ADD COLUMN certificate_url TEXT;

-- Create storage bucket for certificate images
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can read
CREATE POLICY "auth_read_certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'certificates');

-- RLS: admin/hr can upload
CREATE POLICY "admin_hr_upload_certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates'
  AND public.get_user_role() IN ('admin', 'hr')
);

-- RLS: admin/hr can delete
CREATE POLICY "admin_hr_delete_certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificates'
  AND public.get_user_role() IN ('admin', 'hr')
);
