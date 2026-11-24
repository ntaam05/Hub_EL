"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mail/mail";
import {
  searchUsersService,
  addFriendService,
  getPendingRequestsService,
  respondFriendRequestService,
  getFriendsListService,
  removeFriendService,
  getOtherUserProfileService,
  blockUserService,
  getBlockedUsersService,
  unblockUserService,
} from "@/services/friends.service";

function safeRevalidatePath(path: string, type?: "layout" | "page") {
  try {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
  } catch {
    // Ignore error when called outside Next.js request context (e.g. CLI tests)
  }
}

// 1. TÌM KIẾM NGƯỜI DÙNG (BẰNG TÊN HOẶC ID)
export async function searchUsersAction(query: string, currentUserId: string) {
  return await searchUsersService(query, currentUserId);
}

// 2. GỬI LỜI MỜI KẾT BẠN
export async function addFriendAction(currentUserId: string, targetUserId: string) {
  const result = await addFriendService(currentUserId, targetUserId);
  if (result.success) {
    safeRevalidatePath("/social");
  }
  return result;
}

// 3. LẤY DANH SÁCH LỜI MỜI
export async function getPendingRequestsAction(userId: string) {
  return await getPendingRequestsService(userId);
}

// 4. ĐỒNG Ý / TỪ CHỐI KẾT BẠN
export async function respondFriendRequestAction(friendshipId: number, accept: boolean) {
  const result = await respondFriendRequestService(friendshipId, accept);
  if (result.success) {
    safeRevalidatePath("/social");
  }
  return {
    ...result,
    senderId: result.data?.senderId,
  };
}

// 5. LẤY DANH SÁCH BẠN BÈ ĐÃ KẾT BẠN
export async function getFriendsListAction(userId: string) {
  return await getFriendsListService(userId);
}

// 6 & 7. LỊCH SỬ CHAT VÀ GỬI TIN NHẮN
export async function getChatHistoryAction(currentUserId: string, targetId: string, isGroup: boolean = false) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: isGroup 
        ? { groupId: parseInt(targetId) }
        : {
            OR: [
              { senderId: currentUserId, receiverId: targetId },
              { senderId: targetId, receiverId: currentUserId }
            ]
          },
      orderBy: { createdAt: 'asc' },
      include: isGroup ? { sender: { select: { id: true, name: true, image: true, avatar: true } } } : undefined
    });
    return { success: true, data: messages };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendMessageAction(senderId: string, receiverId: string | null, content: string, messageType: "TEXT" | "IMAGE" | "WIKI_CARD" | "SHARE_VIDEO" = "TEXT", fileUrl?: string, isGiftCard: boolean = false, groupId?: number) {
  try {
    const newMessage = await prisma.chatMessage.create({
      data: { senderId, receiverId, groupId, content, messageType, fileUrl, isGiftCard, createdAt: new Date() },
      include: groupId ? { sender: { select: { id: true, name: true, image: true, avatar: true } } } : undefined
    });

    // ... (Giữ nguyên đoạn code Gửi Email tặng quà cũ ở đây) ...

    return { success: true, data: newMessage };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// THÊM MỚI: TÍNH NĂNG CHAT NHÓM
// ==========================================

export async function getChatGroupsAction(userId: string) {
  try {
    const groups = await prisma.chatGroup.findMany({
      where: {
        OR: [
          { members: { some: { userId } } }, // Nhóm đang tham gia
          { messages: { some: { senderId: userId } } } // Nhóm TỪNG tham gia (có lịch sử chat)
        ]
      },
      include: { members: true }
    });
    
    const patchedGroups = groups.map(g => {
      const isStillMember = g.members.some(m => m.userId === userId);
      return {
        ...g,
        leaderId: g.leaderId || (g.members.length > 0 ? g.members[0].userId : null),
        isKicked: !isStillMember // 🚨 Cờ đánh dấu đã bị kích/rời đi
      };
    });
    
    return { success: true, data: patchedGroups };
  } catch (error: any) { 
    console.error("LỖI LẤY DANH SÁCH NHÓM:", error);
    return { success: false, error: error.message }; 
  }
}

export async function updateGroupAvatarAction(groupId: number, avatarUrl: string) {
  try {
    await prisma.chatGroup.update({
      where: { id: groupId },
      data: { avatar: avatarUrl }
    });
    import("next/cache").then(m => m.revalidatePath('/social'));
    return { success: true, message: "Cập nhật ảnh nhóm thành công" };
  } catch (error: any) { 
    return { success: false, error: error.message }; 
  }
}

export async function createChatGroupAction(creatorId: string, memberIds: string[], groupName: string) {
  try {
    const allMembers = [creatorId, ...memberIds];
    const group = await prisma.chatGroup.create({
      data: {
        name: groupName,
        leaderId: creatorId,
        members: { create: allMembers.map(id => ({ userId: id })) }
      }
    });
    import("next/cache").then(m => m.revalidatePath('/social'));
    return { success: true, data: group };
  } catch (error: any) { 
    console.error("LỖI TẠO NHÓM CHAT:", error);
    return { success: false, error: error.message }; 
  }
}

export async function renameChatGroupAction(groupId: number, newName: string) {
  try {
    await prisma.chatGroup.update({ where: { id: groupId }, data: { name: newName } });
    revalidatePath('/social');
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getGroupMembersAction(groupId: number) {
  try {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, avatar: true, image: true } } }
    });
    return { success: true, data: members.map(m => m.user) };
  } catch (error: any) { return { success: false, error: error.message }; }
}

// 8. HỦY KẾT BẠN
export async function removeFriendAction(currentUserId: string, friendId: string) {
  const result = await removeFriendService(currentUserId, friendId);
  if (result.success) {
    safeRevalidatePath("/social");
    safeRevalidatePath("/profile/[id]", "page");
  }
  return result;
}

// 9. LẤY THÔNG TIN PROFILE
export async function getOtherUserProfile(targetUserId: string, currentUserId: string) {
  return await getOtherUserProfileService(targetUserId, currentUserId);
}

// 10. CHẶN NGƯỜI DÙNG
export async function blockUserAction(currentUserId: string, targetUserId: string) {
  const result = await blockUserService(currentUserId, targetUserId);
  if (result.success) {
    safeRevalidatePath("/social");
  }
  return result;
}

// 11. LẤY DANH SÁCH NGƯỜI ĐÃ CHẶN
export async function getBlockedUsersAction(userId: string) {
  return await getBlockedUsersService(userId);
}

// 12. BỎ CHẶN NGƯỜI DÙNG
export async function unblockUserAction(currentUserId: string, targetUserId: string) {
  const result = await unblockUserService(currentUserId, targetUserId);
  if (result.success) {
    safeRevalidatePath("/social");
    safeRevalidatePath("/settings");
  }
  return result;
}

// 13. LẤY DANH SÁCH THẺ WIKI CỦA USER ĐỂ CHIA SẺ
// ==========================================
export async function getOwnedWikiCardsAction(userId: string) {
  try {
    const inventory = await prisma.userInventory.findMany({
      where: { userId },
      include: { 
        card: { select: { id: true, title: true, rarity: true, imageUrl: true } } 
      },
      orderBy: { acquiredAt: 'desc' }
    });
    return { success: true, data: inventory.map((i: any) => i.card) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 14. MỞ HỘP QUÀ WIKI VÀ CHUYỂN QUYỀN SỞ HỮU
// ==========================================
export async function claimWikiGiftAction(messageId: number, currentUserId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.findUnique({ where: { id: messageId } });
      if (!msg) throw new Error("Không tìm thấy hộp quà.");
      if (msg.receiverId !== currentUserId) throw new Error("Đây không phải quà của bạn.");
      
      let cardData: any = {};
      try { cardData = JSON.parse(msg.fileUrl || "{}"); } catch(e) {}
      if (cardData.claimed) throw new Error("Quà này đã được mở.");

      const cardId = cardData.id;
      if (!cardId) throw new Error("Dữ liệu thẻ bị lỗi.");

      // 1. Kiểm tra xem người gửi còn giữ thẻ này không?
      const senderInventory = await tx.userInventory.findFirst({
        where: { userId: msg.senderId, cardId: cardId }
      });

      if (!senderInventory) {
        // Nếu người gửi đã lỡ xóa thẻ -> Báo hỏng hộp quà
        cardData.claimed = true;
        await tx.chatMessage.update({
           where: { id: messageId },
           data: { fileUrl: JSON.stringify(cardData), content: "Hộp quà đã hỏng do người gửi không còn sở hữu thẻ này." }
        });
        throw new Error("Người gửi không còn sở hữu thẻ này nữa.");
      }

      // 2. Tịch thu thẻ của người gửi
      await tx.userInventory.delete({ where: { id: senderInventory.id } });

      // 3. Trao thẻ cho người nhận
      const receiverInventory = await tx.userInventory.findUnique({
        where: { userId_cardId: { userId: currentUserId, cardId: cardId } }
      });

      let stardustGained = 0;
      if (receiverInventory) {
         // Nếu người nhận đã có thẻ này rồi -> Phân rã thành Bụi Sao
         const STARDUST_MAP: Record<string, number> = { N: 1, R: 5, SR: 20, SSR: 100, UR: 500, LR: 1000, MR: 5000 };
         stardustGained = STARDUST_MAP[cardData.rarity] || 1;
         await tx.user.update({
            where: { id: currentUserId },
            data: { stardust: { increment: stardustGained } }
         });
      } else {
         // Thêm vào tủ đồ người nhận
         await tx.userInventory.create({
            data: { userId: currentUserId, cardId: cardId, source: "SHARED" }
         });
      }

      // 4. Cập nhật trạng thái hộp quà thành "Đã Mở"
      cardData.claimed = true;
      const updatedMsg = await tx.chatMessage.update({
         where: { id: messageId },
         data: { 
             fileUrl: JSON.stringify(cardData), 
             content: "Bạn đã nhận một thẻ Wiki!" 
         }
      });

      return { success: true, data: updatedMsg, stardust: stardustGained };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeGroupMemberAction(groupId: number, memberId: string, currentUserId: string) {
  try {
    const group = await prisma.chatGroup.findUnique({ where: { id: groupId }});
    if (group?.leaderId !== currentUserId) return { success: false, error: "Bạn không phải trưởng nhóm!" };
    await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId: memberId } } });
    import("next/cache").then(m => m.revalidatePath('/social'));
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function transferLeadershipAction(groupId: number, newLeaderId: string, currentUserId: string) {
  try {
    const group = await prisma.chatGroup.findUnique({ where: { id: groupId }});
    if (group?.leaderId !== currentUserId) return { success: false, error: "Bạn không phải trưởng nhóm!" };
    await prisma.chatGroup.update({ where: { id: groupId }, data: { leaderId: newLeaderId } });
    import("next/cache").then(m => m.revalidatePath('/social'));
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteChatGroupAction(groupId: number, currentUserId: string) {
  try {
    const group = await prisma.chatGroup.findUnique({ where: { id: groupId }});
    if (group?.leaderId !== currentUserId) return { success: false, error: "Bạn không phải trưởng nhóm!" };
    await prisma.chatGroup.delete({ where: { id: groupId } });
    import("next/cache").then(m => m.revalidatePath('/social'));
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function leaveChatGroupAction(groupId: number, currentUserId: string) {
  try {
    const group = await prisma.chatGroup.findUnique({ where: { id: groupId }});
    if (group?.leaderId === currentUserId) return { success: false, error: "Trưởng nhóm phải nhường Key trước khi rời đi!" };
    await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId: currentUserId } } });
    import("next/cache").then(m => m.revalidatePath('/social'));
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}
export async function addMemberToGroupAction(groupId: number, memberId: string, currentUserId: string) {
  try {
    const group = await prisma.chatGroup.findUnique({ where: { id: groupId }});
    if (group?.leaderId !== currentUserId) return { success: false, error: "Chỉ trưởng nhóm mới được thêm người!" };
    
    await prisma.groupMember.create({ data: { groupId, userId: memberId } });
    import("next/cache").then(m => m.revalidatePath('/social'));
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}