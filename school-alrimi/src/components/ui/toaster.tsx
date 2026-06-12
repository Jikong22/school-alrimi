"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

/**
 * Korean-friendly toast container.
 *
 * - `top-center` placement matches Korean UX convention (네이버/카카오/토스
 *   style) — bottom-right is associated with OS-level notifications and is
 *   easy to miss on small phone screens.
 * - 3s duration is short enough to feel non-blocking but long enough to read
 *   a Korean sentence (한글은 어절 단위라 2~3초가 안정적).
 * - `richColors` paints success/error/info with brand colors so the toast
 *   reads at a glance, even with a single line of text.
 * - Font is inherited from the document (Pretendard) so Korean text is
 *   rendered with the same family as the rest of the UI.
 */
export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="top-center"
      duration={3000}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "font-sans text-sm rounded-xl border shadow-lg backdrop-blur",
          title: "font-medium",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-foreground",
        },
      }}
      {...props}
    />
  );
}

export { SonnerToaster };
export type { ToasterProps };
