$(function () {
    // ── 1. 讀取作品 ID（三種方式，優先順序如下）──
    // 方式 A: 獨立頁面（projects/detail/jianyuan.html）設定的 PROJECT_ID 變數
    // 方式 B: URL hash（detail.html#jianyuan）
    // 方式 C: Query string（detail.html?id=jianyuan，向後相容）
    var projectId = (window.PROJECT_ID || '')
        || window.location.hash.replace('#', '').trim()
        || new URLSearchParams(window.location.search).get('id')
        || '';

    // ── 路徑前綴：作品頁在 projects/ 下，要往上一層 ──
    // 一般 detail.html 也在 projects/ 下，往上一層即可
    var prefix = window.PATH_PREFIX || '../';

    if (!projectId) {
        $('#detailTitle').text('Project Not Found');
        return;
    }

    var folderNames = ['logo-design', 'web-design', 'illustration', 'animation'];

    // ── 優先嘗試讀取 ROOT 目錄下的 JSON（新版，無分類資料夾），失敗則嘗試子資料夾 ──
    var mainUrl = prefix + 'data/projects/' + projectId + '.json?_t=' + new Date().getTime();
    $.getJSON(mainUrl, function (project) {
        renderPage(project, project.category || 'logo-design');
    }).fail(function () {
        tryNextFolder(0);
    });

    function tryNextFolder(index) {
        if (index >= folderNames.length) {
            $('#detailTitle').text('Project Not Found');
            return;
        }
        var folder = folderNames[index];
        var url = prefix + 'data/projects/' + folder + '/' + projectId + '.json?_t=' + new Date().getTime();
        $.getJSON(url, function (project) {
            renderPage(project, folder);
        }).fail(function () {
            tryNextFolder(index + 1);
        });
    }

    // ── 修正圖片路徑（相容大小寫，使用動態 prefix）──
    function fixPath(p) {
        if (!p) return '';
        return p
            .replace(/^\.\.\/images\//i, prefix + 'Images/')
            .replace(/^images\//i,       prefix + 'Images/');
    }

    // ── "logo-design" → "Logo Design" ──
    function toDisplayName(str) {
        if (!str) return '';
        return str.split(/[-\s]+/)
                  .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
                  .join(' ');
    }

    // ── 填入畫面（與 CMS 預覽相同順序）──
    function renderPage(project, folder) {

        // 1. 標題
        $('#detailTitle').text(project.title || '');

        // 2. meta-info：分類 / 年份 / 客戶
        var category = toDisplayName(project.category || folder);
        var subtitle  = project.subtitle ? '<span style="margin-left:6px;">' + project.subtitle + '</span>' : '';
        $('#detailMeta').html(
            '<div><b>Services:</b><span>' + category + subtitle + '</span></div>' +
            '<div><b>Year:</b><span>' + (project.year   || '') + '</span></div>' +
            (project.role ? '<div><b>Role：</b><span>' + project.role + '</span></div>' : '')
        );

        // 3. 簡介
        var $desc = $('#detailDesc');
        if (project.description && project.description.trim() !== '') {
            $desc.text(project.description);
            $desc.removeClass('align-left align-center align-right');
            if (project.desc_align) {
                $desc.addClass('align-' + project.desc_align);
            } else {
                $desc.addClass('align-left');
            }
            $desc.show();
        } else {
            $desc.hide();
        }

        // 4. 封面圖（在簡介下方）
        var cover = fixPath(project.cover_image);
        if (cover) {
            var $img = $('#detailCoverImg');
            $img.attr('src', cover).attr('alt', project.title).show();
            $img.removeClass('align-left align-center align-right align-full');
            if (project.cover_align) {
                $img.addClass('align-' + project.cover_align);
            } else {
                $img.addClass('align-full');
            }
        } else {
            $('#detailCoverImg').hide();
        }

        // 5. 動態積木內容
        var $sections = $('#detailSections');
        $sections.empty();

        if (!project.page_blocks || !Array.isArray(project.page_blocks)) return;

        project.page_blocks.forEach(function (block) {
            if (!block) return;

            // 單張大圖
            if (block.type === 'image_block' && block.image) {
                $sections.append(
                    '<div class="sectionItem sectionImage">' +
                        '<img src="' + fixPath(block.image) + '" alt="Project Image" />' +
                    '</div>'
                );

            // 文字區塊
            } else if (block.type === 'text_block' && block.text) {
                $sections.append(
                    '<div class="sectionItem sectionText">' +
                        '<p class="bodyText">' + block.text + '</p>' +
                    '</div>'
                );

            // 雙圖並排
            } else if (block.type === 'two_images_block') {
                $sections.append(
                    '<div class="sectionItem sectionTwoImages">' +
                        '<div class="imgHalf"><img src="' + fixPath(block.image_left)  + '" alt="Left" /></div>' +
                        '<div class="imgHalf"><img src="' + fixPath(block.image_right) + '" alt="Right" /></div>' +
                    '</div>'
                );

            // 三圖並排
            } else if (block.type === 'three_images_block') {
                $sections.append(
                    '<div class="sectionItem sectionThreeImages">' +
                        '<div class="imgThird"><img src="' + fixPath(block.image_left || '')  + '" alt="Left" /></div>' +
                        '<div class="imgThird"><img src="' + fixPath(block.image_center || '') + '" alt="Center" /></div>' +
                        '<div class="imgThird"><img src="' + fixPath(block.image_right || '') + '" alt="Right" /></div>' +
                    '</div>'
                );

            // YouTube / 影片
            } else if (block.type === 'video_block' && block.video_url) {
                var vu = block.video_url;
                if (vu.includes('youtube.com') || vu.includes('youtu.be')) {
                    var vid = (vu.split('v=')[1] || vu.split('/').pop()).split('&')[0];
                    $sections.append(
                        '<div class="sectionItem sectionVideo" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">' +
                        '<iframe src="https://www.youtube.com/embed/' + vid + '" ' +
                            'style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" ' +
                            'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
                            'referrerpolicy="strict-origin-when-cross-origin" ' +
                            'allowfullscreen></iframe>' +
                    '</div>'
                    );
                } else {
                    $sections.append(
                        '<div class="sectionItem sectionVideo">' +
                            '<video src="' + vu + '" controls style="width:100%;height:auto;display:block;"></video>' +
                        '</div>'
                    );
                }

            // 嵌入 iframe（Figma 等）
            } else if (block.type === 'embed_block' && block.embed_code) {
                var ec = block.embed_code.trim();
                $sections.append(
                    ec.startsWith('<iframe')
                        ? '<div class="sectionItem sectionEmbed">' + ec + '</div>'
                        : '<div class="sectionItem sectionEmbed" style="height:500px;">' +
                              '<iframe src="' + ec + '" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>' +
                          '</div>'
                );

            // 下載按鈕
            } else if (block.type === 'download_block' && block.file_url) {
                $sections.append(
                    '<div class="sectionItem sectionDownload">' +
                        '<a href="' + block.file_url + '" target="_blank" download class="btn">' +
                            '📎 ' + (block.button_text || '下載附件') +
                        '</a>' +
                    '</div>'
                );
            }
        });
    }

    // ── 增加 Previous / Next 連結功能，動態插入到 detail 頁底部 ──
    function setupPrevNext(currentId) {
        var listUrl = prefix + 'data/projects.json?_t=' + new Date().getTime();
        $.getJSON(listUrl, function (data) {
            var items = (data && data.projects) || [];
            var ids = items.map(function (p) { return p.id; });
            var idx = ids.indexOf(currentId);
            if (idx === -1) return;

            var prevId = idx > 0 ? ids[idx - 1] : null;
            var nextId = idx < ids.length - 1 ? ids[idx + 1] : null;

            var $wrapper = $('.project-detail-wrapper');
            if (!$wrapper.length) return;

            var $nav = $wrapper.find('.project-nav');
            if (!$nav.length) {
                $nav = $('<div/>', { 'class': 'project-nav' });
                $wrapper.append($nav);
            }
            $nav.empty();

            function detailHrefFor(id) {
                var path = window.location.pathname || '';
                // 如果目前是在 /projects/ 目錄下的個別作品頁（但排除 fallback 用的 detail.html 及 index.html）
                if ((path.indexOf('/projects/') !== -1 || path.indexOf('\\projects\\') !== -1) && 
                    path.indexOf('detail.html') === -1 && 
                    path.indexOf('index.html') === -1) {
                    return id + '.html';
                }
                return prefix + 'projects/' + id + '.html';
            }

            if (prevId) {
                $nav.append($('<a/>', { 'class': 'UI longnext prev', href: detailHrefFor(prevId) }));
            }
            
            // 中間加入 Back 鏈接
            $nav.append($('<a/>', { 'class': 'back', href: 'javascript:history.back()', text: 'Back' }));
            
            if (nextId) {
                $nav.append($('<a/>', { 'class': 'UI longnext', href: detailHrefFor(nextId) }));
            }
        });
    }

    // 在載入並呈現內容後設定 prev/next
    setupPrevNext(projectId);
});