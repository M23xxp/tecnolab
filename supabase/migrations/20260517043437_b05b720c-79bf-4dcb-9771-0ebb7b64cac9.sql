-- Tighten enrollments RLS so Instructors only see/update their own courses
DROP POLICY IF EXISTS enrollments_student_select ON public.enrollments;
DROP POLICY IF EXISTS enrollments_admin_update ON public.enrollments;

CREATE POLICY enrollments_select_scoped
ON public.enrollments
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
  OR public.has_instructor_role(auth.uid(), 'Super_Admin'::instructor_role)
  OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = enrollments.course_id AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY enrollments_update_scoped
ON public.enrollments
FOR UPDATE
TO authenticated
USING (
  public.has_instructor_role(auth.uid(), 'Super_Admin'::instructor_role)
  OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = enrollments.course_id AND c.instructor_id = auth.uid()
  )
)
WITH CHECK (
  public.has_instructor_role(auth.uid(), 'Super_Admin'::instructor_role)
  OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = enrollments.course_id AND c.instructor_id = auth.uid()
  )
);