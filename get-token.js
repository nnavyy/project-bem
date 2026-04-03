const fs = require('fs');
let s = fs.readFileSync('token.txt', 'utf8');
if (s.includes('\0')) {
  s = fs.readFileSync('token.txt', 'utf16le');
}
const lines = s.split(/\r?\n/);
let extractedToken = '';
for (const line of lines) {
  if (line.includes('TOKEN') && line.includes(':')) {
    extractedToken = line.split(':')[1].trim();
    if(extractedToken.length === 16) break;
  }
}
fs.writeFileSync('plain_token.txt', extractedToken);
