import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const getJwtSecret = () => process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "hub-el-secret-key-mobile-jwt-2026";

const prisma = new PrismaClient();

// Khởi tạo Next.js App
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  // Tạo HTTP Server bọc Next.js (tăng maxHeaderSize tránh lỗi HTTP 431 khi cookie session chứa dữ liệu lớn)
  const httpServer = createServer({ maxHeaderSize: 131072 }, handler);

  // Khởi tạo Socket.io dùng chung cổng với Next.js
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Gán vào global để các services có thể tương tác khi cần (e.g. kick room member)
  global.__socketIo = io;

  // Socket Middleware: Xác thực bắt buộc qua JWT hoặc NextAuth Session Cookie
  io.use(async (socket, nextMiddleware) => {
    try {
      const secret = getJwtSecret();

      // 1. Kiểm tra Bearer Token trong handshake (Dành cho Flutter Mobile & API Clients)
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (rawToken) {
        const token = rawToken.startsWith("Bearer ")
          ? rawToken.substring(7).trim()
          : rawToken.trim();

        try {
          const decoded = jwt.verify(token, secret);
          if (decoded && decoded.id) {
            socket.authenticatedUserId = decoded.id;
            socket.userPayload = decoded;
            return nextMiddleware();
          } else {
            return nextMiddleware(new Error("AUTHENTICATION_FAILED: Token không chứa định danh người dùng hợp lệ"));
          }
        } catch (jwtErr) {
          if (jwtErr.name === "TokenExpiredError") {
            return nextMiddleware(new Error("TOKEN_EXPIRED: Phiên đăng nhập đã hết hạn"));
          }
          return nextMiddleware(new Error("INVALID_TOKEN: Chữ ký token không hợp lệ"));
        }
      }

      // 2. Kiểm tra NextAuth Session Cookie (Dành cho Web Client trên cùng origin)
      if (socket.handshake.headers?.cookie) {
        try {
          const sessionToken = await getToken({
            req: { headers: socket.handshake.headers },
            secret: secret,
          });

          if (sessionToken && sessionToken.id) {
            socket.authenticatedUserId = sessionToken.id;
            socket.userPayload = sessionToken;
            return nextMiddleware();
          }
        } catch (cookieErr) {
          // Cookie verification failed
        }
      }

      // 3. Không có JWT và không có session cookie hợp lệ -> Từ chối kết nối
      return nextMiddleware(new Error("UNAUTHORIZED: Yêu cầu xác thực tài khoản"));
    } catch (err) {
      return nextMiddleware(new Error("AUTHENTICATION_ERROR: " + err.message));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.authenticatedUserId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    console.log(`🟢 [Socket.IO] Kết nối thành công: ${socket.id} (User: ${userId})`);

    // Tự động gia nhập phòng cá nhân của chính user đã xác thực
    socket.join(userId);

    // Lưu các phòng đang gõ phím để dọn dẹp khi disconnect hoặc leave_room
    const activeTypingRooms = new Set();

    // 1. Gia nhập phòng (Personal Room hoặc Group Room)
    socket.on("join_room", async (roomName) => {
      if (!roomName) return;

      if (roomName.startsWith("group_")) {
        const groupId = parseInt(roomName.replace("group_", ""));
        if (isNaN(groupId)) {
          socket.emit("error", { code: "INVALID_GROUP", message: "ID nhóm không hợp lệ" });
          return;
        }

        try {
          const member = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
          });

          if (!member) {
            console.warn(`🚫 [BẢO MẬT] User ${userId} KHÔNG phải thành viên nhóm ${groupId}. Từ chối join room!`);
            socket.emit("error", { code: "FORBIDDEN", message: "Bạn không phải thành viên của nhóm này" });
            return;
          }

          socket.join(roomName);
          console.log(`👥 [Socket.IO] User ${userId} đã tham gia nhóm: ${roomName}`);
        } catch (err) {
          console.error("Lỗi xác minh thành viên nhóm:", err);
        }
      } else {
        // Phòng cá nhân: Nghiêm cấm gia nhập phòng của người dùng khác
        if (roomName !== userId) {
          console.warn(`🚫 [BẢO MẬT] User ${userId} cố tình join phòng của ${roomName}. Bị từ chối!`);
          socket.emit("error", { code: "FORBIDDEN", message: "Bạn không thể tham gia phòng của người khác" });
          return;
        }
        socket.join(roomName);
      }
    });

    // 2. Rời phòng
    socket.on("leave_room", (roomName) => {
      if (roomName) {
        if (activeTypingRooms.has(roomName)) {
          activeTypingRooms.delete(roomName);
          socket.to(roomName).emit("user_stop_typing", {
            receiverId: roomName,
            senderId: userId,
          });
        }
        socket.leave(roomName);
        console.log(`🚪 [Socket.IO] User ${userId} đã rời phòng: ${roomName}`);
      }
    });

    // 3. Gửi tin nhắn và chuyển tiếp an toàn
    socket.on("send_message", async (data) => {
      if (!data || !data.receiverId) return;

      const receiverId = data.receiverId;

      try {
        if (receiverId.startsWith("group_")) {
          const groupId = parseInt(receiverId.replace("group_", ""));
          if (isNaN(groupId)) return;

          const member = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
          });

          if (!member) {
            console.warn(`🚫 [BẢO MẬT] User ${userId} cố gửi tin nhắn vào nhóm ${groupId} khi không phải thành viên!`);
            socket.emit("error", { code: "FORBIDDEN", message: "Bạn không có quyền gửi tin nhắn vào nhóm này" });
            return;
          }
        } else {
          // Chat 1-1: Kiểm tra xem có bị chặn không
          const blocked = await prisma.friendship.findFirst({
            where: {
              status: "BLOCKED",
              OR: [
                { userId1: userId, userId2: receiverId },
                { userId1: receiverId, userId2: userId },
              ],
            },
          });

          if (blocked) {
            console.warn(`🚫 [BẢO MẬT] User ${userId} bị chặn chat với ${receiverId}`);
            socket.emit("error", { code: "FORBIDDEN", message: "Không thể gửi tin nhắn do quan hệ bị chặn" });
            return;
          }
        }

        // Bắt buộc senderId là userId đã xác thực từ JWT/Session (chống giả mạo người gửi)
        const sanitizedMessage = {
          ...(data.message || {}),
          senderId: userId,
        };

        io.to(receiverId).emit("receive_message", sanitizedMessage);
      } catch (err) {
        console.error("Lỗi khi xử lý send_message:", err);
      }
    });

    // 4. Typing indicator: Bắt đầu soạn tin
    socket.on("typing_start", async (data) => {
      if (!data || !data.receiverId) return;
      const receiverId = data.receiverId;

      try {
        if (receiverId.startsWith("group_")) {
          const groupId = parseInt(receiverId.replace("group_", ""));
          if (isNaN(groupId)) return;
          const member = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
          });
          if (!member) return;
        }

        activeTypingRooms.add(receiverId);

        // Buộc senderId lấy từ danh tính xác thực
        socket.to(receiverId).emit("user_typing", {
          receiverId,
          senderId: userId,
          senderName: socket.userPayload?.name || undefined,
        });
      } catch (err) {
        console.error("Lỗi khi xử lý typing_start:", err);
      }
    });

    // 5. Typing indicator: Dừng soạn tin
    socket.on("typing_stop", (data) => {
      if (!data || !data.receiverId) return;
      const receiverId = data.receiverId;
      activeTypingRooms.delete(receiverId);

      socket.to(receiverId).emit("user_stop_typing", {
        receiverId,
        senderId: userId,
      });
    });

    // 6. Lời mời kết bạn (gán danh tính xác thực)
    socket.on("send_friend_request", (data) => {
      if (data && data.receiverId) {
        io.to(data.receiverId).emit("receive_friend_request", {
          ...data,
          senderId: userId,
        });
      }
    });

    socket.on("accept_friend_request", (data) => {
      if (data && data.receiverId) {
        io.to(data.receiverId).emit("friend_request_accepted", {
          ...data,
          senderId: userId,
        });
      }
    });

    // 7. Disconnect: Tự động dọn dẹp typing indicator trong tất cả các phòng
    socket.on("disconnect", () => {
      for (const room of activeTypingRooms) {
        socket.to(room).emit("user_stop_typing", {
          receiverId: room,
          senderId: userId,
        });
      }
      activeTypingRooms.clear();
      console.log(`🔴 [Socket.IO] Ngắt kết nối: ${socket.id} (User: ${userId})`);
    });
  });

  // Bắt đầu lắng nghe trên cổng 3000
  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, "0.0.0.0", () => {
      console.log(`> Sẵn sàng! Hub-EL đang chạy trên http://${hostname}:${port} (0.0.0.0:${port})`);
    });
});
