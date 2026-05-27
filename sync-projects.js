/**
 * sync-projects.js
 * 1. 自動掃描 data/projects/ 各分類資料夾，更新 data/projects.json
 * 2. 自動補建 projects/detail/{id}.html（若不存在）
 *
 * 用法：
 *   node sync-projects.js          ← 掃描一次就結束
 *   node sync-projects.js --watch  ← 持續監聽，有新作品自動更新
 */

const fs   = require('fs');
const path = require('path');

const CATEGORIES   = ['logo-design', 'web-design', 'illustration', 'animation', 'photography'];
const DATA_DIR     = path.join(__dirname, 'data', 'projects');
const OUTPUT       = path.join(__dirname, 'data', 'projects.json');
const DETAIL_DIR   = path.join(__dirname, 'projects', 'detail');

// ── Detail .html 模板 ──
function detailTemplate(id) {
    return `<!DOCTYPE html>
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
            <a href="../index.html">All Projects</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer></footer>
</body>
</html>
`;
}

// ── 主要同步函式 ──
function sync() {
    const projects = [];
    const createdDetails = [];
    const renamedFiles = [];

    // 確保 detail 資料夾存在
    if (!fs.existsSync(DETAIL_DIR)) {
        fs.mkdirSync(DETAIL_DIR, { recursive: true });
    }

    for (const category of CATEGORIES) {
        const dir = path.join(DATA_DIR, category);
        if (!fs.existsSync(dir)) continue;

        const files = fs.readdirSync(dir)
            .filter(f => f.endsWith('.json'))
            .sort();

        for (const file of files) {
            const fileBasename = path.basename(file, '.json');
            const filePath = path.join(dir, file);

            // 讀取 JSON 內容取得 id 欄位
            let id = fileBasename; // 預設用檔名
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(content);
                if (data.id && data.id.trim() !== '') {
                    id = data.id.trim();
                }
            } catch (e) {
                console.warn(`⚠️ 無法解析 JSON: ${file} — ${e.message}`);
            }

            // 若 JSON 內的 id 與檔名不同，自動重新命名檔案
            if (id !== fileBasename) {
                const newFilePath = path.join(dir, id + '.json');
                fs.renameSync(filePath, newFilePath);
                renamedFiles.push(`${fileBasename} → ${id}`);

                // 刪除舊的 detail .html（內含舊 id）
                const oldDetailPath = path.join(DETAIL_DIR, fileBasename + '.html');
                if (fs.existsSync(oldDetailPath)) {
                    fs.unlinkSync(oldDetailPath);
                }
            }

            projects.push({ id, folder: category });

            // 建立（或補建）detail .html
            const detailPath = path.join(DETAIL_DIR, id + '.html');
            if (!fs.existsSync(detailPath)) {
                fs.writeFileSync(detailPath, detailTemplate(id), 'utf-8');
                createdDetails.push(id);
            }
        }
    }

    // 寫入 projects.json
    fs.writeFileSync(OUTPUT, JSON.stringify({ projects }, null, 2), 'utf-8');

    const now = new Date().toLocaleTimeString('zh-TW');
    console.log(`\n✅ [${now}] projects.json 已更新，共 ${projects.length} 件作品：`);
    for (const cat of CATEGORIES) {
        const items = projects.filter(p => p.folder === cat);
        if (items.length) {
            console.log(`   📁 ${cat} (${items.length}) → ${items.map(p => p.id).join(', ')}`);
        }
    }

    if (renamedFiles.length > 0) {
        console.log(`\n🔄 自動改名（ID 已更新）：${renamedFiles.join(', ')}`);
    }

    if (createdDetails.length > 0) {
        console.log(`\n📄 自動建立 detail 頁面：${createdDetails.join(', ')}`);
    }
}


// ── 主程式 ──
if (process.argv.includes('--watch')) {
    console.log('👀 自動同步模式啟動（每秒掃描，有變更自動更新）');
    console.log('   按 Ctrl+C 結束\n');
    sync();

    // 記錄上次每個檔案的修改時間
    const lastMtimes = {};

    function getAllJsonFiles() {
        const result = [];
        for (const category of CATEGORIES) {
            const dir = path.join(DATA_DIR, category);
            if (!fs.existsSync(dir)) continue;
            fs.readdirSync(dir)
                .filter(f => f.endsWith('.json'))
                .forEach(f => result.push(path.join(dir, f)));
        }
        return result;
    }

    setInterval(() => {
        let changed = false;
        try {
            const files = getAllJsonFiles();

            // 1. 偵測新增的檔案
            for (const fp of files) {
                if (!(fp in lastMtimes)) {
                    changed = true;
                    // 先給個初始值，避免等等 mtime 比對又觸發一次，不過無所謂
                    lastMtimes[fp] = 0; 
                }
            }

            // 2. 偵測修改的檔案
            for (const fp of files) {
                try {
                    const mtime = fs.statSync(fp).mtimeMs;
                    if (lastMtimes[fp] !== mtime) {
                        changed = true;
                        lastMtimes[fp] = mtime;
                    }
                } catch (_) {}
            }

            // 3. 偵測刪除的檔案
            for (const fp of Object.keys(lastMtimes)) {
                if (!fs.existsSync(fp)) {
                    delete lastMtimes[fp];
                    changed = true;
                }
            }
        } catch (_) {}

        if (changed) {
            console.log('\n📂 偵測到作品資料變更，正在同步...');
            sync();
        }
    }, 1000); // 每 1 秒掃描一次

} else {
    sync();
}

