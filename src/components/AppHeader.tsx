import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, LogOut, User as UserIcon, Menu, Home, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavLink = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function AppHeader() {
  const { user, signOut } = useAuth();
  const [isInstructor, setIsInstructor] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!user) { setIsInstructor(false); return; }
    supabase.from("instructors").select("id").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsInstructor(!!data));
  }, [user]);

  const links: NavLink[] = [
    { to: "/", label: "الرئيسية", icon: Home },
    ...(user ? [{ to: "/dashboard", label: "لوحتي", icon: LayoutDashboard }] : []),
    ...(user ? [{ to: "/profile", label: "حسابي", icon: UserIcon }] : []),
    ...(isInstructor ? [{ to: "/admin", label: "الإدارة", icon: ShieldCheck }] : []),
  ];

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-extrabold text-foreground">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-lg">تكنو لاب</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(l.to)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user && (
            <Button variant="outline" size="sm" onClick={() => signOut()} className="hidden md:inline-flex gap-1">
              <LogOut className="h-4 w-4" />
              <span>خروج</span>
            </Button>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="فتح القائمة">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader className="text-right">
                <SheetTitle className="flex items-center gap-2 text-foreground">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  تكنو لاب
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(l.to)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </Link>
                ))}
              </nav>
              {user && (
                <div className="absolute bottom-6 right-6 left-6">
                  <Button variant="outline" className="w-full gap-2" onClick={() => { setOpen(false); signOut(); }}>
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
