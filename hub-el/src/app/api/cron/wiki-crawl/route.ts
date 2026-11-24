import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

const WIKI_RANDOM_API = "https://en.wikipedia.org/w/api.php?format=json&action=query&generator=random&grnnamespace=0&grnlimit=20&prop=extracts|pageimages|info&piprop=thumbnail&pithumbsize=800&exintro=true&explaintext=true";

export async function GET(request: Request) {
  const TARGET_TOTAL_CARDS = 20; 
  const MAX_LOOPS = 10; // Tăng số vòng lặp vì điều kiện lọc ảnh sẽ làm tỉ lệ bỏ qua bài cao hơn
  
  try {
    let successCount = 0;
    let skippedCount = 0;
    let loopCount = 0;
    const resultsSummary: string[] = [];

    while (successCount < TARGET_TOTAL_CARDS && loopCount < MAX_LOOPS) {
      loopCount++;
      
      const response = await fetch(WIKI_RANDOM_API, {
        headers: {
          "User-Agent": "WikiGacha_Project/1.0 (Learning; auto-crawling student project)"
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error("⛔ Wikipedia Blocked IP (429).");
          resultsSummary.push("🚨 NGẮT: Bị chặn IP (429).");
          break;
        }
        break; 
      }

      const data = await response.json();
      const pages = data?.query?.pages;

      if (!pages) continue;

      for (const pageId in pages) {
        if (successCount >= TARGET_TOTAL_CARDS) break; 

        const article = pages[pageId];
        const title = article.title;
        const introText = article.extract as string; 
        const totalCharCount = article.length || 0; 
        const imageUrl = article.thumbnail ? article.thumbnail.source : null;

        // 1. ĐIỀU KIỆN BẮT BUỘC: PHẢI CÓ ẢNH VÀ NỘI DUNG KHÔNG ĐƯỢC QUÁ NGẮN
        if (!imageUrl || !introText || introText.trim() === "" || totalCharCount < 1000) {
          skippedCount++;
          continue;
        }

        // 2. Tính toán độ hiếm dựa trên TỔNG SỐ CHỮ THỰC TẾ
        let rarity = "N";
        let stars = 1;

        if (totalCharCount >= 75000)      { rarity = "MR";  stars = 7; } // Thần thoại Tối cao
        else if (totalCharCount >= 50000) { rarity = "LR";  stars = 6; } // Truyền thuyết
        else if (totalCharCount >= 30000) { rarity = "UR";  stars = 5; } // Tối thượng
        else if (totalCharCount >= 15000) { rarity = "SSR"; stars = 4; } // Cực kỳ hiếm
        else if (totalCharCount >= 8000)  { rarity = "SR";  stars = 3; } // Siêu hiếm
        else if (totalCharCount >= 3000)  { rarity = "R";   stars = 2; } // Hiếm
        else                              { rarity = "N";   stars = 1; } // Thường 

        // // 3. Chia đoạn Intro để hiển thị
        // const chunks: string[] = [];
        // const sentences = introText.match(/[^.!?]+[.!?]+/g) || [introText];
        // const sentencesPerChunk = Math.ceil(sentences.length / stars);
        
        // for (let i = 0; i < stars; i++) {
        //   const chunkSentences = sentences.slice(i * sentencesPerChunk, (i + 1) * sentencesPerChunk);
        //   if (chunkSentences.length > 0) {
        //     chunks.push(chunkSentences.join(" ").trim());
        //   }
        // }

        // 4. Lưu vào Database
        await prisma.wikiCard.upsert({
          where: { wikiUrl: `https://en.wikipedia.org/?curid=${pageId}` },
          update: { 
            contentText: introText, 
            chunkData: "[]", 
            imageUrl: imageUrl,
            rarity: rarity,
            totalStars: stars
          },
          create: {
            title: title,
            wikiUrl: `https://en.wikipedia.org/?curid=${pageId}`,
            rarity: rarity,
            imageUrl: imageUrl, 
            totalStars: stars,
            contentText: introText,
            chunkData: "[]",
            aiContent: "Chưa generate", 
          }
        });

        successCount++;
        resultsSummary.push(`[${rarity}] ${title} - Thực tế: ~${Math.round(totalCharCount/6)} words 🖼️`);
      }
      
      // Nghỉ 1.5s để tránh bị Wikipedia chặn
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    return NextResponse.json({ 
        status: "success", 
        summary: `Quét ${loopCount} lượt: Thu hoạch ${successCount} thẻ (100% có ảnh). Lọc ${skippedCount} bài không đạt chuẩn.`,
        savedCards: resultsSummary
    });

  } catch (error: any) {
    console.error("Crawl Wiki Error:", error);
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}