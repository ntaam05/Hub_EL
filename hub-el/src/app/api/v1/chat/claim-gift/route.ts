import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { claimWikiGiftService } from "@/services/chat.service";

export async function POST(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "Thiếu messageId trong body" },
        { status: 400 }
      );
    }

    const result = await claimWikiGiftService(parseInt(messageId.toString()), auth.userId);
    return NextResponse.json(result, {
      status: result.statusCode || (result.success ? 200 : 400),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Dữ liệu JSON không hợp lệ" },
      { status: 400 }
    );
  }
}

