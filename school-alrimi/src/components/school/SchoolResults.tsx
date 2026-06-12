"use client";

import { SchoolCard } from "./SchoolCard";

export interface School {
  schoolName: string;
  schoolCode: string;
  region: string;
  schoolKind: string;
}

interface SchoolResultsProps {
  schools: School[];
  onSelect: (school: School) => void;
}

export function SchoolResults({ schools, onSelect }: SchoolResultsProps) {
  if (schools.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        검색 결과가 없습니다
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3" role="list" aria-label="학교 검색 결과">
      {schools.map((school) => (
        <li key={school.schoolCode}>
          <SchoolCard
            schoolName={school.schoolName}
            schoolCode={school.schoolCode}
            region={school.region}
            schoolKind={school.schoolKind}
            onClick={() => onSelect(school)}
          />
        </li>
      ))}
    </ul>
  );
}
