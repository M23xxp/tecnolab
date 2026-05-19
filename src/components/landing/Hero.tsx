import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export function Hero() {
  const navigate = useNavigate();
  const [signing, setSigning] = useState(false);

  const handleGoogle = async () => {
    setSigning(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("فشل تسجيل الدخول. حاول مرة أخرى.");
      setSigning(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 -right-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-accent/40 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/60 to-background" />
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-24 md:pt-36 md:pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 backdrop-blur px-4 py-1.5 text-xs md:text-sm font-medium text-foreground/80"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          شراكة بين جمعية العرفان الخيرية ومنظمة CARE
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.15]"
        >
          منصة <span className="bg-gradient-to-l from-primary to-accent-foreground bg-clip-text text-transparent">تكنو لاب</span>
          <br className="hidden md:block" />
          <span className="text-2xl md:text-4xl lg:text-5xl font-bold text-muted-foreground block mt-3">
            للتدريب التقني وبناء القدرات
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed"
        >
          منصة متكاملة تجمع بين الخبرة والابتكار لتمكين الشباب من امتلاك مهارات
          المستقبل في عالم التكنولوجيا، عبر دورات احترافية وجلسات تطبيقية.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            onClick={handleGoogle}
            disabled={signing}
            size="lg"
            className="h-14 px-8 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" opacity=".95"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".75"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" opacity=".55"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".85"/>
            </svg>
            {signing ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول باستخدام جوجل"}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            تسجيل سريع وآمن
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            دورات معتمدة
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            مدربون متخصصون
          </div>
        </motion.div>
      </div>
    </section>
  );
}
