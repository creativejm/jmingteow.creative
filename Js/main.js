$(function(){
    //主要執行js
})
function Silder($targer,child_selector,reFn, m_view=3, m_viewDis=3, infinite=false){
    var s_maxview = m_view;
    var viewDis = m_viewDis;
	var sc_index = 0;
    var orign_count = $targer.find(child_selector).length;
    if(infinite){
        var $first = $targer.find(child_selector+':first');
        var $last = $targer.find(child_selector+':last');
        var $b = $targer.find(child_selector+':gt(-'+(viewDis+1)+')').clone().addClass('copy');
        var temp = viewDis*1
        var $l = $targer.find(child_selector+':lt('+temp+')').clone().addClass('copy') ;
        $first.before($b);
        $last.after($l);
        var tmp = reFn();
        maxview = tmp.m;
        viewDis = tmp.d;
        sc_index = viewDis
    }
    $targer.find('a.prev').fadeTo( "fast", 0 ).css('pointer-events','none');
    $targer.find(child_selector).css('transition','0.8s');
	$targer.find('a.prev').click(function(event){
		event.preventDefault();
		var w = $targer.find(child_selector+':eq(0)').outerWidth(true);
		if(sc_index*1 - viewDis >= 0){
			sc_index = sc_index*1 - viewDis;
			var dis = sc_index * w * -1 ;
			$targer.find(child_selector).css('transform','translateX('+dis+'px)');
		}else if(sc_index*1 - viewDis < 0 && viewDis > 1){
            sc_index = 0;
            var dis = sc_index * w * -1 ;
			$targer.find(child_selector).css('transform','translateX('+dis+'px)');
        }
        $targer.find('a.next').fadeTo( "fast", 1 ).css('pointer-events','');
        if(sc_index == 0){
            $targer.find('a.prev').fadeTo( "fast", 0 ).css('pointer-events','none');
        }else{
            $targer.find('a.prev').fadeTo( "fast", 1 ).css('pointer-events','');
        }
        if(infinite){
            setTimeout(function(){
                infiniteSet(false)
            },800)
        }
	})
	$targer.find('a.next').click(function(event){
		event.preventDefault();
		var w = $targer.find(child_selector+':eq(0)').outerWidth(true);
		if(sc_index*1 + viewDis <= $targer.find(child_selector).length - s_maxview && viewDis == 1){
			sc_index = sc_index*1 + viewDis;
			var dis = sc_index * w * -1;
			$targer.find(child_selector).css('transform','translateX('+dis+'px)');
            if(sc_index*1+ viewDis > $targer.find(child_selector).length - s_maxview){
                $targer.find('a.next').fadeTo( "fast", 0 ).css('pointer-events','none');
            }else{
                $targer.find('a.next').fadeTo( "fast", 1 ).css('pointer-events','');
            }
		}else if(viewDis > 1 && $targer.find(child_selector).length%viewDis >= 1 && sc_index*1 + viewDis <= Math.ceil(($targer.find(child_selector).length - s_maxview)/s_maxview)*s_maxview){
            sc_index = sc_index*1 + viewDis;
			var dis = sc_index * w * -1;
			$targer.find(child_selector).css('transform','translateX('+dis+'px)');
            if(infinite){
                setTimeout(function(){
                    infiniteSet(true)
                },800)
            }

            
            if(sc_index*1 >= Math.ceil(($targer.find(child_selector).length - s_maxview)/s_maxview)*s_maxview){
                $targer.find('a.next').fadeTo( "fast", 0 ).css('pointer-events','none');
            }else{
                $targer.find('a.next').fadeTo( "fast", 1 ).css('pointer-events','');
            }
        }
        $targer.find('a.prev').fadeTo( "fast", 1 ).css('pointer-events','');
        
	})
    function infiniteSet(direction){
        $targer.find(child_selector).css('transition','0s');
        if(sc_index - orign_count > 0 && direction)sc_index = sc_index - orign_count;
        if(sc_index < viewDis && !direction)sc_index = sc_index + orign_count;
        var w = $targer.find(child_selector+':eq(0)').outerWidth(true);
        var dis = sc_index * w * -1;
		$targer.find(child_selector).css('transform','translateX('+dis+'px)');
        setTimeout(function(){
            $targer.find(child_selector).css('transition','0.8s');
        },50)
        process()
    }
    var doit;
    $(window).on('resize',function(){
        var tmp = reFn();
        s_maxview = tmp.m;
        viewDis = tmp.d;
        if(s_maxview == undefined) s_maxview = maxview;
        clearTimeout(doit);
        if($targer.find(child_selector).length > s_maxview){
            doit = setTimeout(function(){
                if(sc_index > $targer.find(child_selector).length - s_maxview ){
                    sc_index = $targer.find(child_selector).length - s_maxview;
                }
                $targer.find(child_selector).stop(true,false);
                var w = $targer.find(child_selector+':eq(0)').outerWidth(true);
                var dis = sc_index * w * -1;
                var fix_index = sc_index%viewDis;
                if(fix_index > 0 && sc_index > viewDis && !infinite){
                    sc_index = sc_index - fix_index;
                }
                $targer.find(child_selector).css('transform','translateX('+dis+'px)');
            }, 500);
        }
    }).trigger('resize');

    function process(){
        var $pg = $targer.find('.progress');
        if($pg != undefined){
            var w = 100 / orign_count ;
            var count = sc_index ;
            $pg.find('b').css('left',w * count+'%')
        }
    }
}
function detectSwipe(element, callback) {
    let startX, startY;

    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });

    element.addEventListener('touchend', (e) => {
        if (!startX || !startY) {
            return;
        }

        let endX = e.changedTouches[0].clientX;
        let endY = e.changedTouches[0].clientY;

        let deltaX = endX - startX;
        let deltaY = endY - startY;

        let direction;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? "right" : "left";
        } else {
            direction = deltaY > 0 ? "down" : "up";
        }

        callback(direction);

        startX = null;
        startY = null;
    });
}

function initVideoPopup() {
    let currentIndex = 0;
    const $items = $('.item.popup');
    const $popup = $('.lightbox');
    const $slider = $('.iframe-slider');
    
    // 創建所有 iframe
    function createIframes() {
        $items.each(function(index) {
            const videoUrl = $(this).attr('href');
            const videoId = $(this).attr('data-yt');
            const vertical = $(this).hasClass('mov2') ? '' : 'vertical-movie';
            const $iframeItem = $('<div>')
                .addClass('iframe-item movie '+vertical)
                .attr('data-index', index)
                .append($('<iframe>')
                    .attr({
                        'src': `https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1`,
                        'frameborder': '0',
                        'allowfullscreen': true
                    })
                );
            $slider.append($iframeItem);
        });
    }

    // 更新按鈕顯示狀態
    function updateButtonVisibility() {
        if (currentIndex === 0) {
            $('.UI.prev').hide();
        } else {
            $('.UI.prev').show();
        }
        
        if (currentIndex === $items.length - 1) {
            $('.UI.next').hide();
        } else {
            $('.UI.next').show();
        }
    }

    // 更新 iframe 位置
    function updateIframePositions() {
        $('.iframe-item').each(function() {
            const index = $(this).data('index');
            if (index === currentIndex) {
                $(this).addClass('current').removeClass('prev next');
            } else if (index < currentIndex) {
                $(this).addClass('prev').removeClass('current next');
            } else {
                $(this).addClass('next').removeClass('current prev');
            }
        });
        updateButtonVisibility();
    }

    // 控制影片播放/暫停
    function toggleVideoPlayback($iframe, shouldPlay) {
        try {
            const player = $iframe[0].contentWindow.postMessage(
                JSON.stringify({
                    'event': 'command',
                    'func': shouldPlay ? 'playVideo' : 'pauseVideo',
                    'args': []
                }), '*'
            );
        } catch (e) {
            console.log('YouTube API error:', e);
        }
    }

    // 重新播放影片
    function replayVideo($iframe) {
        try {
            $iframe[0].contentWindow.postMessage(
                JSON.stringify({
                    'event': 'command',
                    'func': 'seekTo',
                    'args': [0, true]
                }), '*'
            );
            toggleVideoPlayback($iframe, true);
        } catch (e) {
            console.log('YouTube API error:', e);
        }
    }

    // 從 YouTube URL 獲取視頻 ID
    function getYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // 綁定事件處理
    function bindEvents() {
        // 打開彈出視窗
        $('.item.popup').click(function(e) {
            e.preventDefault();
            currentIndex = $(this).index();
            updateIframePositions();
            $popup.addClass('show');
            
            // 重新播放當前影片
            const $currentIframe = $('.iframe-item.current iframe');
            replayVideo($currentIframe);
        });

        // 關閉彈出視窗
        $('.UI.close').click(function() {
            $popup.removeClass('show');
            // 暫停所有影片
            $('.iframe-item iframe').each(function() {
                toggleVideoPlayback($(this), false);
            });
        });

        // 點擊背景關閉
        $popup.click(function(e) {
            // 檢查點擊的元素是否為 iframe 或按鈕
            const $target = $(e.target);
            const isIframe = $target.is('iframe') || $target.closest('iframe').length > 0;
            const isButton = $target.hasClass('UI') || $target.closest('.UI').length > 0;
            
            // 如果不是 iframe 和按鈕，則關閉 lightbox
            if (!isIframe && !isButton) {
                $popup.removeClass('show');
                // 暫停所有影片
                $('.iframe-item iframe').each(function() {
                    toggleVideoPlayback($(this), false);
                });
            }
        });

        // 下一個影片
        $('.lightbox .UI.next').click(function(event) {
            event.preventDefault();
            if (currentIndex < $items.length - 1) {
                // 暫停當前影片
                const $currentIframe = $('.iframe-item.current iframe');
                toggleVideoPlayback($currentIframe, false);
                
                currentIndex++;
                updateIframePositions();
                
                // 重新播放新影片
                const $newIframe = $('.iframe-item.current iframe');
                replayVideo($newIframe);
            }
        });

        // 上一個影片
        $('.lightbox .UI.prev').click(function(event) {
            event.preventDefault();
            if (currentIndex > 0) {
                // 暫停當前影片
                const $currentIframe = $('.iframe-item.current iframe');
                toggleVideoPlayback($currentIframe, false);
                
                currentIndex--;
                updateIframePositions();
                
                // 重新播放新影片
                const $newIframe = $('.iframe-item.current iframe');
                replayVideo($newIframe);
            }
        });
    }

    // 初始化
    function init() {
        createIframes();
        bindEvents();
    }

    // 啟動初始化
    init();
}

function shareFB(url){
    var link = encodeURIComponent(url);
    window.open('https://www.facebook.com/sharer/sharer.php?u='+link,'_blank');
}

async function copyToClipboard(text, fn) {
    try {
        await navigator.clipboard.writeText(text);
        fn();
    } catch (err) {
        console.error('Failed to copy text:', err);
    }
}

$(function () {
 
  // ==============================
  // Header 滾動朦朧效果
  // ==============================
  $(window).on('scroll', function () {
    if ($(this).scrollTop() > 50) {
      $('header').addClass('scrolled');
    } else {
      $('header').removeClass('scrolled');
    }
  });
 
 
  // ==============================
  // Mobile Menu Toggle
  // ==============================
  $('.mobilemenu').on('click', function () {
    $('body').toggleClass('MobileMenuOn');
    $('.mobileMenu').toggleClass('open');
  });
 
  // Close menu on link click
  $('.mobileMenu a').on('click', function () {
    $('body').removeClass('MobileMenuOn');
    $('.mobileMenu').removeClass('open');
  });
 
 
  // ==============================
  // Header active 狀態
  // 根據目前網址自動標記對應的導覽連結
  // ==============================
  var currentPath = window.location.pathname;
 
  $('header nav a, .mobileMenu a').each(function () {
    var linkPath = $(this).attr('href');
    if (currentPath === linkPath || currentPath.indexOf(linkPath) === 0 && linkPath !== '/') {
      $(this).addClass('active');
    }
  });
 
  // ==============================
  // Exhibition Parallax & Cursor Light
  // ==============================
  var $exhibition = $('.exhibition-wrapper');
  if ($exhibition.length > 0) {
    var $cursorLight = $('#cursorLight');
    var heroHeight = $exhibition.height() - $(window).height();

    // Mouse follow light
    $(document).on('mousemove', function(e){
      $cursorLight[0].style.setProperty('--x', e.clientX + 'px');
      $cursorLight[0].style.setProperty('--y', e.clientY + 'px');
    });

    // Scroll parallax
    $(window).on('scroll', function(){
      var scrollTop = $(this).scrollTop();
      var progress = Math.max(0, Math.min(1, scrollTop / heroHeight));
      
      $('.collage-center').css({
         'transform': 'translate(-50%, calc(-50% - ' + (progress * 250) + 'px))',
         'opacity': 1 - (progress * 1.5)
      });
      
      $('.parallax-item').each(function(index){
         var speed = parseFloat($(this).data('speed')) || 0.1;
         var direction = (index % 2 === 0) ? -1 : 1;
         $(this).css({
             'margin-top': -(scrollTop * speed * 3) + 'px',
             'margin-left': (scrollTop * speed * direction * 1.2) + 'px'
         }); 
      });
    });

    // --- Dynamic Music logic is now inside index.htm inline script ---


    // --- Interactive Map & Drawing Journal ---
    var canvas = document.getElementById('journalCanvas');
    if (canvas) {
      var ctx = canvas.getContext('2d');
      var isDrawing = false;
      
      // Match canvas internal resolution to its CSS size
      function resizeCanvas() {
        var rect = canvas.parentElement.getBoundingClientRect();
        // Fallback or explicit dimensions based on CSS (320x320)
        canvas.width = 320;
        canvas.height = 320;
        // Re-apply styles after dimension change clears them
        ctx.strokeStyle = '#3b3731';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      resizeCanvas();
      
      $(canvas).on('mousedown', function(e) {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
      });

      $(canvas).on('mousemove', function(e) {
        if (!isDrawing) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
      });

      $(canvas).on('mouseup mouseleave', function() {
        isDrawing = false;
        ctx.closePath();
      });
    }

  }

});
