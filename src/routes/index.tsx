import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { routeAfterAuth } from "@/lib/route-after-auth";
import { AppHeader } from "@/components/AppHeader";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { Features } from "@/components/landing/Features";
import { Partners } from "@/components/landing/Partners";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (loading || !session?.user || handled.current) return;
    handled.current = true;
    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    routeAfterAuth(session.user.id).then((to) => navigate({ to }));
  }, [session, loading, navigate]);

  if (loading || session?.user) return null;

  return (
    <div className="min-h-screen bg-background font-[Tajawal]">
      <AppHeader />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Partners />
      </main>
      <Footer />
    </div>
  );
}
