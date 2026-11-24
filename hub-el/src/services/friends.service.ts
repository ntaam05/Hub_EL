import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail/mail";

// ==========================================
// DATA TRANSFER OBJECTS (DTOs)
// ==========================================

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface UserSearchResultDTO {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  avatar: string | null;
  displayAvatar: string | null;
  friendshipStatus: "NONE" | "PENDING" | "ACCEPTED" | "BLOCKED";
  isSender: boolean;
  friendshipId?: number;
}

export interface FriendDTO {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  isOnline: boolean;
  friendshipStatus: string;
  isBlockedByMe: boolean;
  isBlockedByThem: boolean;
  lastMsg: string;
  level?: number;
  isPro?: boolean;
}

export interface FriendRequestDTO {
  id: number;
  senderId?: string;
  receiverId?: string;
  name: string | null;
  avatar: string | null;
  createdAt: Date;
}

export interface OtherUserProfileDTO {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  avatar: string | null;
  displayAvatar: string | null;
  email: string | null;
  isActive: boolean;
  isProfileHidden: boolean;
  bio: string | null;
  interests: string | null;
  socialLinks: string | null;
  achievements: any[];
  friends: {
    id: string;
    name: string | null;
    avatar: string | null;
    isOnline: boolean;
  }[];
  friendshipStatus: "NONE" | "PENDING" | "ACCEPTED" | "BLOCKED";
  isSender: boolean;
  friendshipId?: number;
}

// ==========================================
// 1. TÌM KIẾM NGƯỜI DÙNG (USER SEARCH)
// ==========================================

export async function searchUsersService(
  query: string,
  currentUserId: string
): Promise<ServiceResult<UserSearchResultDTO[]>> {
  try {
    if (!query || query.trim() === "") {
      return { success: true, data: [] };
    }

    const trimmedQuery = query.trim();

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { name: { contains: trimmedQuery } },
              { username: { contains: trimmedQuery } },
              { id: { equals: trimmedQuery } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        avatar: true,
      },
      take: 10,
    });

    const results: UserSearchResultDTO[] = await Promise.all(
      users.map(async (u) => {
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { userId1: currentUserId, userId2: u.id },
              { userId1: u.id, userId2: currentUserId },
            ],
          },
        });

        let status: "NONE" | "PENDING" | "ACCEPTED" | "BLOCKED" = "NONE";
        let isSender = false;

        if (friendship) {
          status = friendship.status as any;
          isSender = friendship.userId1 === currentUserId;
        }

        return {
          id: u.id,
          name: u.name,
          username: u.username,
          image: u.image,
          avatar: u.avatar,
          displayAvatar: u.avatar || u.image,
          friendshipStatus: status,
          isSender,
          friendshipId: friendship?.id,
        };
      })
    );

    return { success: true, data: results };
  } catch (error: any) {
    console.error("[FriendsService] searchUsersService error:", error);
    return { success: false, error: error.message || "Lỗi khi tìm kiếm người dùng." };
  }
}

// ==========================================
// 2. GỬI LỜI MỜI KẾT BẠN (ADD FRIEND)
// ==========================================

export async function addFriendService(
  currentUserId: string,
  targetUserId: string
): Promise<ServiceResult<{ friendshipId: number }>> {
  try {
    if (!targetUserId || targetUserId.trim() === "") {
      return { success: false, error: "ID người dùng không hợp lệ.", statusCode: 400 };
    }

    if (currentUserId === targetUserId) {
      return { success: false, error: "Không thể tự kết bạn.", statusCode: 400 };
    }

    // Kiểm tra user đích có tồn tại không
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, notificationSettings: true },
    });

    if (!target) {
      return { success: false, error: "Người dùng không tồn tại.", statusCode: 404 };
    }

    // Kiểm tra quan hệ 2 chiều hiện có
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: currentUserId, userId2: targetUserId },
          { userId1: targetUserId, userId2: currentUserId },
        ],
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return { success: false, error: "Đã là bạn bè.", statusCode: 400 };
      }
      if (existing.status === "PENDING") {
        if (existing.userId1 === currentUserId) {
          return { success: true, message: "Đã có lời mời trước đó.", data: { friendshipId: existing.id } };
        } else {
          // Đối phương đã gửi lời mời trước -> Tự động chấp nhận luôn
          await prisma.friendship.update({
            where: { id: existing.id },
            data: { status: "ACCEPTED" },
          });
          return { success: true, message: "Đã chấp nhận lời mời kết bạn từ đối phương!", data: { friendshipId: existing.id } };
        }
      }
      if (existing.status === "BLOCKED") {
        if (existing.userId1 === currentUserId) {
          return { success: false, error: "Bạn đang chặn người này. Hãy bỏ chặn trước khi kết bạn.", statusCode: 400 };
        } else {
          return { success: false, error: "Không thể gửi lời mời kết bạn.", statusCode: 403 };
        }
      }
    }

    // Tạo lời mời mới
    const newFriendship = await prisma.friendship.create({
      data: {
        userId1: currentUserId,
        userId2: targetUserId,
        status: "PENDING",
      },
    });

    // Side effect: Gửi email thông báo (non-blocking)
    const sender = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { name: true },
    });

    if (target.email) {
      let shouldSendEmail = true;
      if (target.notificationSettings) {
        try {
          const settings = JSON.parse(target.notificationSettings);
          if (settings.friendReq === false || settings.allowEmail === false) {
            shouldSendEmail = false;
          }
        } catch (e) {}
      }

      if (shouldSendEmail) {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2563eb; margin-top: 0;">Bạn có một lời mời kết bạn mới!</h2>
              <p>Xin chào <b>${target.name || "bạn"}</b>,</p>
              <p>Bạn vừa nhận được một lời mời kết bạn từ <b>${sender?.name || "Một người dùng"}</b> trên hệ thống Hub-EL.</p>
              <p style="margin-top: 20px;">Hãy truy cập ứng dụng để xác nhận hoặc từ chối nhé!</p>
          </div>
        `;
        sendEmail(target.email, "Yêu cầu kết bạn mới - Hub-EL", htmlContent).catch((err) => {
          console.warn("[FriendsService] Lỗi gửi email thông báo kết bạn (bỏ qua):", err);
        });
      }
    }

    return {
      success: true,
      message: "Đã gửi lời mời kết bạn!",
      data: { friendshipId: newFriendship.id },
    };
  } catch (error: any) {
    console.error("[FriendsService] addFriendService error:", error);
    return { success: false, error: error.message || "Lỗi khi gửi lời mời kết bạn." };
  }
}

// ==========================================
// 3. LẤY DANH SÁCH LỜI MỜI NHẬN ĐƯỢC
// ==========================================

export async function getPendingRequestsService(
  userId: string
): Promise<ServiceResult<FriendRequestDTO[]>> {
  try {
    const requests = await prisma.friendship.findMany({
      where: { userId2: userId, status: "PENDING" },
      include: {
        user1: {
          select: { id: true, name: true, image: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted: FriendRequestDTO[] = requests.map((r: any) => ({
      id: r.id,
      senderId: r.user1.id,
      name: r.user1.name,
      avatar: r.user1.avatar || r.user1.image,
      createdAt: r.createdAt,
    }));

    return { success: true, data: formatted };
  } catch (error: any) {
    console.error("[FriendsService] getPendingRequestsService error:", error);
    return { success: false, error: error.message || "Lỗi khi lấy danh sách lời mời." };
  }
}

// ==========================================
// 4. LẤY DANH SÁCH LỜI MỜI ĐÃ GỬI (SENT REQUESTS)
// ==========================================

export async function getSentRequestsService(
  userId: string
): Promise<ServiceResult<FriendRequestDTO[]>> {
  try {
    const sent = await prisma.friendship.findMany({
      where: { userId1: userId, status: "PENDING" },
      include: {
        user2: {
          select: { id: true, name: true, image: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted: FriendRequestDTO[] = sent.map((r: any) => ({
      id: r.id,
      receiverId: r.user2.id,
      name: r.user2.name,
      avatar: r.user2.avatar || r.user2.image,
      createdAt: r.createdAt,
    }));

    return { success: true, data: formatted };
  } catch (error: any) {
    console.error("[FriendsService] getSentRequestsService error:", error);
    return { success: false, error: error.message || "Lỗi khi lấy danh sách lời mời đã gửi." };
  }
}

// ==========================================
// 5. PHẢN HỒI LỜI MỜI (CHẤP NHẬN / TỪ CHỐI)
// ==========================================

export async function respondFriendRequestService(
  friendshipId: number,
  accept: boolean,
  currentUserId?: string
): Promise<ServiceResult<{ senderId?: string }>> {
  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      select: { id: true, userId1: true, userId2: true, status: true },
    });

    if (!friendship) {
      return { success: false, error: "Lời mời không tồn tại.", statusCode: 404 };
    }

    // Kiểm tra quyền: Chỉ người nhận (userId2) mới được chấp nhận / từ chối
    if (currentUserId && friendship.userId2 !== currentUserId) {
      return {
        success: false,
        error: "Bạn không có quyền phản hồi lời mời này.",
        statusCode: 403,
      };
    }

    if (friendship.status !== "PENDING") {
      return {
        success: false,
        error: "Lời mời này không ở trạng thái chờ.",
        statusCode: 400,
      };
    }

    if (accept) {
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "ACCEPTED" },
      });

      return {
        success: true,
        message: "Đã chấp nhận kết bạn!",
        data: { senderId: friendship.userId1 },
      };
    } else {
      await prisma.friendship.delete({
        where: { id: friendshipId },
      });

      return {
        success: true,
        message: "Đã từ chối lời mời.",
        data: { senderId: friendship.userId1 },
      };
    }
  } catch (error: any) {
    console.error("[FriendsService] respondFriendRequestService error:", error);
    return { success: false, error: error.message || "Lỗi khi phản hồi lời mời." };
  }
}

// ==========================================
// 6. HỦY LỜI MỜI ĐÃ GỬI (CANCEL REQUEST)
// ==========================================

export async function cancelFriendRequestService(
  requestIdOrTargetUserId: number | string,
  currentUserId: string
): Promise<ServiceResult> {
  try {
    let friendship = null;

    if (typeof requestIdOrTargetUserId === "number") {
      friendship = await prisma.friendship.findUnique({
        where: { id: requestIdOrTargetUserId },
      });
    } else {
      friendship = await prisma.friendship.findFirst({
        where: {
          userId1: currentUserId,
          userId2: requestIdOrTargetUserId,
          status: "PENDING",
        },
      });
    }

    if (!friendship) {
      return { success: false, error: "Lời mời không tồn tại hoặc đã xử lý.", statusCode: 404 };
    }

    if (friendship.userId1 !== currentUserId) {
      return {
        success: false,
        error: "Bạn không thể hủy lời mời do người khác gửi.",
        statusCode: 403,
      };
    }

    if (friendship.status !== "PENDING") {
      return {
        success: false,
        error: "Lời mời này không ở trạng thái chờ.",
        statusCode: 400,
      };
    }

    await prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { success: true, message: "Đã hủy lời mời kết bạn." };
  } catch (error: any) {
    console.error("[FriendsService] cancelFriendRequestService error:", error);
    return { success: false, error: error.message || "Lỗi khi hủy lời mời kết bạn." };
  }
}

// ==========================================
// 7. LẤY DANH SÁCH BẠN BÈ (FRIENDS LIST)
// ==========================================

export async function getFriendsListService(
  userId: string
): Promise<ServiceResult<FriendDTO[]>> {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
        status: { in: ["ACCEPTED", "BLOCKED"] },
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            avatar: true,
            isActive: true,
            isPro: true,
            level: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            avatar: true,
            isActive: true,
            isPro: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const seenFriendIds = new Set<string>();
    const friends: FriendDTO[] = [];

    for (const f of friendships) {
      const isMeUser1 = f.userId1 === userId;
      const targetUser = (isMeUser1 ? f.user2 : f.user1) as any;
      if (!targetUser || seenFriendIds.has(targetUser.id)) {
        continue;
      }
      seenFriendIds.add(targetUser.id);

      const isBlockedByMe = f.status === "BLOCKED" && f.userId1 === userId;
      const isBlockedByThem = f.status === "BLOCKED" && f.userId2 === userId;

      friends.push({
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
        avatar: targetUser.avatar || targetUser.image,
        isOnline: targetUser.isActive,
        friendshipStatus: f.status,
        isBlockedByMe,
        isBlockedByThem,
        lastMsg: isBlockedByMe
          ? "Bạn đã chặn người này"
          : isBlockedByThem
          ? "Không thể nhắn tin"
          : "Bắt đầu trò chuyện...",
        level: targetUser.level,
        isPro: targetUser.isPro,
      });
    }

    return { success: true, data: friends };
  } catch (error: any) {
    console.error("[FriendsService] getFriendsListService error:", error);
    return { success: false, error: error.message || "Lỗi khi lấy danh sách bạn bè." };
  }
}

// ==========================================
// 8. HỦY KẾT BẠN (REMOVE FRIEND)
// ==========================================

export async function removeFriendService(
  currentUserId: string,
  friendId: string
): Promise<ServiceResult> {
  try {
    if (!friendId || friendId.trim() === "") {
      return { success: false, error: "ID bạn bè không hợp lệ.", statusCode: 400 };
    }

    const deleted = await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId1: currentUserId, userId2: friendId },
          { userId1: friendId, userId2: currentUserId },
        ],
      },
    });

    if (deleted.count === 0) {
      return { success: false, error: "Hai người chưa từng có quan hệ bạn bè.", statusCode: 404 };
    }

    return { success: true, message: "Đã hủy kết bạn." };
  } catch (error: any) {
    console.error("[FriendsService] removeFriendService error:", error);
    return { success: false, error: error.message || "Lỗi khi hủy kết bạn." };
  }
}

// ==========================================
// 9. CHẶN NGƯỜI DÙNG (BLOCK USER)
// ==========================================

export async function blockUserService(
  currentUserId: string,
  targetUserId: string
): Promise<ServiceResult> {
  try {
    if (currentUserId === targetUserId) {
      return { success: false, error: "Không thể tự chặn chính mình.", statusCode: 400 };
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: currentUserId, userId2: targetUserId },
          { userId1: targetUserId, userId2: currentUserId },
        ],
      },
    });

    if (existing) {
      await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          status: "BLOCKED",
          userId1: currentUserId, // Đánh dấu ai là người bấm chặn
          userId2: targetUserId,
        },
      });
    } else {
      await prisma.friendship.create({
        data: {
          userId1: currentUserId,
          userId2: targetUserId,
          status: "BLOCKED",
        },
      });
    }

    return { success: true, message: "Đã chặn người dùng này." };
  } catch (error: any) {
    console.error("[FriendsService] blockUserService error:", error);
    return { success: false, error: error.message || "Lỗi khi chặn người dùng." };
  }
}

// ==========================================
// 10. BỎ CHẶN NGƯỜI DÙNG (UNBLOCK USER)
// ==========================================

export async function unblockUserService(
  currentUserId: string,
  targetUserId: string
): Promise<ServiceResult> {
  try {
    if (currentUserId === targetUserId) {
      return { success: false, error: "ID người dùng không hợp lệ.", statusCode: 400 };
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        userId1: currentUserId,
        userId2: targetUserId,
        status: "BLOCKED",
      },
    });

    if (!existing) {
      return { success: false, error: "Bạn chưa từng chặn người dùng này.", statusCode: 404 };
    }

    // Quy tắc Web: Chuyển lại trạng thái ACCEPTED
    await prisma.friendship.update({
      where: { id: existing.id },
      data: { status: "ACCEPTED" },
    });

    return { success: true, message: "Đã bỏ chặn người dùng." };
  } catch (error: any) {
    console.error("[FriendsService] unblockUserService error:", error);
    return { success: false, error: error.message || "Lỗi khi bỏ chặn người dùng." };
  }
}

// ==========================================
// 11. DANH SÁCH NGƯỜI ĐÃ CHẶN (BLOCKED USERS)
// ==========================================

export async function getBlockedUsersService(
  userId: string
): Promise<ServiceResult<{ id: string; name: string | null; avatar: string | null }[]>> {
  try {
    const blocked = await prisma.friendship.findMany({
      where: { userId1: userId, status: "BLOCKED" },
      include: {
        user2: {
          select: { id: true, name: true, image: true, avatar: true },
        },
      },
    });

    const data = blocked.map((b: any) => ({
      id: b.user2.id,
      name: b.user2.name,
      avatar: b.user2.avatar || b.user2.image,
    }));

    return { success: true, data };
  } catch (error: any) {
    console.error("[FriendsService] getBlockedUsersService error:", error);
    return { success: false, error: error.message || "Lỗi khi lấy danh sách người đã chặn." };
  }
}

// ==========================================
// 12. XEM HỒ SƠ NGƯỜI DÙNG KHÁC (OTHER USER PROFILE)
// ==========================================

export async function getOtherUserProfileService(
  targetUserId: string,
  currentUserId: string
): Promise<ServiceResult<OtherUserProfileDTO>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        privacySettings: true,
        notificationSettings: true,
        name: true,
        username: true,
        image: true,
        avatar: true,
        interests: true,
        bio: true,
        socialLinks: true,
        email: true,
        isActive: true,
        achievements: {
          include: { achievement: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Không tìm thấy người dùng.", statusCode: 404 };
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId1: targetUserId }, { userId2: targetUserId }],
        status: "ACCEPTED",
      },
      include: {
        user1: { select: { id: true, name: true, avatar: true, image: true, isActive: true } },
        user2: { select: { id: true, name: true, avatar: true, image: true, isActive: true } },
      },
    });

    const friendsList = friendships.map((f: any) => {
      const target = f.userId1 === targetUserId ? f.user2 : f.user1;
      return {
        id: target.id,
        name: target.name,
        avatar: target.avatar || target.image,
        isOnline: target.isActive,
      };
    });

    const connection = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: currentUserId, userId2: targetUserId },
          { userId1: targetUserId, userId2: currentUserId },
        ],
      },
    });

    const isMe = currentUserId === targetUserId;
    const isFriend = connection?.status === "ACCEPTED";
    const isBlocked = connection?.status === "BLOCKED";

    let privacy = {
      showOnline: true,
      onlineScope: "everyone",
      publicProfile: true,
      profileScope: "everyone",
    };

    if (user.privacySettings) {
      try {
        privacy = { ...privacy, ...JSON.parse(user.privacySettings) };
      } catch (e) {}
    }

    let canSeeOnline =
      isMe ||
      (privacy.showOnline &&
        (privacy.onlineScope === "everyone" ||
          (privacy.onlineScope === "friends" && isFriend)));

    let canSeeProfile =
      isMe ||
      (privacy.publicProfile &&
        (privacy.profileScope === "everyone" ||
          (privacy.profileScope === "friends" && isFriend)));

    // Quy tắc Web: Nếu đang chặn nhau thì không được xem profile của nhau
    if (!isMe && isBlocked) {
      canSeeOnline = false;
      canSeeProfile = false;
    }

    const profileData: OtherUserProfileDTO = {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      avatar: user.avatar,
      displayAvatar: user.avatar || user.image,
      email: isMe || canSeeProfile ? user.email : null,
      isActive: canSeeOnline ? user.isActive : false,
      isProfileHidden: !canSeeProfile,
      bio: canSeeProfile ? user.bio : null,
      interests: canSeeProfile ? user.interests : null,
      socialLinks: canSeeProfile ? user.socialLinks : null,
      achievements: canSeeProfile ? user.achievements : [],
      friends: canSeeProfile ? friendsList : [],
      friendshipStatus: connection ? (connection.status as any) : "NONE",
      isSender: connection?.userId1 === currentUserId,
      friendshipId: connection?.id,
    };

    return {
      success: true,
      data: profileData,
    };
  } catch (error: any) {
    console.error("[FriendsService] getOtherUserProfileService error:", error);
    return { success: false, error: error.message || "Lỗi khi lấy thông tin hồ sơ." };
  }
}

