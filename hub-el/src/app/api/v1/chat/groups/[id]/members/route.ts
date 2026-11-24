import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getGroupMembersService, addMemberToGroupService } from "@/services/chat.service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;
  const groupId = parseInt(id);
  if (isNaN(groupId)) {
    return NextResponse.json({ success: false, error: "ID nhóm không hợp lệ" }, { status: 400 });
  }

  const result = await getGroupMembersService(groupId, auth.userId);
  return NextResponse.json(result, { status: result.statusCode || (result.success ? 200 : 400) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateApiRequest(req);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;
  const groupId = parseInt(id);
  if (isNaN(groupId)) {
    return NextResponse.json({ success: false, error: "ID nhóm không hợp lệ" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { targetUserId } = body;
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Thiếu targetUserId" }, { status: 400 });
    }

    const result = await addMemberToGroupService(groupId, targetUserId, auth.userId);
    return NextResponse.json(result, { status: result.statusCode || (result.success ? 200 : 400) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Dữ liệu JSON không hợp lệ" }, { status: 400 });
  }
}

