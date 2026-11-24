// src/actions/wiki-manager.ts
"use server";

import { getWikiManagementService } from "@/services/wiki.service";

export async function getWikiManagementData(userId: string) {
  return await getWikiManagementService(userId);
}
