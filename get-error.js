const fs = require('fs');
async function run() {
  const res = await fetch("http://localhost:3000/api/test_generate");
  const text = await res.text();
  fs.writeFileSync("error-log.txt", text);
}
run();
