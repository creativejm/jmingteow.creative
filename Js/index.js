$(function () {
    var allNonFeaturedProjects = [];
    var itemsPerPage = 12;  // 精選不進分頁，12個/頁讓非精選作品更容易觸發pager
    var currentAllWorksPage = 1;

    // ==========================================
    // 自動從 all.json 讀取所有作品清單
    // 新增作品後請到後台「📋 作品清單管理」登錄！
    // ==========================================
    $.getJSON('../data/projects.json?_t=' + new Date().getTime(), function (data) {
        var projectsList = data.projects || [];
        console.log('[列表工人] ✅ projects.json 載入，共 ' + projectsList.length + ' 件作品');

        if (projectsList.length === 0) return;

        var loadedProjects = [];
        var loadedCount = 0;
        var total = projectsList.length;

        projectsList.forEach(function (p) {
            if (!p.id || !p.folder) { onOneDone(); return; }

            // 1. 優先嘗試讀取根目錄下的 flat JSON (data/projects/id.json)
            var mainUrl = '../data/projects/' + p.id + '.json?_t=' + new Date().getTime();
            $.getJSON(mainUrl, function (project) {
                loadedProjects.push({ id: p.id, folder: p.folder, data: project });
                onOneDone();
            }).fail(function () {
                // 2. 備用方案：嘗試舊版的子資料夾路徑 (data/projects/folder/id.json)
                var fallbackUrl = '../data/projects/' + p.folder + '/' + p.id + '.json?_t=' + new Date().getTime();
                $.getJSON(fallbackUrl, function (project) {
                    loadedProjects.push({ id: p.id, folder: p.folder, data: project });
                    onOneDone();
                }).fail(function () {
                    console.warn('[列表工人] ⚠️ 找不到或無法讀取：' + mainUrl + ' 及 ' + fallbackUrl);
                    onOneDone();
                });
            });
        });

        function onOneDone() {
            loadedCount++;
            if (loadedCount >= total) {
                console.log('[列表工人] ✅ 全部載入完成');

                // 按 order 數字小排到大，無設定則預設 99
                loadedProjects.sort(function(a, b) {
                    var orderA = a.data.order !== undefined ? parseInt(a.data.order) : 99;
                    var orderB = b.data.order !== undefined ? parseInt(b.data.order) : 99;
                    return orderA - orderB;
                });

                // 1. 分類所有作品為：精選(featured_all) 與 非精選
                var featuredItems = [];
                var nonFeaturedItems = [];

                loadedProjects.forEach(function(item) {
                    if (item.data.featured_all === true) {
                        featuredItems.push(item);
                    } else {
                        nonFeaturedItems.push(item);
                    }
                });

                // 2. 如果精選作品數量不是 3 的倍數，從一般作品前面拿幾個來補滿，讓排版不留空
                var remainder = featuredItems.length % 3;
                if (remainder !== 0 && nonFeaturedItems.length > 0) {
                    var needed = 3 - remainder;
                    for (var i = 0; i < needed; i++) {
                        if (nonFeaturedItems.length > 0) {
                            // 移出第一個一般作品，加入精選區
                            var fillItem = nonFeaturedItems.shift();
                            featuredItems.push(fillItem);
                        }
                    }
                }

                // 清空 Featured 容器避免殘留
                $('#grid-featured-works').empty();

                // 3. 渲染精選區作品
                featuredItems.forEach(function(item) {
                    renderProjectCard(item.id, item.data, item.folder, true);
                });

                // 4. 其餘一般作品進入 All Works 分頁清單，並渲染到各自分類網格
                allNonFeaturedProjects = nonFeaturedItems;
                allNonFeaturedProjects.forEach(function(item) {
                    renderProjectCard(item.id, item.data, item.folder, false);
                });

                // 檢查精選區是否有卡片，若無則隱藏該區塊，若有則顯示
                if ($('#grid-featured-works .card').length === 0) {
                    $('#featured-works').hide();
                } else {
                    $('#featured-works').show();
                }

                var $activeTab = $('.projects-tabs .tab-list li.active');
                if ($activeTab.length) $activeTab.trigger('click');
            }
        }

    }).fail(function () {
        console.error('[列表工人] ❌ 讀取 all.json 失敗！請確認 data/projects/all.json 存在。');
    });

    function renderProjectCard(projectId, project, folderName, isFeatured) {
        var fixedCover = project.cover_image
            ? project.cover_image
                .replace(/^\.\.\/images\//i, '../Images/')
                .replace(/^images\//i, '../Images/')
            : '';

        var rawCategory = project.category || folderName;
        var displayTag = rawCategory
            .split('-')
            .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
            .join(' ');

        var cardHTML =
            '<div class="card" data-id="' + projectId + '">' +
                '<a href="detail/' + projectId + '.htm">' +
                    '<div class="thumb">' +
                        '<img src="' + fixedCover + '" alt="' + project.title + '" />' +
                    '</div>' +
                    '<div class="info">' +
                        '<h4 class="title">' + project.title + '</h4>' +
                        '<span class="tag">' + displayTag + '</span>' +
                    '</div>' +
                '</a>' +
            '</div>';

        // featured_all 作品：加到 All Works 精選區
        if (isFeatured) {
            $('#grid-featured-works').append(cardHTML);
        }

        // 所有作品都加到各自分類 grid（包含 featured_all）
        var gridSelectorId = '#grid-' + folderName;
        if ($(gridSelectorId).length === 0) {
            console.error('[列表工人] 找不到容器：' + gridSelectorId);
            return;
        }
        $(gridSelectorId).append(cardHTML);
    }

    // ── 渲染分頁 All Works ──
    window.renderAllWorksPage = function(page, shouldScroll) {
        currentAllWorksPage = page;
        var totalPages = Math.ceil(allNonFeaturedProjects.length / itemsPerPage);
        if (totalPages < 1) totalPages = 1;
        if (currentAllWorksPage < 1) currentAllWorksPage = 1;
        if (currentAllWorksPage > totalPages) currentAllWorksPage = totalPages;

        // 精選區永遠只出現在第一頁，且當精選區真的有卡片時才顯示
        if (currentAllWorksPage === 1 && $('#grid-featured-works .card').length > 0) {
            $('#featured-works').show();
        } else {
            $('#featured-works').hide();
        }

        var start = (currentAllWorksPage - 1) * itemsPerPage;
        var end = start + itemsPerPage;
        var pageItems = allNonFeaturedProjects.slice(start, end);

        var $grid = $('#grid-all-works');
        $grid.empty();

        pageItems.forEach(function(item) {
            var fixedCover = item.data.cover_image
                ? item.data.cover_image
                    .replace(/^\.\.\/images\//i, '../Images/')
                    .replace(/^images\//i, '../Images/')
                : '';

            var rawCategory = item.data.category || item.folder;
            var displayTag = rawCategory
                .split('-')
                .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
                .join(' ');

            var cardHTML =
                '<div class="card" data-id="' + item.id + '">' +
                    '<a href="detail/' + item.id + '.htm">' +
                        '<div class="thumb">' +
                            '<img src="' + fixedCover + '" alt="' + item.data.title + '" />' +
                        '</div>' +
                        '<div class="info">' +
                            '<h4 class="title">' + item.data.title + '</h4>' +
                            '<span class="tag">' + displayTag + '</span>' +
                        '</div>' +
                    '</a>' +
                '</div>';
            $grid.append(cardHTML);
        });

        // 渲染分頁按鈕
        var $pager = $('#all-works-pager');
        $pager.empty();

        if (totalPages > 1) {
            var prevClass = 'pager-arrow prev-page' + (currentAllWorksPage === 1 ? ' disabled' : '');
            $pager.append('<span class="' + prevClass + ' UI prev" onclick="renderAllWorksPage(' + (currentAllWorksPage - 1) + ', true)"></span>');

            for (var i = 1; i <= totalPages; i++) {
                var activeClass = i === currentAllWorksPage ? 'active' : '';
                $pager.append('<span class="pager-num ' + activeClass + '" onclick="renderAllWorksPage(' + i + ', true)">' + i + '</span>');
            }

            var nextClass = 'pager-arrow next-page' + (currentAllWorksPage === totalPages ? ' disabled' : '');
            $pager.append('<span class="' + nextClass + ' UI next" onclick="renderAllWorksPage(' + (currentAllWorksPage + 1) + ', true)"></span>');

            // 點擊分頁後，畫面自動跳動到最上面的位置（從頭開始看起）
            if (shouldScroll) {
                setTimeout(function() {
                    $('html, body').animate({ scrollTop: 0 }, 300);
                }, 50);
            }
        }
    };
});