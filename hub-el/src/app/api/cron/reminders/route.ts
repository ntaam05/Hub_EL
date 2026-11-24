import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail/mail";

export async function GET(request: Request) {
  try {
    // 1. Chặn người ngoài gọi bừa bãi bằng 1 mã bảo mật (Secret Key)
    // Ví dụ: Gọi bằng link http://localhost:3000/api/cron/reminders?secret=hub_el_cron_secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    if (secret !== "hub_el_cron_secret") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Lấy tất cả người dùng từ DB
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, 
        currentStreak: true, lastStudyDate: true, 
        aiTokens: true, level: true, isPro: true,
        notificationSettings: true
      }
    });

    const todayMidnight = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    let sentCount = 0;

    for (const user of users) {
      if (!user.email || !user.notificationSettings) continue;

      let settings: any = {};
      try { settings = JSON.parse(user.notificationSettings); } catch(e) { continue; }

      // -------- A. NHẮC NHỞ CHUỖI (NẾU BẬT TASKS: TRUE) --------
      if (settings.tasks === true && user.currentStreak && user.currentStreak > 0) {
        let hasStudiedToday = false;
        if (user.lastStudyDate) {
          const lastMidnight = new Date(user.lastStudyDate).setHours(0, 0, 0, 0);
          if (todayMidnight === lastMidnight) hasStudiedToday = true;
        }

        // Nếu hôm nay chưa học -> Gửi nhắc nhở
        if (!hasStudiedToday) {
          const content = `
            <div style="font-family: Arial; padding: 20px; text-align: center;">
              <h2>Đừng để mất chuỗi ${user.currentStreak} ngày 🔥 của bạn!</h2>
              <p>Chào ${user.name}, bạn chưa học bài hôm nay. Hãy vào Hub-EL ngay để giữ chuỗi và nhận phần thưởng nhé!</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quizzes" style="display: inline-block; padding: 10px 20px; background: #ea580c; color: white; text-decoration: none; border-radius: 8px; margin-top: 15px;">Vào học ngay</a>
            </div>
          `;
          await sendEmail(user.email, `🔥 Cảnh báo mất chuỗi ${user.currentStreak} ngày!`, content);
          sentCount++;
          continue; // Đã gửi mail nhắc chuỗi thì thôi không gửi mail năng lượng nữa để tránh spam 2 mail 1 lúc
        }
      }

      // -------- B. NHẮC NHỞ NĂNG LƯỢNG ĐẦY (NẾU BẬT ENERGY: TRUE) --------
      if (settings.energy === true) {
         // Tính mức năng lượng tối đa của user
         const baseCap = 50 + ((user.level || 1) - 1) * 5;
         const maxEnergy = user.isPro ? baseCap + 50 : baseCap;

         if (user.aiTokens && user.aiTokens >= maxEnergy) {
            const content = `
              <div style="font-family: Arial; padding: 20px; text-align: center;">
                <h2 style="color: #3b82f6;">⚡ Năng lượng AI của bạn đã đầy!</h2>
                <p>Chào ${user.name}, thanh năng lượng AI của bạn đang ở mức tối đa (${maxEnergy}/${maxEnergy}).</p>
                <p>Đừng để phí, hãy vào làm bài tập hoặc chat với AI ngay nhé!</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; margin-top: 15px;">Vào ứng dụng</a>
              </div>
            `;
            await sendEmail(user.email, "⚡ Năng lượng AI đã đầy!", content);
            sentCount++;
         }
      }
    }

    return NextResponse.json({ success: true, emailsSent: sentCount });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}