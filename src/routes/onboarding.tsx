import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    un_number: "",
    individual_id: "",
    age: "",
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("students")
      .select("full_name, phone, un_number, individual_id, age, is_completed")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.is_completed) {
          navigate({ to: "/dashboard" });
          return;
        }
        if (data) {
          setForm({
            full_name: data.full_name ?? "",
            phone: data.phone ?? "",
            un_number: data.un_number ?? "",
            individual_id: data.individual_id ?? "",
            age: data.age != null ? String(data.age) : "",
          });
        }
      });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.full_name || !form.phone || !form.un_number || !form.individual_id || !form.age) {
      toast.error("الرجاء تعبئة جميع الحقول");
      return;
    }
    const ageNum = parseInt(form.age, 10);
    if (Number.isNaN(ageNum) || ageNum < 5 || ageNum > 100) {
      toast.error("الرجاء إدخال عمر صحيح");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("students")
      .upsert({
        id: user.id,
        full_name: form.full_name,
        phone: form.phone,
        un_number: form.un_number,
        individual_id: form.individual_id,
        age: ageNum,
        is_completed: true,
      });
    setSubmitting(false);
    if (error) {
      toast.error("حدث خطأ أثناء حفظ البيانات");
      return;
    }
    toast.success("تم حفظ بياناتك بنجاح");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-extrabold text-foreground">إكمال الملف الشخصي</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          يرجى تعبئة البيانات التالية للمتابعة إلى منصة تكنو لاب
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">الاسم الكامل</Label>
            <Input id="full_name" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="أدخل اسمك الكامل" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="مثال: +962 7xx xxx xxx" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">العمر</Label>
              <Input id="age" type="number" min={5} max={100} value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="مثال: 22" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="un_number">رقم المفوضية</Label>
            <Input id="un_number" value={form.un_number}
              onChange={(e) => setForm({ ...form, un_number: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="individual_id">الرقم الفردي (Individual ID)</Label>
            <Input id="individual_id" value={form.individual_id}
              onChange={(e) => setForm({ ...form, individual_id: e.target.value })} required />
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-11 font-semibold">
            {submitting ? "جارٍ الحفظ..." : "حفظ ومتابعة"}
          </Button>
        </form>
      </div>
    </div>
  );
}
