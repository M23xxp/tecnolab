import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowRight, Loader2, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/instructors/$instructorId")({
  component: InstructorProfilePage,
});

type Instructor = {
  id: string; name: string; title: string | null;
  contact_number: string | null; profile_image_url: string | null;
  role: "Super_Admin" | "Instructor";
};

function InstructorProfilePage() {
  const { instructorId } = Route.useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ok">("checking");
  const [data, setData] = useState<Instructor | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate({ to: "/" }); return; }
    const { data: me } = await supabase.from("instructors")
      .select("role").eq("id", session.user.id).maybeSingle();
    if (!me || me.role !== "Super_Admin") { navigate({ to: "/" }); return; }
    const { data: ins } = await supabase.from("instructors")
      .select("id, name, title, contact_number, profile_image_url, role")
      .eq("id", instructorId).maybeSingle();
    if (!ins) { toast.error("لم يتم العثور على المدرب"); navigate({ to: "/admin" }); return; }
    setData(ins as Instructor);
    setState("ok");
  }, [instructorId, navigate]);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    const { error } = await supabase.from("instructors").update({
      name: data.name,
      title: data.title,
      contact_number: data.contact_number,
      profile_image_url: data.profile_image_url,
      role: data.role,
    }).eq("id", data.id);
    setSaving(false);
    if (error) { toast.error("تعذّر الحفظ"); return; }
    toast.success("تم الحفظ");
  };

  if (state === "checking" || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/admin" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
          العودة إلى لوحة الإدارة
        </Link>
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-muted ring-2 ring-primary/20 shrink-0">
              {data.profile_image_url ? (
                <img src={data.profile_image_url} alt={data.name}
                  className="object-cover aspect-square w-full h-full rounded-full" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <UserIcon className="h-10 w-10" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">{data.name}</h1>
              <p className="text-sm text-muted-foreground">{data.title ?? "—"}</p>
            </div>
          </div>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>الاسم</Label>
              <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>المسمى الوظيفي</Label>
              <Input value={data.title ?? ""} onChange={(e) => setData({ ...data, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم التواصل</Label>
              <Input value={data.contact_number ?? ""} onChange={(e) => setData({ ...data, contact_number: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>صورة الملف الشخصي (رابط)</Label>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/20">
                  {data.profile_image_url ? (
                    <img src={data.profile_image_url} alt="معاينة"
                      className="object-cover aspect-square w-full h-full rounded-full" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <UserIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <Input value={data.profile_image_url ?? ""}
                  placeholder="https://example.com/photo.jpg"
                  onChange={(e) => setData({ ...data, profile_image_url: e.target.value })} />
              </div>
              <p className="text-xs text-muted-foreground">
                ألصق رابط صورة (JPG / PNG). ستظهر بشكل دائري دون تشويه.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>الدور</Label>
              <Select value={data.role}
                onValueChange={(v) => setData({ ...data, role: v as Instructor["role"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instructor">مدرب</SelectItem>
                  <SelectItem value="Super_Admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}</Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
