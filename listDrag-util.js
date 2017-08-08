/*
 * 拖拽插件
 * author: Leven 2017/07/26
 * params {String} listItem 拖拽子列 (必须)
 * params {Function} onMouseUpCallback 拖拽完成后续操作
 * 用法: $(seletor).listDrag({ listItem: [className], onMouseUpCallback: [function] })
 */
(function ($, window, document, undefined) {
    $.fn.listDrag = function (options) {
        var args = arguments
            , result = void 0;

        if (this.length == 0)
            return this;

        this.each(function () {
            var thisEle = this
                , instance = $(thisEle).data('listDrag');

            if (!instance) {
                instance = new $.listDrag(thisEle, options);
                $(thisEle).data('listDrag', instance);
            }
        });
        return void 0 === result ? this : result;
    };

    $.listDrag = function(selsector, configs){
        this.options = $.extend(true, {}, $.listDrag.defaults, configs);
        this.Elm = $(selsector);
        this.listElm = this.Elm.find('.' + this.options.listItem);
        this.range = { x: 0, y: 0 };//鼠标元素偏移量
        this.tarPos = { x: 0, y: 0, x1: 0, y1: 0 }; //目标元素对象的坐标初始化
        this.boxPos = { x: this.Elm.offset().left, y: this.Elm.offset().top };
        this.theDiv = null;
        this.colCount = null;
        this.move = false;//拖拽对象 拖拽状态
        this.mouseDownAction();
    }
    $.listDrag.prototype = {
        mouseDownAction: function(){
            var _this = this;

            this.Elm.css('position', 'relative');
            _this.listElm.on('mousedown', function(event){
                event.preventDefault();
                if(event.button == 2 || event.button == 3 || event.target.className == 'del-icon'){
                    return;
                }
                _this.theDiv = $(this);

                _this.listPos = { x: _this.theDiv.offset().left, y: _this.theDiv.offset().top }
                _this.listElmWH = { width: _this.theDiv.outerWidth(), height: _this.theDiv.outerHeight() }

                if(_this.colCount == null){
                    _this.colCount = _this.Elm.outerWidth() / _this.listElmWH.width
                }

                //鼠标元素相对偏移量
                _this.range.x = event.pageX - _this.theDiv.offset().left;
                _this.range.y = event.pageY - _this.theDiv.offset().top;

                _this.theDivId = _this.theDiv.index();
                _this.theDivHeight = _this.theDiv.height();
                _this.theDivHalf = _this.theDivHeight/2;
                _this.move = true;

                // _this.theDiv.removeClass(_this.options.listItem);
                _this.cloneDOM = _this.theDiv.clone(true);
                _this.cloneDOM.css({'opacity': .4});
                _this.theDiv.css({
                    'position': 'absolute',
                    'z-index': 999,
                    'left': event.pageX - _this.range.x - _this.boxPos.x,
                    'width': _this.listElmWH.width,
                    'height': _this.listElmWH.height
                }).before(_this.cloneDOM);
            });
            _this.mouseMoveAction();
        },
        mouseMoveAction: function(){
            var _this = this
                , lastPos = { x: 0, y: 0, x1: 0, y1: 0 }
                , posNumX = 0, posNumY = 0, index = 0;

            $(document).on('mousemove', function(event) {
                if (_this.move){
                    lastPos.x = event.pageX - _this.range.x - _this.boxPos.x;
                    lastPos.y = event.pageY - _this.range.y - _this.boxPos.y;
                    lastPos.y1 = lastPos.y + _this.theDivHeight;

                    posNumX = (event.pageX - _this.boxPos.x - _this.range.x) / _this.listElmWH.width;
                    posNumY = Math.round((event.pageY - _this.boxPos.y - _this.range.y) / _this.listElmWH.height);

                    if(posNumX < 0 && posNumY == 0){
                        _this.listElm.eq(0).before(_this.cloneDOM)
                    }else{
                        if(index != ((Math.ceil(posNumX) + _this.colCount * posNumY) - 1)){
                            _this.listElm.eq((Math.ceil(posNumX) + _this.colCount * posNumY)- 1).after(_this.cloneDOM);
                            index = (Math.ceil(posNumX) + _this.colCount * posNumY) - 1;
                        }
                    }
                    // 拖拽元素随鼠标移动
                    _this.theDiv.css({left: lastPos.x + 'px',top: lastPos.y + 'px'});
                }
            }).on('mouseup', function(event) {
                if (_this.move){
                    _this.theDiv.css({
                        'position': '',
                        'z-index': '',
                        'left': '',
                        'top': '',
                        'width': '',
                        'height': ''
                    });
                    _this.cloneDOM.before(_this.theDiv).remove();
                    _this.move = false;
                    // callback
                    _this.options.onMouseUpCallback(_this.Elm);
                }
            });
        }
    }
    // 默认配置参数
    $.listDrag.defaults = {
        listItem: '.list-item',
        onMouseUpCallback: $.noop()
    };
})(jQuery, window, document);