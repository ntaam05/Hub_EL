// src/app/api/v1/settings/interests/route.ts
import { NextResponse } from "next/server";
import { getInterestTagsService } from "@/services/settings.service";

export async function GET() {
  try {
    const res = await getInterestTagsService();
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: res.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi lấy danh mục sở thích." },
      { status: 500 }
    );
  }
}

