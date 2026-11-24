import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Link as LinkIcon, Sparkles, Loader2, Gift, CheckCircle2, UserCheck, Search, X, Users, Edit3, Crown, Key, UserMinus, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatModals({
  showMediaModal, setShowMediaModal, mediaFiles, showLinksModal, setShowLinksModal, linkFiles,
  showWikiModal, setShowWikiModal, ownedCards, isLoadingCards, handleSendWikiCard,
  giftResult, setGiftResult, showRequestsModal, setShowRequestsModal, pendingRequests, handleRespondRequest,
  showAddFriendModal, setShowAddFriendModal, searchQuery, setSearchQuery, isSearching, searchResults, handleAddFriend,
  router, 
  showCreateGroupModal, setShowCreateGroupModal, friends, handleCreateGroup,
  showRenameGroupModal, setShowRenameGroupModal, handleRenameGroup, currentGroupName,
  showMembersModal, setShowMembersModal, groupMembers,
  currentUserId, activeFriend, handleRemoveMember, handleTransferLeadership,
  showAddMemberModal, setShowAddMemberModal, handleAddMemberToGroup
}: any) {

  const [groupNameInput, setGroupNameInput] = useState("");
  const [renameInput, setRenameInput] = useState(currentGroupName || "");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchFriendQuery, setSearchFriendQuery] = useState("");
  const [addMemberSearch, setAddMemberSearch] = useState(""); // 🚨 State tìm kiếm mới

  useEffect(() => {
    if (showRenameGroupModal) setRenameInput(currentGroupName || "");
    if (showAddMemberModal) setAddMemberSearch(""); // Reset thanh tìm kiếm khi mở
  }, [showRenameGroupModal, currentGroupName, showAddMemberModal]);

  const filteredFriends = friends?.filter((f: any) => f.name.toLowerCase().includes(searchFriendQuery.toLowerCase()));
  
  // 🚨 Bộ lọc cho Modal Thêm người
  const availableFriends = friends?.filter((f: any) => !groupMembers.some((m: any) => m.id === f.id));
  const filteredAddFriends = availableFriends?.filter((f: any) => f.name.toLowerCase().includes(addMemberSearch.toLowerCase()));

  return (
    <>
      {/* CÁC MODAL TẠO NHÓM VÀ ĐỔI TÊN */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Users className="w-5 h-5 text-blue-500"/> Tạo nhóm chat mới</h3>
              <button onClick={() => setShowCreateGroupModal(false)} className="text-slate-500 hover:text-red-500 font-semibold transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <input type="text" placeholder="Tên nhóm (Tùy chọn)..." value={groupNameInput} onChange={e => setGroupNameInput(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none text-slate-900 dark:text-white focus:border-blue-500 border border-transparent font-bold" />
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Tìm bạn bè..." value={searchFriendQuery} onChange={e => setSearchFriendQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-[#020617] pl-10 pr-4 py-2 rounded-xl outline-none text-sm border border-slate-200 dark:border-slate-700" />
              </div>
            </div>
            <div className="px-4 pb-4 max-h-[300px] overflow-y-auto space-y-2">
              {filteredFriends?.length > 0 ? filteredFriends.map((f: any) => (
                 <label key={f.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                    <input type="checkbox" checked={selectedFriends.includes(f.id)} onChange={(e) => {
                       if (e.target.checked) setSelectedFriends([...selectedFriends, f.id]);
                       else setSelectedFriends(selectedFriends.filter(id => id !== f.id));
                    }} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <img src={f.avatar || "https://i.pravatar.cc/150"} className="w-10 h-10 rounded-full border dark:border-slate-700 object-cover" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{f.name}</span>
                 </label>
              )) : <div className="text-center py-4 text-slate-400 text-sm">Không tìm thấy bạn bè nào.</div>}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]">
              <button disabled={selectedFriends.length === 0} onClick={() => {
                  handleCreateGroup(selectedFriends, groupNameInput);
                  setShowCreateGroupModal(false); setSelectedFriends([]); setGroupNameInput("");
              }} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors">
                  Tạo Nhóm ({selectedFriends.length} thành viên)
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-sm rounded-2xl shadow-2xl p-6">
             <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2"><Edit3 className="w-5 h-5 text-blue-500"/> Đổi tên nhóm</h3>
             <input autoFocus type="text" value={renameInput} onChange={e => setRenameInput(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none text-slate-900 dark:text-white mb-6 border border-slate-200 dark:border-slate-700" />
             <div className="flex gap-3">
                <button onClick={() => setShowRenameGroupModal(false)} className="flex-1 py-2.5 rounded-xl font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">Hủy</button>
                <button onClick={() => { handleRenameGroup(renameInput); setShowRenameGroupModal(false); }} className="flex-1 py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700">Lưu</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL THÀNH VIÊN VÀ MODAL THÊM THÀNH VIÊN MỚI */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Users className="w-5 h-5 text-blue-500"/> Thành viên ({groupMembers?.length})</h3>
              <div className="flex items-center gap-2">
                  {activeFriend?.leaderId === currentUserId && (
                      <button onClick={() => setShowAddMemberModal(true)} className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors" title="Thêm thành viên mới">
                          <UserPlus className="w-4 h-4"/>
                      </button>
                  )}
                  <button onClick={() => setShowMembersModal(false)} className="text-slate-500 hover:text-red-500 font-semibold transition-colors"><X className="w-5 h-5"/></button>
              </div>
            </div>
            <div className="p-2 max-h-[400px] overflow-y-auto">
               {groupMembers?.map((m: any) => {
                  const isLeader = activeFriend?.leaderId === m.id;
                  const isMe = currentUserId === m.id;
                  const amILeader = activeFriend?.leaderId === currentUserId;

                  return (
                     <div key={m.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => { setShowMembersModal(false); router.push(`/profile/${m.id}`); }}>
                           <img src={m.avatar || m.image || "https://i.pravatar.cc/150"} className="w-10 h-10 rounded-full border dark:border-slate-700 object-cover shrink-0" />
                           <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-[14px] text-slate-800 dark:text-slate-200 truncate flex items-center gap-2">
                                 {m.name} {isMe && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Bạn</span>}
                              </span>
                              {isLeader && <span className="text-[10px] text-yellow-600 dark:text-yellow-500 font-bold flex items-center gap-1 mt-0.5 uppercase tracking-wider"><Crown className="w-3 h-3"/> Trưởng nhóm</span>}
                           </div>
                        </div>
                        
                        {amILeader && !isMe && (
                           <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button onClick={() => handleTransferLeadership(m.id)} title="Trao quyền Trưởng nhóm" className="p-1.5 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 rounded-lg transition-colors"><Key className="w-4 h-4"/></button>
                              <button onClick={() => handleRemoveMember(m.id, m.name)} title="Xóa khỏi nhóm" className="p-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"><UserMinus className="w-4 h-4"/></button>
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
          </div>
        </div>
      )}

      {/* 🚨 MODAL THÊM THÀNH VIÊN ĐÃ ĐƯỢC CẬP NHẬT THANH TÌM KIẾM */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Thêm thành viên</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-500 hover:text-red-500 font-semibold transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            {/* Thanh tìm kiếm */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]">
               <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Tìm bạn bè..." value={addMemberSearch} onChange={e => setAddMemberSearch(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 pl-9 pr-4 py-2 rounded-xl outline-none text-sm text-slate-900 dark:text-white border border-transparent focus:border-blue-500" />
               </div>
            </div>

            <div className="p-2 max-h-[350px] overflow-y-auto space-y-1">
               {filteredAddFriends?.length > 0 ? 
                   filteredAddFriends.map((f: any) => (
                      <div key={f.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
                          <div className="flex items-center gap-3">
                             <img src={f.avatar || "https://i.pravatar.cc/150"} className="w-10 h-10 rounded-full object-cover border dark:border-slate-700" />
                             <span className="font-semibold text-slate-800 dark:text-slate-200">{f.name}</span>
                          </div>
                          <button onClick={() => handleAddMemberToGroup(f.id, f.name)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-transform">
                             Thêm
                          </button>
                      </div>
                   )) 
               : <div className="p-6 text-center text-slate-500 text-sm font-medium">{addMemberSearch ? "Không tìm thấy bạn bè nào" : "Tất cả bạn bè đã ở trong nhóm."}</div>}
            </div>
          </div>
        </div>
      )}

      {/* CÁC MODAL CÒN LẠI GIỮ NGUYÊN (Wiki, Files, Kết bạn, etc...) */}
      {showWikiModal && ( <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"> <div className="bg-white dark:bg-[#0f172a] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"> <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]"> <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500"/> Tặng Thẻ Wiki</h3> <button onClick={() => setShowWikiModal(false)} className="text-slate-500 hover:text-red-500 font-semibold transition-colors"><X className="w-5 h-5" /></button> </div> <div className="px-5 pt-4 pb-2 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/20 text-center"> <p className="text-[13px] font-bold text-purple-600 dark:text-purple-400">⚠️ Lưu ý quan trọng:</p> <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">Khi người nhận mở hộp quà, thẻ này sẽ <strong className="text-red-500">biến mất khỏi túi đồ</strong> của bạn.</p> </div> <div className="p-5 overflow-y-auto max-h-[50vh]"> {isLoadingCards ? ( <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div> ) : ownedCards.length > 0 ? ( <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"> {ownedCards.map((card: any, idx: number) => { const rarityColors: Record<string, string> = { N: "bg-slate-500", R: "bg-blue-500", SR: "bg-purple-500", SSR: "bg-yellow-500", UR: "bg-red-500", LR: "bg-cyan-500", MR: "bg-emerald-500" }; const badgeColor = rarityColors[card.rarity] || "bg-slate-500"; return ( <div key={`${card.id}-${idx}`} onClick={() => handleSendWikiCard(card)} className="relative group cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-purple-500 transition-colors shadow-sm"> <div className="aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden relative"> {card.imageUrl ? <img src={card.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">Wiki</div>} <div className={cn("absolute top-1.5 right-1.5 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm", badgeColor)}>{card.rarity}</div> </div> <div className="p-2 bg-white dark:bg-[#0f172a] text-center truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">{card.title}</div> <div className="absolute inset-0 bg-purple-600/90 text-white font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">Gửi Tặng</div> </div> ) })} </div> ) : ( <div className="text-center py-10 text-slate-500 font-medium">Bạn chưa sở hữu thẻ Wiki nào. Hãy vào Góc Gacha để thu thập nhé!</div> )} </div> </div> </div> )}
      {giftResult && ( <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"> <div className="animate-in zoom-in-50 duration-500 flex flex-col items-center w-full max-w-sm"> <Sparkles className="w-16 h-16 text-yellow-400 mb-8 animate-[spin_3s_linear_infinite]" /> <div className="w-[220px] md:w-[260px] rounded-2xl border-4 border-yellow-400 overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.6)] bg-slate-900 relative"> <div className="aspect-square bg-slate-800 relative"> {giftResult.card.imageUrl ? <img src={giftResult.card.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">Wiki</div>} <div className="absolute top-2 right-2 text-white text-xs font-black px-2 py-1 rounded-full shadow-sm bg-yellow-500 z-20">{giftResult.card.rarity}</div> </div> <div className="p-5 text-center bg-slate-900"> <p className="font-black text-xl text-white tracking-tight">{giftResult.card.title}</p> </div> </div> <p className="text-white font-black mt-8 text-xl text-center px-4"> {giftResult.stardust > 0 ? <span className="text-yellow-400">Trùng thẻ! Nhận được +{giftResult.stardust} Bụi Sao ✨</span> : <span className="text-emerald-400">Tuyệt vời! Bạn nhận được Thẻ mới! 🎉</span>} </p> <button onClick={() => setGiftResult(null)} className="mt-8 px-10 py-3.5 bg-white text-slate-900 hover:bg-slate-200 hover:scale-105 font-black rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"> Đóng </button> </div> </div> )}
      {showMediaModal && ( <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"> <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"> <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]"> <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-500"/> File phương tiện</h3> <button onClick={() => setShowMediaModal(false)} className="text-slate-500 hover:text-red-500 font-semibold transition-colors">Đóng</button> </div> <div className="p-5 overflow-y-auto max-h-[500px]"> {mediaFiles.length > 0 ? ( <div className="grid grid-cols-3 gap-2"> {mediaFiles.map((m: any) => <img key={m.id} src={m.fileUrl} className="w-full aspect-square object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(m.fileUrl, '_blank')} />)} </div> ) : <div className="text-center py-10 text-slate-400">Không có ảnh nào trong cuộc trò chuyện này.</div>} </div> </div> </div> )}
      {showLinksModal && ( <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"> <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"> <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]"> <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><LinkIcon className="w-5 h-5 text-blue-500"/> File đính kèm</h3> <button onClick={() => setShowLinksModal(false)} className="text-slate-500 hover:text-red-500 font-semibold transition-colors">Đóng</button> </div> <div className="p-5 flex flex-col gap-3 overflow-y-auto max-h-[500px]"> {linkFiles.length > 0 ? linkFiles.map((l: any, idx: number) => ( <a key={idx} href={l.url} target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-50 dark:bg-[#020617] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex flex-col"> <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm truncate">{l.url}</span> <span className="text-xs text-slate-400 mt-1">{new Date(l.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> </a> )) : <div className="text-center py-10 text-slate-400">Không có liên kết nào được chia sẻ.</div>} </div> </div> </div> )}
      {showRequestsModal && ( <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"> <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"> <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]"> <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><UserCheck className="w-5 h-5 text-blue-500"/> Lời mời kết bạn</h3> <button onClick={() => setShowRequestsModal(false)} className="text-slate-500 hover:text-red-500 font-semibold transition-colors">Đóng</button> </div> <div className="p-5 flex flex-col gap-3 min-h-[200px] max-h-[400px] overflow-y-auto"> {pendingRequests.length > 0 ? pendingRequests.map((req: any) => ( <div key={req.id} className="flex flex-row items-center gap-3 bg-slate-50 dark:bg-[#020617] p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-200 transition-colors"> <img src={req.avatar || "https://i.pravatar.cc/150"} className="w-14 h-14 rounded-full object-cover border dark:border-slate-700 cursor-pointer" onClick={() => { setShowRequestsModal(false); router.push(`/profile/${req.senderId}`); }} /> <div className="flex-1 min-w-0 cursor-pointer group" onClick={() => { setShowRequestsModal(false); router.push(`/profile/${req.senderId}`); }}> <p className="font-bold text-[15px] text-slate-800 dark:text-white truncate group-hover:text-blue-500">{req.name}</p> <p className="text-[12px] text-slate-500">Gửi lời mời kết bạn</p> </div> <div className="flex flex-col gap-1.5 shrink-0"> <button onClick={() => handleRespondRequest(req.id, true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all">Xác nhận</button> <button onClick={() => handleRespondRequest(req.id, false)} className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all">Xóa</button> </div> </div> )) : <div className="text-center py-6 text-slate-500 font-medium my-auto">Không có lời mời nào.</div>} </div> </div> </div> )}
      {showAddFriendModal && ( <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"> <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"> <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]"> <h3 className="font-bold text-lg text-slate-800 dark:text-white">Thêm bạn bè mới</h3> <button onClick={() => setShowAddFriendModal(false)} className="text-slate-500 hover:text-red-500 font-semibold transition-colors">Đóng</button> </div> <div className="p-5"> <div className="relative"> <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /> <input type="text" placeholder="Nhập tên hoặc ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 pl-10 pr-4 py-3 rounded-xl outline-none text-slate-900 dark:text-white border border-transparent focus:border-blue-500/50" /> </div> </div> <div className="p-5 pt-0 flex flex-col gap-3 min-h-[250px] max-h-[400px] overflow-y-auto"> <p className="text-sm font-semibold text-slate-500">Kết quả tìm kiếm:</p> {isSearching ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : searchResults.length > 0 ? searchResults.map((user: any) => ( <div key={user.id} className="flex flex-row items-center gap-3 bg-slate-50 dark:bg-[#020617] p-3 rounded-xl border border-slate-200 dark:border-slate-800"> <img src={user.displayAvatar || "https://i.pravatar.cc/150"} className="w-12 h-12 rounded-full object-cover border dark:border-slate-700 cursor-pointer" onClick={() => { setShowAddFriendModal(false); router.push(`/profile/${user.id}`); }} /> <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setShowAddFriendModal(false); router.push(`/profile/${user.id}`); }}> <p className="font-bold text-[15px] text-slate-800 dark:text-white truncate">{user.name}</p> <p className="text-[11px] text-slate-500 truncate">ID: {user.id.substring(0,8)}...</p> </div> {user.friendshipStatus === "ACCEPTED" || user.friendshipStatus === "BLOCKED" ? ( <button disabled className="bg-slate-200 dark:bg-slate-800 text-slate-500 px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Bạn bè</button> ) : user.friendshipStatus === "PENDING" ? ( user.isSender ? <button disabled className="bg-orange-100 text-orange-600 px-3 py-2 rounded-lg text-[11px] font-bold shrink-0">Đã gửi lời mời</button> : <button onClick={() => { setShowAddFriendModal(false); setShowRequestsModal(true); }} className="bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-[11px] font-bold shrink-0">Có lời mời</button> ) : ( <button onClick={() => handleAddFriend(user.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shrink-0">Kết bạn</button> )} </div> )) : <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800"> <p className="text-sm text-slate-400 font-medium">{searchQuery ? "Không tìm thấy ai." : "Nhập ID hoặc tên để tìm kiếm..."}</p> </div>} </div> </div> </div> )}
    </>
  );
}