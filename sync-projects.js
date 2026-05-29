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

const DATA_DIR     = path.join(__dirname, 'data', 'projects');
const OUTPUT       = path.join(__dirname, 'data', 'projects.json');
const DETAIL_DIR   = path.join(__dirname, 'projects');
const CATEGORIES_JSON = path.join(__dirname, 'data', 'categories.json');

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
</html>
`;
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

    if (!fs.existsSync(DATA_DIR)) return;
    const actualFolders = fs.readdirSync(DATA_DIR).filter(function (f) {
        const fullPath = path.join(DATA_DIR, f);
        return fs.statSync(fullPath).isDirectory() && !f.startsWith('.') && !f.startsWith('_');
    });

    const inactiveFolders = actualFolders.filter(function (f) { return !activeCatIds.has(f); });
    
    const missingFolders = [];
    categoriesList.forEach(function (c) {
        const folderPath = path.join(DATA_DIR, c.id);
        if (!fs.existsSync(folderPath) || fs.readdirSync(folderPath).length === 0) {
            missingFolders.push(c.id);
        }
    });

    if (inactiveFolders.length === 1 && missingFolders.length === 1) {
        const oldId = inactiveFolders[0];
        const newId = missingFolders[0];

        const oldPath = path.join(DATA_DIR, oldId);
        const newPath = path.join(DATA_DIR, newId);

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

// ── 主要同步函式 ──
function sync() {
    migrateCategories();
    const projects = [];
    const createdDetails = [];
    const renamedFiles = [];
    const SKIP_FILES = new Set(['all.json', 'manifest.json', 'projects.json']);
    const processedKeys = new Set(); // category + '/' + id

    // 確保 detail 資料夾存在
    if (!fs.existsSync(DETAIL_DIR)) {
        fs.mkdirSync(DETAIL_DIR, { recursive: true });
    }

    // 1. 掃描 flat 格式（data/projects/*.json）
    if (fs.existsSync(DATA_DIR)) {
        const files = fs.readdirSync(DATA_DIR)
            .filter(f => f.endsWith('.json') && !SKIP_FILES.has(f))
            .sort();

        for (const file of files) {
            const fileBasename = path.basename(file, '.json');
            const filePath = path.join(DATA_DIR, file);

            // 讀取 JSON 內容取得 id 和 category 欄位
            let id = fileBasename; // 預設用檔名
            let category = 'logo-design'; // 預設分類
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(content);
                if (data.id && data.id.trim() !== '') {
                    id = data.id.trim();
                }
                if (data.category && data.category.trim() !== '') {
                    category = data.category.trim();
                }
            } catch (e) {
                console.warn(`⚠️ 無法解析 JSON: ${file} — ${e.message}`);
                continue;
            }

            const key = category + '/' + id;
            if (processedKeys.has(key)) continue;

            // 若 JSON 內的 id 與檔名不同，自動重新命名檔案
            if (id !== fileBasename) {
                const newFilePath = path.join(DATA_DIR, id + '.json');
                fs.renameSync(filePath, newFilePath);
                renamedFiles.push(`${fileBasename} → ${id}`);

                // 刪除舊的 detail .html
                const oldDetailPath = path.join(DETAIL_DIR, category, fileBasename + '.html');
                if (fs.existsSync(oldDetailPath)) {
                    fs.unlinkSync(oldDetailPath);
                }
            }

            projects.push({ id, folder: category });
            processedKeys.add(key);

            // 建立（或補建）detail .html
            const categoryDir = path.join(DETAIL_DIR, category);
            if (!fs.existsSync(categoryDir)) {
                fs.mkdirSync(categoryDir, { recursive: true });
            }
            const detailPath = path.join(categoryDir, id + '.html');
            if (!fs.existsSync(detailPath)) {
                fs.writeFileSync(detailPath, detailTemplate(id), 'utf-8');
                createdDetails.push(`${category}/${id}`);
            }
        }
    }

    // 2. 舊版相容：掃描子資料夾（如果存在）
    const CATEGORIES = fs.existsSync(DATA_DIR)
        ? fs.readdirSync(DATA_DIR).filter(f => {
            const fullPath = path.join(DATA_DIR, f);
            return fs.statSync(fullPath).isDirectory() && !f.startsWith('.') && !f.startsWith('_');
          })
        : [];

    for (const folder of CATEGORIES) {
        const dir = path.join(DATA_DIR, folder);
        if (!fs.existsSync(dir)) continue;

        const files = fs.readdirSync(dir)
            .filter(f => f.endsWith('.json') && !SKIP_FILES.has(f))
            .sort();

        for (const file of files) {
            const fileBasename = path.basename(file, '.json');
            const filePath = path.join(dir, file);

            // 讀取 JSON 內容取得 id 和 category 欄位
            let id = fileBasename; // 預設用檔名
            let category = folder; // 預設為資料夾名稱
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(content);
                if (data.id && data.id.trim() !== '') {
                    id = data.id.trim();
                }
                if (data.category && data.category.trim() !== '') {
                    category = data.category.trim();
                }
            } catch (e) {
                console.warn(`⚠️ 無法解析 JSON: ${file} — ${e.message}`);
                continue;
            }

            const key = category + '/' + id;
            if (processedKeys.has(key)) continue;

            // 若 JSON 內的 id 與檔名不同，自動重新命名檔案
            if (id !== fileBasename) {
                const newFilePath = path.join(dir, id + '.json');
                fs.renameSync(filePath, newFilePath);
                renamedFiles.push(`${fileBasename} → ${id}`);

                // 刪除舊的 detail .html
                const oldDetailPath = path.join(DETAIL_DIR, category, fileBasename + '.html');
                if (fs.existsSync(oldDetailPath)) {
                    fs.unlinkSync(oldDetailPath);
                }
            }

            projects.push({ id, folder: category });
            processedKeys.add(key);

            // 建立（或補建）detail .html
            const categoryDir = path.join(DETAIL_DIR, category);
            if (!fs.existsSync(categoryDir)) {
                fs.mkdirSync(categoryDir, { recursive: true });
            }
            const detailPath = path.join(categoryDir, id + '.html');
            if (!fs.existsSync(detailPath)) {
                fs.writeFileSync(detailPath, detailTemplate(id), 'utf-8');
                createdDetails.push(`${category}/${id}`);
            }
        }
    }

    let categoriesList = [];
    try {
        if (fs.existsSync(CATEGORIES_JSON)) {
            const catData = JSON.parse(fs.readFileSync(CATEGORIES_JSON, 'utf-8'));
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

    // 寫入 projects.json
    fs.writeFileSync(OUTPUT, JSON.stringify({ categories: categoriesList, projects }, null, 2), 'utf-8');

    const now = new Date().toLocaleTimeString('zh-TW');
    console.log(`\n✅ [${now}] projects.json 已更新，共 ${projects.length} 件作品：`);
    
    // 彙整所有出現過的分類
    const allUniqueCategories = [];
    projects.forEach(p => {
        if (p.folder && allUniqueCategories.indexOf(p.folder) === -1) {
            allUniqueCategories.push(p.folder);
        }
    });

    for (const cat of allUniqueCategories) {
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
    const SKIP_FILES = new Set(['all.json', 'manifest.json', 'projects.json']);

    function getAllJsonFiles() {
        const result = [];
        if (fs.existsSync(CATEGORIES_JSON)) {
            result.push(CATEGORIES_JSON);
        }
        // 掃描根目錄 JSON 檔案
        if (fs.existsSync(DATA_DIR)) {
            fs.readdirSync(DATA_DIR)
                .filter(f => f.endsWith('.json') && !SKIP_FILES.has(f))
                .forEach(f => result.push(path.join(DATA_DIR, f)));

            // 掃描子目錄 JSON 檔案 (舊相容)
            fs.readdirSync(DATA_DIR).forEach(f => {
                const sub = path.join(DATA_DIR, f);
                if (fs.existsSync(sub) && fs.statSync(sub).isDirectory() && !f.startsWith('.') && !f.startsWith('_')) {
                    fs.readdirSync(sub)
                        .filter(sf => sf.endsWith('.json') && !SKIP_FILES.has(sf))
                        .forEach(sf => result.push(path.join(sub, sf)));
                }
            });
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

