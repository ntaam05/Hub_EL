import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getGachaExchangeService, exchangeGachaCardService } from "@/services/gacha.service";

export async function GET(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    const result = await getGachaExchangeService(userId);
    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EXCHANGE_FETCH_FAILED",
            message: result.message || "Không thể lấy dữ liệu tiệm đổi thẻ.",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Lỗi API GET /api/v1/gacha/exchange:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi máy chủ nội bộ khi lấy dữ liệu tiệm đổi thẻ.",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;
  const userId = auth.userId;

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_BODY",
            message: "Dữ liệu JSON không hợp lệ.",
          },
        },
        { status: 400 }
      );
    }

    const cardId = Number(body.cardId);
    if (!cardId || isNaN(cardId) || cardId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CARD_ID",
            message: "cardId phải là số nguyên dương hợp lệ.",
          },
        },
        { status: 400 }
      );
    }

    const result = await exchangeGachaCardService(userId, cardId);

    if (!result.success || !result.data) {
      let statusCode = 400;
      if (result.code === "CARD_NOT_FOUND" || result.code === "USER_NOT_FOUND") statusCode = 404;
      else if (result.code === "INSUFFICIENT_STARDUST") statusCode = 400;
      else if (result.code === "ALREADY_OWNED") statusCode = 409;
      else if (result.code === "SYSTEM_ERROR") statusCode = 500;

      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.code || "EXCHANGE_FAILED",
            message: result.message || "Đổi thẻ thất bại.",
          },
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Lỗi API POST /api/v1/gacha/exchange:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Lỗi máy chủ nội bộ khi thực hiện đổi thẻ.",
        },
      },
      { status: 500 }
    );
  }
}

