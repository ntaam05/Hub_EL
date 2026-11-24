"use server";

import { prisma } from "@/lib/prisma";

interface ReportData {
  videoId: string;
  title: string;
  channelName: string;
  reason: string;
  userId: string;
}

export async function reportVideoAction(data: ReportData) {
  try {
    // Lưu báo cáo vào database với trạng thái mặc định là PENDING
    await prisma.reportedVideo.create({
      data: {
        videoId: data.videoId,
        title: data.title,
        channelName: data.channelName,
        reason: data.reason,
        reportedBy: data.userId
      }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}