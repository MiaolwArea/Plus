/*
 * author: Leven
 * 依赖于 JQuery 1.8+
 * Create 18/10/2016
 * demo
 * 使用: $('#dropInput').autoSelected({
 * 			value: '',
 * 			colModels: [],
 * 			data: customerInfo
 * 		});
 * 参数查看: $('#dropInput').autoSelected().defaults
 * 插件销毁：$('#dropInput').autoSelected('destroy')
 * 样式问题: 多个下拉选框需找到对应的autoSelectedDrop来定位编写样式；单个用内部私有类名: autoSelectedDropBox
 */
(function ($, window, document, undefined) {
    'use strict';

    // 外部参数
    var pluginName = 'autoSelected'
        , defaults = {
        value: '',                          // 选中后需要提交的字段值（必须）
        colModels: [],                      // 下拉自定义展示数据列，注意顺序（必须）
        data: [],                           // 下拉数据
        ajaxOption: {                       // ajax请求配置，需要data配置为空或不配置时生效
            url: '',
            data: {},
            onceRequest: true               // 点击下拉显示是否只请求一次或多次
        },
        class: null,                        // 自定义传入下拉框的样式类
        positionRefer: null,                // 相对定位位置元素，优先级次于直接left和top
        width: null,                        // 自定义下拉宽度
        height: 200,                        // 下拉控件最大高度
        left: 0,							// 下拉控件左偏移
        top: 0,								// 下拉控件顶部偏移
        afterSelectedRow: $.noop(),         // 选中后触发callback事件
        afterInput: $.noop()                // 初始化, 后续事件动作(性能考虑,目前只针对input为空之后的处理)
    };

    // 私有属性
    var _param = {
        _tempClass: 'autoSelectedDrop',
        _plusClass: 'autoSelectedDropBox',
        _firstAction: true
    };
    $.fn.autoSelected = function (options) {
        // 主要针对销毁功能
        if (typeof options == 'string') {
            var args = arguments,
                method = options;

            Array.prototype.shift.call(args);
            return this.each(function() {
                var instance = $(this).data(pluginName);

                // 危险操作！！能够调用内部私有方法
                if (instance && instance[method])
                    instance[method].apply(instance, args);
            });
        }

        // 暴露插件的默认配置
        this.defaults = defaults;
        options = $.extend(true, {}, defaults, options);
        return this.each(function () {
            var thisEle = this
                , instance = $(thisEle).data(pluginName);
            // 如果没有保存实例
            if (!instance) {
                instance = new autoSelected(thisEle, options);
                $(thisEle).data(pluginName, instance);
            }
        });
    };
    // 构造主函数
    function autoSelected(selsector, configs) {
        this.ElmThis = selsector;
        this.Elm = $(selsector);
        this._rowIdArry = [];
        this.modifiedValue = false;             // 是否修改了input的值
        this.options = configs;
        this._init.apply(this, arguments);
    }
    autoSelected.prototype = {
        _init: function(){
            this.isChangeId();
            this.appendData();
            this.getInfo();
        },

        isChangeId: function(){
            if($('.'+ _param._tempClass).length > 0){
                this._tempClass = _param._tempClass + '_' + $('.'+ _param._plusClass).length;
            }else{
                this._tempClass = _param._tempClass;
            }
        },

        getInfo: function(){
            var _this = this
                , values = '';

            this.Elm.attr('autocomplete', 'off').on('click', function(){
                values = $(this).val();
                if(!_this.modifiedValue)
                    _this.valArray = (values == '' ? [] : $(this).val().split(','));

                if(!_this.options.ajaxOption.onceRequest){
                    _this.InfoXHR();
                }

                _this._liHtml(_this.dataInfo);
                _this.setValue(values);
                if(typeof values == 'string' && values != '' && _this.valArray != '' && values != _this.valArray){
                    _this.setValue(values);
                }
                if(_param._firstAction){
                    _this.setValue(values);
                    _param._firstAction = false;
                }
                _this.show();
            });

            _this.InfoXHR();
        },

        setValue: function(values){
            var _this = this
                , valArry = values.split(',')
                , colModelInfo = _this.options.colModels
                , $input = $('.' + _this._tempClass)
                , thisSelector;

            this._rowIdArry = [];
            $input.find('li').removeClass('active');
            for(var v in valArry){
                $.each(_this.dataInfo, function(i, k){
                    var name = '';
                    for(var x in colModelInfo){
                        name += k[colModelInfo[x]];
                    }
                    thisSelector = $input.find('li[data-rowId="' + k[_this.options.value] + '"]');

                    if(valArry[v] == name){
                        _this.afterSelected(k[_this.options.value]);
                        thisSelector.addClass('active');
                        return false;
                    }
                });
            }
        },

        appendData: function(){
            var _this = this
                , _div = '';

            _div = ''
                +'<div style="display: none" class="' + this._tempClass + (_this.options.class || '') + ' '+ _param._plusClass +'">'
                +	'<ul></ul>'
                +'</div>';
            $('body').prepend(_div);
            this._tempDOM = $('.' + this._tempClass);
            this.bindEvent();
        },

        InfoXHR: function(){
            var _this = this
                , ajaxOption = _this.options.ajaxOption;

            if(typeof ajaxOption.url === 'string' && _this.options.data == ''){
                $.ajax({
                    url: ajaxOption.url,
                    type: "POST",
                    dataType: "json",
                    async: true,
                    data: ajaxOption.data,
                    success: function(data){
                        _this.dataInfo = data;
                        _this._liHtml(data);
                    }
                })
            }else{
                _this.dataInfo = _this.options.data;
                _this._liHtml(_this.options.data);
            }
        },

        _liHtml: function(dataInfo){
            var _this = this
                , _li = ''
                , colModelInfo = _this.options.colModels;

            $.each(dataInfo, function(i, k){
                var _span = '';
                for(var x in colModelInfo){
                    _span += '<span>'+k[colModelInfo[x]]+'</span>';
                }
                _li += '<li data-rowId="'+ k[_this.options.value] +'">' + _span + '</li>';
            });
            $('.' + this._tempClass).find('ul').html(_li);
            _this._tempDOM.css({
                'overflow-y': (this._tempDOM.height() > this.options.height ? 'scroll' : 'hidden')
            });
            this.elemStyle();
        },

        _getPositionRefer: function () {
            var _this = this
                , _positionRefer = _this.options.positionRefer
                , $positionRefer;

            if ($.isFunction(_positionRefer)) {
                $positionRefer = _positionRefer.call(_this.Elm);
                $positionRefer = ($positionRefer && $positionRefer.length > 0) ? $positionRefer : (_this.Elm.parent('label') || _this.Elm);
            } else {
                $positionRefer = $(_positionRefer);
                $positionRefer = ($positionRefer && $positionRefer.length > 0) ? $positionRefer : (_this.Elm.parent('label') || _this.Elm);
            }
            return $positionRefer;
        },

        destroy: function() {
            this._tempDOM.remove();
            this.content = null;
            this.Elm.off('.autoSelected').removeData('.autoSelected').removeData(pluginName);
        },

        elemStyle: function(){
            var boxWidth = 100
                , _this = this
                , options = _this.options
                , postionDOM = _this._getPositionRefer()
                , boxTop  = (postionDOM.offset().top + _this.Elm.height() + parseInt(options.top))
                , boxLeft = (postionDOM.offset().left + parseInt(options.top))
                , borderWidth = parseInt(this._tempDOM.css('borderWidth')) * 2;

            if(options.width != null){
                boxWidth = options.width;
            }else if(postionDOM != null){
                boxWidth = postionDOM.outerWidth() - borderWidth;
            }
            this._tempDOM.css({
                'position': 'absolute',
                'top': boxTop,
                'left': boxLeft,
                'width': boxWidth,
                'max-height': options.height,
                'overflow-x': 'hidden'
            });
        },

        bindEvent: function(){
            var _this = this
                , colModelInfo = _this.options.colModels
                , $input = $('.' + _this._tempClass)
                , delayTimer = null;

            // 多选控制
            this._tempDOM.on('click', 'li:not(.no-selected)', function(){
                var _Tthis = $(this)
                    , posVal = $.inArray(_Tthis.text(), _this.valArray);

                if(_this.valArray != '' && posVal > -1){
                    _this.valArray.splice(posVal, 1);
                }else{
                    _this.valArray.push(_Tthis.text());
                }
                _Tthis.toggleClass('active');
                _this.Elm.val(_this.valArray);
                _this.afterSelected(_Tthis.data('rowid'));
            }).on('click', 'li.no-selected', function(){
                _this.hide();
            });

            // 下拉显示控制
            $(document).on('mousedown', function(){
                var e = (window.event ? window.event: e)
                    , target = e.srcElement || e.target
                    , $target = $(target);

                _this.Elm.off('blur').on('blur', function(){
                    if($target.attr('name') && _this.Elm.attr('name') && ($target.attr('name') == _this.Elm.attr('name'))){
                        _this.hide();
                    }
                });

                if(_this.Elm.attr('disabled') != 'disabled' && !_this._tempDOM.is(':hidden')){
                    $target[0].tagName == _this.Elm[0].tagName || ($target.closest('.' + _this._tempClass).length != 0) ? null : _this.hide();
                    if(($target.attr('id') && _this.Elm.attr('id') && $target.attr('id') != _this.Elm.attr('id'))){
                        _this.hide();
                    }
                }
            }).on("mousewheel DOMMouseScroll", function (e) {
                _this.hide();
            });

            this.Elm.on('keyup', function(){
                var target = this;

                clearTimeout(delayTimer);
                _this.modifiedValue = true;
                delayTimer = setTimeout(function(){
                    var _li = '', inpVal = $(target).val();
                    if(inpVal === ''){
                        _this.clean();
                        // 后续自定义事件
                        if(typeof _this.options.afterInput != 'undefined'){
                            _this.options.afterInput.call(_this.ElmThis, arguments);
                        }
                    }
                    $.each(_this.dataInfo, function(i, k){
                        var _span = '', isHave;
                        for(var x in colModelInfo){
                            if(k[colModelInfo[x]].toLocaleLowerCase().indexOf(inpVal) != -1){
                                isHave = true;
                            }
                            _span += '<span>'+k[colModelInfo[x]]+'</span>';
                        }
                        if(isHave){
                            _li += '<li data-rowId="'+ k[_this.options.value] +'">' + (isHave ? _span : '') + '</li>';
                        }
                    });
                    if(!_li){
                        _li = '<li class="no-selected"><span>'+ i18n["application.common.autoSelected.warn"] +'</span></li>';
                    }
                    $input.find('ul').html(_li);
                }, 300);
            });
        },

        afterSelected: function(rowId){
            var posVal = $.inArray(rowId, this._rowIdArry);

            if(posVal == -1){
                this._rowIdArry.push(rowId);
            }else{
                this._rowIdArry.splice(posVal, 1)
            }
            // 选中后事件callback
            if(typeof this.options.afterSelectedRow != 'undefined'){
                this.options.afterSelectedRow(this._rowIdArry);
            }
        },

        show: function(){
            this._tempDOM.show();
            if(this.valArray != undefined){
                this.Elm.val(this.valArray);
            }
        },

        hide: function(){
            this._tempDOM.hide();
            if(this.valArray != undefined){
                this.Elm.val(this.valArray).blur();
            }
            this._liHtml(this.dataInfo);
        },

        clean: function(){
            $('.' + this._tempClass).find('li').removeClass('active');
            this._rowIdArry = [];
            this.valArray = [];
        }
    }
})(jQuery, window, document);