import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tăng giới hạn payload (tùy chọn trong Next.js 13+, thường không cần thiết nhưng cứ để cho an toàn)
export const maxDuration = 60; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, receiverId, fileUrl } = body;

    if (!senderId || !receiverId || !fileUrl) {
      return NextResponse.json({ success: false, error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    // Kiểm tra kích thước chuỗi base64 (chặn nếu quá 5MB ~ 6.5 triệu ký tự base64)
    if (fileUrl.length > 7000000) {
        return NextResponse.json({ success: false, error: "Ảnh quá lớn, tối đa 5MB" }, { status: 413 });
    }

    // Lưu thẳng vào Database (Prisma xử lý chuỗi dài trong cột Text/LongText rất tốt)
    const newMessage = await prisma.chatMessage.create({
      data: { 
          senderId, 
          receiverId, 
          content: "Đã gửi một ảnh đính kèm", 
          messageType: "IMAGE", 
          fileUrl, 
          createdAt: new Date() 
      }
    });

    return NextResponse.json({ success: true, data: newMessage });
  } catch (error: any) {
    console.error("LỖI UPLOAD ẢNH:", error);
    return NextResponse.json({ success: false, error: "Lỗi hệ thống khi lưu ảnh" }, { status: 500 });
  }
}