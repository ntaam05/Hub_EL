// src/actions/user/settings.ts
"use server";
import { revalidatePath } from "next/cache";
import {
  updatePersonalProfileService,
  updateAvatarService,
  updatePrivacySettingsService,
  updateNotificationSettingsService,
} from "@/services/settings.service";

export async function updatePersonalProfileAction(
  userId: string,
  data: {
    fullName: string;
    username: string;
    bio: string;
    interests: string[];
    socialLinks: { platform: string; url: string }[];
  }
) {
  const res = await updatePersonalProfileService(userId, data);
  if (res.success) {
    revalidatePath("/", "layout");
  }
  return res;
}

export async function updateAvatarAction(userId: string, base64Image: string) {
  const res = await updateAvatarService(userId, base64Image);
  if (res.success) {
    revalidatePath("/", "layout");
  }
  return res;
}

export async function updatePrivacyAction(userId: string, privacyData: any) {
  const res = await updatePrivacySettingsService(userId, privacyData);
  if (res.success) {
    revalidatePath("/", "layout");
  }
  return res;
}

export async function updateNotificationSettingsAction(
  userId: string,
  notifData: any
) {
  const res = await updateNotificationSettingsService(userId, notifData);
  if (res.success) {
    revalidatePath("/", "layout");
  }
  return res;
}
