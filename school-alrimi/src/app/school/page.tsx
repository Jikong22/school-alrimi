"use client";

import { useState } from "react";
import { SchoolSearch } from "@/components/school/SchoolSearch";
import { SchoolResults } from "@/components/school/SchoolResults";
import { Button } from "@/components/ui/button";
import { useSchoolSelection } from "@/hooks/useSchoolSelection";
import type { School } from "@/lib/neis/school-search";

export default function SchoolPage() {
  const [results, setResults] = useState<School[]>([]);
  const { selectedSchool, isLoaded, selectSchool, clearSchool } = useSchoolSelection();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-foreground">
          학교 선택
        </h1>

        {selectedSchool ? (
          <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground">선택된 학교</p>
              <p className="text-lg font-bold" style={{ wordBreak: "keep-all" }}>
                {selectedSchool.schoolName}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedSchool.region} · {selectedSchool.schoolKind}
              </p>
            </div>
            <Button variant="outline" onClick={clearSchool}>
              학교 변경
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <SchoolSearch onResults={setResults} />
            </div>
            <SchoolResults
              schools={results}
              onSelect={(school) => selectSchool(school)}
            />
          </>
        )}
      </main>
    </div>
  );
}
