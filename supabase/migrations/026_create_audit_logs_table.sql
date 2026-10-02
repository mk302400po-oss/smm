-- Create Audit Logs Table for Admin Action Tracking
-- This migration creates a secure audit logging system

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Stores audit trail of all admin actions for security and compliance';
COMMENT ON COLUMN public.audit_logs.user_id IS 'The admin user who performed the action';
COMMENT ON COLUMN public.audit_logs.action IS 'The type of action performed (CREATE, UPDATE, DELETE, etc.)';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'The type of resource affected (service, user, order, etc.)';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'The ID of the affected resource';
COMMENT ON COLUMN public.audit_logs.details IS 'Additional details about the action in JSON format';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the user who performed the action';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'User agent string of the browser/client';

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Policy 1: Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 2: Authenticated users can insert (for logging, but app will verify admin role)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create function to clean up old audit logs (optional - run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 'Deletes audit logs older than specified days (default 90)';
