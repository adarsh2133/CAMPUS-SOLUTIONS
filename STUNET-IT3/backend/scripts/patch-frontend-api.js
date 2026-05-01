const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '..', '..', 'api.js');

if (!fs.existsSync(apiPath)) {
  console.warn('api.js not found, skipping frontend API patch.');
  process.exit(0);
}

let content = fs.readFileSync(apiPath, 'utf8');
content = content.replace(
  /const\s+API_BASE\s*=\s*['"]http:\/\/localhost:5000\/api['"];?/,
  "const API_BASE = window.STUNET_API_BASE || '/api';"
);

fs.writeFileSync(apiPath, content);
console.log('✅ Frontend API base patched for deployment.');
