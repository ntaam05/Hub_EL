// src/app/api/v1/settings/avatar/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { updateAvatarService } from "@/services/settings.service";

export async function POST(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Thiếu dữ liệu ảnh đại diện (image)." },
        { status: 400 }
      );
    }

    const res = await updateAvatarService(auth.userId, image);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi cập nhật ảnh đại diện." },
      { status: 500 }
    );
  }
}

