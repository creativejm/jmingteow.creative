/* ============================================================
   PROJECTS.JS
   讀取 /data/projects.json 的作品清單，
   再依各作品 id 讀取 /data/projects/{folder}/{id}.json
   自動產生卡片並插入對應分類的 .grid 裡
   ============================================================ */

$(function () {

  var BASE = '/data/projects/';

  // ==============================
  // 讀取 projects.json 清單
  // ==============================
  fetch('/data/projects.json?_t=' + Date.now())
    .then(function (res) { return res.json(); })
    .then(function (data) {

      var projects = data.projects;
      if (!projects || !projects.length) return;

      // 先把每個分類的 grid 清空
      ['logo-design', 'web-design', 'illustration', 'animation', 'photography'].forEach(function (cat) {
        $('#grid-' + cat).empty();
        $('#allworks-grid-' + cat).empty();
      });

      // 依序讀取每個作品的 JSON，載入後插入卡片
      projects.forEach(function (p) {
        var folder = p.folder;
        var id     = p.id;
        if (!folder || !id) return;

        var jsonUrl = BASE + folder + '/' + id + '.json?_t=' + Date.now();

        fetch(jsonUrl)
          .then(function (res) {
            if (!res.ok) throw new Error('Not found: ' + jsonUrl);
            return res.json();
          })
          .then(function (proj) {
            insertCard(proj, folder, id);
          })
          .catch(function (err) {
            console.warn('⚠️ 無法載入作品：' + id, err);
          });
      });

    })
    .catch(function (err) {
      console.error('❌ projects.json 讀取失敗：', err);
    });


  // ==============================
  // 建立並插入卡片
  // ==============================
  function insertCard(proj, folder, id) {
    var cover = proj.cover_image || '';
    var title = proj.title || id;
    var year  = proj.year  || '';
    var url   = '/projects/' + id + '.html';

    // 修正本地上傳圖片路徑（../images/ → /Images/）
    if (cover && !cover.startsWith('http')) {
      cover = cover.replace(/^\.\.\//,'').replace(/^images\//i,'Images/');
      cover = '/' + cover;
    }

    var card = $(
      '<div class="card" data-id="' + id + '" data-order="' + (proj.order || 99) + '">' +
        '<a href="' + url + '">' +
          '<div class="thumb">' +
            (cover ? '<img src="' + cover + '" alt="' + title + '" loading="lazy" />' : '') +
          '</div>' +
          '<div class="info">' +
            '<h4 class="title">' + title + '</h4>' +
            '<span class="year">' + year + '</span>' +
          '</div>' +
        '</a>' +
      '</div>'
    );

    // 插入到對應分類的 grid，依 order 排序
    var $grid = $('#grid-' + folder);
    if ($grid.length) {
      insertSorted($grid, card, proj.order || 99);
    }
  }


  // ==============================
  // 依 order 值排序插入
  // ==============================
  function insertSorted($grid, $card, order) {
    var $items = $grid.children('.card');
    var inserted = false;

    $items.each(function () {
      var thisOrder = parseInt($(this).data('order')) || 99;
      if (order < thisOrder) {
        $(this).before($card);
        inserted = true;
        return false; // break
      }
    });

    if (!inserted) {
      $grid.append($card);
    }
  }

});
