import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { claimDailyTaskRewardAction } from "@/actions/user/learning";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const progressId = Number(resolvedParams.id);
    if (isNaN(progressId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "ID nhiệm vụ không hợp lệ!",
          },
        },
        { status: 400 }
      );
    }

    const res = await claimDailyTaskRewardAction(decoded.id, progressId);
    if (!res.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CLAIM_FAILED",
            message: res.error || "Không thể nhận thưởng nhiệm vụ.",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        xpDelta: res.xpDelta,
        coinsDelta: res.coinsDelta,
      },
    });
  } catch (error: any) {
    console.error("API /api/v1/dashboard/tasks/[id]/claim Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Lỗi máy chủ khi nhận thưởng nhiệm vụ.",
        },
      },
      { status: 500 }
    );
  }
}

