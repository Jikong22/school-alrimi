"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SchoolCardProps {
  schoolName: string;
  schoolCode: string;
  region: string;
  schoolKind: string;
  onClick: () => void;
}

export function SchoolCard({
  schoolName,
  region,
  schoolKind,
  onClick,
}: SchoolCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        "py-4"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${schoolName} 선택`}
    >
      <CardContent className="flex flex-col gap-2">
        <h3 className="text-base font-bold text-foreground" style={{ wordBreak: "keep-all" }}>
          {schoolName}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{region}</span>
          <Badge variant="secondary">{schoolKind}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
