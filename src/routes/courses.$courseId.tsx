import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Building2, Phone, MessageCircle, Download, ClipboardList,
  CalendarDays, User as UserIcon, Loader2, Info, Clock, CalendarCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { orgLabel } from "@/lib/org-labels";

type Course = {
  id: string; title: string;
  organization: string;
  instructor_id: string | null;
  work_file_url: string | null;
  work_file_urls: string[] | null;
  whatsapp_group_link: string | null;
  thumbnail_url: string | null;
};
type Instructor = {
  id: string; name: string; title: string | null;
  profile_image_url: string | null; contact_number: string | null;
};
type Session = { id: string; session_date: string; session_time: string };
type Assignment = { id: string; title: string; description: string | null; due_date: string | null };
type EnrollStatus = "pending" | "approved" | "rejected" | null;

export const Route = createFileRoute("/courses/$courseId")({ component: CourseDetailPage });

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrollStatus, setEnrollStatus] = useState<EnrollStatus>(null);
  const [busy, setBusy] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }

    let cancelled = false;

    (async () => {
      try {
        const { data: c } = await supabase.from("courses")
          .select("id, title, organization, instructor_id, work_file_url, work_file_urls, whatsapp_group_link, thumbnail_url")
          .eq("id", courseId).maybeSingle();

        if (cancelled) return;

        if (!c) { navigate({ to: "/dashboard" }); return; }
        setCourse(c as Course);

        const [{ data: ins }, { data: sess }, { data: enr }] = await Promise.all([
          c.instructor_id
            ? supabase.from("instructors").select("id, name, title, profile_image_url, contact_number").eq("id", c.instructor_id).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase.from("sessions").select("id, session_date, session_time").eq("course_id", courseId).order("session_date"),
          supabase.from("enrollments").select("status").eq("course_id", courseId).eq("student_id", user.id).maybeSingle(),
        ]);

        if (cancelled) return;

        setInstructor((ins as Instructor) ?? null);
        setSessions((sess ?? []) as Session[]);
        setEnrollStatus((enr?.status as EnrollStatus) ?? null);

        if (enr?.status === "approved") {
          const { data: a } = await supabase.from("assignments")
            .select("id, title, description, due_date").eq("course_id", courseId).order("due_date");
          if (!cancelled) setAssignments((a ?? []) as Assignment[]);
        }
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [courseId, user, authLoading, navigate]);

  const handleEnroll = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("enrollments")
      .insert({ student_id: user.id, course_id: courseId, status: "pending" });
    setBusy(false);
    if (error) { toast.error("تعذّر إرسال طلب الانضمام"); return; }
    toast.success("تم إرسال طلب الانضمام");
    setEnrollStatus("pending");
  };

  if (authLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-bold text-foreground">حدث خطأ</h2>
          <p className="mt-2 text-sm text-muted-foreground">تعذّر تحميل بيانات الدورة. حاول مرة أخرى.</p>
          <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>
            العودة إلى الدورات
          </Button>
        </div>
      </div>
    );
  }

  const isApproved = enrollStatus === "approved";
  const workFiles = (course.work_file_urls && course.work_file_urls.length > 0)
    ? course.work_file_urls
    : (course.work_file_url ? [course.work_file_url] : []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
          العودة إلى الدورات
        </Link>

        {course.thumbnail_url && (
          <img src={course.thumbnail_url} alt={course.title}
            className="mb-6 object-cover h-64 w-full rounded-2xl" />
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-extrabold text-foreground">{course.title}</h1>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {orgLabel(course.organization)}
          </div>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-bold text-foreground">المدرب</h2>
              {instructor ? (
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-primary/20 bg-muted shrink-0">
                    {instructor.profile_image_url ? (
                      <img src={instructor.profile_image_url} alt={instructor.name}
                        className="object-cover aspect-square w-full h-full rounded-full" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <UserIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-foreground">{instructor.name}</p>
                    {instructor.title && <p className="text-sm text-muted-foreground">{instructor.title}</p>}
                    {instructor.contact_number && (
                      <a href={`https://wa.me/${instructor.contact_number.replace(/\D/g, "")}`}
                         target="_blank" rel="noreferrer"
                         className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                        <Phone className="h-4 w-4" />
                        {instructor.contact_number}
                      </a>
                    )}
                  </div>
                </div>
              ) : <p className="text-sm text-muted-foreground">لم يتم تعيين مدرب بعد</p>}
            </Card>

            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">جدول الجلسات</h2>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {sessions.length} جلسة
                </span>
              </div>
              {sessions.length === 0 ? (
                <div className="rounded-xl border border-dashed py-10 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">لا توجد جلسات مجدولة بعد</p>
                </div>
              ) : (
                <ol className="space-y-3">
                  {sessions.map((s, idx) => {
                    const d = new Date(s.session_date);
                    const day = d.toLocaleDateString("ar-EG", { weekday: "long" });
                    const date = d.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
                    const isPast = d < new Date(new Date().toDateString());
                    return (
                      <li key={s.id}
                        className={`group flex items-stretch gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm ${isPast ? "opacity-60" : ""}`}>
                        <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span className="text-[10px] font-semibold">جلسة</span>
                          <span className="text-xl font-extrabold leading-none">{idx + 1}</span>
                        </div>
                        <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-bold text-foreground">{day}</p>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarCheck className="h-3.5 w-3.5" />
                              {date}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold text-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            {s.session_time.slice(0, 5)}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Card>

            {isApproved && (
              <>
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-foreground">الواجبات</h2>
                  </div>
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>يتم تسليم الواجبات عبر جروب الواتساب الخاص بالدورة</span>
                  </div>
                  {assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">لا توجد واجبات حالياً</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {assignments.map((a) => (
                        <Card key={a.id} className="p-4 transition hover:shadow-md">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold text-foreground">{a.title}</p>
                            {a.due_date && (
                              <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                {new Date(a.due_date).toLocaleDateString("ar-EG")}
                              </span>
                            )}
                          </div>
                          {a.description && <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>}
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>

                {workFiles.length > 0 && (
                  <Card className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Download className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-bold text-foreground">ملفات العمل</h2>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {workFiles.map((url, i) => (
                        <Button key={i} asChild variant="outline" className="justify-start">
                          <a href={url} target="_blank" rel="noreferrer">
                            <Download className="ml-2 h-4 w-4" />
                            تحميل الملف {i + 1}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </Card>
                )}

                {course.whatsapp_group_link && (
                  <Button asChild size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <a href={course.whatsapp_group_link} target="_blank" rel="noreferrer">
                      <MessageCircle className="ml-2 h-4 w-4" />
                      الانضمام لجروب الواتساب
                    </a>
                  </Button>
                )}
              </>
            )}
          </div>

          <div>
            <Card className="sticky top-24 p-6">
              <h3 className="text-lg font-bold text-foreground">حالة الانضمام</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {enrollStatus === "approved" && "تم قبولك في هذه الدورة. استمتع بالمحتوى!"}
                {enrollStatus === "pending" && "طلبك قيد المراجعة من قبل الإدارة."}
                {enrollStatus === "rejected" && "للأسف، تم رفض طلب الانضمام."}
                {enrollStatus === null && "قدّم طلبك للانضمام إلى الدورة وسيتم مراجعته."}
              </p>
              <div className="mt-5">
                {enrollStatus === null ? (
                  <Button onClick={handleEnroll} disabled={busy} className="w-full" size="lg">
                    {busy ? "جارٍ الإرسال..." : "طلب انضمام"}
                  </Button>
                ) : enrollStatus === "pending" ? (
                  <Button disabled className="w-full bg-muted text-muted-foreground" size="lg">
                    قيد الانتظار
                  </Button>
                ) : enrollStatus === "approved" ? (
                  <div className="rounded-lg bg-green-500/10 px-4 py-3 text-center text-sm font-medium text-green-700 dark:text-green-400">
                    تم القبول ✓
                  </div>
                ) : (
                  <div className="rounded-lg bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-destructive">
                    تم الرفض
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
