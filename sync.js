/**
 * sync.js — 作品清單自動同步 + 個別頁面生成器
 * 啟動後自動監控 data/projects/ 資料夾
 * 1. 更新 data/projects/all.json
 * 2. 自動生成 projects/detail/jianyuan.htm 等獨立頁面
 *
 * 使用方法：node sync.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, 'data', 'projects');
const ALL_JSON    = path.join(__dirname, 'data', 'projects.json');
const DETAIL_DIR  = path.join(__dirname, 'projects', 'detail');
const SKIP_FILES  = new Set(['all.json', 'manifest.json', 'projects.json']);
const FOLDERS     = ['logo-design', 'web-design', 'illustration', 'animation'];
const POLL_MS     = 3000;

// ── 生成每個作品的獨立 .htm 頁面 ──
// 路徑：projects/detail/jianyuan.htm
// 相對路徑往上兩層到根目錄
function generateDetailPage(id) {
    if (!fs.existsSync(DETAIL_DIR)) {
        fs.mkdirSync(DETAIL_DIR, { recursive: true });
    }

    const htmlPath = path.join(DETAIL_DIR, id + '.htm');

    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, min-width=640, user-scalable=0, viewport-fit=cover"/>
  <title>Project — JM PORTFOLIO</title>
  <meta name="description" content="Project detail" />
  <meta name="robots" content="all" />
  <meta property="og:site_name" content="JM PORTFOLIO" />
  <meta property="og:type" content="website" />

  <link rel="stylesheet" href="../../css/default.css" />
  <link rel="stylesheet" href="../../css/ui.css" />
  <link rel="stylesheet" href="../../css/portfolio.css" />
  <link rel="stylesheet" href="../../css/mediaqueries.css" />

  <script src="../../Js/rm/jquery-3.4.1.min.js"></script>

  <!-- 告訴 detail.js 這個頁面的作品 ID 和路徑深度 -->
  <script>
    var PROJECT_ID  = '${id}';
    var PATH_PREFIX = '../../';
  </script>

  <script src="../../Js/rm/realmediaScript.js" defer></script>
  <script src="../../Js/main.js" defer></script>
  <script src="../../Js/detail.js" defer></script>

  <script>
    $(function () {
      $('header').load('../../include/header.htm');
      $('footer').load('../../include/footer.htm');
    });
  </script>
</head>
<body>
  <header></header>

  <div class="bodybox detail">
    <div class="mainContent">
      <div class="container">
        <div class="project-detail-wrapper">
          <h1 id="detailTitle" class="title"></h1>
          <div class="meta-info" id="detailMeta"></div>
          <p id="detailDesc"></p>
          <img id="detailCoverImg" src="" alt="Project Cover" />
          <div id="detailSections"></div>
          <div class="back">
            <a href="../index.htm">All Projects</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer></footer>
</body>
</html>`;

    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('    📄 生成頁面：projects/detail/' + id + '.htm');
}

// ── 掃描所有 JSON，重建 all.json + 生成 .htm ──
function buildAllJson() {
    const projects = [];

    // 1. 先掃描 ROOT (data/projects/) 目錄下的所有 JSON 檔案（新版 flat 上稿方式，解決 CMS 列表消失問題）
    if (fs.existsSync(ROOT)) {
        fs.readdirSync(ROOT).forEach(function (file) {
            if (!file.endsWith('.json')) return;
            if (SKIP_FILES.has(file)) return;

            const filePath = path.join(ROOT, file);
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const id = file.replace(/\.json$/, '');
                const category = data.category || 'logo-design';
                projects.push({ id: id, folder: category });
                generateDetailPage(id);
            } catch (e) {
                // 忽略解析錯誤或非標準作品 JSON 檔
            }
        });
    }

    // 2. 舊版相容：也掃描子資料夾（如果存在）
    FOLDERS.forEach(function (folder) {
        const folderPath = path.join(ROOT, folder);
        if (!fs.existsSync(folderPath)) return;

        fs.readdirSync(folderPath).forEach(function (file) {
            if (!file.endsWith('.json')) return;
            if (SKIP_FILES.has(file)) return;

            const id = file.replace(/\.json$/, '');
            // 避免與 ROOT 的重複
            if (!projects.some(p => p.id === id)) {
                projects.push({ id: id, folder: folder });
                generateDetailPage(id);
            }
        });
    });

    const newContent = JSON.stringify({ projects: projects }, null, 2);
    const oldContent = fs.existsSync(ALL_JSON) ? fs.readFileSync(ALL_JSON, 'utf8') : '';
    if (newContent.trim() === oldContent.trim()) return;

    fs.writeFileSync(ALL_JSON, newContent, 'utf8');
    const time = new Date().toLocaleTimeString('zh-TW');
    console.log('[' + time + '] ✅ all.json 已更新：共 ' + projects.length + ' 件作品');
    projects.forEach(function (p) {
        console.log('    → ' + p.folder + '/' + p.id);
    });
}

const isOnce = process.argv.includes('--once');

if (isOnce) {
    console.log('🔄 作品同步器：執行單次掃描...');
    buildAllJson();
    console.log('✅ 單次掃描完成，已退出。');
    process.exit(0);
} else {
    console.log('🔄 作品同步器已啟動，每 ' + (POLL_MS / 1000) + ' 秒自動掃描...');
    console.log('📁 監控路徑：' + ROOT);
    console.log('📄 頁面輸出：projects/detail/*.htm');
    console.log('─────────────────────────────────────');
    buildAllJson();
    setInterval(buildAllJson, POLL_MS);
}
