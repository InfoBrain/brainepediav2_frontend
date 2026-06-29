import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { sanitizeErrorForDisplay } from "@/lib/apiErrorHandler";
import type { ApiResult } from "@/lib/api";

type SuccessOptions = {
  title: string;
  description?: string;
};

type ErrorOptions = {
  title?: string;
  fallback?: string;
  silent?: boolean;
};

export function useApiFeedback() {
  const { toast } = useToast();

  const showSuccess = useCallback(
    ({ title, description }: SuccessOptions) => {
      toast({ title, description });
    },
    [toast],
  );

  const showError = useCallback(
    (message: string, options: ErrorOptions = {}) => {
      if (options.silent) return;
      const description = sanitizeErrorForDisplay(message || options.fallback || "Please try again.");
      toast({
        title: options.title ?? "Action failed",
        description,
        variant: "destructive",
      });
    },
    [toast],
  );

  const handleApiResult = useCallback(
    <T,>(
      res: ApiResult<T>,
      success: SuccessOptions,
      errorOptions?: ErrorOptions,
    ): res is ApiResult<T> & { ok: true; data: T } => {
      if (res.ok) {
        showSuccess(success);
        return true;
      }
      showError(res.error || res.message || "", errorOptions);
      return false;
    },
    [showError, showSuccess],
  );

  return { showSuccess, showError, handleApiResult };
}

export const SUCCESS_COPY = {
  jobCreated: { title: "Job created", description: "Your posting is live and ready for applicants." },
  profileUpdated: { title: "Profile updated", description: "Your changes have been saved." },
  applicationSubmitted: { title: "Application submitted", description: "The employer can now review your verified profile." },
  challengeCompleted: { title: "Challenge completed", description: "Your results are being processed." },
  discussionPosted: { title: "Discussion posted", description: "Your thread is now visible in the forum." },
  replyAdded: { title: "Reply added", description: "Your contribution has been published." },
  companyUpdated: { title: "Company updated", description: "Your organization profile has been saved." },
  subscriptionActivated: { title: "Subscription activated", description: "Your plan benefits are now available." },
} as const;
