
-- ENUMS
CREATE TYPE public.instructor_role AS ENUM ('Super_Admin','Instructor');
CREATE TYPE public.organization_type AS ENUM ('Al-Irfan','CARE');
CREATE TYPE public.enrollment_status AS ENUM ('pending','approved','rejected');

-- STUDENTS
CREATE TABLE public.students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  un_number TEXT,
  individual_id TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INSTRUCTORS
CREATE TABLE public.instructors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role public.instructor_role NOT NULL DEFAULT 'Instructor',
  profile_image_url TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COURSES
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  organization public.organization_type NOT NULL,
  work_file_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SESSIONS
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ENROLLMENTS
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status public.enrollment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

-- Helper: check instructor role (security definer, avoids recursion)
CREATE OR REPLACE FUNCTION public.has_instructor_role(_user_id UUID, _role public.instructor_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.instructors WHERE id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_instructor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.instructors WHERE id = _user_id);
$$;

-- Auto-create student row on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.students (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_instructors_updated BEFORE UPDATE ON public.instructors
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ENABLE RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- STUDENTS policies
CREATE POLICY "students_select_own" ON public.students FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_instructor(auth.uid()));
CREATE POLICY "students_update_own" ON public.students FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "students_insert_own" ON public.students FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- INSTRUCTORS policies
CREATE POLICY "instructors_select_all" ON public.instructors FOR SELECT TO authenticated USING (true);
CREATE POLICY "instructors_admin_manage" ON public.instructors FOR ALL TO authenticated
USING (public.has_instructor_role(auth.uid(),'Super_Admin'))
WITH CHECK (public.has_instructor_role(auth.uid(),'Super_Admin'));

-- COURSES policies
CREATE POLICY "courses_select_active" ON public.courses FOR SELECT TO authenticated
USING (is_active OR public.is_instructor(auth.uid()));
CREATE POLICY "courses_admin_all" ON public.courses FOR ALL TO authenticated
USING (public.has_instructor_role(auth.uid(),'Super_Admin'))
WITH CHECK (public.has_instructor_role(auth.uid(),'Super_Admin'));
CREATE POLICY "courses_instructor_own" ON public.courses FOR ALL TO authenticated
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

-- SESSIONS policies
CREATE POLICY "sessions_select_all" ON public.sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "sessions_admin_manage" ON public.sessions FOR ALL TO authenticated
USING (public.has_instructor_role(auth.uid(),'Super_Admin'))
WITH CHECK (public.has_instructor_role(auth.uid(),'Super_Admin'));
CREATE POLICY "sessions_instructor_own_course" ON public.sessions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid()));

-- ENROLLMENTS policies
CREATE POLICY "enrollments_student_select" ON public.enrollments FOR SELECT TO authenticated
USING (student_id = auth.uid() OR public.is_instructor(auth.uid()));
CREATE POLICY "enrollments_student_insert" ON public.enrollments FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());
CREATE POLICY "enrollments_admin_update" ON public.enrollments FOR UPDATE TO authenticated
USING (public.is_instructor(auth.uid()))
WITH CHECK (public.is_instructor(auth.uid()));
