import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getUserFullStats } from "@/actions/stats";

export async function GET(req: Request) {
  try {
    const auth = authenticateApiRequest(req);
    if (auth.errorResponse) return auth.errorResponse;

    const res = await getUserFullStats(auth.userId);
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.message || "Không thể tải dữ liệu thống kê." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: res.data,
    });
  } catch (error: any) {
    console.error("API /api/v1/stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ." },
      { status: 500 }
    );
  }
}

