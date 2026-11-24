// src/app/api/v1/settings/privacy/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import {
  getPrivacySettingsService,
  updatePrivacySettingsService,
} from "@/services/settings.service";

export async function GET(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const res = await getPrivacySettingsService(auth.userId);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tải quyền riêng tư." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const res = await updatePrivacySettingsService(auth.userId, body);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi cập nhật quyền riêng tư." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  return PATCH(req);
}

