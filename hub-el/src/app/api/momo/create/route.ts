import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const { type, amount, name } = await req.json();

    // 1. Tạo Order ID
    const orderId = `HUBEL_${Date.now()}_${session.user.id.slice(-4)}`;
    const numAmount = String(amount); // Chuyển thành chuỗi theo đúng format của GitHub
    
    // 2. Lưu vào DB
    await prisma.order.create({
      data: {
        orderCode: orderId,
        userId: session.user.id,
        amount: Number(amount),
        type: type,
        status: 'PENDING'
      }
    });

    // 3. DÙNG BỘ KEY TỪ FILE GITHUB BẠN TÌM ĐƯỢC
    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    
    const domain = "http://localhost:3000";
    const redirectUrl = `${domain}/store?status=success`;
    const ipnUrl = `${domain}/api/momo/callback`; 
    const requestType = "payWithMethod";
    const extraData = ""; 
    const orderInfo = "pay with MoMo"; // Lấy đúng chuỗi orderInfo của GitHub để không bị lệch chữ ký
    
    // 4. Băm chữ ký (Y hệt file GitHub)
    const rawSignature = "accessKey=" + accessKey + "&amount=" + numAmount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + orderId + "&requestType=" + requestType;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    // 5. Gửi request sang MoMo
    const requestBody = {
      partnerCode: partnerCode,
      accessKey: accessKey,
      requestId: orderId,
      amount: numAmount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      extraData: extraData,
      requestType: requestType,
      signature: signature,
      lang: 'vi'
    };

    const result = await fetch("https://test-payment.momo.vn/v2/gateway/api/create", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const momoRes = await result.json();
    
    if (momoRes.resultCode === 0) {
      return NextResponse.json({ payUrl: momoRes.payUrl });
    } else {
      console.log("LỖI TỪ MOMO:", momoRes); 
      throw new Error(momoRes.message || "Lỗi tạo thanh toán MoMo");
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}