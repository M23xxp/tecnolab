import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, Loader2, Plus, Trash2, Pencil, Download, Check, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ORG_OPTIONS, orgLabel, type OrgValue } from "@/lib/org-labels";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Course = {
  id: string; title: string;
  organization: OrgValue;
  instructor_id: string | null;
  thumbnail_url: string | null;
  work_file_urls: string[] | null;
  whatsapp_group_link: string | null;
  is_active: boolean;
  target_gender: string | null;
};
type Instructor = {
  id: string; name: string; title: string | null;
  contact_number: string | null; profile_image_url: string | null;
  role: "Super_Admin" | "Instructor";
};
type Session = { id: string; course_id: string; session_date: string; session_time: string };
type Assignment = { id: string; course_id: string; title: string; description: string | null; due_date: string | null };
type EnrollmentRow = {
  student_id: string; course_id: string; status: "pending" | "approved" | "rejected";
  students: {
    id: string; full_name: string | null; phone: string | null;
    un_number: string | null; individual_id: string | null; age: number | null;
  } | null;
  courses: {
    title: string;
  } | null;
};

type Role = "Super_Admin" | "Instructor";

function AdminPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ok">("checking");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("Instructor");
  const [userId, setUserId] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const refreshCourses = useCallback(async (currentRole: Role, uid: string) => {
    let q = supabase.from("courses")
      .select("id, title, organization, instructor_id, thumbnail_url, work_file_urls, whatsapp_group_link, is_active, target_gender")
      .order("created_at", { ascending: false });
    if (currentRole === "Instructor") {
      q = q.eq("instructor_id", uid);
    }
    const { data } = await q;
    setCourses((data ?? []) as Course[]);
  }, []);

  const refreshInstructors = useCallback(async () => {
    const { data } = await supabase.from("instructors")
      .select("id, name, title, contact_number, profile_image_url, role")
      .order("created_at", { ascending: false });
    setInstructors((data ?? []) as Instructor[]);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate({ to: "/login" }); return; }
      const { data, error } = await supabase
        .from("instructors").select("id, name, role")
        .eq("id", session.user.id).maybeSingle();
      if (error || !data) { navigate({ to: "/dashboard" }); return; }
      setName(data.name);
      setRole(data.role as Role);
      setUserId(session.user.id);
      await Promise.all([refreshCourses(data.role as Role, session.user.id), refreshInstructors()]);
      setState("ok");
    })();
  }, [navigate, refreshCourses, refreshInstructors]);

  const reloadCourses = useCallback(() => refreshCourses(role, userId), [refreshCourses, role, userId]);

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isSuper = role === "Super_Admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">لوحة الإدارة</h1>
            <p className="text-sm text-muted-foreground">
              مرحباً، {name} · {isSuper ? "مدير عام" : "مدرب"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="courses">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="courses">الدورات</TabsTrigger>
            <TabsTrigger value="manage" disabled={!selectedCourseId}>
              إدارة الدورة
            </TabsTrigger>
            <TabsTrigger value="enrollments">طلبات الانضمام</TabsTrigger>
            {isSuper && <TabsTrigger value="instructors">إدارة المدربين</TabsTrigger>}
          </TabsList>

          <TabsContent value="courses" className="mt-4">
            <CoursesTab
              courses={courses}
              instructors={instructors}
              isSuper={isSuper}
              currentUserId={userId}
              onChanged={reloadCourses}
              onManage={(id) => setSelectedCourseId(id)}
            />
          </TabsContent>

          <TabsContent value="manage" className="mt-4">
            {selectedCourseId && (
              <ManageCourseTab
                course={courses.find((c) => c.id === selectedCourseId)!}
                onBack={() => setSelectedCourseId(null)}
              />
            )}
          </TabsContent>

          <TabsContent value="enrollments" className="mt-4">
            <AllEnrollments role={role} userId={userId} />
          </TabsContent>

          {isSuper && (
            <TabsContent value="instructors" className="mt-4">
              <InstructorsTab instructors={instructors} onChanged={refreshInstructors} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

/* ======================== Courses Tab ======================== */

function CoursesTab({
  courses, instructors, isSuper, currentUserId, onChanged, onManage,
}: {
  courses: Course[]; instructors: Instructor[];
  isSuper: boolean; currentUserId: string;
  onChanged: () => Promise<void>; onManage: (id: string) => void;
}) {
  const [editing, setEditing] = useState<Course | null>(null);
  const [open, setOpen] = useState(false);

  const remove = async (id: string) => {
    if (!confirm("حذف هذه الدورة نهائياً؟")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { toast.error("تعذّر الحذف"); return; }
    toast.success("تم الحذف");
    await onChanged();
  };

  return (
    <div>
      <div className="mb-4 flex justify-between gap-2">
        <h2 className="text-lg font-bold">إدارة الدورات</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="ml-2 h-4 w-4" /> دورة جديدة
            </Button>
          </DialogTrigger>
          <CourseFormDialog
            instructors={instructors}
            initial={editing}
            isSuper={isSuper}
            currentUserId={currentUserId}
            onClose={() => { setOpen(false); setEditing(null); }}
            onSaved={async () => { setOpen(false); setEditing(null); await onChanged(); }}
          />
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">لا توجد دورات بعد</Card>
      ) : (
        <div className="grid gap-3">
          {courses.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                {c.thumbnail_url ? (
                  <img src={c.thumbnail_url} alt={c.title} className="h-14 w-20 rounded object-cover" />
                ) : <div className="h-14 w-20 rounded bg-muted" />}
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{orgLabel(c.organization)}</p>
                </div>
                {!c.is_active && <Badge variant="secondary">غير نشطة</Badge>}
                <Badge variant="outline" className="border-primary/30 text-xs">
                  {c.target_gender === "male" ? "شباب" : c.target_gender === "female" ? "بنات" : "مختلط"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onManage(c.id)}>
                  إدارة
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setEditing(c); setOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => remove(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseFormDialog({
  instructors, initial, isSuper, currentUserId, onClose, onSaved,
}: {
  instructors: Instructor[]; initial: Course | null;
  isSuper: boolean; currentUserId: string;
  onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    organization: (initial?.organization ?? "Al-Irfan") as OrgValue,
    instructor_id: initial?.instructor_id ?? (isSuper ? "" : currentUserId),
    thumbnail_url: initial?.thumbnail_url ?? "",
    whatsapp_group_link: initial?.whatsapp_group_link ?? "",
    work_file_urls: (initial?.work_file_urls ?? []).join("\n"),
    is_active: initial?.is_active ?? true,
    target_gender: initial?.target_gender ?? "both",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("العنوان مطلوب"); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      organization: form.organization,
      instructor_id: isSuper ? (form.instructor_id || null) : currentUserId,
      thumbnail_url: form.thumbnail_url || null,
      whatsapp_group_link: form.whatsapp_group_link || null,
      work_file_urls: form.work_file_urls.split("\n").map((s) => s.trim()).filter(Boolean),
      is_active: form.is_active,
      target_gender: form.target_gender,
    };
    const { error } = initial
      ? await supabase.from("courses").update(payload).eq("id", initial.id)
      : await supabase.from("courses").insert(payload);
    setSaving(false);
    if (error) { toast.error("تعذّر الحفظ: " + error.message); return; }
    toast.success("تم الحفظ");
    await onSaved();
  };

  return (
    <DialogContent className="max-w-lg" onInteractOutside={onClose}>
      <DialogHeader><DialogTitle>{initial ? "تعديل دورة" : "دورة جديدة"}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>العنوان</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>المنظمة</Label>
            <Select value={form.organization} onValueChange={(v) => setForm({ ...form, organization: v as OrgValue })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORG_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isSuper && (
            <div className="space-y-1.5">
              <Label>المدرب</Label>
              <Select
                value={form.instructor_id || "none"}
                onValueChange={(v) => setForm({ ...form, instructor_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="اختر المدرب" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— بدون مدرب —</SelectItem>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>الفئة المستهدفة</Label>
          <Select value={form.target_gender} onValueChange={(v) => setForm({ ...form, target_gender: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="both">الجميع</SelectItem>
              <SelectItem value="male">شباب</SelectItem>
              <SelectItem value="female">بنات</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>رابط الصورة المصغرة</Label>
          <Input value={form.thumbnail_url} placeholder="https://..."
            onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>رابط جروب الواتساب</Label>
          <Input value={form.whatsapp_group_link} placeholder="https://chat.whatsapp.com/..."
            onChange={(e) => setForm({ ...form, whatsapp_group_link: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>روابط ملفات العمل (رابط في كل سطر)</Label>
          <Textarea rows={4} value={form.work_file_urls}
            onChange={(e) => setForm({ ...form, work_file_urls: e.target.value })}
            placeholder={"https://...\nhttps://..."} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          الدورة نشطة
        </label>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
          <Button type="submit" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

/* ======================== Manage Course Tab ======================== */

function ManageCourseTab({ course, onBack }: { course: Course; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{course.title}</h2>
          <p className="text-sm text-muted-foreground">{orgLabel(course.organization)}</p>
        </div>
        <Button variant="outline" onClick={onBack}>رجوع</Button>
      </div>
      <SessionsManager courseId={course.id} />
      <AssignmentsManager courseId={course.id} />
      <EnrollmentsManager courseId={course.id} courseTitle={course.title} />
    </div>
  );
}

function SessionsManager({ courseId }: { courseId: string }) {
  const [items, setItems] = useState<Session[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const refresh = useCallback(async () => {
    const { data } = await supabase.from("sessions")
      .select("id, course_id, session_date, session_time")
      .eq("course_id", courseId).order("session_date");
    setItems((data ?? []) as Session[]);
  }, [courseId]);
  useEffect(() => { refresh(); }, [refresh]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) { toast.error("التاريخ والوقت مطلوبان"); return; }
    const { error } = await supabase.from("sessions")
      .insert({ course_id: courseId, session_date: date, session_time: time });
    if (error) { toast.error("تعذّر الإضافة"); return; }
    setDate(""); setTime("");
    await refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف الجلسة؟")) return;
    await supabase.from("sessions").delete().eq("id", id);
    await refresh();
  };

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-bold">الجلسات</h3>
      <form onSubmit={add} className="mb-4 flex flex-wrap gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-32" />
        <Button type="submit"><Plus className="ml-2 h-4 w-4" /> إضافة</Button>
      </form>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد جلسات</p>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2 text-sm">
              <span>{new Date(s.session_date).toLocaleDateString("ar-EG")} — {s.session_time.slice(0, 5)}</span>
              <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AssignmentsManager({ courseId }: { courseId: string }) {
  const [items, setItems] = useState<Assignment[]>([]);
  const [form, setForm] = useState({ title: "", description: "", due_date: "" });
  const refresh = useCallback(async () => {
    const { data } = await supabase.from("assignments")
      .select("id, course_id, title, description, due_date")
      .eq("course_id", courseId).order("due_date");
    setItems((data ?? []) as Assignment[]);
  }, [courseId]);
  useEffect(() => { refresh(); }, [refresh]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("العنوان مطلوب"); return; }
    const { error } = await supabase.from("assignments").insert({
      course_id: courseId,
      title: form.title.trim(),
      description: form.description || null,
      due_date: form.due_date || null,
    });
    if (error) { toast.error("تعذّر الإضافة"); return; }
    setForm({ title: "", description: "", due_date: "" });
    await refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف الواجب؟")) return;
    await supabase.from("assignments").delete().eq("id", id);
    await refresh();
  };

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-bold">الواجبات</h3>
      <form onSubmit={add} className="mb-4 grid gap-2 sm:grid-cols-2">
        <Input placeholder="عنوان الواجب" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input type="date" value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        <Textarea placeholder="الوصف" rows={2} className="sm:col-span-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Button type="submit" className="sm:col-span-2"><Plus className="ml-2 h-4 w-4" /> إضافة واجب</Button>
      </form>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد واجبات</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-2 rounded-lg border bg-background/50 p-3 text-sm">
              <div>
                <p className="font-semibold">{a.title}</p>
                {a.description && <p className="text-muted-foreground">{a.description}</p>}
                {a.due_date && <p className="mt-1 text-xs text-primary">تسليم: {new Date(a.due_date).toLocaleDateString("ar-EG")}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(a.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AllEnrollments({ role, userId }: { role: Role; userId: string }) {
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const refresh = useCallback(async () => {
    let query = supabase.from("enrollments")
      .select("*, students ( id, full_name, phone, un_number, individual_id, age ), courses!inner ( title )")
      .order("created_at", { ascending: false });
    if (role !== "Super_Admin") query = query.eq("courses.instructor_id", userId);
    const { data, error } = await query;
    if (error) { console.error("Enrollments Fetch Error:", error); return; }
    setRows((data ?? []) as EnrollmentRow[]);
  }, [role, userId]);
  useEffect(() => { refresh(); }, [refresh]);

  const setStatus = async (studentId: string, courseId: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("enrollments").update({ status })
      .eq("student_id", studentId).eq("course_id", courseId);
    if (error) { console.error("Enrollment Update Error:", error); toast.error("تعذّر التحديث"); return; }
    toast.success(status === "approved" ? "تم القبول" : "تم الرفض");
    await refresh();
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge className="bg-green-600">مقبول</Badge>;
    if (s === "pending") return <Badge variant="secondary">قيد المراجعة</Badge>;
    return <Badge variant="destructive">مرفوض</Badge>;
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">جميع طلبات الانضمام ({rows.length})</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد طلبات</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.student_id + r.course_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background/50 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {r.students?.full_name ?? "—"}
                  <span className="mr-2 font-normal text-muted-foreground">
                    ← {r.courses?.title ?? "—"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.students?.phone ?? "—"} · UN: {r.students?.un_number ?? "—"} · ID: {r.students?.individual_id ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(r.status)}
                {r.status !== "approved" && (
                  <Button size="sm" onClick={() => setStatus(r.student_id, r.course_id, "approved")}>
                    <Check className="ml-1 h-4 w-4" /> قبول
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(r.student_id, r.course_id, "rejected")}>
                    <X className="ml-1 h-4 w-4" /> رفض
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function EnrollmentsManager({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from("enrollments")
      .select("student_id, course_id, status, students ( id, full_name, phone, un_number, individual_id, age )")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    if (error) { console.error("Enrollments Fetch Error:", error); return; }
    setRows((data ?? []) as unknown as EnrollmentRow[]);
  }, [courseId]);
  useEffect(() => { refresh(); }, [refresh]);

  const setStatus = async (studentId: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("enrollments").update({ status })
      .eq("student_id", studentId).eq("course_id", courseId);
    if (error) { console.error("Enrollment Update Error:", error); toast.error("تعذّر التحديث"); return; }
    toast.success(status === "approved" ? "تم القبول" : "تم الرفض");
    await refresh();
  };

  const exportCsv = () => {
    const approved = rows.filter((r) => r.status === "approved" && r.students);
    if (approved.length === 0) { toast.error("لا يوجد طلاب مقبولون"); return; }
    const headers = ["الاسم الكامل", "رقم الهاتف", "العمر", "رقم المفوضية", "الرقم الفردي"];
    const lines = [headers.join(",")];
    for (const r of approved) {
      const s = r.students!;
      const row = [s.full_name, s.phone, s.age, s.un_number, s.individual_id]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",");
      lines.push(row);
    }
    const csv = "\uFEFF" + lines.join("\n"); // BOM for Excel UTF-8
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${courseTitle}-المقبولين.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge>مقبول</Badge>;
    if (s === "pending") return <Badge variant="secondary">قيد المراجعة</Badge>;
    return <Badge variant="destructive">مرفوض</Badge>;
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">الطلاب المسجلون ({rows.length})</h3>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="ml-2 h-4 w-4" /> تصدير المقبولين CSV
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد طلبات</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.student_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background/50 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.students?.full_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {r.students?.phone ?? "—"} · UN: {r.students?.un_number ?? "—"} · ID: {r.students?.individual_id ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(r.status)}
                {r.status !== "approved" && (
                  <Button size="sm" onClick={() => setStatus(r.student_id, "approved")}>
                    <Check className="ml-1 h-4 w-4" /> قبول
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(r.student_id, "rejected")}>
                    <X className="ml-1 h-4 w-4" /> رفض
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ======================== Instructors Tab ======================== */

function InstructorsTab({ instructors, onChanged }: { instructors: Instructor[]; onChanged: () => Promise<void> }) {
  return (
    <div className="space-y-6">
      <AddInstructorForm onAdded={onChanged} />

      <div>
        <h2 className="mb-3 text-lg font-bold">قائمة المدربين</h2>
        {instructors.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">لا يوجد مدربون</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {instructors.map((i) => (
              <Card key={i.id} className="flex items-center gap-3 p-4">
                <div className="h-14 w-14 overflow-hidden rounded-full bg-muted shrink-0">
                  {i.profile_image_url ? (
                    <img src={i.profile_image_url} alt={i.name}
                      className="object-cover aspect-square w-full h-full rounded-full" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{i.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {i.title ?? "—"} · {i.role === "Super_Admin" ? "مدير" : "مدرب"}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/instructors/$instructorId" params={{ instructorId: i.id }}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddInstructorForm({ onAdded }: { onAdded: () => Promise<void> }) {
  const [form, setForm] = useState({
    id: "",
    name: "",
    title: "",
    contact_number: "",
    role: "Instructor" as Role,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uuid = form.id.trim();
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(uuid)) { toast.error("معرّف المستخدم (UUID) غير صحيح"); return; }
    if (!form.name.trim()) { toast.error("الاسم مطلوب"); return; }
    setSaving(true);
    const { error } = await supabase.from("instructors").insert({
      id: uuid,
      name: form.name.trim(),
      title: form.title.trim() || null,
      contact_number: form.contact_number.trim() || null,
      role: form.role,
    });
    setSaving(false);
    if (error) { toast.error("تعذّر الإضافة: " + error.message); return; }
    toast.success("تم إضافة المدرب");
    setForm({ id: "", name: "", title: "", contact_number: "", role: "Instructor" });
    await onAdded();
  };

  return (
    <Card className="p-5">
      <h3 className="mb-1 font-bold">إضافة مدرب جديد</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        يجب أن يكون المستخدم قد سجّل دخوله بحساب جوجل مرة واحدة على الأقل للحصول على معرّف (UUID) من نظام المصادقة.
      </p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>معرّف المستخدم (Auth UUID)</Label>
          <Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="00000000-0000-0000-0000-000000000000" required />
        </div>
        <div className="space-y-1.5">
          <Label>الاسم</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>المسمّى الوظيفي</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="مدرب تقنيات الويب" />
        </div>
        <div className="space-y-1.5">
          <Label>رقم التواصل</Label>
          <Input value={form.contact_number}
            onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
            placeholder="+962 7xx xxx xxx" />
        </div>
        <div className="space-y-1.5">
          <Label>الصلاحية</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Instructor">مدرب (Instructor)</SelectItem>
              <SelectItem value="Super_Admin">مدير عام (Super_Admin)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            <Plus className="ml-2 h-4 w-4" /> {saving ? "جارٍ الإضافة..." : "إضافة المدرب"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
