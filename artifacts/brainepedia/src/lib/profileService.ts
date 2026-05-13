import { api } from "./api";
import { getUser } from "./auth";

const USER_KEY = "brainepedia.auth.user";

export interface ProfileUpdatePayload {
  firstName: string;
  surName: string;
  middleName?: string;
  nickName?: string;
  aboutMe?: string;
  currentTitle?: string;
  profession?: string;
  address?: string;
  phoneNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  gender?: string;
  dateOfBirth?: string;
  facebook?: string;
  linkedIn?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  imageFile?: File | null;
}

export function buildProfileFormData(userId: string, payload: ProfileUpdatePayload): FormData {
  const fd = new FormData();

  fd.append("UserId", userId);
  fd.append("FirstName", payload.firstName ?? "");
  fd.append("SurName", payload.surName ?? "");
  fd.append("MiddleName", payload.middleName ?? "");
  fd.append("NickName", payload.nickName ?? "");
  fd.append("AboutMe", payload.aboutMe ?? "");
  fd.append("CurrentTitle", payload.currentTitle ?? "");
  fd.append("Profession", payload.profession ?? "");
  fd.append("Address", payload.address ?? "");
  fd.append("PhoneNumber", payload.phoneNumber ?? "");
  fd.append("Country", payload.country ?? "");
  fd.append("State", payload.state ?? "");
  fd.append("City", payload.city ?? "");
  fd.append("Gender", payload.gender ?? "");
  fd.append("DateOfBirth", payload.dateOfBirth ?? "");
  fd.append("LinkedIn", payload.linkedIn ?? "");
  fd.append("Github", payload.github ?? "");
  fd.append("Instagram", payload.instagram ?? "");
  fd.append("Facebook", payload.facebook ?? "");
  fd.append("Twitter", payload.twitter ?? "");
  fd.append("Youtube", payload.youtube ?? "");

  if (payload.imageFile) {
    fd.append("ImageFile", payload.imageFile);
  }

  console.log("[profileService] FormData entries:");
  for (const [key, value] of fd.entries()) {
    if (value instanceof File) {
      console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
    } else {
      console.log(`  ${key}: "${value}"`);
    }
  }

  return fd;
}

export async function updateProfile(
  profileId: string,
  userId: string,
  payload: ProfileUpdatePayload
): Promise<{ ok: boolean; data?: any; error?: string; imageUrl?: string }> {
  console.log(`[profileService] Submitting update → POST /api/Profiles/edit/${profileId}?userId=${userId}`);

  const fd = buildProfileFormData(userId, payload);
  const res = await api.profiles.update(profileId, userId, fd);

  console.log("[profileService] API response:", {
    ok: res.ok,
    status: res.status,
    data: res.data,
    error: res.error,
  });

  if (!res.ok) {
    console.error("[profileService] Update failed:", res.error);
    return { ok: false, error: res.error };
  }

  const imageUrl: string | undefined =
    res.data?.imageUrl ||
    res.data?.avatarUrl ||
    res.data?.profileImage ||
    undefined;

  const currentUser = getUser();
  if (currentUser) {
    const updatedUser = {
      ...currentUser,
      firstName: payload.firstName,
      lastName: payload.surName,
      surName: payload.surName,
      ...(imageUrl ? { avatarUrl: imageUrl, imageUrl } : {}),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    console.log("[profileService] localStorage user updated:", updatedUser);
  }

  window.dispatchEvent(new Event("auth-change"));
  console.log("[profileService] auth-change event dispatched");

  return { ok: true, data: res.data, imageUrl };
}
