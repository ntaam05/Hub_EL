// src/app/api/v1/store/exchange/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { exchangeResourcesService } from "@/services/store.service";

export async function POST(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json(
        { success: false, error: "Vui lòng chọn loại giao dịch (type)." },
        { status: 400 }
      );
    }

    const res = await exchangeResourcesService(auth.userId, type);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ khi đổi tài nguyên." },
      { status: 500 }
    );
  }
}

