import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { routeAfterAuth } from "@/lib/route-after-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [signing, setSigning] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (loading || !session?.user || handled.current) return;
    handled.current = true;
    routeAfterAuth(session.user.id).then((to) => navigate({ to }));
  }, [session, loading, navigate]);

  const handleGoogle = async () => {
    setSigning(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
    if (result.error) {
      toast.error("فشل تسجيل الدخول. حاول مرة أخرى.");
      setSigning(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-foreground">تكنو لاب</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            منصة التدريب المشتركة بين جمعية العرفان الخيرية ومنظمة CARE
          </p>
        </div>
        <div className="space-y-4">
          <Button
            onClick={handleGoogle}
            disabled={signing}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".9"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" opacity=".7"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".85"/>
            </svg>
            {signing ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول بحساب Google"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            بتسجيل الدخول فإنك توافق على شروط الاستخدام وسياسة الخصوصية
          </p>
        </div>
      </div>
    </div>
  );
}
