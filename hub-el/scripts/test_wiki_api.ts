async function main() {
  const loginRes = await fetch("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "emulator_user_2026@hubel.test",
      password: "Password123!",
    }),
  });
  const loginData = await loginRes.json();
  console.log("Login success:", loginData.success);
  const token = loginData.data?.accessToken;
  if (!token) return console.log("No token:", loginData);

  const wikiRes = await fetch("http://localhost:3000/api/v1/wiki/inventory", {
    headers: { Authorization: "Bearer " + token },
  });
  const wikiData = await wikiRes.json();
  console.log("Wiki API success:", wikiData.success);
  console.log("Items returned:", wikiData.data?.length);
  wikiData.data?.forEach((i: any) =>
    console.log(
      "Card ID:",
      i.card?.id,
      "Title:",
      i.card?.title,
      "Rarity:",
      i.card?.rarity,
      "Attempts:",
      i.card?.attempts?.length
    )
  );
}

main().catch(console.error);
