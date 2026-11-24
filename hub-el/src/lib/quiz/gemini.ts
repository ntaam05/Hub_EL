export async function generateQuizService(context: string, count: number, difficulty: string) {
  const apiKeys = (process.env.GEMINI_API_KEYS || "")
    .split(",")
    .map(key => key.trim())
    .filter(key => key.length > 0);

  const apiUrl = process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  const maxRetries = apiKeys.length > 0 ? apiKeys.length : 1; 
  let attempt = 0;

  // THIẾT KẾ PROMPT TỔNG LỰC: PHÂN LOẠI VÀ ÁP DẠNG BÀI TẬP ĐẶC THÙ
  const prompt = `Bạn là một Chuyên gia ra đề thi chuyên nghiệp. 
Dựa vào nội dung bài học sau: [${context}]

🎯 NHIỆM VỤ: 
Tạo đúng ${count} câu hỏi trắc nghiệm. Bạn được phép sáng tạo tình huống/ví dụ mới nhưng PHẢI bám sát chủ đề và kiến thức trong video.

🛑 QUY TẮC RIÊNG CHO TỪNG MÔN HỌC:

1. NẾU LÀ NGOẠI NGỮ (Anh, Trung, Hàn, Nhật...):
   - Dạng câu hỏi: 
     + Dịch nghĩa: Hỏi nghĩa của từ/cụm từ.
     + Dịch câu: Chọn bản dịch đúng cho một câu.
     + Điền từ: Cho 1 câu ngoại ngữ bị trống một chỗ và bắt chọn từ đúng để hoàn thành (BẮT BUỘC dùng ngoại ngữ đó trong câu hỏi).
     + Tìm từ sai: Chọn từ bị dùng sai ngữ pháp hoặc ngữ cảnh.
   - Yêu cầu: Không đục lỗ câu tiếng Việt.

2. NẾU LÀ IT / LẬP TRÌNH:
   - Dạng câu hỏi:
     + Tìm lỗi sai: Đưa ra đoạn code có lỗi và hỏi lỗi ở đâu.
     + Điền code còn thiếu: Cho đoạn code bị khuyết và bắt chọn phần bù vào.
     + Đoán Output: Đoạn code này in ra kết quả gì?
     + Chọn đoạn code sai: Trong các đáp án, đoạn code nào bị lỗi cú pháp?
   - Yêu cầu: Bắt buộc dùng \\n để xuống dòng khi viết code trong questionText.

3. NẾU LÀ CÁC MÔN KHÁC (Toán, Lý, Lịch sử...):
   - Hỏi về khái niệm, công thức, nguyên nhân, hệ quả hoặc bài tập áp dụng tương tự bài học.

🚫 CẤM TUYỆT ĐỐI:
- Không hỏi về link, website, quảng cáo, tên kênh, hoặc các thông tin ngoài lề không thuộc kiến thức chuyên môn.

========================================
📤 OUTPUT FORMAT (JSON ONLY):
- Chỉ trả về duy nhất một mảng JSON.
- Toàn bộ câu hỏi, đáp án, giải thích viết bằng TIẾNG VIỆT (trừ các thuật ngữ/câu ngoại ngữ hoặc code).

[
  {
    "questionText": "Nội dung câu hỏi...",
    "optionA": "Đáp án A",
    "optionB": "Đáp án B",
    "optionC": "Đáp án C",
    "optionD": "Đáp án D",
    "correctAnswer": "A",
    "explanation": "Giải thích chi tiết tại sao đúng."
  }
]`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: "application/json" }
  };

  while (attempt < maxRetries) {
    try {
      const currentKey = apiKeys[attempt % apiKeys.length]?.trim();
      if (!currentKey) throw new Error("Key không hợp lệ");

      const fullUrl = `${apiUrl}?key=${currentKey}`;
      console.log(`🤖 Đang tạo ${count} câu hỏi (Key ${attempt + 1})...`);

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Lỗi API");

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        let aiResponseText = data.candidates[0].content.parts[0].text;
        aiResponseText = aiResponseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(aiResponseText);
      }
      throw new Error("Dữ liệu trống");

    } catch (e: any) {
      attempt++; 
      console.error(`⚠️ Thử lại lần ${attempt}: ${e.message}`);
      if (attempt >= maxRetries) throw new Error("AI đang quá tải, hãy thử lại sau!");
    }
  }
  throw new Error("Lỗi không xác định");
}