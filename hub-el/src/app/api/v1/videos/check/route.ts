import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { checkEducationalVideoAction } from "@/actions/video/video";

export async function POST(req: Request) {
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
    const body = await req.json();
    let { url, videoId, title, channelTitle } = body;

    // Trích xuất videoId từ URL nếu có
    if (url && !videoId) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      videoId = match && match[2].length === 11 ? match[2] : null;
    }

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_YOUTUBE_URL",
            message: "Link YouTube không hợp lệ hoặc không tìm thấy Video ID!",
          },
        },
        { status: 400 }
      );
    }

    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // Nếu chưa có title hoặc channelTitle, lấy qua OEmbed của YouTube
    if (!title || !channelTitle) {
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
          { cache: "no-store" }
        );
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          title = title || oembedData.title || "Video không xác định";
          channelTitle = channelTitle || oembedData.author_name || "Kênh ẩn danh";
          if (oembedData.thumbnail_url) {
            thumbnailUrl = oembedData.thumbnail_url;
          }
        }
      } catch (e) {
        console.warn("Lỗi fetch OEmbed YouTube:", e);
      }
    }

    title = title || "Video Bài Giảng";
    channelTitle = channelTitle || "Kênh Ẩn Danh";

    // Kiểm tra tính giáo dục và kiểm duyệt
    const checkRes = await checkEducationalVideoAction(title, channelTitle, videoId, userId);
    if (checkRes.success && checkRes.isEducational === false) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NON_EDUCATIONAL_VIDEO",
            message: checkRes.reason || "Video không phù hợp với tiêu chuẩn giáo dục của Hub-EL.",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        title,
        channelTitle,
        thumbnailUrl,
      },
    });
  } catch (error: any) {
    console.error("API /api/v1/videos/check Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi kiểm tra video.",
        },
      },
      { status: 500 }
    );
  }
}

