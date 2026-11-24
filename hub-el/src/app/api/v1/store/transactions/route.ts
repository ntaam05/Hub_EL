// src/app/api/v1/store/transactions/route.ts
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getUserTransactionsService } from "@/services/store.service";

export async function GET(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    const res = await getUserTransactionsService(auth.userId, limit);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi tải lịch sử giao dịch." },
      { status: 500 }
    );
  }
}

