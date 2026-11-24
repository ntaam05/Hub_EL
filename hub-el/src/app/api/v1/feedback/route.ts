// src/app/api/v1/feedback/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { submitFeedbackService } from "@/services/settings.service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { content } = body;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { fullName: true, name: true },
    });

    const userName = user?.fullName || user?.name || "Người dùng Hub-EL";
    const res = await submitFeedbackService(auth.userId, userName, content);

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi gửi đóng góp ý kiến." },
      { status: 500 }
    );
  }
}

