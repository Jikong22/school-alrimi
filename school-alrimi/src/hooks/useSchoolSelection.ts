"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SelectedSchool {
  schoolName: string;
  schoolCode: string;
  region: string;
  schoolKind: string;
}

const STORAGE_KEY = "selected-school";

export function useSchoolSelection() {
  const [selectedSchool, setSelectedSchool] = useState<SelectedSchool | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SelectedSchool;
        setSelectedSchool(parsed);
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoaded(true);
  }, []);

  const selectSchool = useCallback(async (school: SelectedSchool) => {
    setSelectedSchool(school);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(school));

    // Best-effort Supabase persistence
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_schools").upsert(
          {
            user_id: user.id,
            school_code: school.schoolCode,
            school_name: school.schoolName,
            region: school.region,
            selected_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }
    } catch {
      // Silently ignore Supabase errors (user may be offline or unauthenticated)
    }
  }, []);

  const clearSchool = useCallback(async () => {
    setSelectedSchool(null);
    localStorage.removeItem(STORAGE_KEY);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_schools").delete().eq("user_id", user.id);
      }
    } catch {
      // Silently ignore
    }
  }, []);

  return { selectedSchool, isLoaded, selectSchool, clearSchool };
}
