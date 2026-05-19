import { supabase } from "@/integrations/supabase/client";

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "lovable", opts?: { redirect_uri?: string }) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider === "lovable" ? "google" : provider,
        options: {
          redirectTo: opts?.redirect_uri,
        },
      });

      if (error) {
        return { error };
      }

      if (data?.url) {
        window.location.href = data.url;
        return { redirected: true };
      }

      return {};
    },
  },
};
