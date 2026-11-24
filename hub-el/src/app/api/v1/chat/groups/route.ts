import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getChatGroupsService, createChatGroupService } from "@/services/chat.service";

export async function GET(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  const result = await getChatGroupsService(auth.userId);
  return NextResponse.json(result, {
    status: result.statusCode || (result.success ? 200 : 400),
  });
}

export async function POST(req: Request) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { name, memberIds } = body;

    const result = await createChatGroupService(
      auth.userId,
      Array.isArray(memberIds) ? memberIds : [],
      name || ""
    );

    return NextResponse.json(result, {
      status: result.statusCode || (result.success ? 201 : 400),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Dữ liệu JSON không hợp lệ" },
      { status: 400 }
    );
  }
}

