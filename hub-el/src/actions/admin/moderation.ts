"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. QUẢN LÝ BÁO CÁO CỦA NGƯỜI DÙNG (REPORTS)
// ==========================================

// Lấy danh sách báo cáo (ĐÃ GỘP THEO VIDEO VÀ SẮP XẾP SỐ LƯỢNG)
export async function getPendingReportsAction() {
  try {
    // 1. Lấy toàn bộ báo cáo PENDING
    const rawReports = await prisma.reportedVideo.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Gộp các báo cáo trùng videoId
    const grouped: Record<string, any> = {};
    rawReports.forEach(report => {
      if (!grouped[report.videoId]) {
        grouped[report.videoId] = {
          videoId: report.videoId,
          title: report.title,
          channelName: report.channelName,
          reportCount: 0, // Bộ đếm số phiếu
          reasons: [], // Mảng lưu các lý do khác nhau
          latestReportTime: report.createdAt
        };
      }
      grouped[report.videoId].reportCount += 1;
      
      // Chỉ push lý do vào mảng nếu chưa có (tránh trùng lặp text)
      if (!grouped[report.videoId].reasons.includes(report.reason)) {
          grouped[report.videoId].reasons.push(report.reason);
      }
    });

    // 3. Chuyển object thành mảng và SẮP XẾP (Video nhiều phiếu báo cáo nhất lên đầu)
    const sortedReports = Object.values(grouped).sort((a, b) => b.reportCount - a.reportCount);

    return { success: true, data: sortedReports };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Xử lý hàng loạt báo cáo cho 1 video
export async function resolveReportGroupAction(videoId: string, actionType: "BAN" | "IGNORE", adminName: string) {
  try {
    // 1. Cập nhật trạng thái cho TẤT CẢ các report của video này
    await prisma.reportedVideo.updateMany({
      where: { videoId, status: "PENDING" },
      data: { status: actionType === "BAN" ? "RESOLVED" : "IGNORED" }
    });

    // 2. Nếu Admin chọn CẤM, đưa video này vào danh sách Tử hình (ModeratedVideo)
    if (actionType === "BAN") {
      const sampleReport = await prisma.reportedVideo.findFirst({ where: { videoId } });
      const existing = await prisma.moderatedVideo.findUnique({ where: { videoId } });
      
      if (!existing) {
        await prisma.moderatedVideo.create({
          data: {
            videoId,
            title: sampleReport?.title || "Unknown",
            channelName: sampleReport?.channelName,
            status: "BANNED",
            reason: `Bị cấm do cộng đồng báo cáo`,
            moderatedBy: adminName
          }
        });
      } else {
        await prisma.moderatedVideo.update({
          where: { videoId },
          data: { status: "BANNED", moderatedBy: adminName, reason: `Bị cấm do cộng đồng báo cáo` }
        });
      }
    }

    revalidatePath('/admin/moderation');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function moderateVideoAction(videoId: string, title: string, channelName: string, status: "BANNED" | "APPROVED", adminName: string) {
  try {
    const existing = await prisma.moderatedVideo.findUnique({ where: { videoId } });
    
    if (existing) {
      await prisma.moderatedVideo.update({
        where: { videoId },
        data: { status, moderatedBy: adminName, title, channelName }
      });
    } else {
      await prisma.moderatedVideo.create({
        data: { videoId, title, channelName, status, moderatedBy: adminName }
      });
    }

    revalidatePath('/admin/moderation');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
// ==========================================
// 3. QUẢN LÝ LỊCH SỬ CẤM (BANNED HISTORY)
// ==========================================

// Lấy danh sách các video đã bị đưa vào danh sách đen
export async function getBannedVideosAction() {
  try {
    const bannedVideos = await prisma.moderatedVideo.findMany({
      where: { status: "BANNED" },
      orderBy: { updatedAt: 'desc' }
    });
    return { success: true, data: bannedVideos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Khôi phục video (Gỡ bỏ lệnh cấm)
export async function unbanVideoAction(videoId: string) {
  try {
    // Xóa record khỏi bảng ModeratedVideo để video trở về trạng thái bình thường (vùng xám)
    await prisma.moderatedVideo.delete({
      where: { videoId }
    });
    revalidatePath('/admin/moderation');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}