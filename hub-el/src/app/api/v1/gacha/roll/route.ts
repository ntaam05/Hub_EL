import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { rollGachaService } from "@/services/gacha.service";

export async function POST(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    const count = body.count !== undefined ? Number(body.count) : 1;

    if (!Number.isInteger(count) || count < 1 || count > 5) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_COUNT",
            message: "Số lượt quay phải là số nguyên từ 1 đến 5.",
          },
        },
        { status: 400 }
      );
    }

    const result = await rollGachaService(userId, count);

    if (!result.success || !result.data) {
      let statusCode = 400;
      if (result.code === "USER_NOT_FOUND") statusCode = 404;
      else if (result.code === "INSUFFICIENT_COINS") statusCode = 400;
      else if (result.code === "INVALID_COUNT") statusCode = 400;
      else if (result.code === "SYSTEM_ERROR") statusCode = 500;

      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.code || "GACHA_ROLL_FAILED",
            message: result.message || "Quay Gacha thất bại.",
          },
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Lỗi API POST /api/v1/gacha/roll:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi máy chủ nội bộ khi thực hiện quay Gacha.",
        },
      },
      { status: 500 }
    );
  }
}

