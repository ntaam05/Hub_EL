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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
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
    if (confirm(`Bạn có chắc muốn chặn ${activeFriend.name}?`)) {
        setActiveFriend((prev: any) => ({...prev, isBlockedByMe: true}));
        showNotification("Đã chặn người dùng này", "success");
        blockUserAction(currentUserId, activeFriend.id).then(() => loadData()).catch(() => loadData());
    }
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

  const handleRemoveMember = async (memberId: string, memberName: string) => {
      if (!activeFriend || !activeFriend.isGroup) return;
      if(confirm(`Xóa ${memberName} khỏi nhóm?`)) {
          const res = await removeGroupMemberAction(activeFriend.id, memberId, currentUserId);
          if (res.success) {
              const sysText = `[SYS:KICK:${memberId}] ${session?.user?.name} đã xóa ${memberName} khỏi nhóm`;
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
      }
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

  const handleTransferLeadership = async (newLeaderId: string) => {
      if (!activeFriend || !activeFriend.isGroup) return;
      if(confirm("Chuyển quyền trưởng nhóm cho người này?")) {
          const res = await transferLeadershipAction(activeFriend.id, newLeaderId, currentUserId);
          if (res.success) {
              showNotification("Đã chuyển quyền", "success");
              setActiveFriend((prev: any) => ({ ...prev, leaderId: newLeaderId }));
              loadData();
          } else showNotification(res.error, "error");
      }
  };

  const handleDeleteGroup = async () => {
      if (!activeFriend || !activeFriend.isGroup) return;
      if(confirm("Bạn có CHẮC CHẮN muốn giải tán nhóm này không? Toàn bộ lịch sử chat sẽ bị xóa vĩnh viễn!")) {
          const res = await deleteChatGroupAction(activeFriend.id, currentUserId);
          if (res.success) {
              showNotification("Đã giải tán nhóm", "success");
              setActiveFriend(null);
              loadData();
          } else showNotification(res.error, "error");
      }
  };

  const handleLeaveGroup = async () => {
      if (!activeFriend || !activeFriend.isGroup) return;
      if (activeFriend.leaderId === currentUserId && activeFriend.memberCount > 1) {
           showNotification("Trưởng nhóm phải nhường Key trước khi rời đi!", "error"); return;
      }
      if(confirm("Bạn có chắc muốn rời khỏi nhóm này?")) {
          const res = await leaveChatGroupAction(activeFriend.id, currentUserId);
          if (res.success) {
              const sysText = `[SYS:LEAVE:${currentUserId}] ${session?.user?.name} đã rời khỏi nhóm`;
              const msgRes = await sendMessageAction(currentUserId, null, sysText, "TEXT", undefined, false, activeFriend.id);
              if (msgRes.success && socket) {
                  socket.emit("send_message", { receiverId: `group_${activeFriend.id}`, message: { ...msgRes.data, groupId: activeFriend.id } });
              }
              showNotification("Đã rời nhóm", "success");
              setActiveFriend(null);
              loadData();
          } else showNotification(res.error, "error");
      }
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

  return (
    <div className="h-[calc(100dvh-80px)] w-full flex bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden font-sans relative pb-[70px] md:pb-0">
      
      {notification && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border bg-white dark:bg-slate-900 border-blue-500 text-blue-600 dark:text-blue-400 animate-in fade-in slide-in-from-top-5">
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} className="text-red-500" />}
          <span className="font-black text-sm uppercase">{notification.msg}</span>
        </div>
      )}

      {/* CỘT TRÁI */}
      <div className="w-[80px] md:w-[350px] shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-[#0f172a]">
        <div className="p-3 md:p-4 flex flex-col items-center md:items-stretch gap-4 shrink-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 w-full">
            <h1 className="text-2xl font-black text-slate-800 dark:text-white hidden md:block">Chat</h1>
            <div className="flex flex-col md:flex-row gap-4 md:gap-2 mt-2 md:mt-0">
              <button onClick={() => setShowCreateGroupModal(true)} className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-sm"><Users className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
              <button onClick={() => setShowRequestsModal(true)} className="relative w-10 h-10 md:w-9 md:h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-sm">
                <UserCheck className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                {pendingRequests.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f172a]">{pendingRequests.length}</span>}
              </button>
              <button onClick={() => setShowAddFriendModal(true)} className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-sm"><UserPlus className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Tìm kiếm trên Messenger..." className="w-full bg-slate-100 dark:bg-slate-800/80 pl-10 pr-4 py-2 rounded-full text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-500 border border-transparent dark:border-slate-700/50 focus:border-blue-500/50 transition-colors" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 mt-2">
          {chatList.length === 0 ? (
            <div className="text-center text-slate-500 text-sm mt-10 hidden md:block">Bạn chưa có cuộc trò chuyện nào.<br/>Nhấn nút + để tìm bạn nhé!</div>
          ) : (
            chatList.map((chat) => (
              <button key={chat.isGroup ? `group_${chat.id}` : chat.id} onClick={() => setActiveFriend(chat)} className={cn("w-full flex items-center gap-3 p-2 rounded-xl transition-colors border border-transparent", activeFriend?.id === chat.id && !!activeFriend?.isGroup === !!chat.isGroup ? "bg-blue-50 dark:bg-slate-800 border-blue-100 dark:border-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-800/50")}>
                <div className="relative shrink-0">
                  <img src={chat.avatar || "https://i.pravatar.cc/150"} alt="avt" className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border dark:border-slate-700", chat.isKicked && "opacity-50 grayscale")} />
                  {chat.isOnline && !chat.isBlockedByMe && !chat.isBlockedByThem && !chat.isGroup && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#0f172a] rounded-full"></div>}
                </div>
                <div className="hidden md:flex flex-1 flex-col text-left overflow-hidden">
                  <p className="font-semibold text-[15px] text-slate-800 dark:text-slate-200 truncate">{chat.name}</p>
                  <p className={cn("text-[13px] truncate", chat.isKicked ? "text-red-500 dark:text-red-400 font-medium" : "text-slate-500 dark:text-slate-400")}>{chat.lastMsg}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* CỘT GIỮA */}
      {activeFriend ? (
        <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 dark:bg-[#020617] relative z-10">
          <div className="h-[72px] shrink-0 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-[#0f172a] shadow-sm z-10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => !activeFriend.isGroup && router.push(`/profile/${activeFriend.id}`)}>
              <div className="relative">
                <img src={activeFriend.avatar || "https://i.pravatar.cc/150"} alt="avt" className={cn("w-10 h-10 rounded-full border dark:border-slate-700 object-cover", activeFriend.isGroup && activeFriend.isKicked && "grayscale opacity-50")} />
              </div>
              <div>
                <p className="font-bold text-[15px] text-slate-800 dark:text-slate-100 leading-tight group-hover:text-blue-500 transition-colors">{activeFriend.name}</p>
                <p className={cn("text-[12px]", activeFriend.isGroup && activeFriend.isKicked ? "text-red-500 font-bold" : "text-slate-500 dark:text-slate-400")}>
                    {activeFriend.isGroup 
                       ? (activeFriend.isKicked ? "Bạn đã rời nhóm" : `${activeFriend.memberCount || 'Nhiều'} thành viên`) 
                       : (activeFriend.isBlockedByMe || activeFriend.isBlockedByThem ? 'Ngoại tuyến' : (activeFriend.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'))}
                </p>
              </div>
            </div>

            <button onClick={() => setShowMobileSettings(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 ml-auto">
                <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 flex flex-col gap-5">
             {messages.length === 0 ? (
               <p className="text-center text-sm text-slate-400 my-auto">Hãy gửi lời chào đến {activeFriend.name}!</p>
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
                         <div key={msg.id || index} className="flex justify-center my-3 w-full">
                             <span className="bg-slate-200/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 text-[11px] font-bold px-4 py-1.5 rounded-full text-center shadow-sm">
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
                         <img src={msg.sender?.avatar || msg.sender?.image || activeFriend.avatar || "https://i.pravatar.cc/150"} className="w-7 h-7 rounded-full shrink-0 border dark:border-slate-700 mt-auto mb-5 object-cover" title={msg.sender?.name} />
                      )}
                      <div className={cn("flex flex-col min-w-0", isMe ? "items-end" : "items-start")}>
                          {!isMe && activeFriend.isGroup && <span className="text-[10px] text-slate-500 font-bold mb-1 ml-1">{msg.sender?.name}</span>}
                          
                          <div className={cn("text-[15px]", (msg.messageType === "IMAGE" || msg.messageType === "WIKI_CARD" || msg.messageType === "SHARE_VIDEO") && msg.fileUrl ? "bg-transparent p-0 shadow-none" : cn("p-3 rounded-2xl shadow-sm", isMe ? "bg-blue-600 text-white rounded-br-sm shadow-blue-500/20" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 rounded-bl-sm"))}>
                              {replyText && (
                                  <div className={cn("mb-2 p-2 rounded-lg text-xs border-l-4 opacity-90", isMe ? "bg-blue-700/50 border-blue-300 text-blue-50" : "bg-slate-100 dark:bg-slate-700 border-slate-400 text-slate-500 dark:text-slate-400")}>
                                    <div className="flex items-center gap-1 mb-1 font-bold opacity-80 text-[10px] uppercase tracking-wide"><Reply className="w-3 h-3" /> {replyLabel}</div>
                                    <p className="line-clamp-2 italic">{replyText}</p>
                                  </div>
                              )}
                              
                              {/* 🚨 HIỂN THỊ THẺ VIDEO CHIA SẺ TẠI ĐÂY */}
                              {msg.messageType === "SHARE_VIDEO" && msg.fileUrl ? (
                                  <div onClick={() => router.push(`/watch/${msg.fileUrl}`)} className={cn("w-[240px] md:w-[280px] rounded-2xl border overflow-hidden shadow-sm bg-white dark:bg-[#0f172a] flex flex-col transition-transform hover:scale-[1.02] cursor-pointer", isMe ? "border-blue-400 dark:border-blue-700" : "border-slate-200 dark:border-slate-700/50")}>
                                      <div className="p-2 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-1.5 bg-slate-50 dark:bg-[#020617]/50">
                                          <MonitorPlay className="w-4 h-4 text-red-500" />
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chia sẻ Video</span>
                                      </div>
                                      <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-800 group">
                                          <img src={`https://img.youtube.com/vi/${msg.fileUrl}/mqdefault.jpg`} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              <PlayCircle className="w-12 h-12 text-white drop-shadow-lg transition-transform group-hover:scale-110" />
                                          </div>
                                      </div>
                                      <div className="p-3 bg-white dark:bg-[#0f172a]">
                                          <p className="font-bold text-[13px] text-slate-800 dark:text-white line-clamp-2 leading-snug">{actualContent}</p>
                                      </div>
                                  </div>
                              ) : msg.messageType === "IMAGE" && msg.fileUrl ? (
                                  <img src={msg.fileUrl} className="max-w-[200px] md:max-w-[280px] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.fileUrl as string, '_blank')} />
                              ) : msg.messageType === "WIKI_CARD" && msg.fileUrl ? (
                                  <div className={cn("w-[180px] md:w-[220px] rounded-xl border overflow-hidden shadow-md bg-white dark:bg-[#0f172a] flex flex-col transition-transform", msg.isGiftCard ? "border-transparent cursor-default" : "border-slate-200 dark:border-slate-700/50 hover:scale-[1.02] cursor-pointer")} onClick={() => { try { const card = JSON.parse(msg.fileUrl as string); if (msg.isGiftCard) return; router.push(`/wiki/${card.id}`); } catch(e){} }}>
                                      {(() => {
                                          try {
                                              const card = JSON.parse(msg.fileUrl as string);
                                              if (msg.isGiftCard && !card.claimed) {
                                                  return (
                                                      <div className={cn("flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500 to-indigo-600 aspect-square relative", isMe ? "opacity-80 cursor-default" : "cursor-pointer hover:scale-105 transition-transform")} onClick={(e) => { e.stopPropagation(); handleClaimGift(msg.id, card, isMe); }}>
                                                          {claimingGiftId === msg.id ? <Loader2 className="w-12 h-12 text-white mb-2 animate-spin" /> : <Gift className={cn("w-12 h-12 text-white mb-2", !isMe && "animate-bounce")} />}
                                                          <p className="text-white font-black text-sm text-center">{isMe ? "Quà đã gửi" : "Nhấn để mở quà!"}</p>
                                                      </div>
                                                  );
                                              }
                                              const rarityColors: Record<string, string> = { N: "bg-slate-500", R: "bg-blue-500", SR: "bg-purple-500", SSR: "bg-yellow-500", UR: "bg-red-500", LR: "bg-cyan-500", MR: "bg-emerald-500" };
                                              const badgeColor = rarityColors[card.rarity] || "bg-slate-500";
                                              return (
                                                  <>
                                                      <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-800">
                                                          {card.imageUrl ? <img src={card.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">Wiki</div>}
                                                          <div className={cn("absolute top-2 right-2 px-2 py-0.5 rounded-full font-black text-[10px] text-white shadow-sm", badgeColor)}>{card.rarity}</div>
                                                          {msg.isGiftCard && card.claimed && <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Đã nhận</div>}
                                                      </div>
                                                      <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a]"><p className="font-bold text-[13px] text-slate-800 dark:text-white truncate">{card.title}</p><p className="text-[10px] text-slate-500 mt-0.5">{msg.isGiftCard ? "Đã lưu vào bộ sưu tập" : "Nhấn để xem chi tiết ✨"}</p></div>
                                                  </>
                                              )
                                          } catch(e) { return <div className="p-4 text-center text-slate-500 text-sm">Thẻ Wiki bị lỗi</div>; }
                                      })()}
                                  </div>
                              ) : (
                                  <span className="break-words whitespace-pre-wrap leading-relaxed">{renderTextWithLinks(actualContent)}</span>
                              )}
                          </div>

                          <div className={cn("flex items-center gap-3 mt-1 px-1 h-4", isMe ? "flex-row-reverse" : "flex-row")}>
                              <span className="text-[10px] text-slate-400 font-medium">{formatTime(msg.createdAt)}</span>
                              {(!activeFriend.isBlockedByMe && !activeFriend.isBlockedByThem && !activeFriend.isKicked) && (
                                <button onClick={() => setReplyingTo({ id: msg.id, content: actualContent, isMe })} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-slate-400 hover:text-blue-500 transition-all text-[10px] font-bold uppercase tracking-wider"><Reply className="w-3 h-3" /> Trả lời</button>
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
            <div className="p-4 bg-slate-100/80 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-slate-500 flex items-center gap-2"><Ban className="w-4 h-4" /> Bạn không thể nhắn tin với người này.</span>
            </div>
          ) : activeFriend.isGroup && activeFriend.isKicked ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border-t border-red-200 dark:border-red-900/20 shrink-0 flex items-center justify-center">
                <span className="text-sm font-bold text-red-500 flex items-center gap-2"><Ban className="w-4 h-4" /> Bạn không còn là thành viên của nhóm này. Bạn chỉ có thể xem tin nhắn cũ.</span>
            </div>
          ) : (
            <div className="p-3 md:p-4 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 shrink-0 flex flex-col gap-3 z-20">
              {replyingTo && (
                 <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2">
                     <div className="flex flex-col min-w-0 pr-4"><span className="text-xs font-black text-blue-500">Đang trả lời {replyingTo.isMe ? "chính mình" : "tin nhắn"}</span><span className="text-sm text-slate-600 dark:text-slate-300 truncate">{replyingTo.content}</span></div>
                     <button type="button" onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"><X className="w-4 h-4" /></button>
                 </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/50 p-1.5 rounded-full shadow-inner relative">
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                <input type="file" accept="image/*" ref={groupAvatarInputRef} onChange={handleGroupAvatarUpload} className="hidden" />
                <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isSending} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50">{isSending ? <Loader2 className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5" />}</button>
                <button type="button" onClick={() => { if (ownedCards.length === 0) { setIsLoadingCards(true); getOwnedWikiCardsAction(currentUserId).then(res => { if (res.success) setOwnedCards(res.data || []); setIsLoadingCards(false); setShowWikiModal(true); }); } else setShowWikiModal(true); }} className="p-2 text-slate-500 hover:text-purple-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><Sparkles className="w-5 h-5" /></button>
                <input autoFocus type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Nhập tin nhắn..." className="flex-1 bg-transparent outline-none text-[15px] px-2 text-slate-900 dark:text-white placeholder:text-slate-500" />
                <button type="submit" disabled={!messageInput.trim() || isSending} className="p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-full transition-colors shadow-sm"><Send className="w-4 h-4 ml-0.5" /></button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full items-center justify-center bg-slate-50 dark:bg-[#020617]">
          <div className="w-24 h-24 mb-6 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center"><Send className="w-10 h-10 text-blue-500 ml-2" /></div>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Hub-EL Messenger</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Chọn một đoạn chat hoặc bắt đầu cuộc trò chuyện mới</p>
        </div>
      )}

      {showMobileSettings && activeFriend && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in flex justify-end">
            <div className="w-[80%] max-w-[320px] bg-white dark:bg-[#0f172a] h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
                
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#020617]">
                    <h3 className="font-bold text-slate-800 dark:text-white">Tùy chọn đoạn chat</h3>
                    <button onClick={() => setShowMobileSettings(false)} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 active:scale-95 transition-all"><X className="w-4 h-4" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                    <div className="flex flex-col items-center justify-center py-4 border-b border-slate-100 dark:border-slate-800 mb-2">
                        <img src={activeFriend.avatar || "https://i.pravatar.cc/150"} className="w-20 h-20 rounded-full object-cover mb-3 shadow-md border-2 border-white dark:border-slate-700" />
                        <p className="font-black text-xl text-slate-800 dark:text-white text-center">{activeFriend.name}</p>
                    </div>

                    {!activeFriend.isGroup && (
                        <button onClick={() => { setShowMobileSettings(false); router.push(`/profile/${activeFriend.id}`); }} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                            <User className="w-5 h-5 text-blue-500" /> Xem trang cá nhân
                        </button>
                    )}

                    <button onClick={() => { handleToggleMute(); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                        {mutedUsers.includes(activeFriend.id.toString()) ? <Bell className="w-5 h-5 text-orange-500" /> : <BellOff className="w-5 h-5 text-orange-500" />}
                        {mutedUsers.includes(activeFriend.id.toString()) ? "Bật thông báo" : "Tắt thông báo chat"}
                    </button>

                    <button onClick={() => { setShowMediaModal(true); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                        <ImageIcon className="w-5 h-5 text-emerald-500" /> File phương tiện ({mediaFiles.length})
                    </button>

                    <button onClick={() => { setShowLinksModal(true); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                        <LinkIcon className="w-5 h-5 text-indigo-500" /> Các file đính kèm ({linkFiles.length})
                    </button>

                    {activeFriend.isGroup ? (
                        <>
                            <button onClick={() => { handleViewGroupMembers(); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                                <Users className="w-5 h-5 text-purple-500" /> Xem các thành viên
                            </button>
                            <button onClick={() => { setShowRenameGroupModal(true); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                                <Edit3 className="w-5 h-5 text-yellow-500" /> Đổi tên nhóm chat
                            </button>
                            <button onClick={() => { handleLeaveGroup(); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 rounded-xl font-semibold text-red-600 dark:text-red-400 mt-4 border border-red-100 dark:border-red-900/30">
                                <LogOut className="w-5 h-5" /> Rời khỏi nhóm này
                            </button>
                        </>
                    ) : (
                        <button onClick={() => { handleBlockUser(); setShowMobileSettings(false); }} className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-500/10 rounded-xl font-semibold text-red-600 dark:text-red-400 mt-4 border border-red-100 dark:border-red-900/30">
                            <Ban className="w-5 h-5" /> Chặn người dùng này
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
         onRemoveFriend={async () => { if(confirm(`Hủy kết bạn với ${activeFriend.name}?`)) { await removeFriendAction(currentUserId, activeFriend.id); showNotification("Đã hủy kết bạn", "success"); setActiveFriend(null); loadData(); } }}
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
    </div>
  );
}