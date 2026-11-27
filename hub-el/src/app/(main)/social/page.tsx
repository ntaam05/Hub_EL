"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Search, UserPlus, Image as ImageIcon, Link as LinkIcon, 
  Ban, Send, Sparkles, Loader2, CheckCircle2,
  AlertCircle, UserCheck, Reply, X, Gift, Users,
  Menu, BellOff, Bell, User, Edit3, LogOut,
  PlayCircle, MonitorPlay
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  searchUsersAction, addFriendAction, getFriendsListAction, 
  getChatHistoryAction, sendMessageAction, getPendingRequestsAction, 
  respondFriendRequestAction, removeFriendAction, blockUserAction, 
  unblockUserAction, getOwnedWikiCardsAction, claimWikiGiftAction,
  getChatGroupsAction, createChatGroupAction, renameChatGroupAction, getGroupMembersAction,
  deleteChatGroupAction, leaveChatGroupAction, removeGroupMemberAction, transferLeadershipAction, updateGroupAvatarAction,
  addMemberToGroupAction
} from '@/actions/social/social';
import { io, Socket } from 'socket.io-client';

import { updateTaskProgressAction } from '@/actions/quests/progress';
import ChatRightSidebar from './components/ChatRightSidebar';
import ChatModals from './components/ChatModals';
import ConfirmHoldDialog, { ConfirmDialogState } from './components/ConfirmHoldDialog';
import { RollingActionButton } from '../dashboard/LucianPrimitives';
import '../dashboard/lucian-dashboard.css';

const METEORS = [
  { top: '8%', left: '25%', len: '140px', dur: '4.8s', del: '0.2s' },
  { top: '20%', left: '68%', len: '175px', dur: '5.5s', del: '1.6s' },
  { top: '42%', left: '46%', len: '155px', dur: '5.1s', del: '0.9s' },
  { top: '65%', left: '80%', len: '135px', dur: '4.5s', del: '2.5s' },
];

export default function SocialChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const currentUserId = session?.user?.id as string;
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const [friends, setFriends] = useState<any[]>([]);
  const [chatList, setChatList] = useState<any[]>([]);
  const [activeFriend, setActiveFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [replyingTo, setReplyingTo] = useState<{id: string, content: string, isMe: boolean} | null>(null);

  const [mutedUsers, setMutedUsers] = useState<string[]>([]);
  const mutedUsersRef = useRef<string[]>([]);
  
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  useEffect(() => { mutedUsersRef.current = mutedUsers; }, [mutedUsers]);

  useEffect(() => {
     const saved = localStorage.getItem('hubel_muted_users');
     if (saved) setMutedUsers(JSON.parse(saved));
  }, []);

  const handleToggleMute = () => {
     if (!activeFriend) return;
     setMutedUsers(prev => {
         const newMuted = prev.includes(activeFriend.id.toString()) 
             ? prev.filter(id => id !== activeFriend.id.toString()) 
             : [...prev, activeFriend.id.toString()];
         localStorage.setItem('hubel_muted_users', JSON.stringify(newMuted));
         return newMuted;
     });
     showNotification(mutedUsers.includes(activeFriend.id.toString()) ? "Đã bật thông báo chat" : "Đã tắt thông báo chat", "success");
  };

  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showWikiModal, setShowWikiModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showRenameGroupModal, setShowRenameGroupModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  
  const [ownedCards, setOwnedCards] = useState<any[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [claimingGiftId, setClaimingGiftId] = useState<number | null>(null);
  const [giftResult, setGiftResult] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatFilterQuery, setChatFilterQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 3500);
  };

  const activeFriendRef = useRef(activeFriend);
  useEffect(() => { activeFriendRef.current = activeFriend; }, [activeFriend]);

  const loadData = async () => {
    if (!currentUserId) return;
    const [resFriends, resRequests, resGroups] = await Promise.all([
        getFriendsListAction(currentUserId),
        getPendingRequestsAction(currentUserId),
        getChatGroupsAction(currentUserId)
    ]);
    
    let combinedList: any[] = [];

    if (resFriends.success) {
        setFriends(resFriends.data || []);
        combinedList = [...(resFriends.data || [])];
    }
    
    if (resGroups.success) {
        const formattedGroups = (resGroups.data || []).map((g: any) => ({
           id: g.id,
           name: g.name,
           avatar: g.avatar || "https://ui-avatars.com/api/?name=Group&background=3b82f6&color=fff",
           isGroup: true,
           leaderId: g.leaderId,
           isKicked: g.isKicked,
           memberCount: g.members.length,
           lastMsg: g.isKicked ? "Bạn không còn trong nhóm này" : "Bắt đầu trò chuyện nhóm..."
        }));
        combinedList = [...combinedList, ...formattedGroups];
    }

    setChatList(combinedList);

    if (activeFriendRef.current) {
        const updated = combinedList.find((f:any) => f.id === activeFriendRef.current.id && !!f.isGroup === !!activeFriendRef.current.isGroup);
        if (updated) setActiveFriend(updated);
    }

    if (resRequests.success) setPendingRequests(resRequests.data || []);
  };

  useEffect(() => { loadData() }, [currentUserId]);

  const fetchMessages = async () => {
    if (!currentUserId || !activeFriend) return;
    const res = await getChatHistoryAction(currentUserId, activeFriend.id.toString(), activeFriend.isGroup);
    if (res.success) setMessages(res.data || []);
  };

  useEffect(() => {
    fetchMessages();
    setReplyingTo(null); 
  }, [activeFriend?.id, currentUserId]);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" }); 
    }
  }, [messages]);
  
  useEffect(() => {
    if (!currentUserId) return;
    const socketIo = io();
    setSocket(socketIo);
    socketIo.emit("join_room", currentUserId);
    
    chatList.filter(c => c.isGroup && !c.isKicked).forEach(g => {
        socketIo.emit("join_room", `group_${g.id}`);
    });

    socketIo.on("receive_message", (newMessage) => {
        if (newMessage.content && newMessage.content.startsWith("[SYS:")) {
            const parts = newMessage.content.split("]")[0].split(":"); 
            const sysType = parts[1];
            const targetId = parts[2];

            if (sysType === "KICK" && targetId === currentUserId) {
                if (activeFriendRef.current?.id === newMessage.groupId) setActiveFriend(null); 
                loadData();
            } else if (sysType === "ADD" && targetId === currentUserId) {
                socketIo.emit("join_room", `group_${newMessage.groupId}`); 
                loadData();
            } else {
                if (activeFriendRef.current?.id === newMessage.groupId) {
                    getGroupMembersAction(newMessage.groupId).then(res => { if(res.success) setGroupMembers(res.data || []); });
                }
                loadData();
            }
        }

        const currentPartner = activeFriendRef.current;
        const isCurrentChat = currentPartner && (
           (currentPartner.isGroup && newMessage.groupId === currentPartner.id) || 
           (!currentPartner.isGroup && currentPartner.id === newMessage.senderId)
        );

        if (isCurrentChat) {
            setMessages((prev) => {
                if (prev.find(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } else {
            const blockId = newMessage.groupId ? newMessage.groupId.toString() : newMessage.senderId;
            if (!mutedUsersRef.current.includes(blockId) && !newMessage.content?.startsWith("[SYS:")) {
                showNotification("Bạn có tin nhắn mới!", "success");
            }
            loadData(); 
        }
    });

    socketIo.on("friend_request_accepted", (data) => {
        showNotification(`${data.senderName} đã chấp nhận kết bạn!`, "success");
        loadData();  
    });
    socketIo.on("receive_friend_request", () => { loadData(); });

    return () => { socketIo.disconnect(); };
  }, [currentUserId, chatList.length]);

  const handleCreateGroup = async (memberIds: string[], name: string) => {
      const finalName = name.trim() || `Nhóm ${memberIds.length + 1} thành viên`;
      const res = await createChatGroupAction(currentUserId, memberIds, finalName);
      if (res.success) { showNotification("Tạo nhóm thành công!", "success"); loadData(); } 
      else { showNotification("Lỗi tạo nhóm", "error"); }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageInput.trim() || !activeFriend || isSending) return;
    
    if (activeFriend.isGroup && activeFriend.isKicked) {
        showNotification("Bạn không còn là thành viên của nhóm này!", "error");
        return;
    }

    let finalContent = messageInput;
    if (replyingTo) {
        const originalSenderId = replyingTo.isMe ? currentUserId : activeFriend.id;
        finalContent = `[REPLY:${originalSenderId}]${replyingTo.content}[/REPLY]${messageInput}`;
    }

    setMessageInput("");
    setReplyingTo(null); 
    setIsSending(true);

    const isGroup = activeFriend.isGroup;
    const receiverId = isGroup ? null : activeFriend.id;
    const groupId = isGroup ? activeFriend.id : undefined;

    const res = await sendMessageAction(currentUserId, receiverId, finalContent, "TEXT", undefined, false, groupId);
    if (res.success) {
      setMessages((prev) => [...prev, res.data]);
      if (socket) {
          if (isGroup) socket.emit("send_message", { receiverId: `group_${groupId}`, message: { ...res.data, senderName: session?.user?.name, senderAvatar: session?.user?.image, groupId } });
          else socket.emit("send_message", { receiverId: activeFriend.id, message: { ...res.data, senderName: session?.user?.name, senderAvatar: session?.user?.image } });
      }
      updateTaskProgressAction(currentUserId, "MESSAGE_SEND", 1);
    } else { showNotification("Lỗi gửi tin", "error"); }
    setIsSending(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFriend || !currentUserId) return;
    if (activeFriend.isGroup && activeFriend.isKicked) return showNotification("Bạn đã bị kích khỏi nhóm!", "error");
    if (file.size > 5 * 1024 * 1024) return showNotification("Ảnh tối đa 5MB", "error");

    setIsSending(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64Image = reader.result as string;
        try {
            const isGroup = activeFriend.isGroup;
            const receiverId = isGroup ? null : activeFriend.id;
            const groupId = isGroup ? activeFriend.id : undefined;

            const response = await fetch('/api/upload/message', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId: currentUserId, receiverId, groupId, fileUrl: base64Image })
            });
            const res = await response.json();
            if (res.success) {
                setMessages(prev => [...prev, res.data]);
                if (socket) {
                    if (isGroup) socket.emit("send_message", { receiverId: `group_${groupId}`, message: res.data });
                    else socket.emit("send_message", { receiverId: activeFriend.id, message: res.data });
                }
                updateTaskProgressAction(currentUserId, "MESSAGE_SEND", 1);
            } else showNotification(res.error, "error");
        } catch (error) { showNotification("Lỗi mạng", "error"); } 
        finally { setIsSending(false); if (imageInputRef.current) imageInputRef.current.value = ""; }
    };
  };

  const handleGroupAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFriend || !activeFriend.isGroup) return;
    if (file.size > 5 * 1024 * 1024) return showNotification("Ảnh tối đa 5MB", "error");

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64Image = reader.result as string;
        try {
            showNotification("Đang tải ảnh lên...", "success");
            const res = await updateGroupAvatarAction(activeFriend.id, base64Image);
            if (res.success) {
                showNotification("Đổi ảnh nhóm thành công!", "success");
                setActiveFriend((prev: any) => ({...prev, avatar: base64Image}));
                loadData(); 
            } else { showNotification("Lỗi cập nhật ảnh", "error"); }
        } catch (error) { showNotification("Lỗi mạng", "error"); } 
        finally { if (groupAvatarInputRef.current) groupAvatarInputRef.current.value = ""; }
    };
  };

  const handleSendWikiCard = async (card: any) => {
      setShowWikiModal(false);
      if (!activeFriend || !currentUserId) return;
      if (activeFriend.isGroup && activeFriend.isKicked) return showNotification("Bạn đã bị kích!", "error");
      
      setIsSending(true);
      const cardDataStr = JSON.stringify({ id: card.id, title: card.title, rarity: card.rarity, imageUrl: card.imageUrl, claimed: false });
      const isGroup = activeFriend.isGroup;
      
      const res = await sendMessageAction(currentUserId, isGroup ? null : activeFriend.id, `Đã gửi tặng Hộp Quà Wiki`, "WIKI_CARD", cardDataStr, true, isGroup ? activeFriend.id : undefined);

      if (res.success) {
          setMessages(prev => [...prev, res.data]);
          if (socket) {
              if (isGroup) socket.emit("send_message", { receiverId: `group_${activeFriend.id}`, message: { ...res.data, senderName: session?.user?.name, senderAvatar: session?.user?.image, groupId: activeFriend.id } });
              else socket.emit("send_message", { receiverId: activeFriend.id, message: { ...res.data, senderName: session?.user?.name, senderAvatar: session?.user?.image } });
          }
          updateTaskProgressAction(currentUserId, "MESSAGE_SEND", 1);
      } else showNotification("Lỗi gửi quà", "error");
      setIsSending(false);
  };

  const handleClaimGift = async (msgId: number, card: any, isMe: boolean) => {
      if (isMe) return showNotification("Chờ người nhận mở quà nhé!", "error");
      setClaimingGiftId(msgId);
      const res = await claimWikiGiftAction(msgId, currentUserId);
      if (res.success) {
          setGiftResult({ card, stardust: (res as any).stardust });
          setMessages(prev => prev.map(m => m.id === msgId ? (res as any).data : m));
          if (socket) {
              if (activeFriend.isGroup) socket.emit("send_message", { receiverId: `group_${activeFriend.id}`, message: (res as any).data });
              else socket.emit("send_message", { receiverId: activeFriend.id, message: (res as any).data });
          }
      } else {
          showNotification((res as any).error || "Lỗi mở quà", "error");
          if ((res as any).error === "Người gửi không còn sở hữu thẻ này nữa.") fetchMessages();
      }
      setClaimingGiftId(null);
  };

  const handleBlockUser = () => {
    if (!activeFriend || activeFriend.isGroup || !currentUserId) return;
    const target = activeFriend;
    setConfirmDialog({
      title: "Chặn người dùng",
      description: "Người này sẽ không thể gửi tin nhắn cho bạn cho đến khi bạn bỏ chặn",
      holdLabel: "Giữ để chặn",
      avatarUrl: target.avatar,
      targetName: target.name,
      onConfirm: async () => {
        setActiveFriend((prev: any) => ({ ...prev, isBlockedByMe: true }));
        showNotification("Đã chặn người dùng này", "success");
        await blockUserAction(currentUserId, target.id).catch(() => {});
        await loadData();
      },
    });
  };

  const handleUnblockUser = () => {
      if (!activeFriend || activeFriend.isGroup || !currentUserId) return;
      setActiveFriend((prev: any) => ({...prev, isBlockedByMe: false}));
      showNotification("Đã bỏ chặn", "success");
      unblockUserAction(currentUserId, activeFriend.id).then(() => loadData()).catch(() => loadData());
  }

  const handleRenameGroup = async (newName: string) => {
      if (!activeFriend || !activeFriend.isGroup || !newName.trim()) return;
      const res = await renameChatGroupAction(activeFriend.id, newName);
      if (res.success) {
          showNotification("Đã đổi tên nhóm", "success");
          setActiveFriend((prev: any) => ({...prev, name: newName}));
          loadData();
      }
  };

  const handleViewGroupMembers = async () => {
      if (!activeFriend || !activeFriend.isGroup) return;
      const res = await getGroupMembersAction(activeFriend.id);
      if (res.success) {
          setGroupMembers(res.data || []);
          setShowMembersModal(true);
      }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!activeFriend || !activeFriend.isGroup) return;
    const group = activeFriend;
    setConfirmDialog({
      title: "Xóa thành viên",
      description: `${memberName} sẽ bị xóa khỏi nhóm trò chuyện này`,
      holdLabel: "Giữ để xóa khỏi nhóm",
      targetName: memberName,
      onConfirm: async () => {
        const res = await removeGroupMemberAction(group.id, memberId, currentUserId);
        if (res.success) {
          const sysText = `[SYS:KICK:${memberId}] ${session?.user?.name} đã xóa ${memberName} khỏi nhóm`;
          const msgRes = await sendMessageAction(currentUserId, null, sysText, "TEXT", undefined, false, group.id);
          if (msgRes.success) {
            setMessages((prev) => [...prev, msgRes.data]);
            if (socket) {
              socket.emit("send_message", { receiverId: `group_${group.id}`, message: { ...msgRes.data, groupId: group.id } });
              socket.emit("send_message", { receiverId: memberId, message: { ...msgRes.data, groupId: group.id } });
            }
          }
          const mbrs = await getGroupMembersAction(group.id);
          if (mbrs.success) setGroupMembers(mbrs.data || []);
          loadData();
        } else {
          showNotification(res.error, "error");
        }
      },
    });
  };

  const handleAddMemberToGroup = async (memberId: string, memberName: string) => {
      if (!activeFriend || !activeFriend.isGroup) return;
      const res = await addMemberToGroupAction(activeFriend.id, memberId, currentUserId);
      if (res.success) {
          setShowAddMemberModal(false);
          const sysText = `[SYS:ADD:${memberId}] ${session?.user?.name} đã thêm ${memberName} vào nhóm`;
          const msgRes = await sendMessageAction(currentUserId, null, sysText, "TEXT", undefined, false, activeFriend.id);
          
          if (msgRes.success) {
              setMessages(prev => [...prev, msgRes.data]);
              if (socket) {
                  socket.emit("send_message", { receiverId: `group_${activeFriend.id}`, message: { ...msgRes.data, groupId: activeFriend.id } });
                  socket.emit("send_message", { receiverId: memberId, message: { ...msgRes.data, groupId: activeFriend.id } }); 
              }
          }
          const mbrs = await getGroupMembersAction(activeFriend.id);
          if(mbrs.success) setGroupMembers(mbrs.data || []);
          loadData(); 
      } else showNotification(res.error, "error");
  };

  const handleTransferLeadership = (newLeaderId: string) => {
    if (!activeFriend || !activeFriend.isGroup) return;
    const group = activeFriend;
    setConfirmDialog({
      title: "Chuyển quyền trưởng nhóm",
      description: "Người được chọn sẽ trở thành trưởng nhóm mới và có toàn quyền quản lý nhóm",
      holdLabel: "Giữ để chuyển quyền",
      onConfirm: async () => {
        const res = await transferLeadershipAction(group.id, newLeaderId, currentUserId);
        if (res.success) {
          showNotification("Đã chuyển quyền", "success");
          setActiveFriend((prev: any) => ({ ...prev, leaderId: newLeaderId }));
          loadData();
        } else {
          showNotification(res.error, "error");
        }
      },
    });
  };

  const handleDeleteGroup = () => {
    if (!activeFriend || !activeFriend.isGroup) return;
    const group = activeFriend;
    setConfirmDialog({
      title: "Giải tán nhóm",
      description: "Toàn bộ lịch sử trò chuyện của nhóm sẽ bị xóa vĩnh viễn và không thể khôi phục",
      holdLabel: "Giữ để giải tán nhóm",
      avatarUrl: group.avatar,
      targetName: group.name,
      onConfirm: async () => {
        const res = await deleteChatGroupAction(group.id, currentUserId);
        if (res.success) {
          showNotification("Đã giải tán nhóm", "success");
          setActiveFriend(null);
          loadData();
        } else {
          showNotification(res.error, "error");
        }
      },
    });
  };

  const handleLeaveGroup = () => {
    if (!activeFriend || !activeFriend.isGroup) return;
    if (activeFriend.leaderId === currentUserId && activeFriend.memberCount > 1) {
      showNotification("Trưởng nhóm phải nhường quyền trước khi rời đi", "error");
      return;
    }
    const group = activeFriend;
    setConfirmDialog({
      title: "Rời khỏi nhóm",
      description: "Bạn sẽ không còn nhận được tin nhắn mới từ nhóm này nữa",
      holdLabel: "Giữ để rời nhóm",
      avatarUrl: group.avatar,
      targetName: group.name,
      onConfirm: async () => {
        const res = await leaveChatGroupAction(group.id, currentUserId);
        if (res.success) {
          const sysText = `[SYS:LEAVE:${currentUserId}] ${session?.user?.name} đã rời khỏi nhóm`;
          const msgRes = await sendMessageAction(currentUserId, null, sysText, "TEXT", undefined, false, group.id);
          if (msgRes.success && socket) {
            socket.emit("send_message", { receiverId: `group_${group.id}`, message: { ...msgRes.data, groupId: group.id } });
          }
          showNotification("Đã rời nhóm", "success");
          setActiveFriend(null);
          loadData();
        } else {
          showNotification(res.error, "error");
        }
      },
    });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0 && currentUserId) {
        setIsSearching(true);
        const res = await searchUsersAction(searchQuery, currentUserId);
        if (res.success) setSearchResults(res.data || []);
        setIsSearching(false);
      } else setSearchResults([]);
    }, 300); 
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentUserId]);

  const handleAddFriend = (friendId: string) => {
    if (!currentUserId) return;
    setSearchResults(prev => prev.map(user => user.id === friendId ? { ...user, friendshipStatus: "PENDING", isSender: true } : user));
    showNotification("Đã gửi yêu cầu kết bạn!", 'success');
    if (socket) socket.emit("send_friend_request", { receiverId: friendId, senderName: session?.user?.name, senderId: currentUserId, avatar: session?.user?.image });
    addFriendAction(currentUserId, friendId).then(res => { if (!res.success) showNotification(res.error || "Lỗi", 'error'); }).catch(console.error);
  };

  const handleRespondRequest = (friendshipId: number, accept: boolean) => {
      setPendingRequests(prev => prev.filter(req => req.id !== friendshipId));
      if (pendingRequests.length <= 1) setShowRequestsModal(false);
      showNotification(accept ? "Đã chấp nhận kết bạn!" : "Đã từ chối", 'success');
      respondFriendRequestAction(friendshipId, accept).then(res => {
          if (res.success) { if (accept && socket && res.senderId) socket.emit("accept_friend_request", { receiverId: res.senderId, senderName: session?.user?.name }); loadData(); }
      }).catch(console.error);
  };

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
        if (part.match(urlRegex)) return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline font-semibold opacity-90 hover:opacity-100">{part}</a>;
        return <span key={i}>{part}</span>;
    });
  };

  const formatTime = (dateString: string) => {
     if (!dateString) return "";
     return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const mediaFiles = messages.filter(m => m.messageType === "IMAGE" && m.fileUrl);

  const linkFiles = messages.reduce((acc, m) => {
      if (m.messageType === "TEXT" && m.content) {
          const links = m.content.match(/(https?:\/\/[^\s]+)/g) || [];
          links.forEach((l: string) => acc.push({ url: l, date: m.createdAt }));
      } else if (m.messageType === "SHARE_VIDEO" && m.fileUrl) {
          acc.push({ url: `/watch/${m.fileUrl}`, title: m.content, date: m.createdAt });
      }
      return acc;
  }, [] as any[]);

  const filteredChatList = chatFilterQuery.trim()
    ? chatList.filter((c) =>
        (c.name || "").toLowerCase().includes(chatFilterQuery.trim().toLowerCase())
      )
    : chatList;

  return (
    <div className="ux dash-bg-gradient h-[calc(100dvh-80px)] w-full flex text-[var(--ux-ink)] overflow-hidden relative pb-[70px] md:pb-0">
      {/* Hiệu ứng sao băng chạy nền */}
      <div className="dash-meteors" aria-hidden="true">
        {METEORS.map((m, idx) => (
          <span
            key={idx}
            className="dash-meteor"
            style={
              {
                "--my": m.top,
                "--mx": m.left,
                "--mlen": m.len,
                "--mdur": m.dur,
                "--mdel": m.del,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border bg-[var(--ux-surface)] border-[var(--ux-line-2)] text-[var(--ux-ink)]">
          {notification.type === 'success' ? (
            <CheckCircle2 size={18} className="text-[var(--ux-mint)] shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-[var(--ux-danger)] shrink-0" />
          )}
          <span className="font-medium text-xs sm:text-sm">{notification.msg}</span>
        </div>
      )}

      {/* CỘT TRÁI */}
      <div className="relative z-10 w-[76px] md:w-[330px] shrink-0 border-r border-[var(--ux-line)] flex flex-col h-full bg-[var(--ux-surface)]">
        <div className="p-3 md:p-4 flex flex-col items-center md:items-stretch gap-3.5 shrink-0 border-b border-[var(--ux-line)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 w-full">
            <h1 className="text-lg font-semibold text-[var(--ux-ink)] hidden md:block">Trò chuyện</h1>
            <div className="flex flex-col md:flex-row gap-2.5 md:gap-1.5 mt-1 md:mt-0">
              <button
                type="button"
                title="Tạo nhóm chat"
                onClick={() => setShowCreateGroupModal(true)}
                className="w-9 h-9 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] hover:border-[var(--ux-line-2)] text-[var(--ux-ink-2)] hover:text-[var(--ux-ink)] flex items-center justify-center transition-colors"
              >
                <Users className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                title="Lời mời kết bạn"
                onClick={() => setShowRequestsModal(true)}
                className="relative w-9 h-9 rounded-lg bg-[var(--ux-surface-2)] border border-[var(--ux-line)] hover:border-[var(--ux-line-2)] text-[var(--ux-ink-2)] hover:text-[var(--ux-ink)] flex items-center justify-center transition-colors"
              >
                <UserCheck className="w-4 h-4" strokeWidth={1.75} />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--ux-danger)] text-white text-[10px] font-semibold tabular-nums rounded-full flex items-center justify-center border-2 border-[var(--ux-surface)]">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                title="Tìm bạn mới"
                onClick={() => setShowAddFriendModal(true)}
                className="w-9 h-9 rounded-lg bg-[var(--ux-accent-soft)] border border-[var(--ux-accent)]/25 hover:bg-[var(--ux-accent)] text-[var(--ux-accent)] hover:text-white flex items-center justify-center transition-colors"
              >
                <UserPlus className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ux-ink-3)]" strokeWidth={1.75} />
            <input
              type="text"
              value={chatFilterQuery}
              onChange={(e) => setChatFilterQuery(e.target.value)}
              placeholder="Tìm cuộc trò chuyện"
              className="w-full bg-[var(--ux-surface-2)] pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none text-[var(--ux-ink)] placeholder:text-[var(--ux-ink-3)] border border-[var(--ux-line)] focus:border-[var(--ux-accent)] transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChatList.length === 0 ? (
            <div className="text-center text-[var(--ux-ink-3)] text-xs mt-10 px-4 hidden md:block leading-relaxed">
              {chatList.length === 0
                ? "Chưa có cuộc trò chuyện nào. Nhấn biểu tượng thêm bạn ở trên để bắt đầu."
                : "Không tìm thấy cuộc trò chuyện phù hợp."}
            </div>
          ) : (
            filteredChatList.map((chat) => {
              const isSelected =
                activeFriend?.id === chat.id &&
                !!activeFriend?.isGroup === !!chat.isGroup;
              return (
                <button
                  key={chat.isGroup ? `group_${chat.id}` : chat.id}
                  type="button"
                  onClick={() => setActiveFriend(chat)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors border text-left",
                    isSelected
                      ? "bg-[var(--ux-accent-soft)] border-[var(--ux-accent)]/30"
                      : "border-transparent hover:bg-[var(--ux-surface-2)]"
                  )}
                >
                  <div className="relative shrink-0">
                    <img
                      src={chat.avatar || "https://i.pravatar.cc/150"}
                      alt={chat.name}
                      className={cn(
                        "w-10 h-10 md:w-11 md:h-11 rounded-full object-cover border border-[var(--ux-line-2)]",
                        chat.isKicked && "opacity-50 grayscale"
                      )}
                    />
                    {chat.isOnline && !chat.isBlockedByMe && !chat.isBlockedByThem && !chat.isGroup && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--ux-mint)] border-2 border-[var(--ux-surface)] rounded-full" />
                    )}
                  </div>
                  <div className="hidden md:flex flex-1 flex-col overflow-hidden">
                    <p className="font-medium text-sm text-[var(--ux-ink)] truncate">
                      {chat.name}
                    </p>
                    <p
                      className={cn(
                        "text-xs truncate mt-0.5",
                        chat.isKicked
                          ? "text-[var(--ux-danger)] font-medium"
                          : "text-[var(--ux-ink-3)]"
                      )}
                    >
                      {chat.lastMsg}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CỘT GIỮA */}
      {activeFriend ? (
        <div className="flex-1 flex flex-col h-full min-w-0 relative z-10">
          <div className="h-16 shrink-0 border-b border-[var(--ux-line)] flex items-center justify-between px-4 lg:px-6 bg-[var(--ux-surface)] z-10">
            <div
              className="flex items-center gap-3 cursor-pointer group min-w-0"
              onClick={() => !activeFriend.isGroup && router.push(`/profile/${activeFriend.id}`)}
            >
              <img
                src={activeFriend.avatar || "https://i.pravatar.cc/150"}
                alt={activeFriend.name}
                className={cn(
                  "w-9 h-9 rounded-full border border-[var(--ux-line-2)] object-cover shrink-0",
                  activeFriend.isGroup && activeFriend.isKicked && "grayscale opacity-50"
                )}
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[var(--ux-ink)] leading-tight group-hover:text-[var(--ux-accent)] transition-colors truncate">
                  {activeFriend.name}
                </p>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    activeFriend.isGroup && activeFriend.isKicked
                      ? "text-[var(--ux-danger)] font-medium"
                      : "text-[var(--ux-ink-3)]"
                  )}
                >
                  {activeFriend.isGroup
                    ? activeFriend.isKicked
                      ? "Bạn đã rời nhóm"
                      : `${activeFriend.memberCount || "Nhiều"} thành viên`
                    : activeFriend.isBlockedByMe || activeFriend.isBlockedByThem
                    ? "Ngoại tuyến"
                    : activeFriend.isOnline
                    ? "Đang hoạt động"
                    : "Ngoại tuyến"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileSettings(true)}
              className="md:hidden p-2 text-[var(--ux-ink-2)] hover:bg-[var(--ux-surface-2)] rounded-lg transition-colors ml-auto"
            >
              <Menu className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 flex flex-col gap-4">
             {messages.length === 0 ? (
               <p className="text-center text-xs text-[var(--ux-ink-3)] my-auto">
                 Hãy gửi lời chào đến {activeFriend.name}
               </p>
             ) : (
               messages.map((msg, index) => {
                 let isSystemMsg = false;
                 let displayContent = msg.content || "";
                 
                 if (displayContent.startsWith("[SYS:")) {
                     isSystemMsg = true;
                     const endBracket = displayContent.indexOf("]");
                     if (endBracket !== -1) {
                         displayContent = displayContent.substring(endBracket + 1).trim();
                     }
                 }

                 if (isSystemMsg) {
                     return (
                         <div key={msg.id || index} className="flex justify-center my-2 w-full">
                             <span className="bg-[var(--ux-surface)] border border-[var(--ux-line)] text-[var(--ux-ink-3)] text-[11px] font-medium px-3.5 py-1 rounded-full text-center">
                                 {displayContent}
                             </span>
                         </div>
                     );
                 }

                 const isMe = msg.senderId === currentUserId;
                 let replyText = null; let replySenderId = null; let actualContent = msg.content || "";
                 if (actualContent.startsWith("[REPLY:")) {
                     const idEndIndex = actualContent.indexOf("]");
                     if (idEndIndex !== -1) {
                         replySenderId = actualContent.substring(7, idEndIndex);
                         const textEndIndex = actualContent.indexOf("[/REPLY]");
                         if (textEndIndex !== -1) {
                             replyText = actualContent.substring(idEndIndex + 1, textEndIndex);
                             actualContent = actualContent.substring(textEndIndex + 8);
                         }
                     }
                 }
                 let replyLabel = "";
                 if (replyText) {
                     if (isMe) replyLabel = replySenderId === currentUserId ? "Bạn đã trả lời chính mình" : `Bạn đã trả lời tin nhắn`;
                     else replyLabel = replySenderId === currentUserId ? `Đã trả lời bạn` : `Đã trả lời tin nhắn`;
                 }

                 return (
                   <div key={msg.id || index} className={cn("flex gap-2 max-w-[85%] md:max-w-[70%] group", isMe ? "self-end flex-row-reverse" : "self-start")}>
                      {!isMe && (
                         <img src={msg.sender?.avatar || msg.sender?.image || activeFriend.avatar || "https://i.pravatar.cc/150"} className="w-7 h-7 rounded-full shrink-0 border border-[var(--ux-line-2)] mt-auto mb-5 object-cover" title={msg.sender?.name} />
                      )}
                      <div className={cn("flex flex-col min-w-0", isMe ? "items-end" : "items-start")}>
                          {!isMe && activeFriend.isGroup && <span className="text-[11px] text-[var(--ux-ink-3)] font-medium mb-1 ml-1">{msg.sender?.name}</span>}
                          
                          <div className={cn("text-sm", (msg.messageType === "IMAGE" || msg.messageType === "WIKI_CARD" || msg.messageType === "SHARE_VIDEO") && msg.fileUrl ? "bg-transparent p-0" : cn("px-3.5 py-2.5 rounded-2xl", isMe ? "bg-[var(--ux-accent)] text-white rounded-br-sm" : "bg-[var(--ux-surface)] border border-[var(--ux-line)] text-[var(--ux-ink)] rounded-bl-sm"))}>
                              {replyText && (
                                  <div className={cn("mb-2 p-2 rounded-lg text-xs border-l-2", isMe ? "bg-white/15 border-white/60 text-white/95" : "bg-[var(--ux-surface-2)] border-[var(--ux-accent)] text-[var(--ux-ink-2)]")}>
                                    <div className="flex items-center gap-1 mb-0.5 font-medium text-[11px] opacity-85"><Reply className="w-3 h-3" /> {replyLabel}</div>
                                    <p className="line-clamp-2 opacity-90">{replyText}</p>
                                  </div>
                              )}
                              
                              {msg.messageType === "SHARE_VIDEO" && msg.fileUrl ? (
                                  <div onClick={() => router.push(`/watch/${msg.fileUrl}`)} className="w-[240px] md:w-[280px] rounded-xl border border-[var(--ux-line)] overflow-hidden bg-[var(--ux-surface)] flex flex-col cursor-pointer group/vid">
                                      <div className="px-3 py-2 border-b border-[var(--ux-line)] flex items-center gap-1.5 bg-[var(--ux-surface-2)]">
                                          <MonitorPlay className="w-3.5 h-3.5 text-[var(--ux-accent)]" strokeWidth={1.75} />
                                          <span className="text-[11px] font-medium text-[var(--ux-ink-2)]">Video chia sẻ</span>
                                      </div>
                                      <div className="relative w-full aspect-video bg-[var(--ux-surface-3)]">
                                          <img src={`https://img.youtube.com/vi/${msg.fileUrl}/mqdefault.jpg`} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity">
                                              <PlayCircle className="w-10 h-10 text-white" strokeWidth={1.5} />
                                          </div>
                                      </div>
                                      <div className="p-3">
                                          <p className="font-medium text-[13px] text-[var(--ux-ink)] line-clamp-2 leading-snug">{actualContent}</p>
                                      </div>
                                  </div>
                              ) : msg.messageType === "IMAGE" && msg.fileUrl ? (
                                  <img src={msg.fileUrl} className="max-w-[200px] md:max-w-[280px] rounded-xl border border-[var(--ux-line)] cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.fileUrl as string, '_blank')} />
                              ) : msg.messageType === "WIKI_CARD" && msg.fileUrl ? (
                                  <div className={cn("w-[180px] md:w-[210px] rounded-xl border border-[var(--ux-line)] overflow-hidden bg-[var(--ux-surface)] flex flex-col", msg.isGiftCard ? "cursor-default" : "cursor-pointer")} onClick={() => { try { const card = JSON.parse(msg.fileUrl as string); if (msg.isGiftCard) return; router.push(`/wiki/${card.id}`); } catch(e){} }}>
                                      {(() => {
                                          try {
                                              const card = JSON.parse(msg.fileUrl as string);
                                              if (msg.isGiftCard && !card.claimed) {
                                                  return (
                                                      <div className={cn("flex flex-col items-center justify-center p-5 bg-[var(--ux-accent)] aspect-square relative", isMe ? "opacity-85 cursor-default" : "cursor-pointer hover:bg-[var(--ux-accent-2)] transition-colors")} onClick={(e) => { e.stopPropagation(); handleClaimGift(msg.id, card, isMe); }}>
                                                          {claimingGiftId === msg.id ? <Loader2 className="w-10 h-10 text-white mb-2 animate-spin" /> : <Gift className="w-10 h-10 text-white mb-2" strokeWidth={1.5} />}
                                                          <p className="text-white font-semibold text-xs text-center">{isMe ? "Quà đã gửi" : "Nhấn để mở quà"}</p>
                                                      </div>
                                                  );
                                              }
                                              const rarityColors: Record<string, string> = { N: "bg-slate-500", R: "bg-blue-500", SR: "bg-purple-500", SSR: "bg-amber-500", UR: "bg-red-500", LR: "bg-cyan-500", MR: "bg-emerald-500" };
                                              const badgeColor = rarityColors[card.rarity] || "bg-slate-500";
                                              return (
                                                  <>
                                                      <div className="relative w-full aspect-square bg-[var(--ux-surface-3)]">
                                                          {card.imageUrl ? <img src={card.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[var(--ux-ink-3)] text-xs font-medium">Wiki</div>}
                                                          <div className={cn("absolute top-2 right-2 px-2 py-0.5 rounded-md font-semibold text-[10px] text-white", badgeColor)}>{card.rarity}</div>
                                                          {msg.isGiftCard && card.claimed && <div className="absolute top-2 left-2 bg-black/65 text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[var(--ux-mint)]" /> Đã nhận</div>}
                                                      </div>
                                                      <div className="p-2.5 text-center border-t border-[var(--ux-line)]"><p className="font-medium text-xs text-[var(--ux-ink)] truncate">{card.title}</p><p className="text-[11px] text-[var(--ux-ink-3)] mt-0.5">{msg.isGiftCard ? "Đã lưu vào bộ sưu tập" : "Nhấn để xem chi tiết"}</p></div>
                                                  </>
                                              )
                                          } catch(e) { return <div className="p-4 text-center text-[var(--ux-ink-3)] text-xs">Thẻ Wiki bị lỗi</div>; }
                                      })()}
                                  </div>
                              ) : (
                                  <span className="break-words whitespace-pre-wrap leading-relaxed">{renderTextWithLinks(actualContent)}</span>
                              )}
                          </div>

                          <div className={cn("flex items-center gap-3 mt-1 px-1 h-4", isMe ? "flex-row-reverse" : "flex-row")}>
                              <span className="text-[10.5px] text-[var(--ux-ink-3)] tabular-nums">{formatTime(msg.createdAt)}</span>
                              {(!activeFriend.isBlockedByMe && !activeFriend.isBlockedByThem && !activeFriend.isKicked) && (
                                <button onClick={() => setReplyingTo({ id: msg.id, content: actualContent, isMe })} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[var(--ux-ink-3)] hover:text-[var(--ux-accent)] transition-opacity text-[11px] font-medium"><Reply className="w-3 h-3" /> Trả lời</button>
                              )}
                          </div>
                      </div>
                   </div>
                 )
               })
             )}
             <div ref={messagesEndRef} />
          </div>

          {!activeFriend.isGroup && (activeFriend.isBlockedByMe || activeFriend.isBlockedByThem) ? (
            <div className="p-3.5 bg-[var(--ux-surface)] border-t border-[var(--ux-line)] shrink-0 flex items-center justify-center">
                <span className="text-xs font-medium text-[var(--ux-ink-3)] flex items-center gap-2"><Ban className="w-4 h-4" /> Bạn không thể nhắn tin với người này</span>
            </div>
          ) : activeFriend.isGroup && activeFriend.isKicked ? (
            <div className="p-3.5 bg-[var(--ux-danger)]/10 border-t border-[var(--ux-danger)]/20 shrink-0 flex items-center justify-center">
                <span className="text-xs font-medium text-[var(--ux-danger)] flex items-center gap-2"><Ban className="w-4 h-4" /> Bạn không còn là thành viên của nhóm này</span>
            </div>
          ) : (
            <div className="p-3 md:p-4 bg-[var(--ux-surface)] border-t border-[var(--ux-line)] shrink-0 flex flex-col gap-2.5 z-20">
              {replyingTo && (
                 <div className="flex items-center justify-between px-3.5 py-2 bg-[var(--ux-surface-2)] rounded-xl border border-[var(--ux-line)]">
                     <div className="flex flex-col min-w-0 pr-4"><span className="text-[11px] font-medium text-[var(--ux-accent)]">Đang trả lời {replyingTo.isMe ? "chính mình" : "tin nhắn"}</span><span className="text-xs text-[var(--ux-ink-2)] truncate">{replyingTo.content}</span></div>
                     <button type="button" onClick={() => setReplyingTo(null)} className="p-1 text-[var(--ux-ink-3)] hover:text-[var(--ux-danger)] transition-colors shrink-0"><X className="w-4 h-4" /></button>
                 </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] focus-within:border-[var(--ux-accent)] p-1.5 rounded-xl transition-colors relative">
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                <input type="file" accept="image/*" ref={groupAvatarInputRef} onChange={handleGroupAvatarUpload} className="hidden" />
                <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isSending} className="p-2 text-[var(--ux-ink-3)] hover:text-[var(--ux-accent)] hover:bg-[var(--ux-surface)] rounded-lg transition-colors disabled:opacity-50" title="Gửi ảnh">{isSending ? <Loader2 className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4" strokeWidth={1.75} />}</button>
                <button type="button" onClick={() => { if (ownedCards.length === 0) { setIsLoadingCards(true); getOwnedWikiCardsAction(currentUserId).then(res => { if (res.success) setOwnedCards(res.data || []); setIsLoadingCards(false); setShowWikiModal(true); }); } else setShowWikiModal(true); }} className="p-2 text-[var(--ux-ink-3)] hover:text-[var(--ux-accent)] hover:bg-[var(--ux-surface)] rounded-lg transition-colors" title="Tặng thẻ Wiki"><Sparkles className="w-4 h-4" strokeWidth={1.75} /></button>
                <input autoFocus type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Nhập tin nhắn" className="flex-1 bg-transparent outline-none text-sm px-2 text-[var(--ux-ink)] placeholder:text-[var(--ux-ink-3)]" />
                <button type="submit" disabled={!messageInput.trim() || isSending} className="p-2 bg-[var(--ux-accent)] text-white hover:bg-[var(--ux-accent-2)] disabled:opacity-40 rounded-lg transition-colors"><Send className="w-4 h-4" strokeWidth={1.75} /></button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col h-full items-center justify-center p-6 text-center">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-[var(--ux-accent-soft)] text-[var(--ux-accent)] flex items-center justify-center border border-[var(--ux-accent)]/20">
            <Send className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <h2 className="text-lg font-semibold text-[var(--ux-ink)]">Hub-EL Messenger</h2>
          <p className="text-xs sm:text-sm text-[var(--ux-ink-2)] mt-1.5 mb-5 max-w-sm">
            Chọn một cuộc trò chuyện bên trái hoặc kết nối với bạn học mới
          </p>
          <RollingActionButton
            label="Tìm bạn mới"
            onClick={() => setShowAddFriendModal(true)}
          />
        </div>
      )}

      {showMobileSettings && activeFriend && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end">
            <div className="w-[82%] max-w-[320px] bg-[var(--ux-surface)] h-full shadow-2xl flex flex-col border-l border-[var(--ux-line)]">
                
                <div className="p-4 border-b border-[var(--ux-line)] flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-[var(--ux-ink)]">Tùy chọn đoạn chat</h3>
                    <button onClick={() => setShowMobileSettings(false)} className="p-1.5 bg-[var(--ux-surface-2)] border border-[var(--ux-line)] rounded-lg text-[var(--ux-ink-2)]"><X className="w-4 h-4" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5">
                    <div className="flex flex-col items-center justify-center py-4 border-b border-[var(--ux-line)] mb-2">
                        <img src={activeFriend.avatar || "https://i.pravatar.cc/150"} className="w-16 h-16 rounded-full object-cover mb-2.5 border border-[var(--ux-line-2)]" />
                        <p className="font-semibold text-base text-[var(--ux-ink)] text-center">{activeFriend.name}</p>
                    </div>

                    {!activeFriend.isGroup && (
                        <button onClick={() => { setShowMobileSettings(false); router.push(`/profile/${activeFriend.id}`); }} className="flex items-center gap-3 p-3 bg-[var(--ux-surface-2)] rounded-xl text-sm font-medium text-[var(--ux-ink)]">
                            <User className="w-4 h-4 text-[var(--ux-accent)]" /> Xem trang cá nhân
                        </button>
                    )}

                    <button onClick={() => { handleToggleMute(); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3 bg-[var(--ux-surface-2)] rounded-xl text-sm font-medium text-[var(--ux-ink)]">
                        {mutedUsers.includes(activeFriend.id.toString()) ? <Bell className="w-4 h-4 text-[var(--ux-warn)]" /> : <BellOff className="w-4 h-4 text-[var(--ux-warn)]" />}
                        {mutedUsers.includes(activeFriend.id.toString()) ? "Bật thông báo" : "Tắt thông báo chat"}
                    </button>

                    <button onClick={() => { setShowMediaModal(true); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3 bg-[var(--ux-surface-2)] rounded-xl text-sm font-medium text-[var(--ux-ink)]">
                        <ImageIcon className="w-4 h-4 text-[var(--ux-mint)]" /> File phương tiện ({mediaFiles.length})
                    </button>

                    <button onClick={() => { setShowLinksModal(true); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3 bg-[var(--ux-surface-2)] rounded-xl text-sm font-medium text-[var(--ux-ink)]">
                        <LinkIcon className="w-4 h-4 text-[var(--ux-accent)]" /> Các file đính kèm ({linkFiles.length})
                    </button>

                    {activeFriend.isGroup ? (
                        <>
                            <button onClick={() => { handleViewGroupMembers(); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3 bg-[var(--ux-surface-2)] rounded-xl text-sm font-medium text-[var(--ux-ink)]">
                                <Users className="w-4 h-4 text-[var(--ux-accent)]" /> Xem các thành viên
                            </button>
                            <button onClick={() => { setShowRenameGroupModal(true); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3 bg-[var(--ux-surface-2)] rounded-xl text-sm font-medium text-[var(--ux-ink)]">
                                <Edit3 className="w-4 h-4 text-[var(--ux-warn)]" /> Đổi tên nhóm chat
                            </button>
                            <button onClick={() => { handleLeaveGroup(); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3 bg-[var(--ux-danger)]/10 rounded-xl text-sm font-medium text-[var(--ux-danger)] mt-3 border border-[var(--ux-danger)]/20">
                                <LogOut className="w-4 h-4" /> Rời khỏi nhóm này
                            </button>
                        </>
                    ) : (
                        <button onClick={() => { handleBlockUser(); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3 bg-[var(--ux-danger)]/10 rounded-xl text-sm font-medium text-[var(--ux-danger)] mt-3 border border-[var(--ux-danger)]/20">
                            <Ban className="w-4 h-4" /> Chặn người dùng này
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      <ChatRightSidebar 
         activeFriend={activeFriend} currentUserId={currentUserId}
         mediaFilesCount={mediaFiles.length} linkFilesCount={linkFiles.length}
         isMuted={activeFriend ? mutedUsers.includes(activeFriend.id.toString()) : false}
         onToggleMute={handleToggleMute} onOpenMedia={() => setShowMediaModal(true)} onOpenLinks={() => setShowLinksModal(true)}
         onRenameGroup={() => setShowRenameGroupModal(true)} onUpdateGroupAvatar={() => groupAvatarInputRef.current?.click()}
         onViewGroupMembers={handleViewGroupMembers}
         onRemoveFriend={() => {
           if (!activeFriend) return;
           const target = activeFriend;
           setConfirmDialog({
             title: "Hủy kết bạn",
             description: "Hai bạn sẽ không còn trong danh sách bạn bè của nhau nữa",
             holdLabel: "Giữ để hủy kết bạn",
             avatarUrl: target.avatar,
             targetName: target.name,
             onConfirm: async () => {
               await removeFriendAction(currentUserId, target.id);
               showNotification("Đã hủy kết bạn", "success");
               setActiveFriend(null);
               loadData();
             },
           });
         }}
         onBlockUser={handleBlockUser} onUnblockUser={handleUnblockUser} onDeleteGroup={handleDeleteGroup} onLeaveGroup={handleLeaveGroup}
         router={router}
      />

      <ChatModals 
         showMediaModal={showMediaModal} setShowMediaModal={setShowMediaModal} mediaFiles={mediaFiles}
         showLinksModal={showLinksModal} setShowLinksModal={setShowLinksModal} linkFiles={linkFiles}
         showWikiModal={showWikiModal} setShowWikiModal={setShowWikiModal} ownedCards={ownedCards} isLoadingCards={isLoadingCards} handleSendWikiCard={handleSendWikiCard}
         giftResult={giftResult} setGiftResult={setGiftResult}
         showRequestsModal={showRequestsModal} setShowRequestsModal={setShowRequestsModal} pendingRequests={pendingRequests} handleRespondRequest={handleRespondRequest}
         showAddFriendModal={showAddFriendModal} setShowAddFriendModal={setShowAddFriendModal} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isSearching={isSearching} searchResults={searchResults} handleAddFriend={handleAddFriend} router={router}
         showCreateGroupModal={showCreateGroupModal} setShowCreateGroupModal={setShowCreateGroupModal} friends={friends} handleCreateGroup={handleCreateGroup}
         showRenameGroupModal={showRenameGroupModal} setShowRenameGroupModal={setShowRenameGroupModal} handleRenameGroup={handleRenameGroup} currentGroupName={activeFriend?.name}
         showMembersModal={showMembersModal} setShowMembersModal={setShowMembersModal} groupMembers={groupMembers}
         currentUserId={currentUserId} activeFriend={activeFriend} handleRemoveMember={handleRemoveMember} handleTransferLeadership={handleTransferLeadership}
         showAddMemberModal={showAddMemberModal} setShowAddMemberModal={setShowAddMemberModal} handleAddMemberToGroup={handleAddMemberToGroup}
      />

      <ConfirmHoldDialog
        config={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  );
}