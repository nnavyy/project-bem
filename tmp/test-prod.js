const http = require('http');

async function main() {
  // 1. Login
  const loginRes = await fetch("http://localhost:3000/api/login/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "nandaha", token: "JYPSLpGty1AbpH7v" })
  });
  
  const loginData = await loginRes.json();
  console.log("Login:", loginRes.status, loginData);
  
  if (!loginRes.ok) return;

  const cookie = loginRes.headers.get("set-cookie");
  console.log("Cookie:", cookie);

  // 2. Tentukan ID admin yang ada di DB, misal "md" => kita cari id-nya dulu
  const adminsRes = await fetch("http://localhost:3000/api/headadmin/admin", {
    headers: { "Cookie": cookie }
  });
  const admins = await adminsRes.json();
  const target = admins.find(a => a.username === "md");
  
  if (!target) {
    console.log("Admin md tidak ditemukan");
    return;
  }
  
  console.log("Target admin ID:", target.id);

  // 3. Coba Delete Admin
  const delRes = await fetch(`http://localhost:3000/api/superadmin/admin/${target.id}`, {
    method: "DELETE",
    headers: { "Cookie": cookie }
  });
  
  const delData = await delRes.json();
  console.log("Delete Result:", delRes.status, delData);
}

main().catch(console.error);
