import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { searchUsersService } from "@/services/friends.service";

export async function GET(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  const url = new URL(req.url);
  const query = url.searchParams.get("q") || url.searchParams.get("query") || "";

  try {
    const result = await searchUsersService(query, userId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SEARCH_ERROR",
            message: result.error || "Lỗi khi tìm kiếm người dùng.",
          },
        },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    });
  } catch (err: any) {
    console.error("[API v1] GET /api/v1/friends/search error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi hệ thống khi tìm kiếm người dùng.",
        },
      },
      { status: 500 }
    );
  }
}
