const { spawn } = require('child_process');

console.log('🚀 正在同時啟動「後台伺服器 (decap-server)」、「HTTP 伺服器 (live-server)」與「作品同步器 (sync.js)」...');
console.log('==================================================================');

// 1. 啟動作品同步器 (每 3 秒自動掃描一次)
const sync = spawn('node', ['sync.js'], { stdio: 'inherit', shell: true });

// 2. 啟動後台伺服器 (decap-server)
const cms = spawn('npx', ['decap-server'], { stdio: 'inherit', shell: true });

// 3. 啟動 HTTP 伺服器（讓頁面能透過 http:// 正常開啟，port 3000）
const server = spawn('npx', ['-y', 'live-server', '--port=3000', '--no-browser', '--quiet'], { stdio: 'inherit', shell: true });

// 當主進程結束時，確保子進程也被關閉
process.on('SIGINT', () => {
  console.log('\n🛑 正在關閉開發服務...');
  sync.kill();
  cms.kill();
  server.kill();
  process.exit(0);
});
