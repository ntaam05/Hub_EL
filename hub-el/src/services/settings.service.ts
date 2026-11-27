// src/services/settings.service.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function getUserSettingsProfileService(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        fullName: true,
        username: true,
        email: true,
        image: true,
        avatar: true,
        bio: true,
        interests: true,
        socialLinks: true,
        privacySettings: true,
        notificationSettings: true,
        level: true,
        xp: true,
        isPro: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { success: false, error: "Người dùng không tồn tại." };
    }

    let parsedInterests: string[] = [];
    try {
      if (user.interests) parsedInterests = JSON.parse(user.interests);
    } catch (_) {}

    let parsedSocialLinks: any[] = [];
    try {
      if (user.socialLinks) parsedSocialLinks = JSON.parse(user.socialLinks);
    } catch (_) {}

    let parsedPrivacy = {
      showOnline: true,
      onlineScope: "everyone",
      publicProfile: true,
      profileScope: "everyone",
    };
    try {
      if (user.privacySettings) {
        parsedPrivacy = { ...parsedPrivacy, ...JSON.parse(user.privacySettings) };
      }
    } catch (_) {}

    let parsedNotifs = {
      allowEmail: true,
      energy: true,
      friendReq: true,
      streak: true,
      wikiShare: true,
    };
    try {
      if (user.notificationSettings) {
        parsedNotifs = { ...parsedNotifs, ...JSON.parse(user.notificationSettings) };
      }
    } catch (_) {}

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        fullName: user.fullName || user.name || "",
        username: user.username || "",
        email: user.email,
        displayAvatar: user.image || user.avatar || null,
        bio: user.bio || "",
        interests: Array.from(new Set(parsedInterests)),
        socialLinks: parsedSocialLinks,
        privacySettings: parsedPrivacy,
        notificationSettings: parsedNotifs,
        level: user.level,
        xp: user.xp,
        isPro: user.isPro,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi tải thông tin cài đặt hồ sơ.",
    };
  }
}

export async function updatePersonalProfileService(
  userId: string,
  data: {
    fullName?: string;
    username?: string;
    bio?: string;
    interests?: string[];
    socialLinks?: { platform: string; url: string }[];
  }
) {
  try {
    if (!userId) {
      return { success: false, error: "Chưa xác thực người dùng." };
    }

    const { fullName, username, bio, interests, socialLinks } = data;

    // Kiểm tra trùng username nếu username thay đổi
    if (username && username.trim()) {
      const cleanUsername = username.trim();
      const existingUser = await prisma.user.findFirst({
        where: {
          username: cleanUsername,
          id: { not: userId },
        },
      });
      if (existingUser) {
        return { success: false, error: "Biệt danh này đã có người sử dụng." };
      }
    }

    const updateData: any = {};
    if (fullName !== undefined) {
      updateData.fullName = fullName.trim();
      updateData.name = fullName.trim();
    }
    if (username !== undefined) {
      updateData.username = username.trim() || null;
    }
    if (bio !== undefined) {
      updateData.bio = bio.trim();
    }
    if (interests !== undefined) {
      updateData.interests = JSON.stringify(interests);
    }
    if (socialLinks !== undefined) {
      updateData.socialLinks = JSON.stringify(socialLinks);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        fullName: true,
        username: true,
        bio: true,
        interests: true,
        socialLinks: true,
      },
    });

    if ((global as any).__socketIo) {
      (global as any).__socketIo.to(userId).emit("profile_updated", {
        userId,
        name: updated.name,
        fullName: updated.fullName,
        username: updated.username,
      });
    }

    return {
      success: true,
      message: "Cập nhật hồ sơ thành công!",
      data: updated,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi cập nhật hồ sơ cá nhân.",
    };
  }
}

export async function updateAvatarService(userId: string, imageString: string) {
  try {
    if (!userId) return { success: false, error: "Chưa xác thực người dùng." };
    if (!imageString || typeof imageString !== "string" || !imageString.trim()) {
      return { success: false, error: "Dữ liệu ảnh đại diện không hợp lệ." };
    }

    const trimmed = imageString.trim();

    // 1. Kiểm tra kích thước payload (giới hạn tối đa 5MB)
    const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB
    if (trimmed.length > MAX_BASE64_SIZE) {
      return {
        success: false,
        error: "Kích thước ảnh đại diện vượt quá giới hạn cho phép (tối đa 5MB).",
      };
    }

    // 2. Kiểm tra định dạng: Bắt buộc là Base64 Data URI hợp lệ (jpeg, png, webp, gif) hoặc URL http/https hợp lệ
    const isDataUri = /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(trimmed);
    const isHttpUrl = /^https?:\/\/[^\s$.?#].[^\s]*$/.test(trimmed);

    if (!isDataUri && !isHttpUrl) {
      return {
        success: false,
        error: "Định dạng ảnh đại diện không hợp lệ. Chỉ chấp nhận Base64 Data URI (JPEG, PNG, WebP, GIF) hoặc liên kết URL hợp lệ.",
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { image: trimmed },
    });

    if ((global as any).__socketIo) {
      (global as any).__socketIo.to(userId).emit("profile_updated", {
        userId,
        image: trimmed,
        avatar: trimmed,
      });
    }

    return {
      success: true,
      message: "Cập nhật ảnh đại diện thành công!",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi cập nhật ảnh đại diện.",
    };
  }
}

export async function getSecurityInfoService(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    });

    if (!user) {
      return { success: false, error: "Người dùng không tồn tại." };
    }

    const isOAuth = user.accounts.length > 0 || !user.password;
    return {
      success: true,
      data: {
        isOAuth,
        email: user.email,
        hasPassword: !!user.password,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi tải thông tin bảo mật.",
    };
  }
}

// In-memory anti-brute-force tracker for OTP verification attempts (max 5 failed attempts per email)
const failedOtpAttempts = new Map<string, { count: number; lockedUntil?: number }>();

export async function sendSecurityOtpService(email: string) {
  try {
    if (!email || !email.trim()) {
      return { success: false, error: "Email không được để trống." };
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return { success: false, error: "Không tìm thấy tài khoản với email này." };
    }

    // Rate-limiting: Không gửi mã liên tục trong vòng 60 giây
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        email: user.email,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentCode) {
      return {
        success: false,
        error: "Vui lòng đợi 60 giây trước khi yêu cầu mã xác thực mới.",
      };
    }

    // Invalidate old OTP codes before generating a new one
    await prisma.verificationCode.deleteMany({
      where: { email: user.email },
    });
    failedOtpAttempts.delete(user.email);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await prisma.verificationCode.create({
      data: { email: user.email, code, expiresAt },
    });

    if (
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      process.env.NODE_ENV !== "test"
    ) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 5000,
        });

        await transporter.sendMail({
          from: `"Hệ thống Hub-EL" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "Mã Xác Thực Tài Khoản Hub-EL",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; borderRadius: 12px;">
              <h2 style="color: #2563eb; text-align: center;">Yêu cầu xác thực tài khoản Hub-EL</h2>
              <p>Mã xác thực (OTP) của bạn là:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #1e40af; background: #eff6ff; padding: 14px; border-radius: 8px;">
                ${code}
              </div>
              <p style="color: #64748b; font-size: 13px; margin-top: 15px;">Mã này sẽ hết hạn sau <strong>5 phút</strong>. Vui lòng tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
            </div>
          `,
        });
      } catch (mailError: any) {
        // Trong trường hợp Gmail SMTP chậm hoặc timeout mạng, OTP đã được lưu an toàn trong DB
      }
    }

    return {
      success: true,
      message: "Đã gửi mã xác thực 6 số vào hộp thư Email của bạn!",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi gửi mã xác thực qua Email.",
    };
  }
}

export async function verifySecurityOtpService(email: string, code: string) {
  try {
    if (!email || !code) {
      return { success: false, error: "Vui lòng nhập đầy đủ email và mã OTP." };
    }

    const cleanEmail = email.trim().toLowerCase();
    const attemptInfo = failedOtpAttempts.get(cleanEmail);

    // Anti-brute-force check: lock after 5 failed attempts
    if (attemptInfo && attemptInfo.count >= 5) {
      await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
      return {
        success: false,
        error: "Bạn đã nhập sai mã xác thực quá 5 lần. Mã này đã bị vô hiệu hóa vì lý do an toàn.",
      };
    }

    const validCode = await prisma.verificationCode.findFirst({
      where: {
        email: cleanEmail,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!validCode) {
      return { success: false, error: "Mã xác thực không đúng hoặc đã hết hạn." };
    }

    // Timing-safe comparison to prevent timing attacks
    const codeBuf = Buffer.from(code.trim());
    const validBuf = Buffer.from(validCode.code.trim());
    const isMatch =
      codeBuf.length === validBuf.length && crypto.timingSafeEqual(codeBuf, validBuf);

    if (!isMatch) {
      const newCount = (attemptInfo?.count || 0) + 1;
      if (newCount >= 5) {
        await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
        failedOtpAttempts.set(cleanEmail, { count: newCount });
        return {
          success: false,
          error: "Bạn đã nhập sai mã xác thực quá 5 lần. Mã này đã bị vô hiệu hóa vì lý do an toàn.",
        };
      } else {
        failedOtpAttempts.set(cleanEmail, { count: newCount });
        return {
          success: false,
          error: `Mã xác thực không chính xác. Bạn còn ${5 - newCount} lần thử.`,
        };
      }
    }

    // Reset failed counter upon successful match
    failedOtpAttempts.delete(cleanEmail);

    return {
      success: true,
      message: "Xác thực mã OTP thành công!",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi kiểm tra mã xác thực.",
    };
  }
}

export async function changePasswordService(
  userId: string,
  oldPass: string,
  newPass: string
) {
  try {
    if (!userId) return { success: false, error: "Chưa xác thực người dùng." };
    if (!newPass || newPass.length < 8) {
      return { success: false, error: "Mật khẩu mới phải dài ít nhất 8 ký tự." };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return {
        success: false,
        error: "Tài khoản đăng nhập bằng Google không có mật khẩu trực tiếp.",
      };
    }

    const isValid = await bcrypt.compare(oldPass, user.password);
    if (!isValid) {
      return { success: false, error: "Mật khẩu hiện tại không chính xác." };
    }

    const hashed = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return {
      success: true,
      message: "Đổi mật khẩu thành công!",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi cập nhật mật khẩu mới.",
    };
  }
}

export async function resetPasswordWithOtpService(
  email: string,
  code: string,
  newPass: string
) {
  try {
    if (!email || !code || !newPass) {
      return { success: false, error: "Thiếu thông tin đặt lại mật khẩu." };
    }
    if (newPass.length < 8) {
      return { success: false, error: "Mật khẩu mới phải dài ít nhất 8 ký tự." };
    }

    const cleanEmail = email.trim().toLowerCase();
    const validCode = await prisma.verificationCode.findFirst({
      where: {
        email: cleanEmail,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!validCode) {
      return { success: false, error: "Mã xác thực không đúng hoặc đã hết hạn." };
    }

    // Timing-safe comparison of code
    const codeBuf = Buffer.from(code.trim());
    const validBuf = Buffer.from(validCode.code.trim());
    const isMatch =
      codeBuf.length === validBuf.length && crypto.timingSafeEqual(codeBuf, validBuf);

    if (!isMatch) {
      return { success: false, error: "Mã xác thực không đúng hoặc đã hết hạn." };
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return { success: false, error: "Tài khoản không tồn tại." };
    }

    const hashed = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    // Xóa mã OTP đã sử dụng (Single-use OTP)
    try {
      await prisma.verificationCode.delete({ where: { id: validCode.id } });
    } catch (_) {}

    failedOtpAttempts.delete(cleanEmail);

    return {
      success: true,
      message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi đặt lại mật khẩu bằng mã OTP.",
    };
  }
}

export async function getPrivacySettingsService(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { privacySettings: true },
    });

    let privacy = {
      showOnline: true,
      onlineScope: "everyone",
      publicProfile: true,
      profileScope: "everyone",
    };

    if (user?.privacySettings) {
      try {
        privacy = { ...privacy, ...JSON.parse(user.privacySettings) };
      } catch (_) {}
    }

    return { success: true, data: privacy };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tải quyền riêng tư." };
  }
}

export async function updatePrivacySettingsService(
  userId: string,
  privacyData: any
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { privacySettings: JSON.stringify(privacyData) },
    });

    return {
      success: true,
      message: "Đã lưu cài đặt quyền riêng tư!",
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi lưu quyền riêng tư." };
  }
}

export async function getNotificationSettingsService(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true },
    });

    let notifs = {
      allowEmail: true,
      energy: true,
      friendReq: true,
      streak: true,
      wikiShare: true,
    };

    if (user?.notificationSettings) {
      try {
        notifs = { ...notifs, ...JSON.parse(user.notificationSettings) };
      } catch (_) {}
    }

    return { success: true, data: notifs };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tải cài đặt thông báo." };
  }
}

export async function updateNotificationSettingsService(
  userId: string,
  notifData: any
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { notificationSettings: JSON.stringify(notifData) },
    });

    return {
      success: true,
      message: "Đã lưu cài đặt thông báo Email!",
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi lưu cài đặt thông báo." };
  }
}

export async function submitFeedbackService(
  userId: string | null,
  userName: string | null,
  content: string
) {
  try {
    if (!content || !content.trim()) {
      return { success: false, error: "Nội dung góp ý không được để trống." };
    }

    if (content.length > 2000) {
      return {
        success: false,
        error: "Nội dung góp ý không được vượt quá 2000 ký tự.",
      };
    }

    await prisma.feedback.create({
      data: {
        userId,
        userName,
        content: content.trim(),
      },
    });

    return {
      success: true,
      message: "Cảm ơn bạn đã đóng góp ý kiến để hoàn thiện Hub-EL!",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi gửi đóng góp ý kiến.",
    };
  }
}

export async function getInterestTagsService() {
  try {
    const tags = await prisma.interestTag.findMany({
      orderBy: { name: "asc" },
    });
    return {
      success: true,
      data: tags.map((t) => t.name),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi tải danh mục sở thích.",
    };
  }
}

export async function deleteAccountService(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "Chưa xác thực người dùng." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return { success: false, error: "Không tìm thấy người dùng." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.userStats.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.userInventory.deleteMany({ where: { userId } });
      await tx.userTaskProgress.deleteMany({ where: { userId } });
      await tx.userProgress.deleteMany({ where: { userId } });
      await tx.quizAttempt.deleteMany({ where: { userId } });
      await tx.dailyGacha.deleteMany({ where: { userId } });
      await tx.userAchievement.deleteMany({ where: { userId } });
      await tx.streakFreezeUsage.deleteMany({ where: { userId } });
      await tx.friendship.deleteMany({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      });
      await tx.groupMember.deleteMany({ where: { userId } });
      await tx.wikiQuizAttempt.deleteMany({ where: { userId } });
      await tx.dailyStat.deleteMany({ where: { userId } });
      await tx.coinTransaction.deleteMany({ where: { userId } });
      await tx.chatMessage.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      });
      await tx.order.deleteMany({ where: { userId } });
      await tx.feedback.deleteMany({ where: { userId } });
      await tx.verificationCode.deleteMany({ where: { email: user.email } });

      await tx.user.delete({ where: { id: userId } });
    });

    return {
      success: true,
      message: "Tài khoản của bạn đã được xóa vĩnh viễn.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi xóa tài khoản vĩnh viễn.",
    };
  }
}

