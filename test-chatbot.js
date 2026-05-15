/**
 * Test script untuk chatbot Gemini
 * Cara pakai:
 * 1. Pastikan dev server running: npm run dev
 * 2. Buka terminal BARU
 * 3. Run: node test-chatbot.js
 */

const BASE_URL = "http://localhost:3000";

async function testChatbot(question) {
  console.log(`\n🤖 Testing: "${question}"`);
  try {
    const res = await fetch(`${BASE_URL}/api/chatbot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: question }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.log(`❌ Error (${res.status}): ${data.error}`);
      return false;
    }

    console.log(`✅ Reply: ${data.reply}`);
    return true;
  } catch (err) {
    console.log(`❌ Network error: ${err.message}`);
    console.log(`   → Pastikan dev server sudah running: npm run dev`);
    return false;
  }
}

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("    CHATBOT GEMINI TEST SUITE");
  console.log("═══════════════════════════════════════");

  const tests = [
    "Apa itu BEM ITESA?",
    "Program studi apa saja yang ada di ITESA?",
    "Apa kegiatan BEM ITESA?",
  ];

  let passed = 0;
  for (const q of tests) {
    const ok = await testChatbot(q);
    if (ok) passed++;
    await new Promise((r) => setTimeout(r, 1000)); // delay antar request
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`RESULT: ${passed}/${tests.length} tests passed`);
  if (passed === tests.length) {
    console.log("✅ Chatbot Gemini berfungsi dengan baik!");
  } else {
    console.log("❌ Ada yang masih bermasalah, cek error di atas.");
  }
  console.log("═══════════════════════════════════════");
}

main();
