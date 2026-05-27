(function($){
    /*手機狀置判斷*/
    var DetectMobile = function(){
        if( navigator.userAgent.match(/Android/i)|| navigator.userAgent.match(/webOS/i)|| navigator.userAgent.match(/iPhone/i)|| navigator.userAgent.match(/iPad/i)|| navigator.userAgent.match(/iPod/i)|| navigator.userAgent.match(/BlackBerry/i)|| navigator.userAgent.match(/Windows Phone/i))
        {
            return true;
        }else{
            return false;
        }
    }
    /*觸控滑動方向判斷*/
    
    $.fn.Loopwallpaper = function(Option){
        var $wall = $(this);
        var Object = {
            //animation option
            direction:'opacity',// left,top,opacity
            time:5000,
            easetime:800,
            easing:'linear',
            autoloop:true,
            hoverPause:false,
            animate:{
                CssorJS:false,//動畫操作，true使用css，false使用js
            },
            //button option
            Buttons:{
                left:null,
                right:null
            },
            //wallpaper option
            selectClass:'selected',
            //pager option
            Pager:{
                target:null,
                element:'a',
                className:'pager',
                selectClass:'selected'
            },
            //callback option
            /*Callback:{
                beforeRun:null,
                afterRun:null
            },*/
            //touchswipe option
            /*TouchSwipe:{
                withFinger:false,
                triggerRange:50,
                Finger:'all'
            }*/
        };

        function WallLoop(){
            var self = this;
            self.option = $.extend({},Object,Option);
            self.anStop = true;
            self.timestamp;
            self.actionDistance = this.option.direction == 'top' ? $wall.outerHeight() : $wall.outerWidth();
            //Pager setting
            if(self.option.Pager.target != null){
                var $t = self.option.Pager.target;
                for(var i = 0;i < $wall.children().length;i++){
                    $t.append('<'+self.option.Pager.element+' class="'+self.option.Pager.className+'"></'+self.option.Pager.element+'>');
                }
                $t.children(':first').addClass(self.option.Pager.selectClass);
                $t.children().click(function(){
                    if(!$(this).hasClass(self.option.Pager.selectClass)){
                        var i = $(this).index();
                        clearInterval(self.timestamp);
                        var prvWall = $t.children('.'+self.option.Pager.selectClass).index() > i ;
                        self.Animate(i,prvWall);
                    }
                })
            }
            //auto loop & hover setting 
            if(self.option.hoverPause && self.option.autoloop && !DetectMobile()){
                $wall.get(0).addEventListener('mouseover',function(event){
                    clearInterval(self.timestamp);
                })
                $wall.get(0).addEventListener('mouseleave',function(event){
                    self.nextRound();
                })
            }
            //button setting
            if(self.option.Buttons.right != null){
                self.option.Buttons.right.click(function(){
                    self.rightClick();
                })
            }
            if(self.option.Buttons.left != null){
                self.option.Buttons.left.click(function(){
                    self.leftClick();
                })
            }

            self.Init();
        }

        WallLoop.prototype = {
            Init:function(){
                var self = this;
                $wall.css('position','relative');
                $wall.children().each(function(i){
                    var $child = $(this);
                    $child.attr('data-No',i).css({'position':'absolute','left':0,'top':0});
                    switch (self.option.direction)
                    {
                        case 'opacity':
                            $child.css('opacity',0);
                            if(i == 0){
                                $child.css('opacity',1);
                            }
                            break;
                        default:
                            $child.css(self.option.direction,i*self.actionDistance);
                            break;
                    }
                    if(i == 0){
                        $child.addClass(self.option.selectClass);
                    }
                    if($child.find('video').length == 1){
                        $child.find('video').get(0).onended =function(){
                            self.Animate(self.checkIndex($child.attr('data-No'),'next'))
                        }
                    }
                })
                if(DetectMobile()){
                    var dir = self.option.direction;
                    TouchSwip($wall,function(direction,distance){
                        clearInterval(self.timestamp);
                        if(dir == 'left' || dir == 'right' || dir == 'opacity'){
                            if(direction == 'LEFT'){
                                self.leftClick();
                            }else if(direction == 'RIGHT'){
                                self.rightClick();
                            }
                        }else if(dir == 'top' || dir == 'bottom'){
                            if(direction == 'DOWN'){
                                self.rightClick();
                            }else if(direction == 'UP'){
                                self.leftClick();
                            }
                        }
                    })
                }
                if(self.option.autoloop){
                    var $first = $wall.children(':first');
                    if( $first.find('video').length== 1){
                        var $v = $first.find('video').get(0);
                        $v.play();
                    }else{
                        self.nextRound();
                    }
                }
                $(window).on('resize',function(){
                    self.actionDistance = self.option.direction == 'top' ? $wall.outerHeight() : $wall.outerWidth();
                })


            },
            Animate:function(index,left){
                var self = this;
                if(typeof left == 'undefined'){
                    left = false;
                }
                if(self.option.Pager.target != null){
                    self.changePager(self.option.Pager.target.children(':eq('+index+')'),index);
                }
                var $next = $wall.children(':eq('+index+')');
                var $now = $wall.children('.'+self.option.selectClass);
                if( $now.find('video').length == 1){
                    $now.find('video').get(0).pause();
                }

                if(self.option.animate.CssorJS){
                    $next.addClass(self.option.selectClass);
                    $now.removeClass(self.option.selectClass);
                    self.anStop = true;
                }else{
                    var nowObj={},nextObj={};
                    if(self.option.direction != 'opacity'){
                        if(left){
                            $next.css(self.option.direction,self.actionDistance*-1);
                            nowObj[self.option.direction] = '+='+self.actionDistance;
                            nextObj[self.option.direction] = '+='+self.actionDistance;
                        }else{
                            $next.css(self.option.direction,self.actionDistance);
                            nowObj[self.option.direction] = '-='+self.actionDistance;
                            nextObj[self.option.direction] = '-='+self.actionDistance;
                        }
                    }else{
                        nowObj[self.option.direction] = 0;
                        nextObj[self.option.direction] = 1;
                    }

                    $now.stop().animate(nowObj,self.option.easetime,self.option.easing,function(){
                        $(this).removeClass(self.option.selectClass);
                        if($now.find('video').length== 1){
                            var $v = $now.find('video').get(0);
                            $v.currentTime = 0;
                        }
                    });
                    $next.stop().animate(nextObj,self.option.easetime,self.option.easing,function(){
                        $(this).addClass(self.option.selectClass);
                        self.anStop = true;
                        
                        if(self.option.autoloop){
                            if($next.find('video').length== 1){
                                var $v = $next.find('video').get(0);
                                $v.play();
                            }else{
                                self.nextRound();
                            }
                            
                        }
                    });
                }
            },
            rightClick:function(){
                //下一個
                if(this.anStop){
                    var now = $wall.children('.'+this.option.selectClass).attr('data-No');
                    this.anStop = false;
                    clearInterval(this.timestamp);
                    this.Animate(this.checkIndex(now,'next'));
                }
            },
            leftClick:function(){
                //上一個
                if(this.anStop){
                    var now = $wall.children('.'+this.option.selectClass).attr('data-No');
                    this.anStop = false;
                    clearInterval(this.timestamp);
                    this.Animate(this.checkIndex(now,'prev'),true);   
                }
            },
            nextRound:function(){
                var d = new Date();
                var self = this;
                var now = $wall.children('.'+self.option.selectClass).attr('data-No');
                clearInterval(self.timestamp);
                if(self.option.autoloop && self.anStop){
                    self.timestamp = setTimeout(function(){
                        self.anStop = false;
                        self.Animate(self.checkIndex(now,'next'));
                    },self.option.time)
                }
            },
            checkIndex:function(index,way){
                var number = index;
                switch (way){
                    case 'next':
                        if(index*1 + 1 >= $wall.children().length){
                            number = 0;
                        }else{
                            number = index*1 + 1 ;
                        }
                        break;
                    case 'prev':
                        if(index*1 - 1 < 0){
                            number = $wall.children().length - 1;
                        }else{
                            number = index*1 - 1 ;
                        }
                        break;
                    default:
                        break;
                }
                return number;
            },
            changePager:function($this,index){
                var self = this;
                var $t = self.option.Pager.target;
                $t.children().removeClass(self.option.Pager.selectClass);
                $this.addClass(self.option.Pager.selectClass);

            }
        }

        return $(this).each(function() {
            var temp = new WallLoop();
        })
    }

})(jQuery)

var TouchSwip = function($target,fn){
    var startPoint,endPoint,direction,distance;
    var range = 100;
    var scrolling = false;
    function unify(e){return e.changedTouches ? e.changedTouches[0] : e}
    $target.get(0).addEventListener('touchstart', function(event){
        startPoint = unify(event);
        scrolling = true;
    }, false);
    $target.get(0).addEventListener('touchend', function(event){
        endPoint = unify(event);
        var x = startPoint.clientX - endPoint.clientX;
        var y = startPoint.clientY - endPoint.clientY;
        if(Math.abs(x) >= range || Math.abs(y) >= range){
            if(Math.abs(x) > Math.abs(y)){
                distance = Math.abs(x);
                if(x < 0){
                    direction = 'LEFT';
                }else{
                    direction = 'RIGHT';
                }
            }else{
                distance = Math.abs(y);
                if(y < 0){
                    direction = 'UP';
                }else{
                    direction = 'DOWN';
                }
            }
        }
        scrolling = true;
        fn(direction,distance);
    }, false);
}