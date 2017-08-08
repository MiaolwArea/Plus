<script>
	// 表格拖拽，列显隐功能 
    var dragGrid = {
        // 默认配置
        defaults: {
            gridBox: '#gridBox',
            ctlCols: '.ctl-cols',
            colsList: '.cols-list',
        },
        // 初始化
        init: function(options){
            // localStorage.clear();
            this.options = $.extend(true, {}, this.defaults, options);
            this.elm = $(this.options.gridBox);
            this.thDOM = this.elm.find('tr>th');
            this.trDOM = this.elm.find('tr[name=div_tr]');
            this.boxPosX = this.elm.offset().left; 
            this.rangeX = 0;
            this.move = false;
            this.colsMap = this._getItem() || (function(_this){
                var columnName = [];
                _this.thDOM.each(function(idx, ele){
                    columnName.push({
                        name: $(this).attr('name'),
                        text: $(this).text(),
                        isShow: true
                    })
                })
                return columnName;
            })(this);
            this.sortColumn();
            this.showHideBycols();
            this.mouseDownAction();
            this.initColSelect();
        },
        _setItem: function(obj){
            localStorage.setItem("columnName", JSON.stringify(obj));
        },
        _getItem: function(){
            return JSON.parse(localStorage.getItem("columnName"));
        },
        // 记忆列重排
        sortColumn: function(){
            var _this = this
                , colsAry = _this.colsMap
                , $th = $('<div></div>')
                , $ths = $('<div><tr></tr></div>')
                , $trdClone = _this.trDOM.clone();

            for(var i = 0; i < colsAry.length; i++){
                var $thh = $('th[name='+ colsAry[i].name +']');

                if(colsAry[i].isShow){
                    $thh.css('display', '');
                    $th.append($thh);
                }else{
                    $thh.hide();
                    $th.append($thh);
                }
            }
            $trdClone.each(function(){
                var _div = '';

                for(var i = 0; i < colsAry.length; i++){
                    var $td = $(this).find('td[name='+ colsAry[i].name +']');

                    if(colsAry[i].isShow){
                        $td.css('display', '');
                        _div += $td[0].outerHTML;
                    }else{
                        $td.hide();
                        _div += $td[0].outerHTML;
                    }
                }
                $(this).html(_div);
            });
            _this.elm.find('thead tr').html($th.find('th')).end().find('tbody').html($trdClone);
            _this.thDOM = _this.elm.find('tr>th');
            _this.trDOM = _this.elm.find('tr[name=div_tr]');
        },
        initColSelect: function(){
            var _this = this, _li = ''
                , colsAry = _this.colsMap;

            for(var i = 0; i < colsAry.length; i++){
                _li += ''
                    + '<li class="list-item">'
                    + '    <input type="checkbox" '+ (colsAry[i].isShow ? 'checked' : '') +' value="'+ colsAry[i].name +'">'
                    + '    <span>'+ colsAry[i].text +'</span>'
                    + '</li>'
            }
            $(_this.options.colsList).append(_li);
            _this.showHide();
        },
        // 控制列显隐
        showHideBycols: function(){
            var _this = this
                , $ctlCols = _this.elm.siblings(_this.options.ctlCols)
                , $colsList = $(_this.options.colsList)
                , left = 0;

            _this.thDOM.on('mouseenter', function(){
                var $this = $(this);
                
                left = $this.offset().left + $this.outerWidth();
                $ctlCols.show().css('left', left - 35);
                $colsList.hide();
            }).on('mouseleave', function(e){
                $ctlCols.hide();
            });
            $('#list_block').on('scroll', function(){
                $ctlCols.hide();
                $colsList.hide();
            })
            $ctlCols.on('mouseenter', function(){
                $ctlCols.show();
            }).on('click', function(){
                event.preventDefault();
                $colsList.show().css('left', left - 167);
                return false;
            });
        },
        // 隐藏控制列
        showHide: function(){
            var _this = this
                , colsMap = _this.colsMap;

            $(_this.options.colsList).find('input').on('click', function(){
                var name = $(this).val()
                    , isChecked = $(this).is(':checked');

                for(var i = 0; i < colsMap.length; i++){
                    if(colsMap[i].name == name){
                        colsMap[i].isShow = isChecked;
                        break;
                    }
                }
                _this.colsMap = colsMap;
                _this.sortColumn();
                _this._setItem(colsMap);
            })
        },
        // 鼠标按下事件
        mouseDownAction: function(){
            var _this = this
                , opt = _this.options;

            this.thDOM.css('position', 'relative');
            _this.thDOM.on('mousedown', function(event){
                event.preventDefault();
                if(event.button == 2 || event.button == 3){
                    return;
                }
                _this.theDiv = $(this);

                // 元素相对位置
                _this.listPosX = _this.theDiv.offset().left;
                // 鼠标相对元素偏移量
                _this.rangeX = event.pageX - _this.listPosX;
                // 元素高宽
                _this.listElmWH = { width: _this.theDiv.outerWidth(), height: _this.theDiv.outerHeight() };
                // 元素最右边界值
                _this.listPosMaxX = _this.listPosX + _this.listElmWH.width;
                // 元素索引
                _this.oldIndexNo = _this.theDiv.index();
                _this.indexNo = _this.theDiv.index();

                _this.move = true;
                // 添加虚线框
                _this.dashDOM = $('<div class="move-dash" style="position: absolute; background-color: #d5ffe8; outline: 2px dashed #9a9a9a; top: 0; left:0; height: '+ (_this.listElmWH.height - 1) +'px;"></div>');
                _this.theDiv.append(_this.dashDOM).css({
                    'position': 'absolute',
                    'z-index': 999,
                    'left': event.pageX - _this.rangeX - _this.boxPosX,
                    'width': _this.listElmWH.width,
                    'height': _this.listElmWH.height,
                    'background-color': '#f2f2f2'
                }).addClass('move');
                _this.mouseMoveAction();
            });
        },
        // 拖拽过程
        mouseMoveAction: function(){
            var _this = this
                , lastPosX = 0;

            $(document).on('mousemove', function(event) {
                if (_this.move){
                    var page_x = event.pageX;

                    lastPosX = page_x - _this.rangeX - _this.boxPosX;
                    // 拖拽元素随鼠标移动
                    _this.theDiv.css({left: lastPosX + 'px'});

                    if(page_x > _this.listPosMaxX){
                        // 插入下一个
                        _this.indexNo++;
                        var nextDOM = _this.thDOM.eq(_this.indexNo);

                        if(nextDOM.hasClass('move')){
                            _this.indexNo++;
                            nextDOM = _this.thDOM.eq(_this.indexNo);
                        }
                        nextDOM.append(_this.dashDOM);
                        _this.listPosX = nextDOM.offset().left - nextDOM.outerWidth();
                        _this.listPosMaxX = nextDOM.offset().left + nextDOM.outerWidth();
                    }
                    if(page_x < _this.listPosX){
                        // 插入上一个
                        _this.indexNo--;
                        var prevDOM = _this.thDOM.eq(_this.indexNo);

                        if(prevDOM.hasClass('move')){
                            _this.indexNo--;
                            prevDOM = _this.thDOM.eq(_this.indexNo);
                        }
                        prevDOM.append(_this.dashDOM);
                        _this.listPosX = prevDOM.offset().left - prevDOM.outerWidth();
                        _this.listPosMaxX = prevDOM.offset().left + prevDOM.outerWidth();
                    }
                }
            }).on('mouseup', function(event) {
                if (_this.move){
                    _this.theDiv.css({
                        'position': 'relative',
                        'z-index': '',
                        'top': '',
                        'left': '',
                        'width': '',
                        'height': '',
                        'background-color': ''
                    }).removeClass('move');
                    _this.dashDOM.remove();   
                    _this.move = false;
                    // 释放排序
                    _this.thDOM.eq(_this.indexNo).before(_this.thDOM.eq(_this.oldIndexNo));
                    _this.trDOM.each(function(idx, elm){
                        var tdList = $(this).find('td');

                        tdList.eq(_this.indexNo + 1).before(tdList.eq(_this.oldIndexNo + 1));
                    });
                    _this.rememberCols();
                }
            });
        },
        // 记忆列
        rememberCols: function(){
            var _this = this;
            _this.thDOM = _this.elm.find('tr>th');
            var columnName = [];
            _this.thDOM.each(function(idx, ele){
                columnName.push({
                    name: $(this).attr('name'),
                    text: $(this).text(),
                    isShow: true
                })
            })
            _this._setItem(columnName);
        }
    }
    dragGrid.init({
        gridBox: '#orderlist',

    });
</script>
