"use client";

import { useMemo, useState } from "react";
import type { AppRole, AuthCredentials } from "@/types/auth";
import { supabase } from "@/lib/supabase/client";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = useMemo(
    () => ({
      async signIn({ email, password }: AuthCredentials) {
        setLoading(true);
        setError(null);
        const normalizedEmail = email.trim().toLowerCase();

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        }

        setLoading(false);
        return !signInError;
      },

      async getSignedInRole(): Promise<AppRole | null> {
        const { data, error: getUserError } = await supabase.auth.getUser();
        if (getUserError || !data.user) {
          return null;
        }

        const metadataRole = String(
          data.user.user_metadata?.role ?? data.user.app_metadata?.role ?? "",
        ).toLowerCase();
        if (metadataRole === "admin" || metadataRole === "teacher" || metadataRole === "user") {
          return metadataRole;
        }

        return null;
      },

      async signUp({ email, password }: AuthCredentials) {
        setLoading(true);
        setError(null);
        const normalizedEmail = email.trim().toLowerCase();

        const { error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
        }

        setLoading(false);
        return !signUpError;
      },
    }),
    [],
  );

  return { ...actions, loading, error };
}
