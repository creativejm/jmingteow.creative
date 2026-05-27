(function($){
    $.fn.Pitloop = function(Option){
        var DefaultObject = {
            direction   : 'opacity', //left,top,right,bottom,opacity
            cubeseat    : false,
            leftClick   : null,
            rightClick  : null,
            pagerBlock  : null,
            autoloop    : true,
            animateTime : 800,
            stayTime    : 5000,
            selectedName: 'selected',
            hoverPause  : true
        },
            Object = $.extend({},DefaultObject,Option);
        var DefaultKVloop = function($target){
            // init
            var anStop = true,
                AnimateType = Object.direction == 'top' || Object.direction == 'bottom' ? 'h' : 'w',
                Count = 0,
                SettingTime,
                SelectClass = '.'+Object.selectedName,
                SelectName = Object.selectedName;
            $target.css({
                'position':'relative'
            })
            var ZoneWidth = 0,ZoneHeight = 0,SignleWidth = $target.outerWidth(),SignleHeight = $target.outerHeight();
            $target.children().each(function(i){
                $(this).data('OrignElement',{'w':Math.round($(this).outerWidth(true)),'h':$(this).outerHeight(true)})
                    .attr('data-queue',i)
                    .css({
                    'position':'absolute',
                    'z-index' :0,
                });
                switch (Object.direction)
                {
                    case 'opacity':
                        $(this).css({
                            'opacity': 0,
                            'left'   : 0,
                            'top'    : 0
                        });
                        break;
                    case 'left':
                        $(this).css({
                            'left'  : ZoneWidth,
                            'top'   : 0
                        });
                        break;
                    case 'top':
                        $(this).css({
                            'top'   : ZoneHeight,
                            'left'  : 0
                        });
                        break;
                    case 'right':
                        $(this).css({
                            'right' : ZoneWidth,
                            'top'   : 0
                        });
                        break;
                    case 'bottom':
                        $(this).css({
                            'bottom': ZoneHeight,
                            'left'  : 0
                        });
                        break;
                    default:
                        $(this).css({
                            'opacity': 0,
                            'left'   : 0,
                            'top'    : 0
                        });
                        break;
                }
                ZoneWidth  += Math.round($(this).outerWidth(true));
                ZoneHeight += $(this).outerHeight(true);
            })
            $target.children(':first').addClass(SelectName).css({'opacity':1,'z-index':1});
            if(Object.cubeseat){
                $target.children(':last').addClass('last');
            }
            if(Object.autoloop){
                SetLoopTime(1);
            }

            Count = $target.children().length;
            function DistanceFun(now,next){
                //console.log($target.attr('class'))
                if(now == 0){
                    if(next == Count - 1){
                        //console.log('A Distance')
                        return false;
                    }else{
                        //console.log('A -Distance')
                        return true;
                    }
                }else if(now == Count -1){
                    if(next == 0){
                        //console.log('B -Distance')
                        return true;
                    }else{
                        //console.log('B Distance')
                        return false;
                    }
                }else if(next > now){
                    //console.log('C -Distance')
                    return true;
                }else{
                    //console.log('C Distance')
                    return false;
                }
            }
            
            function GetCubeDistance(now,next,type){
                var Dis = 0;
                if(Math.abs(now - next) == 1 || (now == 0 && next == Count-1) || (now == Count-1 && next == 0)){
                    var $temp = $target.children(':eq('+next+')');
                    if(!DistanceFun(now*1,next*1)){
                        $temp = $target.children(':eq('+next+')');
                    }else{
                        $temp = $target.children(':eq('+now+')');
                    }
                    Dis = type == 'w' ? $temp.data('OrignElement').w : $temp.data('OrignElement').h;
                }else{
                    if(now < next){
                        for(var g = now ; g < next ; g++){
                            var $temp = $target.children(':eq('+g+')');
                            Dis += type == 'w' ? $temp.data('OrignElement').w : $temp.data('OrignElement').h;
                        }
                    }else{
                        var nowDis = 0;
                        for(var g = now-1 ; g >= next ; g--){
                            var $temp = $target.children(':eq('+g+')');
                            Dis += type == 'w' ? $temp.data('OrignElement').w : $temp.data('OrignElement').h;
                            $temp.css(Object.direction,-Dis);
                        }
                    }
                }
                return Dis;
            }

            function ResizeElement($element){
                $element.data('OrignElement',{'w':Math.round($element.outerWidth(true)),'h':$element.outerHeight(true)})
            }
            $(window).on('resize',function(){
                var r_ZoneWidth = 0
                var r_ZoneHeight = 0
                $target.children().each(function(){
                    ResizeElement($(this));
                    r_ZoneHeight = Math.round(r_ZoneHeight * 1000)/1000
                    r_ZoneWidth = Math.round(r_ZoneWidth * 1000)/1000
                    switch (Object.direction)
                    {
                        case 'opacity':
                            $(this).css({
                                'opacity': 0,
                                'left'   : 0,
                                'top'    : 0
                            });
                            break;
                        case 'left':
                            $(this).css({
                                'left'  : r_ZoneWidth,
                                'top'   : 0
                            });
                            break;
                        case 'top':
                            $(this).css({
                                'top'   : r_ZoneHeight,
                                'left'  : 0
                            });
                            break;
                        case 'right':
                            $(this).css({
                                'right' : r_ZoneWidth,
                                'top'   : 0
                            });
                            break;
                        case 'bottom':
                            $(this).css({
                                'bottom': r_ZoneHeight,
                                'left'  : 0
                            });
                            break;
                        default:
                            $(this).css({
                                'opacity': 0,
                                'left'   : 0,
                                'top'    : 0
                            });
                            break;
                    }
                    r_ZoneWidth  += Math.round($(this).outerWidth(true));
                    
                    r_ZoneHeight += $(this).outerHeight(true);
                })
            })
            //Animate function           
            var Animate = function(index){
                var $now  = $target.children(SelectClass),
                    $next = $target.children(':eq('+index+')'),
                    Distance = AnimateType == 'w' ? $now.data('OrignElement').w : $now.data('OrignElement').h,
                    //S = DistanceFun($now.index(),index) ? -Distance : Distance,
                    S = Distance,
                    nowObj = {},nextObj = {},cubeObj = {};

                if(Object.direction == 'opacity'){
                    nowObj['opacity'] = 0;
                    nextObj['opacity'] = 1;
                }else if(Object.cubeseat){
                    var nextDistance = GetCubeDistance($now.index(),index,AnimateType);
                    if(!DistanceFun($now.attr('data-queue')*1,$next.attr('data-queue')*1)){
                        $next.css(Object.direction,-nextDistance).removeClass('last');
                        if(typeof $next.prev() == 'undefined'){
                            $target.children(':last').addClass('last');
                        }else{
                            $next.prev().addClass('last');
                        }
                        cubeObj[Object.direction] = '+='+nextDistance+'px';
                    }else{
                        cubeObj[Object.direction] = '-='+nextDistance+'px';
                    }
                }else{
                    nowObj[Object.direction] = -S;
                    nextObj[Object.direction] = 0;
                    $next.css(Object.direction,S);
                }
                if(anStop){
                    anStop = false;
                    $now.removeClass(SelectName).css('z-index',0);
                    $next.addClass(SelectName).css('z-index',1);
                    if(Object.cubeseat){
                        $target.children().animate(cubeObj,Object.animateTime,function(){
                            anStop = true;
                            if(DistanceFun($now.attr('data-queue')*1,$next.attr('data-queue')*1) && $(this).index() == Count - 1){
                                var $last = $target.children('.last').removeClass('last');
                                var lastDistance = AnimateType == 'w' ? $last.data('OrignElement').w +$last.position().left : $last.data('OrignElement').h + $last.position().top
                                $now.css(Object.direction,lastDistance);
                                var $temp = $now;
                                for(var g = $now.index()+1 ; g < $next.index() ; g++){
                                    $temp = $target.children(':eq('+g+')');
                                    var prvIndex = g - 1;
                                    lastDistance += AnimateType == 'w' ? $target.children(':eq('+prvIndex+')').data('OrignElement').w : $target.children(':eq('+prvIndex+')').data('OrignElement').h;
                                    $temp.css(Object.direction,lastDistance)
                                }
                                $temp.addClass('last');
                                // if(Object.autoloop){
                                //     var nextClip = index + 1 >= Count ? 0 : index + 1 ;
                                //     SetLoopTime(nextClip);
                                // }
                            }
                        })
                        process();
                    }else{
                        $now.animate(nowObj,Object.animateTime);
                        $next.animate(nextObj,Object.animateTime,function(){
                            anStop = true;
                            if(Object.autoloop){
                                var nextClip = index + 1 >= Count ? 0 : index + 1 ;
                                SetLoopTime(nextClip);
                            }
                        });
                    }
                }
            }

            //control function
            //pager
            if(Object.pagerBlock != null ){
                for(var x = 0;x < $target.children().length ;x++){
                    Object.pagerBlock.append($('<a/>').addClass('pager'));
                }
                Object.pagerBlock.find('a:first').addClass(SelectName);
                Object.pagerBlock.children('a').click(function(event){
                    event.preventDefault();
                    if(!$(this).hasClass(SelectName) && anStop){
                        clearTimeout(SettingTime);
                        Object.pagerBlock.find('a'+SelectClass).removeClass(SelectName);
                        $(this).addClass(SelectName);
                        Animate($(this).index())
                    }
                })
            }
            //right click
            if(Object.rightClick != null){
                Object.rightClick.click(function(event){
                    event.preventDefault();
                    var NextIndex = $target.children(SelectClass).index() + 1 >= Count ? 0 : $target.children(SelectClass).index() + 1;
                    if(anStop){
                        clearTimeout(SettingTime);
                        NextClip(NextIndex);
                    }
                });
            }
            //left click
            if(Object.leftClick != null){
                Object.leftClick.click(function(event){
                    event.preventDefault();
                    var PreIndex = $target.children(SelectClass).index() - 1 < 0 ? Count-1 : $target.children(SelectClass).index() - 1 ;
                    if(anStop){
                        clearTimeout(SettingTime);
                        NextClip(PreIndex);
                    }
                });
            }
            
            if(Object.autoloop && Object.hoverPause){
                $target.hover(function(){
                    clearTimeout(SettingTime);
                },function(){
                    var nextClip = $target.children('.selected').index() + 1 >= Count ? 0 : $target.children('.selected').index() + 1 ;
                    SetLoopTime(nextClip);
                })
            }

            function SetLoopTime(index){
                clearTimeout(SettingTime);
                SettingTime = setTimeout(function(){
                    NextClip(index);
                },Object.stayTime);
            }

            function NextClip(index){
                if(Object.pagerBlock != null){
                    Object.pagerBlock.find('a'+SelectClass).removeClass(SelectName);
                    Object.pagerBlock.find('a:eq('+index+')').addClass(SelectName);
                }
                Animate(index);
            }

            function process(){
                var $pg = $target.parent().find('.progress');
                if($pg != undefined){
                    var w = 100 / $target.children().length;
                    var count = $target.children('.selected').index() 
                    $pg.find('b').css('left',w * count+'%')
                }
            }
        }

        return $(this).each(function() {
            var self = $(this);
            $(window).on('load',function(){
                DefaultKVloop(self);
            })
        })
    }
})(jQuery);