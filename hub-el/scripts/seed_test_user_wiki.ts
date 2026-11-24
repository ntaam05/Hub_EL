import { prisma } from "../src/lib/prisma";

async function main() {
  const userId = "cmw1tbh930001vclg2eud8m6h";
  const cardIds = [1, 2, 3, 54];
  for (const cid of cardIds) {
    const exists = await prisma.userInventory.findUnique({
      where: { userId_cardId: { userId, cardId: cid } },
    });
    if (!exists) {
      await prisma.userInventory.create({
        data: {
          userId,
          cardId: cid,
          currentStar: cid === 54 ? 2 : 1,
          isNew: false,
          isCompleted: false,
        },
      });
      console.log("Added card", cid, "to test user");
    }
  }

  // Check attempt for card 54
  const attExists = await prisma.wikiQuizAttempt.findFirst({
    where: { userId, cardId: 54 },
  });
  if (!attExists) {
    const sampleAtt = await prisma.wikiQuizAttempt.findFirst({
      where: { cardId: 54 },
    });
    if (sampleAtt) {
      await prisma.wikiQuizAttempt.create({
        data: {
          userId,
          cardId: 54,
          score: sampleAtt.score,
          correctCount: sampleAtt.correctCount,
          totalQuizzes: sampleAtt.totalQuizzes,
          userAnswers: sampleAtt.userAnswers,
          lessonSnapshot: sampleAtt.lessonSnapshot,
        },
      });
      console.log("Added attempt for card 54 to test user");
    }
  }

  const testInv = await prisma.userInventory.findMany({
    where: { userId },
    include: {
      card: {
        include: {
          attempts: {
            where: { userId },
          },
        },
      },
    },
  });
  console.log("Test user inventory count:", testInv.length);
  testInv.forEach((i) =>
    console.log(
      "Card ID:",
      i.card.id,
      "Title:",
      i.card.title,
      "Rarity:",
      i.card.rarity,
      "Attempts:",
      i.card.attempts.length
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

