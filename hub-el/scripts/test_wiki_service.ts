import { getWikiManagementService } from "../src/services/wiki.service";

async function main() {
  const res = await getWikiManagementService("cmw1tbh930001vclg2eud8m6h");
  console.log("Success:", res.success);
  console.log("Total cards in system:", res.data?.length);
  const owned = res.data?.filter((i) => i.isOwned);
  const unowned = res.data?.filter((i) => !i.isOwned);
  console.log("Owned cards:", owned?.length);
  console.log("Unowned cards:", unowned?.length);
  console.log(
    "Sample owned:",
    owned?.[0]?.card.title,
    "isOwned:",
    owned?.[0]?.isOwned,
    "attempts:",
    owned?.[0]?.card.attempts.length
  );
  console.log(
    "Sample unowned:",
    unowned?.[0]?.card.title,
    "isOwned:",
    unowned?.[0]?.isOwned,
    "attempts:",
    unowned?.[0]?.card.attempts.length
  );

  // Test User B isolation: make sure User B cannot see User A's attempts
  const resB = await getWikiManagementService("user_b_test_isolation_id");
  const cardWithAttemptForB = resB.data?.find((i) => i.cardId === 54);
  console.log(
    "User B's attempt count for Card 54 (which User A studied):",
    cardWithAttemptForB?.card.attempts.length
  );
}

main().catch(console.error);

