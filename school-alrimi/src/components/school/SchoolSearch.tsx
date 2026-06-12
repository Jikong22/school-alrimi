"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { searchSchools } from "@/lib/neis/school-search";

interface SchoolSearchProps {
  onResults: (results: Awaited<ReturnType<typeof searchSchools>>) => void;
}

export function SchoolSearch({ onResults }: SchoolSearchProps) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const doSearch = useCallback(
    async (keyword: string) => {
      if (keyword.trim().length < 2) {
        onResults([]);
        return;
      }
      const results = await searchSchools(keyword.trim());
      onResults(results);
    },
    [onResults]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        doSearch(query);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="text"
        placeholder="학교 이름을 입력하세요 (예: 서초)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="학교 검색"
        aria-busy={isPending}
      />
      {isPending && (
        <p className="text-sm text-muted-foreground">검색 중...</p>
      )}
    </div>
  );
}
