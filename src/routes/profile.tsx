import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { orgLabel } from "@/lib/org-labels";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

type Enrollment = {
  status: "pending" | "approved" | "rejected";
  courses: { id: string; title: string; organization: string } | null;
};

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", un_number: "", individual_id: "", age: "",
  });
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const [{ data: s }, { data: e }] = await Promise.all([
        supabase.from("students")
          .select("full_name, phone, un_number, individual_id, age")
          .eq("id", user.id).maybeSingle(),
        supabase.from("enrollments")
          .select("status, courses ( id, title, organization )")
          .eq("student_id", user.id),
      ]);
      if (s) {
        setForm({
          full_name: s.full_name ?? "",
          phone: s.phone ?? "",
          un_number: s.un_number ?? "",
          individual_id: s.individual_id ?? "",
          age: s.age != null ? String(s.age) : "",
        });
      }
      setEnrollments((e ?? []) as unknown as Enrollment[]);
      setPageLoading(false);
    })();
  }, [user, loading, navigate]);

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!user) return;
    const ageNum = form.age ? parseInt(form.age, 10) : null;
    if (form.age && (Number.isNaN(ageNum!) || ageNum! < 5 || ageNum! > 100)) {
      toast.error("الرجاء إدخال عمر صحيح");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("students").update({
      full_name: form.full_name,
      phone: form.phone,
      un_number: form.un_number,
      individual_id: form.individual_id,
      age: ageNum,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("تعذّر حفظ البيانات"); return; }
    toast.success("تم تحديث بياناتك");
  };

  if (loading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusLabel = (s: string) =>
    s === "approved" ? "مقبول" : s === "pending" ? "قيد المراجعة" : "مرفوض";
  const statusVariant = (s: string): "default" | "secondary" | "destructive" =>
    s === "approved" ? "default" : s === "pending" ? "secondary" : "destructive";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        {/* Hero card */}
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-extrabold">
                {(form.full_name || "?").trim().charAt(0)}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold text-foreground">{form.full_name || "حسابي"}</h1>
                <p className="mt-1 text-sm text-muted-foreground">إدارة بياناتك الشخصية ومتابعة دوراتك</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-lg font-bold">البيانات الشخصية</h2>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">الاسم الكامل</Label>
              <Input id="full_name" value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">العمر</Label>
              <Input id="age" type="number" min={5} max={100} value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="un_number">رقم المفوضية</Label>
              <Input id="un_number" value={form.un_number}
                onChange={(e) => setForm({ ...form, un_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="individual_id">الرقم الفردي</Label>
              <Input id="individual_id" value={form.individual_id}
                onChange={(e) => setForm({ ...form, individual_id: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-lg font-bold">دوراتي</h2>
          {enrollments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-2 h-8 w-8" />
              لم تسجّل في أي دورة بعد
            </div>
          ) : (
            <ul className="space-y-2">
              {enrollments.filter(e => e.courses).map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg border bg-background/50 p-3">
                  <Link to="/courses/$courseId" params={{ courseId: e.courses!.id }}
                    className="flex-1 font-medium text-foreground hover:text-primary">
                    {e.courses!.title}
                    <span className="block text-xs text-muted-foreground">{orgLabel(e.courses!.organization)}</span>
                  </Link>
                  <Badge variant={statusVariant(e.status)}>{statusLabel(e.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}
