import { prisma } from "@/lib/prisma";

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  stardust?: number;
}

export interface ConversationDTO {
  id: string; // userId hoặc groupId (string)
  name: string;
  avatar: string | null;
  isGroup: boolean;
  isOnline?: boolean;
  isBlockedByMe?: boolean;
  isBlockedByThem?: boolean;
  lastMsg: string;
  lastMessageTime: Date | null;
  lastSenderId?: string;
  unreadCount?: number;
  memberCount?: number;
  isKicked?: boolean;
  leaderId?: string | null;
}

/**
 * Lấy danh sách tất cả các cuộc trò chuyện (1-1 và Nhóm) của người dùng
 */
export async function getConversationsService(userId: string): Promise<ServiceResult<ConversationDTO[]>> {
  try {
    // 1. Lấy tất cả bạn bè được chấp nhận
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId1: userId, status: { in: ["ACCEPTED", "BLOCKED"] } },
          { userId2: userId, status: { in: ["ACCEPTED", "BLOCKED"] } },
        ],
      },
      include: {
        user1: { select: { id: true, name: true, image: true, avatar: true, isActive: true } },
        user2: { select: { id: true, name: true, image: true, avatar: true, isActive: true } },
      },
    });

    // 2. Lấy tất cả các nhóm người dùng đang tham gia hoặc từng tham gia
    const groups = await prisma.chatGroup.findMany({
      where: {
        OR: [
          { members: { some: { userId } } },
          { messages: { some: { senderId: userId } } },
        ],
      },
      include: {
        members: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const conversations: ConversationDTO[] = [];

    // Xử lý các cuộc trò chuyện 1-1
    for (const f of friendships) {
      const isUser1Me = f.userId1 === userId;
      const partner = isUser1Me ? f.user2 : f.user1;
      const isBlockedByMe = f.status === "BLOCKED" && isUser1Me;
      const isBlockedByThem = f.status === "BLOCKED" && !isUser1Me;

      // Lấy tin nhắn gần nhất giữa 2 người
      const lastMessage = await prisma.chatMessage.findFirst({
        where: {
          groupId: null,
          OR: [
            { senderId: userId, receiverId: partner.id },
            { senderId: partner.id, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      let lastMsgText = "Bắt đầu cuộc trò chuyện...";
      if (lastMessage) {
        if (lastMessage.messageType === "IMAGE") {
          lastMsgText = "[Hình ảnh]";
        } else if (lastMessage.messageType === "WIKI_CARD") {
          lastMsgText = "[Hộp Quà Thẻ Wiki]";
        } else if (lastMessage.messageType === "SHARE_VIDEO") {
          lastMsgText = "[Chia sẻ Video]";
        } else if (lastMessage.content.startsWith("[SYS:")) {
          lastMsgText = "[Thông báo hệ thống]";
        } else {
          lastMsgText = lastMessage.content;
        }
      }

      conversations.push({
        id: partner.id,
        name: partner.name || "Người dùng",
        avatar: partner.avatar || partner.image || "https://i.pravatar.cc/150",
        isGroup: false,
        isOnline: partner.isActive && !isBlockedByMe && !isBlockedByThem,
        isBlockedByMe,
        isBlockedByThem,
        lastMsg: lastMsgText,
        lastMessageTime: lastMessage ? lastMessage.createdAt : f.createdAt,
        lastSenderId: lastMessage?.senderId,
      });
    }

    // Xử lý các cuộc trò chuyện Nhóm
    for (const g of groups) {
      const isStillMember = g.members.some((m) => m.userId === userId);
      const lastMessage = g.messages[0];

      let lastMsgText = isStillMember ? "Bắt đầu cuộc trò chuyện nhóm..." : "Bạn không còn trong nhóm này";
      if (lastMessage) {
        if (lastMessage.messageType === "IMAGE") {
          lastMsgText = "[Hình ảnh]";
        } else if (lastMessage.messageType === "WIKI_CARD") {
          lastMsgText = "[Hộp Quà Thẻ Wiki]";
        } else {
          lastMsgText = lastMessage.content;
        }
      }

      conversations.push({
        id: g.id.toString(),
        name: g.name,
        avatar: g.avatar || "https://ui-avatars.com/api/?name=Group&background=3b82f6&color=fff",
        isGroup: true,
        memberCount: g.members.length,
        isKicked: !isStillMember,
        leaderId: g.leaderId,
        lastMsg: lastMsgText,
        lastMessageTime: lastMessage ? lastMessage.createdAt : null,
        lastSenderId: lastMessage?.senderId,
      });
    }

    // Sắp xếp các cuộc trò chuyện theo thời gian tin nhắn mới nhất giảm dần
    conversations.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });

    return { success: true, data: conversations };
  } catch (error: any) {
    console.error("LỖI LẤY DANH SÁCH CUỘC TRÒ CHUYỆN:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Lấy lịch sử tin nhắn giữa 2 người dùng (1-1) hoặc trong nhóm chat
 */
export async function getChatHistoryService(
  currentUserId: string,
  targetId: string,
  isGroup: boolean = false,
  options?: {
    take?: number;
    skip?: number;
    limit?: number;
    beforeId?: number;
    before?: string;
  }
): Promise<ServiceResult> {
  try {
    if (isGroup) {
      const groupId = parseInt(targetId);
      if (isNaN(groupId)) {
        return { success: false, error: "ID nhóm không hợp lệ", statusCode: 400 };
      }
      const member = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: currentUserId } },
      });
      if (!member) {
        return {
          success: false,
          error: "Bạn không phải thành viên của nhóm này",
          statusCode: 403,
        };
      }
    } else {
      const blocked = await prisma.friendship.findFirst({
        where: {
          status: "BLOCKED",
          OR: [
            { userId1: currentUserId, userId2: targetId },
            { userId1: targetId, userId2: currentUserId },
          ],
        },
      });
      if (blocked) {
        return {
          success: false,
          error: "Không thể xem lịch sử do quan hệ bị chặn",
          statusCode: 403,
        };
      }
    }

    const limit = Math.min(Math.max(options?.limit ?? options?.take ?? 50, 1), 100);
    const beforeId = options?.beforeId ? parseInt(options.beforeId.toString()) : undefined;
    const before = options?.before ? new Date(options.before) : undefined;

    const baseWhere: any = isGroup
      ? { groupId: parseInt(targetId) }
      : {
          OR: [
            { senderId: currentUserId, receiverId: targetId },
            { senderId: targetId, receiverId: currentUserId },
          ],
        };

    if (beforeId) {
      baseWhere.id = { lt: beforeId };
    } else if (before && !isNaN(before.getTime())) {
      baseWhere.createdAt = { lt: before };
    }

    // Nếu truyền skip (hỗ trợ phân trang legacy theo offset)
    if (options?.skip !== undefined) {
      const messages = await prisma.chatMessage.findMany({
        where: baseWhere,
        orderBy: { createdAt: "asc" },
        take: limit,
        skip: options.skip,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              avatar: true,
            },
          },
        },
      });
      return { success: true, data: messages };
    }

    // Phân trang chuẩn Cursor: Lấy các tin nhắn mới nhất trước cursor theo thứ tự giảm dần rồi đảo ngược
    const messages = await prisma.chatMessage.findMany({
      where: baseWhere,
      orderBy: { id: "desc" },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            avatar: true,
          },
        },
      },
    });

    return { success: true, data: messages.reverse() };
  } catch (error: any) {
    console.error("LỖI LẤY LỊCH SỬ CHAT:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Gửi tin nhắn mới (văn bản, ảnh, thẻ wiki, chia sẻ video)
 */
export async function sendMessageService(
  senderId: string,
  receiverId: string | null,
  content: string,
  messageType: "TEXT" | "IMAGE" | "WIKI_CARD" | "SHARE_VIDEO" = "TEXT",
  fileUrl?: string,
  isGiftCard: boolean = false,
  groupId?: number
): Promise<ServiceResult> {
  try {
    if (!content.trim() && !fileUrl) {
      return { success: false, error: "Nội dung tin nhắn không được để trống", statusCode: 400 };
    }

    if (!receiverId && !groupId) {
      return { success: false, error: "Cần chỉ định người nhận hoặc nhóm nhận", statusCode: 400 };
    }

    // Nếu là chat 1-1, kiểm tra chặn
    if (receiverId) {
      const blocked = await prisma.friendship.findFirst({
        where: {
          status: "BLOCKED",
          OR: [
            { userId1: senderId, userId2: receiverId },
            { userId1: receiverId, userId2: senderId },
          ],
        },
      });

      if (blocked) {
        return {
          success: false,
          error: "Không thể gửi tin nhắn do quan hệ đã bị chặn",
          statusCode: 403,
        };
      }
    }

    // Nếu là nhóm, kiểm tra xem có phải là thành viên còn hiệu lực không
    if (groupId) {
      const member = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: senderId } },
      });
      if (!member) {
        return {
          success: false,
          error: "Bạn không phải thành viên của nhóm này",
          statusCode: 403,
        };
      }
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        senderId,
        receiverId: groupId ? null : receiverId,
        groupId: groupId || null,
        content,
        messageType,
        fileUrl,
        isGiftCard,
        createdAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            avatar: true,
          },
        },
      },
    });

    return { success: true, data: newMessage };
  } catch (error: any) {
    console.error("LỖI GỬI TIN NHẮN:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Mở hộp quà thẻ Wiki được tặng trong tin nhắn
 */
export async function claimWikiGiftService(
  messageId: number,
  currentUserId: string
): Promise<ServiceResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.findUnique({
        where: { id: messageId },
        include: {
          sender: {
            select: { id: true, name: true, image: true, avatar: true },
          },
        },
      });

      if (!msg) {
        return { success: false, error: "Không tìm thấy hộp quà.", statusCode: 404 };
      }

      if (msg.receiverId !== currentUserId) {
        return { success: false, error: "Đây không phải quà của bạn.", statusCode: 403 };
      }

      let cardData: any = {};
      try {
        cardData = JSON.parse(msg.fileUrl || "{}");
      } catch (e) {
        return { success: false, error: "Dữ liệu hộp quà không hợp lệ.", statusCode: 400 };
      }

      if (cardData.claimed) {
        return { success: false, error: "Hộp quà này đã được mở rồi.", statusCode: 400 };
      }

      const cardId = cardData.id;
      if (!cardId) {
        return { success: false, error: "Dữ liệu thẻ bị lỗi.", statusCode: 400 };
      }

      // 1. Kiểm tra xem người gửi còn giữ thẻ này không
      const senderInventory = await tx.userInventory.findFirst({
        where: { userId: msg.senderId, cardId: cardId },
      });

      if (!senderInventory) {
        cardData.claimed = true;
        await tx.chatMessage.update({
          where: { id: messageId },
          data: {
            fileUrl: JSON.stringify(cardData),
            content: "Hộp quà đã hỏng do người gửi không còn sở hữu thẻ này.",
          },
        });
        return {
          success: false,
          error: "Người gửi không còn sở hữu thẻ này nữa.",
          statusCode: 400,
        };
      }

      // 2. Tịch thu thẻ của người gửi
      await tx.userInventory.delete({ where: { id: senderInventory.id } });

      // 3. Trao thẻ cho người nhận
      const receiverInventory = await tx.userInventory.findUnique({
        where: { userId_cardId: { userId: currentUserId, cardId: cardId } },
      });

      let stardustGained = 0;
      if (receiverInventory) {
        // Đã có thẻ -> Phân rã thành Bụi Sao
        const STARDUST_MAP: Record<string, number> = {
          N: 1,
          R: 5,
          SR: 20,
          SSR: 100,
          UR: 500,
          LR: 1000,
          MR: 5000,
        };
        stardustGained = STARDUST_MAP[cardData.rarity] || 1;
        await tx.user.update({
          where: { id: currentUserId },
          data: { stardust: { increment: stardustGained } },
        });
      } else {
        // Thêm vào tủ đồ người nhận
        await tx.userInventory.create({
          data: { userId: currentUserId, cardId: cardId, source: "SHARED" },
        });
      }

      // 4. Cập nhật trạng thái hộp quà thành "Đã nhận"
      cardData.claimed = true;
      const updatedMsg = await tx.chatMessage.update({
        where: { id: messageId },
        data: {
          fileUrl: JSON.stringify(cardData),
          content: "Bạn đã nhận một thẻ Wiki!",
        },
        include: {
          sender: {
            select: { id: true, name: true, image: true, avatar: true },
          },
        },
      });

      return {
        success: true,
        data: updatedMsg,
        stardust: stardustGained,
        message: stardustGained > 0
          ? `Bạn đã nhận được ${stardustGained} Bụi Sao do đã sở hữu thẻ này!`
          : "Bạn đã nhận thẻ vào kho đồ thành công!",
      };
    });
  } catch (error: any) {
    console.error("LỖI NHẬN QUÀ WIKI:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Lấy danh sách thẻ Wiki mà người dùng sở hữu để làm quà tặng
 */
export async function getOwnedWikiCardsService(userId: string): Promise<ServiceResult> {
  try {
    const inventory = await prisma.userInventory.findMany({
      where: { userId },
      include: {
        card: {
          select: {
            id: true,
            title: true,
            rarity: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { acquiredAt: "desc" },
    });

    const cards = inventory.map((item) => item.card);
    return { success: true, data: cards };
  } catch (error: any) {
    console.error("LỖI LẤY KHO THẺ ĐỂ TẶNG:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

// ==========================================
// NHÓM CHỨC NĂNG QUẢN LÝ CHAT GROUP
// ==========================================

/**
 * Lấy danh sách nhóm chat của người dùng
 */
export async function getChatGroupsService(userId: string): Promise<ServiceResult> {
  try {
    const groups = await prisma.chatGroup.findMany({
      where: {
        OR: [
          { members: { some: { userId } } },
          { messages: { some: { senderId: userId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, image: true } },
          },
        },
      },
    });

    const formatted = groups.map((g) => {
      const isStillMember = g.members.some((m) => m.userId === userId);
      return {
        ...g,
        leaderId: g.leaderId || (g.members.length > 0 ? g.members[0].userId : null),
        isKicked: !isStillMember,
        memberCount: g.members.length,
      };
    });

    return { success: true, data: formatted };
  } catch (error: any) {
    console.error("LỖI LẤY DANH SÁCH NHÓM:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Tạo nhóm chat mới
 */
export async function createChatGroupService(
  creatorId: string,
  memberIds: string[],
  groupName: string
): Promise<ServiceResult> {
  try {
    const finalName = groupName.trim() || `Nhóm ${memberIds.length + 1} thành viên`;
    const allMembers = Array.from(new Set([creatorId, ...memberIds]));

    const group = await prisma.chatGroup.create({
      data: {
        name: finalName,
        leaderId: creatorId,
        members: {
          create: allMembers.map((id) => ({ userId: id })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, image: true } },
          },
        },
      },
    });

    return { success: true, data: group, message: "Tạo nhóm chat thành công" };
  } catch (error: any) {
    console.error("LỖI TẠO NHÓM CHAT:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Lấy danh sách thành viên trong nhóm
 */
export async function getGroupMembersService(
  groupId: number,
  currentUserId: string
): Promise<ServiceResult> {
  try {
    const group = await prisma.chatGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, image: true } },
          },
        },
      },
    });

    if (!group) {
      return { success: false, error: "Không tìm thấy nhóm", statusCode: 404 };
    }

    // Xác minh quyền: Chỉ thành viên mới được xem danh sách thành viên nhóm
    const isMember = group.members.some((m) => m.userId === currentUserId);
    if (!isMember) {
      return {
        success: false,
        error: "Bạn không phải thành viên của nhóm này",
        statusCode: 403,
      };
    }

    const members = group.members.map((m) => ({
      ...m.user,
      isLeader: m.userId === group.leaderId,
      joinedAt: m.joinedAt,
    }));

    return { success: true, data: members };
  } catch (error: any) {
    console.error("LỖI LẤY THÀNH VIÊN NHÓM:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Thêm thành viên vào nhóm (Chỉ trưởng nhóm hoặc thành viên được phép)
 */
export async function addMemberToGroupService(
  groupId: number,
  targetUserId: string,
  currentUserId: string
): Promise<ServiceResult> {
  try {
    const group = await prisma.chatGroup.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return { success: false, error: "Không tìm thấy nhóm", statusCode: 404 };
    }

    const isMember = group.members.some((m) => m.userId === currentUserId);
    if (!isMember) {
      return { success: false, error: "Bạn không phải thành viên của nhóm này", statusCode: 403 };
    }

    const alreadyIn = group.members.some((m) => m.userId === targetUserId);
    if (alreadyIn) {
      return { success: false, error: "Người dùng đã ở trong nhóm", statusCode: 400 };
    }

    await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUserId,
      },
    });

    return { success: true, message: "Đã thêm thành viên vào nhóm" };
  } catch (error: any) {
    console.error("LỖI THÊM THÀNH VIÊN VÀO NHÓM:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Xóa thành viên khỏi nhóm (Chỉ trưởng nhóm)
 */
export async function removeMemberFromGroupService(
  groupId: number,
  targetUserId: string,
  currentUserId: string
): Promise<ServiceResult> {
  try {
    const group = await prisma.chatGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      return { success: false, error: "Không tìm thấy nhóm", statusCode: 404 };
    }

    if (group.leaderId !== currentUserId) {
      return { success: false, error: "Chỉ trưởng nhóm mới có quyền xóa thành viên!", statusCode: 403 };
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    // Thu hồi quyền truy cập Socket.IO room tức thì
    if ((global as any).__socketIo) {
      (global as any).__socketIo.in(targetUserId).socketsLeave(`group_${groupId}`);
      (global as any).__socketIo.to(`group_${groupId}`).emit("receive_message", {
        content: `[SYS:KICK:${targetUserId}]`,
        groupId,
      });
      (global as any).__socketIo.to(targetUserId).emit("receive_message", {
        content: `[SYS:KICK:${targetUserId}]`,
        groupId,
      });
    }

    return { success: true, message: "Đã xóa thành viên khỏi nhóm" };
  } catch (error: any) {
    console.error("LỖI XÓA THÀNH VIÊN:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Đổi tên nhóm chat
 */
export async function renameChatGroupService(
  groupId: number,
  newName: string,
  currentUserId: string
): Promise<ServiceResult> {
  try {
    if (!newName.trim()) {
      return { success: false, error: "Tên nhóm không được để trống", statusCode: 400 };
    }

    const group = await prisma.chatGroup.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return { success: false, error: "Không tìm thấy nhóm", statusCode: 404 };
    }

    const isMember = group.members.some((m) => m.userId === currentUserId);
    if (!isMember) {
      return { success: false, error: "Bạn không có quyền đổi tên nhóm này", statusCode: 403 };
    }

    const updated = await prisma.chatGroup.update({
      where: { id: groupId },
      data: { name: newName.trim() },
    });

    return { success: true, data: updated, message: "Đổi tên nhóm thành công" };
  } catch (error: any) {
    console.error("LỖI ĐỔI TÊN NHÓM:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Rời khỏi nhóm chat
 */
export async function leaveChatGroupService(
  groupId: number,
  currentUserId: string
): Promise<ServiceResult> {
  try {
    const group = await prisma.chatGroup.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return { success: false, error: "Không tìm thấy nhóm", statusCode: 404 };
    }

    // Nếu là trưởng nhóm và còn thành viên khác -> Phải chuyển quyền trước
    if (group.leaderId === currentUserId && group.members.length > 1) {
      return {
        success: false,
        error: "Trưởng nhóm cần chuyển quyền trước khi rời nhóm!",
        statusCode: 400,
      };
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: currentUserId } },
    });

    // Thu hồi quyền truy cập Socket.IO room tức thì
    if ((global as any).__socketIo) {
      (global as any).__socketIo.in(currentUserId).socketsLeave(`group_${groupId}`);
      (global as any).__socketIo.to(`group_${groupId}`).emit("receive_message", {
        content: `[SYS:LEAVE:${currentUserId}]`,
        groupId,
      });
    }

    return { success: true, message: "Đã rời khỏi nhóm" };
  } catch (error: any) {
    console.error("LỖI RỜI NHÓM:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}

/**
 * Giải tán nhóm chat (Chỉ trưởng nhóm)
 */
export async function deleteChatGroupService(
  groupId: number,
  currentUserId: string
): Promise<ServiceResult> {
  try {
    const group = await prisma.chatGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      return { success: false, error: "Không tìm thấy nhóm", statusCode: 404 };
    }

    if (group.leaderId !== currentUserId) {
      return { success: false, error: "Chỉ trưởng nhóm mới có quyền giải tán nhóm!", statusCode: 403 };
    }

    await prisma.chatGroup.delete({ where: { id: groupId } });

    // Thông báo giải tán nhóm và giải phóng room
    if ((global as any).__socketIo) {
      (global as any).__socketIo.to(`group_${groupId}`).emit("receive_message", {
        content: `[SYS:DISSOLVE:${groupId}]`,
        groupId,
      });
      (global as any).__socketIo.socketsLeave(`group_${groupId}`);
    }

    return { success: true, message: "Đã giải tán nhóm chat thành công" };
  } catch (error: any) {
    console.error("LỖI GIẢI TÁN NHÓM:", error);
    return { success: false, error: error.message, statusCode: 500 };
  }
}
