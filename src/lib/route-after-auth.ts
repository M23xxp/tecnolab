import { supabase } from "@/integrations/supabase/client";

export type PostAuthRoute = "/admin" | "/onboarding" | "/dashboard";

export async function routeAfterAuth(userId: string): Promise<PostAuthRoute> {
  const { data: instructor } = await supabase
    .from("instructors")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (instructor) return "/admin";

  const { data: student } = await supabase
    .from("students")
    .select("is_completed")
    .eq("id", userId)
    .maybeSingle();
  if (!student || !student.is_completed) return "/onboarding";
  return "/dashboard";
}
