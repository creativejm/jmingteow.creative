$(function () {
    var allNonFeaturedProjects = [];
    var allProjectsItemsPerPage = 15; // All Projects 頁籤每頁顯示數量
    var categoryItemsPerPage = 18;    // 各分類頁籤每頁顯示數量
    var currentAllWorksPage = 1;
    var categoryPages = {}; // Stores page index for each category tab
    var categoryMap = {};
    var loadedProjects = [];

    // ==========================================
    // 自動從 all.json 讀取所有作品清單
    // 新增作品後請到後台「📋 作品清單管理」登錄！
    // ==========================================
    $.getJSON('../data/projects.json?_t=' + new Date().getTime(), function (data) {
        var projectsList = data.projects || [];
        var categoriesConfig = data.categories || [];
        categoriesConfig.forEach(function(c) {
            categoryMap[c.id] = c.name;
        });
        console.log('[列表工人] ✅ projects.json 載入，共 ' + projectsList.length + ' 件作品');

        if (projectsList.length === 0) return;

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

                // 動態從作品資料夾名稱中提取唯一分類
                var categories = [];
                projectsList.forEach(function (p) {
                    if (p.folder && categories.indexOf(p.folder) === -1) {
                        categories.push(p.folder);
                    }
                });

                // 按自訂順序排序，新分類追加在後
                var preferredOrder = categoriesConfig.map(function(c) { return c.id; });
                categories.sort(function(a, b) {
                    var idxA = preferredOrder.indexOf(a);
                    var idxB = preferredOrder.indexOf(b);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return a.localeCompare(b);
                });

                // 清空頁籤並動態追加（保留 All Projects）
                $('.tab-list').empty().append('<li class="active" data-target="all">All Projects</li>');
                
                // 移除原有的動態子分類網格（保留 Featured 和 All Works）
                $('.category-lists').find('.subCategory:not(#featured-works, #all-works-list)').remove();

                categories.forEach(function (cat) {
                    var displayName = categoryMap[cat] || cat
                        .split('-')
                        .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
                        .join(' ');
                    $('.tab-list').append('<li data-target="' + cat + '">' + displayName + '</li>');

                    // 追加對應的網格 HTML 與分頁容器到 .category-lists 內
                    var catHTML =
                        '<div class="subCategory" id="' + cat + '" style="display: none;">' +
                            '<div class="grid" id="grid-' + cat + '"></div>' +
                            '<div class="pager-wrap" id="pager-' + cat + '"></div>' +
                        '</div>';
                    $('.category-lists').append(catHTML);
                });

                // ==================== 頁籤事件與網址 Hash 控制 ====================
                function selectTab(target) {
                    $('.projects-tabs .tab-list li').removeClass('active');
                    $('.projects-tabs .tab-list li[data-target="' + target + '"]').addClass('active');

                    $('.subCategory').hide();

                    if (target === 'all') {
                        $('#featured-works, #all-works-list').fadeIn(300);
                        if ($('#grid-featured-works .card').length === 0) {
                            $('#featured-works').hide();
                        }
                        if (typeof window.renderAllWorksPage === 'function') {
                            window.renderAllWorksPage(1);
                        }
                    } else {
                        $('#' + target).fadeIn(300);
                        // 切換分類時，預設渲染第一頁
                        if (typeof window.renderCategoryPage === 'function') {
                            window.renderCategoryPage(target, 1);
                        }
                    }
                }

                function handleHash() {
                    var hash = window.location.hash.substring(1);
                    
                    // Legacy hash redirect/mapping (e.g. #logo-design -> #logo)
                    if (hash === 'logo-design' && categories.indexOf('logo') !== -1) {
                        hash = 'logo';
                    }

                    var validTargets = ['all'].concat(categories);
                    if (hash && validTargets.indexOf(hash) !== -1) {
                        selectTab(hash);
                        setTimeout(function() {
                            var tabOffset = $('.tab-list').offset().top - 150;
                            $('html, body').animate({ scrollTop: tabOffset }, 300);
                        }, 100);
                    } else {
                        selectTab('all');
                    }
                }

                // 使用事件委派 (Event Delegation) 綁定頁籤點擊事件
                $('.projects-tabs .tab-list').off('click', 'li').on('click', 'li', function() {
                    var target = $(this).data('target');
                    selectTab(target);

                    if (target !== 'all') {
                        history.replaceState(null, null, '#' + target);
                    } else {
                        history.replaceState(null, null, window.location.pathname + window.location.search);
                    }
                });

                $(window).off('hashchange.projects').on('hashchange.projects', function() {
                    handleHash();
                });

                // 1. 分類作品：精選 (featured_all) 區塊 + 全部進分頁 All Projects
                var featuredItems = [];
                var allProjectItems = []; // 所有作品都進入分頁

                loadedProjects.forEach(function(item) {
                    if (item.data.featured_all === true) {
                        featuredItems.push(item);
                    }
                    allProjectItems.push(item); // 全部作品加入分頁清單
                });

                // 2. 如果精選作品數量不是 3 的倍數，補充視覺上的空格（但不移除分頁計數）
                var remainder = featuredItems.length % 3;
                if (remainder !== 0) {
                    var needed = 3 - remainder;
                    // 從非精選中找補格作品（只是視覺加入，不影響 allProjectItems）
                    var nonFeaturedForFill = loadedProjects.filter(function(item) {
                        return item.data.featured_all !== true;
                    });
                    for (var i = 0; i < needed; i++) {
                        if (nonFeaturedForFill.length > i) {
                            featuredItems.push(nonFeaturedForFill[i]);
                        }
                    }
                }

                // 清空 Featured 容器避免殘留
                $('#grid-featured-works').empty();

                // 3. 渲染精選區作品
                featuredItems.forEach(function(item) {
                    renderProjectCard(item.id, item.data, item.folder, true);
                });

                // 4. 全部作品進入 All Projects 分頁清單
                allNonFeaturedProjects = allProjectItems;

                // 檢查精選區是否有卡片，若無則隱藏該區塊，若有則顯示
                if ($('#grid-featured-works .card').length === 0) {
                    $('#featured-works').hide();
                } else {
                    $('#featured-works').show();
                }

                // 根據網址目前的 hash 進行首次頁籤選取
                handleHash();
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
        var displayTag = categoryMap[rawCategory] || rawCategory
            .split('-')
            .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
            .join(' ');

        var crop = project.cover_crop || '';
        var cropClass = crop ? ' crop-' + crop : '';

        var cardHTML =
            '<div class="card" data-id="' + projectId + '">' +
                '<a href="' + folderName + '/' + projectId + '.html">' +
                    '<div class="thumb">' +
                        '<img src="' + fixedCover + '" alt="' + project.title + '" class="' + cropClass.trim() + '" />' +
                    '</div>' +
                    '<div class="info">' +
                        '<h4 class="title">' + project.title + '</h4>' +
                        '<span class="tag">' + displayTag + '</span>' +
                    '</div>' +
                '</a>' +
            '</div>';

        // featured_all 作品：加到 All Projects 精選區
        if (isFeatured) {
            $('#grid-featured-works').append(cardHTML);
        }
    }

    // ── 渲染分頁 All Projects ──
    window.renderAllWorksPage = function(page, shouldScroll) {
        currentAllWorksPage = page;
        var totalPages = Math.ceil(allNonFeaturedProjects.length / allProjectsItemsPerPage);
        if (totalPages < 1) totalPages = 1;
        if (currentAllWorksPage < 1) currentAllWorksPage = 1;
        if (currentAllWorksPage > totalPages) currentAllWorksPage = totalPages;

        // 精選區永遠只出現在第一頁，且當精選區真的有卡片時才顯示
        if (currentAllWorksPage === 1 && $('#grid-featured-works .card').length > 0) {
            $('#featured-works').show();
        } else {
            $('#featured-works').hide();
        }

        var start = (currentAllWorksPage - 1) * allProjectsItemsPerPage;
        var end = start + allProjectsItemsPerPage;
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
            var displayTag = categoryMap[rawCategory] || rawCategory
                .split('-')
                .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
                .join(' ');

            var crop = item.data.cover_crop || '';
            var cropClass = crop ? ' crop-' + crop : '';

            var cardHTML =
                '<div class="card" data-id="' + item.id + '">' +
                    '<a href="' + item.folder + '/' + item.id + '.html">' +
                        '<div class="thumb">' +
                            '<img src="' + fixedCover + '" alt="' + item.data.title + '" class="' + cropClass.trim() + '" />' +
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

    // ── 渲染單一分類分頁 ──
    window.renderCategoryPage = function(category, page, shouldScroll) {
        if (!categoryPages[category]) {
            categoryPages[category] = 1;
        }
        if (page) {
            categoryPages[category] = page;
        }
        var currentPage = categoryPages[category];

        // 篩選出屬於該分類的作品
        var catProjects = loadedProjects.filter(function(item) {
            return (item.folder === category || item.data.category === category);
        });

        var totalPages = Math.ceil(catProjects.length / categoryItemsPerPage);
        if (totalPages < 1) totalPages = 1;
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages) currentPage = totalPages;

        var start = (currentPage - 1) * categoryItemsPerPage;
        var end = start + categoryItemsPerPage;
        var pageItems = catProjects.slice(start, end);

        var $grid = $('#grid-' + category);
        if ($grid.length === 0) return;
        $grid.empty();

        pageItems.forEach(function(item) {
            var fixedCover = item.data.cover_image
                ? item.data.cover_image
                    .replace(/^\.\.\/images\//i, '../Images/')
                    .replace(/^images\//i, '../Images/')
                : '';

            var rawCategory = item.data.category || item.folder;
            var displayTag = categoryMap[rawCategory] || rawCategory
                .split('-')
                .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
                .join(' ');

            var crop = item.data.cover_crop || '';
            var cropClass = crop ? ' crop-' + crop : '';

            var cardHTML =
                '<div class="card" data-id="' + item.id + '">' +
                    '<a href="' + item.folder + '/' + item.id + '.html">' +
                        '<div class="thumb">' +
                            '<img src="' + fixedCover + '" alt="' + item.data.title + '" class="' + cropClass.trim() + '" />' +
                        '</div>' +
                        '<div class="info">' +
                            '<h4 class="title">' + item.data.title + '</h4>' +
                            '<span class="tag">' + displayTag + '</span>' +
                        '</div>' +
                    '</a>' +
                '</div>';
            $grid.append(cardHTML);
        });

        // 渲染分類專屬的分頁按鈕
        var $pager = $('#pager-' + category);
        if ($pager.length === 0) return;
        $pager.empty();

        if (totalPages > 1) {
            var prevClass = 'pager-arrow prev-page' + (currentPage === 1 ? ' disabled' : '');
            $pager.append('<span class="' + prevClass + ' UI prev" onclick="renderCategoryPage(\'' + category + '\', ' + (currentPage - 1) + ', true)"></span>');

            for (var i = 1; i <= totalPages; i++) {
                var activeClass = i === currentPage ? 'active' : '';
                $pager.append('<span class="pager-num ' + activeClass + '" onclick="renderCategoryPage(\'' + category + '\', ' + i + ', true)">' + i + '</span>');
            }

            var nextClass = 'pager-arrow next-page' + (currentPage === totalPages ? ' disabled' : '');
            $pager.append('<span class="' + nextClass + ' UI next" onclick="renderCategoryPage(\'' + category + '\', ' + (currentPage + 1) + ', true)"></span>');

            if (shouldScroll) {
                setTimeout(function() {
                    var tabOffset = $('.tab-list').offset().top - 150;
                    $('html, body').animate({ scrollTop: tabOffset }, 300);
                }, 50);
            }
        }
    };
});