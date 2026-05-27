var isMobile = {
    Android: function() { return navigator.userAgent.match(/Android/i) ? true : false; },
    BlackBerry: function() { return navigator.userAgent.match(/BlackBerry/i) ? true : false; },
    iOS: function() { return navigator.userAgent.match(/iPhone|iPod/i) ? true : false; },
    iPad: function() { return navigator.userAgent.match(/iPad/i) ? true : false; },
    Windows: function() { return navigator.userAgent.match(/IEMobile/i) ? true : false; },
    any: function() { return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.iPad() || isMobile.Windows()); }
};
function hoverme($me,$target,classname){
    $me.hover(function(){
        $target.toggleClass(classname);
    },function(){
        $target.toggleClass(classname);
    })
}
function toggleme($me,$target,classname){
    $me.click(function(){
        $target.toggleClass(classname);
    })
}
function scroll2id($who,time,offsetNum){
    if (!offsetNum){offsetNum=0;}
    if (!time){time=1000;}
    if($who.length>0){
        $('html, body').animate({
            scrollTop: $who.offset().top-offsetNum
        }, time, 'swing');
    }
}
function pngMov($target,time,count){
    var $target = typeof $target != 'undefined' ? $target : $('.pngMov');
    var t = (time)? time : 40;
    var c = 999;
    var stopCount = (count)? count : 0;
    $target.each(function(){
        var $this = $(this)
        var height = $(this).height();
        var cd = 0;
        $this.css('background-position','0 -'+height+'px');
        var thisTime = setInterval(function(){
            cd++;
            var thisY = $this.css('background-position').split(" ")[1].split("px")[0];
            var newY = thisY*1-$this.height();
            if(-($this.height()*(c-1)) >= thisY || thisY > 0){
                newY = 0;
            }
            if(stopCount-1 == cd && stopCount !=0){
                clearInterval(thisTime);
            }else{
                $this.css('background-position','0 '+newY+'px');	
            }
        },t)
        })
    $(window).on('resize.pngMov',function(){
        $target.css('background-position','0 0');
    })
}
function slMenu($target,button,bool){
    var clkevent = 'click.slMenu';
    var showBool = false;
    var htmlbool = (bool != undefined)?bool : false;
    $target.hover(function(){
        showBool = false;
    },function(){
        showBool = true;
    })
    $(button).on(clkevent,function(event){
        event.stopPropagation();
        var $this = $(this);
        if(!showBool){
            $this.addClass('selected');
            $target.addClass('show');
            if(htmlbool){
                $('html').on(clkevent+'.menu',function(){
                    if(showBool){
                        $('html').off(clkevent+'.menu');
                        $this.removeClass('selected');
                        $target.removeClass('show');
                        showBool = false;
                    }
                });
            }
            showBool = true;
        }else{
            if(htmlbool){
                $('html').off(clkevent+'.menu');
            }
            $this.removeClass('selected');
            $target.removeClass('show');
            showBool = false;
        }
    })
}
function wheelchange($target,sit,mark){
    var mark = mark || new Date().getTime();
    var newarray = [];
    for(var y=0;y<sit.length;y++){
        var num = sit[y][0].toString();
        newarray.push(parseInt(num));
        $target.removeClass(sit[y][1]);
    }
    var orgclass = $target.attr('class');
    $(document).off('scroll.wheelchange_'+mark);
    $(document).on('scroll.wheelchange_'+mark,function(){
        for(var x=0;x<newarray.length;x++){
            var minl = (x == newarray.length-1)?$(document).height()-$(window).height():newarray[x+1];				
            if($(document).scrollTop() < minl && $(document).scrollTop() >= newarray[x]){
                if(!$target.hasClass(sit[x][1])){
                    $target.removeAttr('class').addClass(orgclass+' '+sit[x][1]);
                }
            }else if($(document).scrollTop() < newarray[0]){
                $target.removeAttr('class').addClass(orgclass);
            }else if($(document).scrollTop() == $(document).height()-$(window).height()){
                $target.removeAttr('class').addClass(orgclass+' '+sit[newarray.length-1][1]);
            }
        }
    }).trigger('scroll.wheelchange_'+mark);
}
function addNum($target,end,time){
    $('<li/>').appendTo($('body')).css({'width':0,'opacity':0,'position':'fixed','bottom':0,'z-index':0,'display':'none'}).animate({'width':end},{
        step:function(now,fx){
            $target.html(Math.round(now));
        },
        duration: time,
        easing : 'swing',
        complete:function(){
            $(this).remove();
        }
    })
}
function devScroll(){
    var temp = "<div style='position:fixed;top:0;display:inline-block;background-color:rgba(255,255,255,1);'>scrollTop=<span id='scll'>0( 0 %)</span></div>"
    $('body').append(temp);
    $(window).on('scroll.devScroll',function(){
        var persent = $(window).scrollTop() / ($(document).height()-$(window).height())*100
        $('#scll').html($(window).scrollTop()+"( "+Math.floor(persent)+" %)");
    })
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires +"; path=/";
}
function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
function beforetime(date){
    var now = new Date();
    console.log(now.getTime() + ' $$ '+ date.getTime());
    if(now.getTime() <= date.getTime()){
        return true;
    }else{
        return false;
    }
}
function aftertime(date){
    var now = new Date();
    console.log(now.getTime() + ' $$ '+ date.getTime());
    if(now.getTime() >= date.getTime()){
        return true;
    }else{
        return false;
    }
}
function duringtime(start,end){
    var now = new Date();
    if(now.getTime() >= start.getTime() && now.getTime() < end.getTime()){
        return true;
    }else{
        return false;
    }
}
function comparison(timeA,timeB){
    var A = new Date(timeA.toLocaleDateString());
    var B = new Date(timeB.toLocaleDateString());
    if(A.getTime() < B.getTime()){
        return -1;
    }else if(A.getTime() > B.getTime()){
        return 1;
    }else if(A.getTime() == B.getTime()){
        return 0;
    }
}
function snap($targer,offset){
    var orgScroll = 0;
    var offsetArea = offset == undefined ? 50 : offset;
    $(window).on('scroll.snap',function(){
        var scrolltop = $(window).scrollTop();
        $targer.each(function(){
            if($(this).offset().top - scrolltop > 0 && $(this).offset().top - scrolltop < offsetArea && orgScroll < scrolltop ){
                $(window).scrollTop($(this).offset().top);
            }else if(scrolltop - $(this).offset().top > 0 &&scrolltop - $(this).offset().top < offsetArea && orgScroll > scrolltop){
                $(window).scrollTop($(this).offset().top);
            }
        })
        orgScroll = scrolltop;
    })
}
function isValidDate2(s) {
    var bits = s.split('/');
    var y = bits[0],
        m = bits[1],
        d = bits[2];
    // Assume not leap year by default (note zero index for Jan)
    var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // If evenly divisible by 4 and not evenly divisible by 100,
    // or is evenly divisible by 400, then a leap year
    if ((!(y % 4) && y % 100) || !(y % 400)) {
        daysInMonth[1] = 29;
    }
    return !(/\D/.test(String(d))) && d > 0 && d <= daysInMonth[--m]
}

function getBrowserWidth() {
    if (/msie/.test(navigator.userAgent.toLowerCase())) {
        return document.compatMode == 'CSS1Compat' ? document.documentElement.clientWidth :
        document.body.clientWidth;
    } else {
        return self.innerWidth;
    }
}
function messageadd(msg,txt){
    if(txt != ''){
        if (msg != ''){ 
            msg +='<div style="padding:3px;"> * ';
            return msg + txt + '</div>'; 
        } else {
            txt='<div style="padding:3px;"> * '+txt+'</div>';
            return txt;
        };
    } else { return msg; };
};
function getIEVersion() {
    var rv = -1;
    if (navigator.appName == 'Microsoft Internet Explorer')
    {
        var ua = navigator.userAgent;
        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            rv = parseFloat( RegExp.$1 );
    }
    else if (navigator.appName == 'Netscape')
    {
        var ua = navigator.userAgent;
        var re  = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");  //for IE 11
        if (re.exec(ua) != null)
            rv = parseFloat( RegExp.$1 );
    }
    return rv;
}
var ZoomChecked = function(){
    var temp = 0;
    var temp2 = 0; 
    if(navigator.userAgent.match("Chrome") == "Chrome" && navigator.userAgent.match("Safari") == "Safari"  ){// chrome
        temp =window.devicePixelRatio;
    }else if(navigator.userAgent.match("NET") == "NET" || navigator.userAgent.match("MSIE") == "MSIE"){
        temp = screen.deviceXDPI  / screen.logicalXDPI;
    }else if(navigator.userAgent.match("Firefox") == "Firefox"){
        temp = window.devicePixelRatio;
    }else if(navigator.userAgent.match("Mac") == "Mac"){//mac的safari
        temp = window.outerWidth / window.innerWidth;
    }else if(navigator.userAgent.match("Safari") == "Safari"){//window的 safari
        temp = (window.outerWidth-8) / window.innerWidth;
        temp2 = (window.outerWidth-16) / window.innerWidth;
    }	
    if(temp != 1 && temp2 != 1){
        return true;
    }else{
        return false;	
    }
}

// baseBrowserTest 瀏覽器偵測（舊版,保留但不續用)
function baseBrowserTest(support){
    if((support.line != undefined) && support.line){
        var line  = navigator.userAgent.match(/Line/i) ? true : false;
        if(line && (isMobile.iOS() || isMobile.iPad())){
            var img = $("<div/>").addClass("mbk");
            $('body').append(img);
        }
    }
    var msg='';
    var txt='';
    var errNum=0;
    if((support.pc == undefined)||(support.pc == false && support.mobile == false)){support.pc=true;};
    if(support.mobile == undefined){support.mobile=true;};
    if((support.ie == undefined)||(support.ie < 7)){support.ie=11;};
    if((support.ie != undefined) && getIEVersion()>0){
        txt='您的IE版本太舊(最低需求IE'+support.ie+'以上)，如遇瀏覽上的困難，請用新版IE或是其他的瀏覽器(推薦使用Chrome,Firefox,Safari)來檢視,謝謝。';
        if (getIEVersion()<support.ie){
            if (getIEVersion()==6){
                alert(txt);
            } else {
                msg = messageadd(msg,txt);txt='';errNum++;
            }
        }
    };
    if(!isMobile.any() && ZoomChecked()){
        // 不支援mobile, 檢視縮放大小
        txt="您的瀏灠器頁面檢視縮放並非為最佳的瀏覽比例，請調整到100%來做檢視！";
        msg = messageadd(msg,txt);txt='';errNum++;
    };
    if(support.base_w != undefined && !isMobile.any()){
        // 螢幕解析度
        txt=(support.base_w > getBrowserWidth())?'本網頁最佳瀏覽解析度寬度為'+support.base_w+'px，但您目前視窗寬度為<span id="nowBrowserWidth">'+getBrowserWidth()+'</span>px，請將您的瀏覽視窗寬度拉大。':'';
        msg = messageadd(msg,txt);txt='';errNum++;
    };
    if(!support.pc){
        // 不支援PC, 預設為支援
        txt=(!isMobile.any())?'這個網頁設計並非專為個人電腦瀏覽設計，請用行動裝置瀏覽。':'';
        msg = messageadd(msg,txt);txt='';errNum++;
    };
    if(!support.mobile){
        // 不支援行動裝置
        txt=(isMobile.any())?'這個網頁設計並未替行動裝置做最佳瀏覽設計，請用個人電腦檢視來獲得最佳瀏覽體驗。':'';
        msg = messageadd(msg,txt);txt='';errNum++;
    };
    if (msg !='' && getCookie('ErrorMessage') != 1){ 
        $('body').prepend('<div class="messagebox alert"><div class="closemessagebox">X</div><div class="sorry" >很抱歉，必須提醒您...<div class="note">'+msg+'</div></div></div>');
        $('.messagebox').slideDown(200);
        $(window).on('resize.browsertest', function(){
            $('#nowBrowserWidth').text(getBrowserWidth());
            if (getBrowserWidth()>support.base_w && errNum <2){
                $('.messagebox').slideUp(100);
            };
        });
        $('.closemessagebox').click(function() {
            $('.messagebox').slideUp(100);
            setCookie('ErrorMessage', 1, 3)
        });
    };
};

// meta vieport min-width 套用
(function() {
    var viewport = document.querySelector("meta[name=viewport]");
    if (viewport) {
        var content = viewport.getAttribute("content");
        var parts = content.split(",");
        for (var i = 0; i < parts.length; ++i) {
            var part = parts[i].trim();
            var pair = part.split("=");
            if (pair[0] === "min-width") {
                var minWidth = parseInt(pair[1]);
                if (screen.width < minWidth) {
                    document.head.removeChild(viewport);
                    var newViewport = document.createElement("meta");
                    newViewport.setAttribute("name", "viewport");
                    newViewport.setAttribute("content", "width=" + minWidth+", user-scalable=0");
                    document.head.appendChild(newViewport);
                    break;
                }
            }
        }
    }
})();
$(function(){
	// 修正手機版100vh, 改用 var(--100vh)替代
    !(function (n, e) {
    	function setViewHeight() {
    		var windowVH = e.innerHeight;
    		n.documentElement.style.setProperty('--100vh', windowVH + 'px');
    	}
    	var i = 'orientationchange' in window ? 'orientationchange' : 'resize';
    	n.addEventListener('DOMContentLoaded', setViewHeight);
    	e.addEventListener(i, setViewHeight);
    })(document, window)
});