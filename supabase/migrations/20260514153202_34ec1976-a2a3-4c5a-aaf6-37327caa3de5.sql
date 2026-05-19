
-- Set search_path explicitly (already set, but make sure)
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.has_instructor_role(uuid, public.instructor_role) SET search_path = public;
ALTER FUNCTION public.is_instructor(uuid) SET search_path = public;

-- Restrict execute privileges
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_instructor_role(uuid, public.instructor_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_instructor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_instructor_role(uuid, public.instructor_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_instructor(uuid) TO authenticated;
