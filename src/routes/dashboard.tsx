import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Building2, GraduationCap, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { orgLabel } from "@/lib/org-labels";

type Course = {
  id: string;
  title: string;
  organization: string;
  thumbnail_url: string | null;
  instructors: { name: string | null } | null;
  target_gender: string | null;
};

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentGender, setStudentGender] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data: profile } = await supabase
        .from("students").select("is_completed, gender").eq("id", user.id).maybeSingle();
      if (!profile || !profile.is_completed) { navigate({ to: "/onboarding" }); return; }
      setStudentGender(profile.gender);
      const { data } = await supabase
        .from("courses")
        .select("id, title, organization, thumbnail_url, target_gender, instructors ( name )")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      let allCourses = (data ?? []) as unknown as Course[];
      if (profile.gender) {
        allCourses = allCourses.filter(
          (c) => !c.target_gender || c.target_gender === "both" || c.target_gender === profile.gender,
        );
      }
      setCourses(allCourses);
      setChecking(false);
    })();
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground">الدورات المتاحة</h1>
          <p className="mt-2 text-muted-foreground">استعرض الدورات النشطة وقدّم طلب الانضمام</p>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">لا توجد دورات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c, i) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to="/courses/$courseId" params={{ courseId: c.id }}>
                  <Card className="group h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                    {c.thumbnail_url ? (
                      <img
                        src={c.thumbnail_url}
                        alt={c.title}
                        className="object-cover h-48 w-full rounded-t-lg"
                      />
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-primary/20 to-primary/5">
                        <BookOpen className="h-12 w-12 text-primary/60" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-foreground line-clamp-2">{c.title}</h3>
                      <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        {c.instructors?.name ?? "لم يُحدّد المدرب"}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {orgLabel(c.organization)}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="rounded-full border border-primary/30 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                          {c.target_gender === "male" ? "شفت شباب" : c.target_gender === "female" ? "شفت بنات" : "مختلط"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                        عرض التفاصيل
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
