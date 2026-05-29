/**
 * sync.js — 作品清單自動同步 + 個別頁面生成器
 * 啟動後自動監控 data/projects/ 資料夾
 * 1. 更新 data/projects/all.json
 * 2. 自動生成 projects/detail/jianyuan.html 等獨立頁面
 *
 * 使用方法：node sync.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, 'data', 'projects');
const ALL_JSON    = path.join(__dirname, 'data', 'projects.json');
const DETAIL_DIR  = path.join(__dirname, 'projects');
const SKIP_FILES  = new Set(['all.json', 'manifest.json', 'projects.json']);
const CATEGORIES_JSON = path.join(__dirname, 'data', 'categories.json');
const POLL_MS     = 3000;

// ── 生成每個作品的獨立 .html 頁面 ──
// 路徑：projects/category/id.html
// 相對路徑往上二層到根目錄
function generateDetailPage(id, category) {
    const categoryDir = path.join(DETAIL_DIR, category);
    if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
    }

    const htmlPath = path.join(categoryDir, id + '.html');

    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, min-width=640, user-scalable=0, viewport-fit=cover"/>
  <title>Project — Jming Studio</title>
  <meta name="description" content="Project detail" />
  <meta name="robots" content="all" />
  <meta property="og:site_name" content="Jming Studio" />
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
      $('header').load('../../include/header.html');
      $('footer').load('../../include/footer.html');
    });
  </script>
</head>
<body style="opacity: 0; transition: opacity 0.15s ease-in-out;">
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
        </div>
      </div>
    </div>
  </div>

  <footer></footer>
</body>
</html>`;

    var existing = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : null;
    var normalize = function (str) {
        return str ? str.replace(/\r\n/g, '\n').trim() : '';
    };
    if (normalize(existing) !== normalize(html)) {
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log('    📄 生成頁面：projects/' + category + '/' + id + '.html');
    }
}

// ── 自動分類資料夾與內文遷移 ──
function migrateCategories() {
    let categoriesList = [];
    try {
        if (fs.existsSync(CATEGORIES_JSON)) {
            const catData = JSON.parse(fs.readFileSync(CATEGORIES_JSON, 'utf8'));
            categoriesList = catData.list || [];
        }
    } catch (e) {
        return;
    }
    if (categoriesList.length === 0) return;

    const activeCatIds = new Set(categoriesList.map(function (c) { return c.id; }));

    if (!fs.existsSync(ROOT)) return;
    const actualFolders = fs.readdirSync(ROOT).filter(function (f) {
        const fullPath = path.join(ROOT, f);
        return fs.statSync(fullPath).isDirectory() && !f.startsWith('.') && !f.startsWith('_');
    });

    const inactiveFolders = actualFolders.filter(function (f) { return !activeCatIds.has(f); });
    
    const missingFolders = [];
    categoriesList.forEach(function (c) {
        const folderPath = path.join(ROOT, c.id);
        if (!fs.existsSync(folderPath) || fs.readdirSync(folderPath).length === 0) {
            missingFolders.push(c.id);
        }
    });

    if (inactiveFolders.length === 1 && missingFolders.length === 1) {
        const oldId = inactiveFolders[0];
        const newId = missingFolders[0];

        const oldPath = path.join(ROOT, oldId);
        const newPath = path.join(ROOT, newId);

        console.log('[遷移工具] 🔄 偵測到分類變更：將 ' + oldId + ' 重新命名為 ' + newId);
        
        try {
            if (fs.existsSync(oldPath)) {
                if (fs.existsSync(newPath)) {
                    fs.rmdirSync(newPath);
                }
                fs.renameSync(oldPath, newPath);
                console.log('[遷移工具] ✅ 資料夾已重命名：data/projects/' + oldId + ' -> data/projects/' + newId);
            }

            if (fs.existsSync(newPath)) {
                const files = fs.readdirSync(newPath).filter(function (f) { return f.endsWith('.json'); });
                files.forEach(function (file) {
                    const filePath = path.join(newPath, file);
                    try {
                        const fileContent = fs.readFileSync(filePath, 'utf8');
                        const data = JSON.parse(fileContent);
                        if (data.category !== newId) {
                            data.category = newId;
                            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                            console.log('[遷移工具] ✏️ 已更新作品 ' + file + ' 的分類欄位為 ' + newId);
                        }
                    } catch (err) {
                        console.warn('[遷移工具] ⚠️ 無法更新作品檔案 ' + file + '：', err.message);
                    }
                });
            }

            const oldDetailDir = path.join(DETAIL_DIR, oldId);
            if (fs.existsSync(oldDetailDir)) {
                fs.rmSync(oldDetailDir, { recursive: true, force: true });
                console.log('[遷移工具] 🗑️ 已清理舊版網頁輸出資料夾：projects/' + oldId);
            }
        } catch (e) {
            console.error('[遷移工具] ❌ 遷移失敗：', e.message);
        }
    }

    if (fs.existsSync(DETAIL_DIR)) {
        const allowedDirs = new Set(['detail', 'Images', 'css', 'Js', 'include']);
        const detailFolders = fs.readdirSync(DETAIL_DIR).filter(function (f) {
            const fullPath = path.join(DETAIL_DIR, f);
            return fs.statSync(fullPath).isDirectory();
        });
        detailFolders.forEach(function (folder) {
            if (!allowedDirs.has(folder) && !activeCatIds.has(folder)) {
                const pathToDelete = path.join(DETAIL_DIR, folder);
                if (!fs.existsSync(pathToDelete)) return;
                try {
                    fs.rmSync(pathToDelete, { recursive: true, force: true });
                    console.log('[清理工具] 🗑️ 刪除未使用的輸出資料夾：projects/' + folder);
                } catch (err) {
                    console.warn('[清理工具] ⚠️ 無法刪除 projects/' + folder + '：', err.message);
                }
            }
        });
    }
}

// ── 掃描所有 JSON，重建 all.json + 生成 .html ──
function buildAllJson() {
    migrateCategories();
    const projects = [];

    // Dynamically discover category subfolders
    const FOLDERS = fs.existsSync(ROOT)
        ? fs.readdirSync(ROOT).filter(f => {
            const fullPath = path.join(ROOT, f);
            return fs.statSync(fullPath).isDirectory() && !f.startsWith('.') && !f.startsWith('_');
          })
        : [];

    // 1. 先掃描 ROOT (data/projects/) 目錄下的所有 JSON 檔案（相容舊版或根目錄有檔案的情況）
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
                generateDetailPage(id, category);
            } catch (e) {
                // 忽略解析錯誤
            }
        });
    }

    // 2. 掃描各分類子資料夾（主要資料來源）
    FOLDERS.forEach(function (folder) {
        const folderPath = path.join(ROOT, folder);
        if (!fs.existsSync(folderPath)) return;

        fs.readdirSync(folderPath).forEach(function (file) {
            if (!file.endsWith('.json')) return;
            if (SKIP_FILES.has(file)) return;

            const filePath = path.join(folderPath, file);
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const id = file.replace(/\.json$/, '');
                const category = data.category || folder; // 優先使用 JSON 內 category，以 folder 為備用

                // 避免與 ROOT 的重複
                if (!projects.some(p => p.id === id && p.folder === category)) {
                    projects.push({ id: id, folder: category });
                    generateDetailPage(id, category);
                }
            } catch (e) {
                // 忽略解析錯誤
            }
        });
    });

    let categoriesList = [];
    try {
        if (fs.existsSync(CATEGORIES_JSON)) {
            const catData = JSON.parse(fs.readFileSync(CATEGORIES_JSON, 'utf8'));
            categoriesList = catData.list || [];
        }
    } catch (e) {
        console.warn('⚠️ 無法解析 categories.json:', e.message);
    }
    if (categoriesList.length === 0) {
        categoriesList = [
            { id: "logo-design", name: "Logo Design" },
            { id: "web-design", name: "Web design" },
            { id: "illustration", name: "Illustration" },
            { id: "animation", name: "Animation" }
        ];
    }

    const newContent = JSON.stringify({ categories: categoriesList, projects: projects }, null, 2);
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
    console.log('📄 頁面輸出：projects/<category>/*.html');
    console.log('─────────────────────────────────────');
    buildAllJson();
    setInterval(buildAllJson, POLL_MS);
}
