"use server";
import { prisma } from "@/lib/prisma";

export async function updateTaskProgressAction(userId: string, taskType: string, amount: number = 1) {
  try {
    // 🚨 FIX LỖI MÚI GIỜ: Lấy thời gian hiện tại theo đúng giờ Việt Nam
    const vnTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    
    // Tạo chuẩn ngày 0h sáng thống nhất cho toàn bộ hệ thống
    const today = new Date(Date.UTC(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate()));

    // 1. Kiểm tra trạng thái PRO của User
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPro: true }
    });

    if (!user) return { success: false, error: "Không tìm thấy User" };

    // 2. Lấy tất cả các task có mã Logic tương ứng
    const allTasks = await prisma.dailyTask.findMany({
      where: { taskType }
    });

    // 3. Lọc ra các task hợp lệ:
    const validTasks = allTasks.filter(task => !task.isProOnly || (task.isProOnly && user.isPro));

    if (validTasks.length === 0) return { success: true };

    // 4. Cập nhật tiến độ ngầm dưới nền
    const updatePromises = validTasks.map(async (task) => {
      return prisma.userTaskProgress.upsert({
        where: {
          userId_taskId_assignedDate: {
            userId,
            taskId: task.id,
            assignedDate: today
          }
        },
        update: {
          current: { increment: amount } // Cộng dồn số lượng
        },
        create: {
          userId,
          taskId: task.id,
          assignedDate: today,
          current: amount
        }
      });
    });

    await Promise.all(updatePromises);
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi cập nhật tiến độ Quest:", error.message);
    return { success: false, error: error.message };
  }
}