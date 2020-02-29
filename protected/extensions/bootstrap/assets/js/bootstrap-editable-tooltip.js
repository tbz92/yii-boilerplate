

(function ($) {

    
    var EditableTooltip = function (element, options) {
        var type, typeDefaults, doAutotext = false, valueSetByTooltip = false;
        this.$element = $(element);

        this.$element.tooltip({placement:'top'});

        
        type = (this.$element.data().type || (options && options.type) || $.fn.editableTooltip.defaults.type);
        typeDefaults = ($.fn.editableTooltip.types[type]) ? $.fn.editableTooltip.types[type] : {};

        
        this.settings = $.extend({}, $.fn.editableTooltip.defaults, $.fn.editableTooltip.types.defaults, typeDefaults, options, this.$element.data());

        
        this.settings.init.call(this, options);

        
        this.name = this.settings.name || this.$element.attr('id') || this.$element.attr('name');
        if (!this.name) {
            $.error('You should define name (or id) for EditableTooltip element');
        }

        
        if (typeof this.settings.validate === 'object' && this.name in this.settings.validate) {
            this.settings.validate = this.settings.validate[this.name];
        }

        
        if (this.settings.value === undefined || this.settings.value === null) {
            this.settings.setValueByTooltip.call(this);
            valueSetByTooltip = true;
        } else {
            this.value = this.settings.value;
            valueSetByTooltip = false;
        }

        
        this.lastSavedValue = this.value;

        this.$toggle = $('<i class="icon-info-sign"></i>').attr('data-original-title', 'Tooltip Editor: <strong>'+this.name+'</strong>');

        this.$element.append(this.$toggle);

        
        this.$toggle.on('click', $.proxy(this.click, this));

        
        $('body').on('click.editable-tooltip', '.editable-tooltip-popover', function (e) { e.stopPropagation(); });

        
        if(!valueSetByTooltip && this.value !== null && this.value !== undefined) {
            switch(this.settings.autotext) {
                case 'always':
                    doAutotext = true;
                    break;

                case 'never':
                    doAutotext = false;
                    break;

                case 'auto':
                    if(this.$element.attr('title').length) {
                        doAutotext = false;
                    } else {
                        
                        if (type === 'select') {
                            this.settings.source = tryParseJson(this.settings.source, true);
                            if (this.settings.source && typeof this.settings.source === 'object') {
                                doAutotext = true;
                            }
                        } else {
                            doAutotext = true;
                        }
                    }
                    break;
            }
        }

        function finalize() {
            
            this.handleEmpty();

            
            var event = jQuery.Event("render");
            event.isInit = true;
            this.$element.trigger(event, this);
        }

        if(doAutotext) {
            $.when(this.settings.setTooltipByValue.call(this)).then($.proxy(finalize, this));
        } else {
            finalize.call(this);
        }


    };

    EditableTooltip.prototype = {
        constructor: EditableTooltip,

        click: function (e) {
            e.stopPropagation();
            e.preventDefault();

            var popover = this.$toggle.data('popover');
            if (popover && popover.tip().is(':visible')) {
                this.hide();
            } else {
                this.show();
            }
        },

        show: function () {
            
            $('.popover').find('form').find('button.editable-tooltip-cancel').click();

            
            if (!this.$toggle.data('popover')) {
                this.$toggle.popover({
                    trigger  :'manual',
                    placement:'right',
                    content  :this.settings.loading
                });

                this.$toggle.data('popover').tip().addClass('editable-tooltip-popover');
            }

            
            this.$toggle.popover('show');

            
            this.setPosition();

            this.$element.addClass('editable-tooltip-open');
            this.errorOnRender = false;

            
            $.when(this.settings.renderInput.call(this))
                .then($.proxy(function () {
                var $tip = this.$toggle.data('popover').tip();

                
                this.$content = $(this.settings.formTemplate);
                this.$content.find('div.control-group').prepend(this.$input);

                
                $tip.find('.popover-content p').append(this.$content);

                
                this.setPosition();

                
                if (this.errorOnRender) {
                    this.$input.attr('disabled', true);
                    $tip.find('button.btn-primary').attr('disabled', true);
                    $tip.find('form').submit(function () {
                        return false;
                    });
                    
                    this.enableContent(this.errorOnRender);
                } else {
                    this.$input.removeAttr('disabled');
                    $tip.find('button.btn-primary').removeAttr('disabled');
                    
                    $tip.find('form').submit($.proxy(this.submit, this));
                    
                    this.enableContent();
                    
                    this.settings.setInputValue.call(this);
                }

                
                $tip.find('button.editable-tooltip-cancel').click($.proxy(this.hide, this));

                
                $(document).on('keyup.editable-tooltip', $.proxy(function (e) {
                    if (e.which === 27) {
                        e.stopPropagation();
                        this.hide();
                    }
                }, this));

                
                $(document).on('click.editable-tooltip', $.proxy(this.hide, this));

                
                this.$element.trigger('shown', this);
            }, this));
        },

        submit: function (e) {
            e.stopPropagation();
            e.preventDefault();

            var error,
                value = this.settings.getInputValue.call(this);

            
            if (error = this.validate(value)) {
                this.enableContent(error);
                return;
            }

            
            if (value == this.value) {
                
                
                this.hide();
            } else {
                
                this.save(value);
            }
        },

        save: function(value) {
            $.when(this.send(value))
                .done($.proxy(function (data) {
                var error, isAjax = (typeof data !== 'undefined');

                
                if (isAjax && typeof this.settings.success === 'function' && (error = this.settings.success.apply(this, arguments))) {
                    
                    this.enableContent(error);
                    return;
                }

                
                this.value = value;
                this.settings.setTooltipByValue.call(this);

                
                if (isAjax) {
                    this.markAsSaved();
                } else {
                    this.markAsUnsaved();
                }

                this.handleEmpty();
                this.hide();

                
                var event = jQuery.Event("render");
                event.isInit = false;
                this.$element.trigger(event, this);
            }, this))
                .fail($.proxy(function(xhr) {
                var msg = (typeof this.settings.error === 'function') ? this.settings.error.apply(this, arguments) : null;
                this.enableContent(msg || xhr.responseText || xhr.statusText);
            }, this));
        },

        send: function(value) {
            var send, pk, params;

            
            if (typeof this.settings.pk === 'function') {
                pk = this.settings.pk.call(this.$element);
            } else if (typeof this.settings.pk === 'string' && $(this.settings.pk).length === 1 && $(this.settings.pk).parent().length) { 
                pk = $(this.settings.pk).text();
            } else {
                pk = this.settings.pk;
            }

            send = (this.settings.url !== undefined) && ((this.settings.send === 'always') || (this.settings.send === 'auto' && pk) || (this.settings.send === 'ifpk'  && pk));

            if (send) { 
                
                this.enableLoading();

                
                this.settings.params = tryParseJson(this.settings.params, true);

                
                params = (typeof this.settings.params === 'string') ? {params:this.settings.params} : $.extend({}, this.settings.params);
                params.name = this.name;
                params.value = value;
                if (pk) {
                    params.pk = pk;
                }

                
                return $.ajax({
                    url     : (typeof this.settings.url === 'function') ? this.settings.url.call(this) : this.settings.url,
                    data    : params,
                    type    : 'post',
                    dataType: 'json'
                });
            }
        },

        hide: function () {
            this.$toggle.popover('hide');
            this.$element.removeClass('editable-tooltip-open');
            $(document).off('keyup.editable-tooltip');
            $(document).off('click.editable-tooltip');

            
            if (this.settings.enablefocus || this.$element.get(0) !== this.$toggle.get(0)) {
                this.$toggle.focus();
            }

            
            this.$element.trigger('hidden', this);
        },

        
        enableContent:function (error) {
            if (error !== undefined && error.length > 0) {
                this.$content.find('div.control-group').addClass('error').find('span.help-block').text(error);
            } else {
                this.$content.find('div.control-group').removeClass('error').find('span.help-block').text('');
            }
            this.$content.show();
            
            this.$toggle.data('popover').tip().find('.editable-tooltip-loading').hide();

            
            this.setPosition();

            
            if (this.settings.type === 'text' || this.settings.type === 'textarea') {
                this.$input.focus();
            }
        },

        
        setPosition: function () {
            var p = this.$toggle.data('popover'), $tip = p.tip(), inside = false, placement, pos, actualWidth, actualHeight, tp;

            placement = typeof p.options.placement === 'function' ? p.options.placement.call(p, $tip[0], p.$element[0]) : p.options.placement;

            pos = p.getPosition(inside);

            actualWidth = $tip[0].offsetWidth;
            actualHeight = $tip[0].offsetHeight;


            switch (inside ? placement.split(' ')[1] : placement) {
                case 'bottom':
                    tp = {top:pos.top + pos.height, left:pos.left + pos.width / 2 - actualWidth / 2};
                    break;
                case 'top':
                    
                    if($tip.find('.arrow').get(0).offsetHeight === 10) {actualHeight += 10;}
                    tp = {top:pos.top - actualHeight, left:pos.left + pos.width / 2 - actualWidth / 2};
                    break;
                case 'left':
                    
                    if($tip.find('.arrow').get(0).offsetWidth === 10) {actualWidth  += 10;}
                    tp = {top:pos.top + pos.height / 2 - actualHeight / 2, left:pos.left - actualWidth};
                    break;
                case 'right':
                    tp = {top:pos.top + pos.height / 2 - actualHeight / 2, left:pos.left + pos.width};
                    break;
            }

            $tip.css(tp).addClass(placement).addClass('in');
        },

        
        enableLoading:function () {
            
            var $tip = this.$toggle.data('popover').$tip;
            $tip.find('.editable-tooltip-loading').css({height:this.$content[0].offsetHeight, width:this.$content[0].offsetWidth});

            this.$content.hide();
            this.$toggle.data('popover').tip().find('.editable-tooltip-loading').show();
        },

        handleEmpty:function () {
            
            if (!this.$element.hasClass('editable-tooltip')) {
                return;
            }

            this.$element.attr('data-original-title', this.settings.emptytext);
        },

        validate:function (value) {
            if (value === undefined) {
                value = this.value;
            }
            if (typeof this.settings.validate === 'function') {
                return this.settings.validate.call(this, value);
            }
        },

        markAsUnsaved:function () {
            if (this.value !== this.lastSavedValue) {
                this.$element.addClass('editable-tooltip-changed');
            } else {
                this.$element.removeClass('editable-tooltip-changed');
            }
        },

        markAsSaved:function () {
            this.lastSavedValue = this.value;
            this.$element.removeClass('editable-tooltip-changed');
        }
    };


    

    $.fn.editableTooltip = function (option) {
        
        var result = {}, args = arguments;
        switch (option) {
            case 'validate':
                this.each(function () {
                    var $this = $(this), data = $this.data('editable-tooltip'), error;
                    if (data && (error = data.validate())) {
                        result[data.name] = error;
                    }
                });
                return result;

            case 'getValue':
                this.each(function () {
                    var $this = $(this), data = $this.data('editable-tooltip');
                    if (data && data.value !== undefined && data.value !== null) {
                        result[data.name] = data.value;
                    }
                });
                return result;

            case 'submit':  
                var config = arguments[1] || {},
                    $elems = this,
                    errors = this.editable('validate'),
                    values;

                if(typeof config.error !== 'function') {
                    config.error = function() {};
                }

                if($.isEmptyObject(errors)) {
                    values = this.editable('getValue');
                    if(config.data) {
                        $.extend(values, config.data);
                    }
                    $.ajax({
                        type: 'POST',
                        url: config.url,
                        data: values,
                        dataType: 'json'
                    }).success(function(response) {
                            if(typeof response === 'object' && response.id) {
                                $elems.editable('option', 'pk', response.id);
                                $elems.editable('markAsSaved');
                                if(typeof config.success === 'function') {
                                    config.success.apply($elems, arguments);
                                }
                            } else { 
                                config.error.apply($elems, arguments);
                            }
                        }).error(function(){  
                            config.error.apply($elems, arguments);
                        });
                } else { 
                    config.error.call($elems, {errors: errors});
                }

                return this;
        }

        
        return this.each(function () {
            var $this = $(this), data = $this.data('editable-tooltip'), options = typeof option === 'object' && option;
            if (!data) {
                $this.data('editable-tooltip', (data = new EditableTooltip(this, options)));
            }

            if(option === 'option') {
                if(args.length === 2 && typeof args[1] === 'object') {
                    data.settings = $.extend({}, data.settings, args[1]); 
                } else if(args.length === 3 && typeof args[1] === 'string') {
                    data.settings[args[1]] = args[2]; 
                }
            } else if (typeof option === 'string') {
                data[option]();
            }
        });
    };

    $.fn.editableTooltip.Constructor = EditableTooltip;

    
    $.fn.editableTooltip.defaults = {
        url:null, 
        type:'text', 
        name:null, 
        pk:null, 
        value:null, 
        emptytext:'Empty', 
        params:null, 
        send:'auto', 
        autotext:'auto', 
        enablefocus:false, 
        formTemplate:'<form class="form-inline" autocomplete="off">' +
            '<div class="control-group">' +
            '&nbsp;<button type="submit" class="btn btn-primary"><i class="icon-ok icon-white"></i></button>&nbsp;<button type="button" class="btn editable-tooltip-cancel"><i class="icon-ban-circle"></i></button>' +
            '<span class="help-block" style="clear: both"></span>' +
            '</div>' +
            '</form>',
        loading:'<div class="editable-tooltip-loading"></div>',

        validate:function (value) {
        }, 
        success:function (data) {
        }, 
        error:function (xhr) {
        }  
    };

    
    $.fn.editableTooltip.types = {
        
        defaults:{
            inputclass:'span2',
            placeholder:null,
            init:function (options) {},
            
            renderInput:function () {
                this.$input = $(this.settings.template);
                this.$input.addClass(this.settings.inputclass);
                if (this.settings.placeholder) {
                    this.$input.attr('placeholder', this.settings.placeholder);
                }
            },
            setInputValue:function () {
                this.$input.val(this.value);
                this.$input.focus();
            },
            
            getInputValue:function () {
                return this.$input.val();
            },

            
            setTooltipByValue:function () {
                this.$element.attr('data-original-title', this.value);
            },

            
            setValueByTooltip:function () {
                this.value = $.trim(this.$element.attr('data-original-title'));
            }
        },

        
        text:{
            template:'<input type="text">',
            setInputValue:function () {
                this.$input.val(this.value);
                setCursorPosition.call(this.$input, this.$input.val().length);
                this.$input.focus();
            }
        },
        
        textarea:{
            template:'<textarea rows="8"></textarea>',
            inputclass:'span3',
            renderInput:function () {
                this.$input = $(this.settings.template);
                this.$input.addClass(this.settings.inputclass);
                if (this.settings.placeholder) {
                    this.$input.attr('placeholder', this.settings.placeholder);
                }

                
                this.$input.keydown(function (e) {
                    if (e.ctrlKey && e.which === 13) {
                        $(this).closest('form').submit();
                    }
                });
            },
            setInputValue:function () {
                this.$input.val(this.value);
                setCursorPosition.apply(this.$input, [this.$input.val().length]);
                this.$input.focus();
            },
            setValueByTooltip:function () {
                var content = this.$element.attr('data-original-title');
                if(this.$element.data('html'))
                {
                    lines = content.split(/<br\s*\/?>/i);

                    for (var i = 0; i < lines.length; i++) {
                        lines[i] = $('<div>').html(lines[i]).text();
                    }
                    this.value = lines.join("\n");
                }else{
                    this.value =  content;
                }
            },
            setTooltipByValue:function () {
                var lines = this.value.split("\n");
                for (var i = 0; i < lines.length; i++) {
                    lines[i] = $('<div>').text(lines[i]).html();
                }
                var text = this.$element.data('html') ?  lines.join('<br>') : lines.join(' ');

                this.$element.attr('data-original-title', text);
            }
        },

        
        select:{
            template:'<select></select>',
            source:null,
            prepend:false,
            onSourceReady:function (success, error) {
                
                try {
                    this.settings.source = tryParseJson(this.settings.source, false);
                } catch (e) {
                    error.call(this);
                    return;
                }

                if (typeof this.settings.source === 'string') {
                    var cacheID = this.settings.source + '-' + this.name, cache;

                    if (!$(document).data(cacheID)) {
                        $(document).data(cacheID, {});
                    }
                    cache = $(document).data(cacheID);

                    
                    if (cache.loading === false && cache.source && typeof cache.source === 'object') { 
                        this.settings.source = cache.source;
                        success.call(this);
                        return;
                    } else if (cache.loading === true) { 
                        cache.callbacks.push($.proxy(function () {
                            this.settings.source = cache.source;
                            success.call(this);
                        }, this));

                        
                        cache.err_callbacks.push($.proxy(error, this));
                        return;
                    } else { 
                        cache.loading = true;
                        cache.callbacks = [];
                        cache.err_callbacks = [];
                    }

                    
                    $.ajax({
                        url:this.settings.source,
                        type:'get',
                        data:{name:this.name},
                        dataType:'json',
                        success:$.proxy(function (data) {
                            this.settings.source = this.settings.doPrepend.call(this, data);
                            cache.loading = false;
                            cache.source = this.settings.source;
                            success.call(this);
                            $.each(cache.callbacks, function () {
                                this.call();
                            }); 
                        }, this),
                        error:$.proxy(function () {
                            cache.loading = false;
                            error.call(this);
                            $.each(cache.err_callbacks, function () {
                                this.call();
                            }); 
                        }, this)
                    });
                } else { 

                    
                    if ($.isArray(this.settings.source)) {
                        var arr = this.settings.source, obj = {};
                        for (var i = 0; i < arr.length; i++) {
                            if (arr[i] !== undefined) {
                                obj[i] = arr[i];
                            }
                        }
                        this.settings.source = obj;
                    }

                    this.settings.source = this.settings.doPrepend.call(this, this.settings.source);
                    success.call(this);
                }
            },

            doPrepend:function (data) {
                this.settings.prepend = tryParseJson(this.settings.prepend, true);

                if (typeof this.settings.prepend === 'string') {
                    return $.extend({}, {'':this.settings.prepend}, data);
                } else if (typeof this.settings.prepend === 'object') {
                    return $.extend({}, this.settings.prepend, data);
                } else {
                    return data;
                }
            },

            renderInput:function () {
                var deferred = $.Deferred();
                this.$input = $(this.settings.template);
                this.$input.addClass(this.settings.inputclass);
                this.settings.onSourceReady.call(this, function () {
                    if (typeof this.settings.source === 'object' && this.settings.source != null) {
                        $.each(this.settings.source, $.proxy(function (key, value) {
                            this.$input.append($('<option>', { value:key }).text(value));
                        }, this));
                    }
                    deferred.resolve();
                }, function () {
                    this.errorOnRender = 'Error when loading options';
                    deferred.resolve();
                });

                return deferred.promise();
            },

            setValueByText:function () {
                this.value = null; 
            },

            setTextByValue:function () {
                var deferred = $.Deferred();
                this.settings.onSourceReady.call(this, function () {
                    if (typeof this.settings.source === 'object' && this.value in this.settings.source) {
                        this.$element.text(this.settings.source[this.value]);
                    } else {
                        
                        this.$element.attr('data-original-title', '');
                    }
                    deferred.resolve();
                }, function () {
                    this.$element.attr('data-original-title', 'Error!');
                    deferred.resolve();
                });

                return deferred.promise();
            }
        }
    };

    

    
    function setCursorPosition(pos) {
        this.each(function (index, elem) {
            if (elem.setSelectionRange) {
                elem.setSelectionRange(pos, pos);
            } else if (elem.createTextRange) {
                var range = elem.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        });
        return this;
    }

    
    function tryParseJson(s, safe) {
        if (typeof s === 'string' && s.length && s.match(/^\{.*\}$/)) {
            if (safe) {
                try {
                    
                    s = (new Function('return ' + s))();
                    
                } catch (e) {} finally {
                    return s;
                }
            } else {
                
                s = (new Function('return ' + s))();
                
            }
        }

        return s;
    }

    
    function mergeKeys(objTo, objFrom, keys) {
        var key, keyLower;
        if (!$.isArray(keys)) {
            return objTo;
        }
        for (var i = 0; i < keys.length; i++) {
            key = keys[i];
            if (key in objFrom) {
                objTo[key] = objFrom[key];
                continue;
            }
            
            
            
            keyLower = key.toLowerCase();
            if (keyLower in objFrom) {
                objTo[key] = objFrom[keyLower];
            }
        }
        return objTo;
    }

}(window.jQuery));
