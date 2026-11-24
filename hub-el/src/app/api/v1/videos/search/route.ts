import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { searchAdvancedAction, validateSearchQueryAction } from "@/actions/video/video";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Thiếu Bearer Token trong Authorization Header!",
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: err.message === "TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
            message: err.message === "TOKEN_EXPIRED" ? "Phiên đăng nhập đã hết hạn!" : "Token xác thực không hợp lệ!",
          },
        },
        { status: 401 }
      );
    }

    const userId = decoded.id;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const pageToken = searchParams.get("pageToken") || undefined;

    if (!query.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMPTY_QUERY",
            message: "Từ khóa tìm kiếm không được để trống!",
          },
        },
        { status: 400 }
      );
    }

    // 1. Kiểm tra từ khóa hợp lệ
    const checkRes = await validateSearchQueryAction(query, userId);
    if (!checkRes.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SEARCH_QUERY",
            message: checkRes.reason || "Từ khóa tìm kiếm không hợp lệ hoặc không thuộc nội dung giáo dục!",
          },
        },
        { status: 400 }
      );
    }

    // 2. Tìm kiếm nâng cao YouTube
    const searchRes = await searchAdvancedAction(
      { keyword: query, minViews: 0, minLikes: 0, duration: "all" },
      pageToken
    );

    if (!searchRes.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SEARCH_FAILED",
            message: searchRes.error || "Tìm kiếm video YouTube thất bại.",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: searchRes.data,
    });
  } catch (error: any) {
    console.error("API /api/v1/videos/search Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi tìm kiếm video.",
        },
      },
      { status: 500 }
    );
  }
}

