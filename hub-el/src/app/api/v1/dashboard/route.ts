import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { getDashboardDataAction } from "@/actions/user/learning";
import { getRecommendedDashboardVideosAction } from "@/actions/video/video";
import { getFavoriteVideosAction } from "@/actions/video/favorite";

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

    // Lấy song song dữ liệu Dashboard, Video Đề Xuất và Video Yêu Thích
    const [dashboardRes, recommendedRes, favoriteRes] = await Promise.all([
      getDashboardDataAction(userId),
      getRecommendedDashboardVideosAction(userId),
      getFavoriteVideosAction(userId),
    ]);

    if (!dashboardRes.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DASHBOARD_DATA_ERROR",
            message: dashboardRes.error || "Không thể tải dữ liệu Dashboard.",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...dashboardRes.data,
        recommendedVideos: recommendedRes.success ? recommendedRes.data : [],
        favoriteVideos: favoriteRes.success ? favoriteRes.data : [],
      },
    });
  } catch (error: any) {
    console.error("API /api/v1/dashboard Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi lấy dữ liệu Dashboard.",
        },
      },
      { status: 500 }
    );
  }
}

