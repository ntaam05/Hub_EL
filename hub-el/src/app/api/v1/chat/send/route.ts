import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { sendMessageService } from "@/services/chat.service";

export async function POST(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { receiverId, groupId, content, messageType, fileUrl, isGiftCard } = body;

    const result = await sendMessageService(
      auth.userId,
      receiverId || null,
      content || "",
      messageType || "TEXT",
      fileUrl,
      isGiftCard || false,
      groupId ? parseInt(groupId.toString()) : undefined
    );

    return NextResponse.json(result, {
      status: result.statusCode || (result.success ? 201 : 400),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Dữ liệu JSON không hợp lệ" },
      { status: 400 }
    );
  }
}

