import { useState } from "react";
import { updateProfile, type ProfileUpdatePayload } from "@/lib/profileService";

interface UseUpdateProfileOptions {
  onSuccess?: (data?: any, imageUrl?: string) => void;
  onError?: (error: string) => void;
}

export function useUpdateProfile(options: UseUpdateProfileOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    profileId: string,
    userId: string,
    payload: ProfileUpdatePayload
  ) => {
    setIsSubmitting(true);
    setError(null);

    const result = await updateProfile(profileId, userId, payload);

    setIsSubmitting(false);

    if (result.ok) {
      options.onSuccess?.(result.data, result.imageUrl);
    } else {
      const errMsg = result.error ?? "Failed to update profile.";
      setError(errMsg);
      options.onError?.(errMsg);
    }

    return result;
  };

  return { mutate, isSubmitting, error };
}
