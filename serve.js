const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.htm':  'text/html; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.yml':  'text/yaml; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (urlPath === '/') urlPath = '/index.htm';

  let filePath = path.join(ROOT, urlPath);

  // 若路徑是目錄，嘗試 index.htm
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const tryHtm = path.join(filePath, 'index.htm');
    const tryHtml = path.join(filePath, 'index.html');
    if (fs.existsSync(tryHtm)) filePath = tryHtm;
    else if (fs.existsSync(tryHtml)) filePath = tryHtml;
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + urlPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  // 允許 CMS 跨來源存取 config.yml
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`🌐 靜態伺服器已啟動：http://localhost:${PORT}`);
  console.log(`📂 根目錄：${ROOT}`);
  console.log(`🔗 後台網址：http://localhost:${PORT}/m@n@ger/`);
});
