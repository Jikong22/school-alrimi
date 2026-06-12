import { toast as sonnerToast } from "sonner";

/**
 * Toast helpers — thin re-exports of Sonner with project-wide defaults so the
 * rest of the app doesn't import Sonner directly.
 *
 * All messages accept any `React.ReactNode`, so Korean strings can be passed
 * as-is (no translation layer needed). Promise-based toasts let async work
 * (e.g. NEIS fetch, push subscription) show a loading → success/error flow
 * with one call site.
 *
 * @example
 *   import { toast } from "@/lib/toast";
 *
 *   toast.success("저장되었습니다");
 *   toast.error("시간표를 불러오지 못했어요");
 *   toast.info("새로운 알림이 있어요");
 *
 *   await toast.promise(syncTimetable(schoolCode), {
 *     loading: "시간표 동기화 중...",
 *     success: "시간표를 최신 상태로 업데이트했어요",
 *     error:   "시간표 동기화에 실패했어요. 잠시 후 다시 시도해주세요.",
 *   });
 */
export const toast = {
  success: (message: React.ReactNode, opts?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(message, opts),

  error: (message: React.ReactNode, opts?: Parameters<typeof sonnerToast.error>[1]) =>
    sonnerToast.error(message, opts),

  info: (message: React.ReactNode, opts?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(message, opts),

  warning: (message: React.ReactNode, opts?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(message, opts),

  loading: (message: React.ReactNode, opts?: Parameters<typeof sonnerToast.loading>[1]) =>
    sonnerToast.loading(message, opts),

  promise: <T,>(
    promise: Promise<T> | (() => Promise<T>),
    data: Parameters<typeof sonnerToast.promise<T>>[1]
  ) => sonnerToast.promise(promise, data),

  dismiss: (id?: Parameters<typeof sonnerToast.dismiss>[0]) => sonnerToast.dismiss(id),
};

export type { ExternalToast } from "sonner";
