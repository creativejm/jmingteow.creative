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

    var categoryMap = {};
    var projectsList = [];
    var folderNames = ['logo-design', 'web-design', 'illustration', 'animation'];

    // ── 先讀取 projects.json 取得動態分類與作品清單 ──
    var listUrl = prefix + 'data/projects.json?_t=' + new Date().getTime();
    $.getJSON(listUrl, function (data) {
        var categoriesConfig = (data && data.categories) || [];
        projectsList = (data && data.projects) || [];
        
        if (categoriesConfig.length > 0) {
            folderNames = categoriesConfig.map(function(c) { return c.id; });
            categoriesConfig.forEach(function(c) {
                categoryMap[c.id] = c.name;
            });
        }
        
        startLoadingProject();
    }).fail(function () {
        console.warn('[作品詳細] ⚠️ 無法載入 projects.json，使用靜態預設分類。');
        startLoadingProject();
    });

    function startLoadingProject() {
        var mainUrl = prefix + 'data/projects/' + projectId + '.json?_t=' + new Date().getTime();
        $.getJSON(mainUrl, function (project) {
            renderPage(project, project.category || 'logo-design');
        }).fail(function () {
            tryNextFolder(0);
        });
    }

    function tryNextFolder(index) {
        if (index >= folderNames.length) {
            $('#detailTitle').text('Project Not Found');
            $('body').css('opacity', 1);
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
        var rawCategory = project.category || folder;
        var category = categoryMap[rawCategory] || toDisplayName(rawCategory);
        var subtitle  = project.subtitle ? '<span style="margin-left:6px;">' + project.subtitle + '</span>' : '';
        $('#detailMeta').html(
            '<div><b>Services:</b><span>' + category + subtitle + '</span></div>' +
            '<div><b>Year:</b><span>' + (project.year   || '') + '</span></div>' +
            (project.role ? '<div><b>Role:</b><span>' + project.role + '</span></div>' : '')
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

        // 4. 根據使用者設定，決定是否在內容頁上方顯示列表封面圖
        var cover = fixPath(project.cover_image);
        if (project.show_cover_in_detail === true && cover) {
            var $img = $('#detailCoverImg');
            $img.attr('src', cover).attr('alt', project.title).show();
            
            $img.removeClass('align-left align-center align-right align-contain align-full');
            if (project.cover_align) {
                $img.addClass('align-' + project.cover_align);
            } else {
                $img.addClass('align-full');
            }
        } else {
            $('#detailCoverImg').hide();
        }

        var showBody = function() {
            $('body').css('opacity', 1);
        };
        showBody();

        // 5. 動態積木內容
        var $sections = $('#detailSections');
        $sections.empty();

        if (project.page_blocks && Array.isArray(project.page_blocks)) {
            project.page_blocks.forEach(function (block) {
                if (!block) return;

            // 單張大圖
            if (block.type === 'image_block' && block.image) {
                var alignClass = block.align ? ' align-' + block.align : ' align-full';
                $sections.append(
                    '<div class="sectionItem sectionImage' + alignClass + '">' +
                        '<img src="' + fixPath(block.image) + '" alt="Project Image" />' +
                    '</div>'
                );

            // 文字區塊
            } else if (block.type === 'text_block' && block.text) {
                // 將 Markdown 格式字串轉換為 HTML
                var parsedText = block.text
                    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                    .replace(/\*(.*?)\*/g, '<i>$1</i>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="text-decoration:underline;color:inherit;">$1</a>')
                    .replace(/\n/g, '<br>');
                
                var textAlignClass = block.align ? ' align-' + block.align : ' align-left';
                var $textWrap = $('<div class="sectionItem sectionText' + textAlignClass + '"></div>');
                var $textBody = $('<div class="bodyText"></div>');
                $textBody.html(parsedText);
                $textWrap.append($textBody);
                $sections.append($textWrap);

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
        // 在載入並呈現內容後設定 prev/next
        setupPrevNext(projectId);
    }

    // ── 增加 Previous / Next 連結功能，動態插入到 detail 頁底部 ──
    function setupPrevNext(currentId) {
        var items = projectsList;
        
        // 找出目前的分類資料夾
        var currentFolder = '';
        var pathParts = window.location.pathname.split('/');
        if (pathParts.length >= 2) {
            currentFolder = pathParts[pathParts.length - 2]; // 例如 "illustration"
        }

        // 尋找符合 miniature ID 與目前分類資料夾的索引
        var currentItemIdx = -1;
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === currentId && items[i].folder === currentFolder) {
                currentItemIdx = i;
                break;
            }
        }
        if (currentItemIdx === -1) {
            // 回退：僅依 ID 尋找
            var ids = items.map(function (p) { return p.id; });
            currentItemIdx = ids.indexOf(currentId);
        }

        var prevItem = currentItemIdx > 0 ? items[currentItemIdx - 1] : null;
        var nextItem = currentItemIdx < items.length - 1 ? items[currentItemIdx + 1] : null;

        var $wrapper = $('.project-detail-wrapper');
        if (!$wrapper.length) return;

        var $nav = $wrapper.find('.project-nav');
        if (!$nav.length) {
            $nav = $('<div/>', { 'class': 'project-nav' });
            $wrapper.append($nav);
        }
        $nav.empty();

        function detailHrefFor(item) {
            if (!item) return '#';
            var path = window.location.pathname || '';
            // 如果目前是在 /projects/ 目錄下的個別作品頁（但排除 fallback 用的 detail.html 及 index.html）
            if ((path.indexOf('/projects/') !== -1 || path.indexOf('\\projects\\') !== -1) && 
                path.indexOf('detail.html') === -1 && 
                path.indexOf('index.html') === -1) {
                return '../' + item.folder + '/' + item.id + '.html';
            }
            return prefix + 'projects/' + item.folder + '/' + item.id + '.html';
        }

        if (prevItem) {
            $nav.append($('<a/>', { 'class': 'UI longnext prev', href: detailHrefFor(prevItem) }));
        }
        
        // 中間加入 Back 鏈接
        $nav.append($('<a/>', { 'class': 'back', href: 'javascript:history.back()', text: 'Back' }));
        
        if (nextItem) {
            $nav.append($('<a/>', { 'class': 'UI longnext', href: detailHrefFor(nextItem) }));
        }
    }
});