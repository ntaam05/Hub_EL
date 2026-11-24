// src/app/api/v1/settings/security/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getSecurityInfoService } from "@/services/settings.service";

export async function GET(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const res = await getSecurityInfoService(auth.userId);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi thông tin bảo mật." },
      { status: 500 }
    );
  }
}

