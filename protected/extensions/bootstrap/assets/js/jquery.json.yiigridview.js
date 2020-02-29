(function ($) {
    var selectCheckedRows, methods,
        gridSettings = [];
    selectCheckedRows = function (gridId) {
        var settings = gridSettings[gridId],
            table = $('#' + gridId).children('.' + settings.tableClass);

        table.children('tbody').find('input.select-on-check').filter(':checked').each(function () {
            $(this).closest('tr').addClass('selected');
        });

        table.children('thead').find('th input').filter('[type="checkbox"]').each(function () {
            var name = this.name.substring(0, this.name.length - 4) + '[]', 
                $checks = $("input[name='" + name + "']", table);
            this.checked = $checks.length > 0 && $checks.length === $checks.filter(':checked').length;
        });
        return this;
    };

    methods = {
        
        init: function (options) {
            var settings = $.extend({
                ajaxUpdate: [],
                ajaxVar: 'ajax',
                pagerClass: 'pager',
                loadingClass: 'loading',
                filterClass: 'filters',
                tableClass: 'items',
                selectableRows: 1,
                cacheTTL: 1,
                cacheTTLType: 's',
                localCache: true,
                
                
                
                
                
            }, options || {});

            settings.tableClass = settings.tableClass.replace(/\s+/g, '.');

            return this.each(function () {
                var $grid = $(this),
                    id = $grid.attr('id'),
                    pagerSelector = '#' + id + ' .' + settings.pagerClass.replace(/\s+/g, '.') + ' a',
                    sortSelector = '#' + id + ' .' + settings.tableClass + ' thead th a.sort-link',
                    inputSelector = '#' + id + ' .' + settings.filterClass + ' input, ' + '#' + id + ' .' + settings.filterClass + ' select';

                settings = $.extend(settings, {
                    colTemplate :  $.jqotec("#" +  id + "-col-template"),
                    rowTemplate: $.jqotec("#" + id + "-row-template"),
                    keysTemplate: $.jqotec("#" + id + "-keys-template"),
                    pagerTemplate: $.jqotec("#" + id + "-pager-template")
                });

                settings.updateSelector = settings.updateSelector
                    .replace('{page}', pagerSelector)
                    .replace('{sort}', sortSelector);

                gridSettings[id] = settings;

                if (settings.ajaxUpdate.length > 0) {
                    $(document).on('click.yiiJsonGridView', settings.updateSelector, function () {
                        var $that = $(this);

                        
                        if (settings.enableHistory && window.History.enabled) {
                            
                            var url = $that.attr('href'),
                                params = $.deparam.querystring(url);

                            delete params[settings.ajaxVar];
                            window.History.pushState(null, null, $.param.querystring(url.substr(0, url.indexOf('?')), params));
                        } else {
                            $('#' + id).yiiJsonGridView('update', {url: $that.attr('href')});
                        }
                        return false;
                    });
                }

                $(document).on('change.yiiJsonGridView keydown.yiiJsonGridView', inputSelector, function (event) {
                    if (event.type == 'keydown' && event.keyCode != 13) {
                        return; 
                    }
                    var data = $(inputSelector).serialize();
                    if (settings.pageVar !== undefined) {
                        data += '&' + settings.pageVar + '=1';
                    }
                    if (settings.enableHistory && settings.ajaxUpdate !== false && window.History.enabled) {
                        
                        var url = $('#' + id).yiiJsonGridView('getUrl'),
                            params = $.deparam.querystring($.param.querystring(url, data));

                        delete params[settings.ajaxVar];
                        History.pushState(null, null, $.param.querystring(url.substr(0, url.indexOf('?')), params));
                    } else {
                        $('#' + id).yiiJsonGridView('update', {data: data});
                    }
                });

                if (settings.enableHistory && settings.ajaxUpdate !== false && window.History.enabled) {
                    $(window).bind('statechange', function() { 
                        var State = window.History.getState(); 
                        $('#' + id).yiiJsonGridView('update', {url: State.url});
                    });
                }

                if (settings.selectableRows > 0) {
                    selectCheckedRows(this.id);
                    $(document).on('click.yiiJsonGridView', '#' + id + ' .' + settings.tableClass + ' > tbody > tr', function (e) {
                        var $currentGrid, $row, isRowSelected, $checks,
                            $target = $(e.target);

                        if ($target.closest('td').is('.empty,.button-column') || (e.target.type === 'checkbox' && !$target.hasClass('select-on-check'))) {
                            return;
                        }

                        $row = $(this);
                        $currentGrid = $('#' + id);
                        $checks = $('input.select-on-check', $currentGrid);
                        isRowSelected = $row.toggleClass('selected').hasClass('selected');

                        if (settings.selectableRows === 1) {
                            $row.siblings().removeClass('selected');
                            $checks.prop('checked', false);
                        }
                        $('input.select-on-check', $row).prop('checked', isRowSelected);
                        $("input.select-on-check-all", $currentGrid).prop('checked', $checks.length === $checks.filter(':checked').length);

                        if (settings.selectionChanged !== undefined) {
                            settings.selectionChanged(id);
                        }
                    });
                    if (settings.selectableRows > 1) {
                        $(document).on('click.yiiJsonGridView', '#' + id + ' .select-on-check-all', function () {
                            var $currentGrid = $('#' + id),
                                $checks = $('input.select-on-check', $currentGrid),
                                $checksAll = $('input.select-on-check-all', $currentGrid),
                                $rows = $currentGrid.children('.' + settings.tableClass).children('tbody').children();
                            if (this.checked) {
                                $rows.addClass('selected');
                                $checks.prop('checked', true);
                                $checksAll.prop('checked', true);
                            } else {
                                $rows.removeClass('selected');
                                $checks.prop('checked', false);
                                $checksAll.prop('checked', false);
                            }
                            if (settings.selectionChanged !== undefined) {
                                settings.selectionChanged(id);
                            }
                        });
                    }
                } else {
                    $(document).on('click.yiiJsonGridView', '#' + id + ' .select-on-check', false);
                }
            });
        },

        
        getKey: function (row) {
            return this.children('.keys').children('span').eq(row).text();
        },

        
        getUrl: function () {
            var sUrl = gridSettings[this.attr('id')].url;
            return sUrl || this.children('.keys').attr('title');
        },

        
        getRow: function (row) {
            var sClass = gridSettings[this.attr('id')].tableClass;
            return this.children('.' + sClass).children('tbody').children('tr').eq(row).children();
        },

        
        getColumn: function (column) {
            var sClass = gridSettings[this.attr('id')].tableClass;
            return this.children('.' + sClass).children('tbody').children('tr').children('td:nth-child(' + (column + 1) + ')');
        },



        
        update: function (options) {
            var start = new Date();
            var customError;
            if (options && options.error !== undefined) {
                customError = options.error;
                delete options.error;
            }

            return this.each(function () {
                var $form,
                    $grid = $(this),
                    id = $grid.attr('id'),
                    settings = gridSettings[id];
                $grid.addClass(settings.loadingClass);

                options = $.extend({
                    type: 'GET',
                    url: $grid.yiiJsonGridView('getUrl'),
                    dataType: 'json',
                    cacheTTL: settings.cacheTTL,
                    cacheTTLType: settings.cacheTTLType, 
                    localCache: settings.localCache,
                    success: function (data) {

                        $grid.removeClass(settings.loadingClass);
                        $grid.find('tbody').jqotesub(settings.rowTemplate, data.rows);
                        $grid.find('.keys').jqotesub(settings.keysTemplate, data.keys);
                        data.pager.length ? $grid.find('.'+settings.pagerClass+' ul').jqotesub(settings.pagerTemplate, data.pager).show() : $grid.find('.' + settings.pagerClass).hide();


                        $.each(data.headers, function(){
                            var $header = $('#' + this.id );
                            if( $header.length )
                            {
                                $header.html(this.content);
                            }
                        });

                        if (settings.afterAjaxUpdate !== undefined) {
                            settings.afterAjaxUpdate(id, data);
                        }
                        if (settings.selectableRows > 0) {
                            selectCheckedRows(id);
                        }
                        var end = new Date();
                        console.log( end - start );
                    },
                    error: function (XHR, textStatus, errorThrown) {
                        var ret, err;
                        $grid.removeClass(settings.loadingClass);
                        if (XHR.readyState === 0 || XHR.status === 0) {
                            return;
                        }
                        if (customError !== undefined) {
                            ret = customError(XHR);
                            if (ret !== undefined && !ret) {
                                return;
                            }
                        }
                        switch (textStatus) {
                            case 'timeout':
                                err = 'The request timed out!';
                                break;
                            case 'parsererror':
                                err = 'Parser error!';
                                break;
                            case 'error':
                                if (XHR.status && !/^\s*$/.test(XHR.status)) {
                                    err = 'Error ' + XHR.status;
                                } else {
                                    err = 'Error';
                                }
                                if (XHR.responseText && !/^\s*$/.test(XHR.responseText)) {
                                    err = err + ': ' + XHR.responseText;
                                }
                                break;
                        }

                        if (settings.ajaxUpdateError !== undefined) {
                            settings.ajaxUpdateError(XHR, textStatus, errorThrown, err);
                        } else if (err) {
                            alert(err);
                        }
                    }
                }, options || {});
                if (options.data !== undefined && options.type === 'GET') {
                    options.url = $.param.querystring(options.url, options.data);
                    options.data = {};
                }

                if (settings.ajaxUpdate !== false) {
                    options.url = $.param.querystring(options.url, settings.ajaxVar + '=' + id);
                    if (settings.beforeAjaxUpdate !== undefined) {
                        settings.beforeAjaxUpdate(id, options);
                    }
                    $.ajax(options);
                } else {  
                    if (options.type === 'GET') {
                        window.location.href = options.url;
                    } else {  
                        $form = $('<form action="' + options.url + '" method="post"></form>').appendTo('body');
                        if (options.data === undefined) {
                            options.data = {};
                        }

                        if (options.data.returnUrl === undefined) {
                            options.data.returnUrl = window.location.href;
                        }

                        $.each(options.data, function (name, value) {
                            $form.append($('<input type="hidden" name="t" value="" />').attr('name', name).val(value));
                        });
                        $form.submit();
                    }
                }
            });
        },

        
        getSelection: function () {
            var settings = gridSettings[this.attr('id')],
                keys = this.find('.keys span'),
                selection = [];
            this.find('.' + settings.tableClass).children('tbody').children().each(function (i) {
                if ($(this).hasClass('selected')) {
                    selection.push(keys.eq(i).text());
                }
            });
            return selection;
        },

        
        getChecked: function (column_id) {
            var settings = gridSettings[this.attr('id')],
                keys = this.find('.keys span'),
                checked = [];
            if (column_id.substring(column_id.length - 2) !== '[]') {
                column_id = column_id + '[]';
            }
            this.children('.' + settings.tableClass).children('tbody').children('tr').children('td').children('input[name="' + column_id + '"]').each(function (i) {
                if (this.checked) {
                    checked.push(keys.eq(i).text());
                }
            });
            return checked;
        }
    };

    $.fn.yiiJsonGridView = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.yiiJsonGridView');
            return false;
        }
    };
    
    $.fn.yiiJsonGridView.settings = gridSettings;
    
    $.fn.yiiJsonGridView.getKey = function (id, row) {
        return $('#' + id).yiiJsonGridView('getKey', row);
    };

    
    $.fn.yiiJsonGridView.getUrl = function (id) {
        return $('#' + id).yiiJsonGridView('getUrl');
    };

    
    $.fn.yiiJsonGridView.getRow = function (id, row) {
        return $('#' + id).yiiJsonGridView('getRow', row);
    };

    
    $.fn.yiiJsonGridView.getColumn = function (id, column) {
        return $('#' + id).yiiJsonGridView('getColumn', column);
    };

    
    $.fn.yiiJsonGridView.update = function (id, options) {
        $('#' + id).yiiJsonGridView('update', options);
    };

    
    $.fn.yiiJsonGridView.getSelection = function (id) {
        return $('#' + id).yiiJsonGridView('getSelection');
    };

    
    $.fn.yiiJsonGridView.getChecked = function (id, column_id) {
        return $('#' + id).yiiJsonGridView('getChecked', column_id);
    };
})(jQuery);