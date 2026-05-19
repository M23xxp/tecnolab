
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS contact_number text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS whatsapp_group_link text;

CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY assignments_admin_all ON public.assignments
  FOR ALL TO authenticated
  USING (public.has_instructor_role(auth.uid(), 'Super_Admin'::instructor_role))
  WITH CHECK (public.has_instructor_role(auth.uid(), 'Super_Admin'::instructor_role));

CREATE POLICY assignments_instructor_own ON public.assignments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = assignments.course_id AND c.instructor_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = assignments.course_id AND c.instructor_id = auth.uid()));

CREATE POLICY assignments_student_approved_select ON public.assignments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = assignments.course_id
      AND e.student_id = auth.uid()
      AND e.status = 'approved'::enrollment_status
  ));

CREATE TRIGGER assignments_set_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
