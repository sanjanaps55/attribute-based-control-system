"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { AdminCreateAccountPayload } from "@/types/auth";

export type RoleRegistryItem = {
  id: string;
  email: string;
  role: "admin" | "teacher" | "user";
  updated_at: string;
};

export type TeacherRegistryItem = RoleRegistryItem & {
  role: "teacher";
  course_codes: string[];
};

export type UserRegistryItem = RoleRegistryItem & {
  role: "user";
  year: string;
  department: string;
  course_codes: string[];
};

export type RoleRegistryResponse = {
  teachers: TeacherRegistryItem[];
  users: UserRegistryItem[];
};

export function useAdminAccountManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAccount = useCallback(async (payload: AdminCreateAccountPayload) => {
    setLoading(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setError("You must be logged in as admin.");
      setLoading(false);
      return null;
    }

    const response = await fetch("/api/admin/create-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string; userId?: string };

    if (!response.ok) {
      setError(data.error ?? "Failed to create account.");
      setLoading(false);
      return null;
    }

    setLoading(false);
    return data.userId ?? null;
  }, []);

  const fetchRoleRegistry = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setError("You must be logged in as admin.");
      return { teachers: [], users: [] } as RoleRegistryResponse;
    }

    const response = await fetch("/api/admin/role-registry", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = (await response.json()) as {
      error?: string;
      teachers?: TeacherRegistryItem[];
      users?: UserRegistryItem[];
    };

    if (!response.ok) {
      setError(data.error ?? "Failed to fetch role registry.");
      return { teachers: [], users: [] } as RoleRegistryResponse;
    }

    return {
      teachers: data.teachers ?? [],
      users: data.users ?? [],
    };
  }, []);

  return { createAccount, fetchRoleRegistry, loading, error };
}
