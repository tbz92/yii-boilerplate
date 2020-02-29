




(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        
        define([
            'jquery',
            'load-image',
            'bootstrap'
        ], factory);
    } else {
        
        factory(
            window.jQuery,
            window.loadImage
        );
    }
}(function ($, loadImage) {
    'use strict';
    
    
    
    $.extend($.fn.modal.defaults, {
        
        
        delegate: document,
        
        selector: null,
        
        
        filter: '*',
        
        index: 0,
        
        href: null,
        
        preloadRange: 2,
        
        offsetWidth: 100,
        
        offsetHeight: 200,
        
        canvas: false,
        
        slideshow: 0,
        
        imageClickDivision: 0.5
    });
    var originalShow = $.fn.modal.Constructor.prototype.show,
        originalHide = $.fn.modal.Constructor.prototype.hide;
    $.extend($.fn.modal.Constructor.prototype, {
        initLinks: function () {
            var $this = this,
                options = this.options,
                selector = options.selector ||
                    'a[data-target=' + options.target + ']';
            this.$links = $(options.delegate).find(selector)
                .filter(options.filter).each(function (index) {
                    if ($this.getUrl(this) === options.href) {
                        options.index = index;
                    }
                });
            if (!this.$links[options.index]) {
                options.index = 0;
            }
        },
        getUrl: function (element) {
            return element.href || $(element).data('href');
        },
        startSlideShow: function () {
            var $this = this;
            if (this.options.slideshow) {
                this._slideShow = window.setTimeout(
                    function () {
                        $this.next();
                    },
                    this.options.slideshow
                );
            }
        },
        stopSlideShow: function () {
            window.clearTimeout(this._slideShow);
        },
        toggleSlideShow: function () {
            var node = this.$element.find('.modal-slideshow');
            if (this.options.slideshow) {
                this.options.slideshow = 0;
                this.stopSlideShow();
            } else {
                this.options.slideshow = node.data('slideshow') || 5000;
                this.startSlideShow();
            }
            node.find('i').toggleClass('icon-play icon-pause');
        },
        preloadImages: function () {
            var options = this.options,
                range = options.index + options.preloadRange + 1,
                link,
                i;
            for (i = options.index - options.preloadRange; i < range; i += 1) {
                link = this.$links[i];
                if (link && i !== options.index) {
                    $('<img>').prop('src', this.getUrl(link));
                }
            }
        },
        loadImage: function () {
            var $this = this,
                modal = this.$element,
                index = this.options.index,
                url = this.getUrl(this.$links[index]),
                oldImg;
            this.abortLoad();
            this.stopSlideShow();
            modal.trigger('beforeLoad');
            
            
            this._loadingTimeout = window.setTimeout(function () {
                modal.addClass('modal-loading');
            }, 100);
            oldImg = modal.find('.modal-image').children().removeClass('in');
            
            window.setTimeout(function () {
                oldImg.remove();
            }, 3000);
            modal.find('.modal-title').text(this.$links[index].title);
            modal.find('.modal-download').prop(
                'href',
                url
            );
            this._loadingImage = loadImage(
                url,
                function (img) {
                    $this.img = img;
                    window.clearTimeout($this._loadingTimeout);
                    modal.removeClass('modal-loading');
                    modal.trigger('load');
                    $this.showImage(img);
                    $this.startSlideShow();
                },
                this._loadImageOptions
            );
            this.preloadImages();
        },
        showImage: function (img) {
            var modal = this.$element,
                transition = $.support.transition && modal.hasClass('fade'),
                method = transition ? modal.animate : modal.css,
                modalImage = modal.find('.modal-image'),
                clone,
                forceReflow;
            modalImage.css({
                width: img.width,
                height: img.height
            });
            modal.find('.modal-title').css({ width: Math.max(img.width, 380) });
            if (transition) {
                clone = modal.clone().hide().appendTo(document.body);
            }
            if ($(window).width() > 767) {
                method.call(modal.stop(), {
                    'margin-top': -((clone || modal).outerHeight() / 2),
                    'margin-left': -((clone || modal).outerWidth() / 2)
                });
            } else {
                modal.css({
                    top: ($(window).height() - (clone || modal).outerHeight()) / 2
                });
            }
            if (clone) {
                clone.remove();
            }
            modalImage.append(img);
            forceReflow = img.offsetWidth;
            modal.trigger('display');
            if (transition) {
                if (modal.is(':visible')) {
                    $(img).on(
                        $.support.transition.end,
                        function (e) {
                            
                            
                            if (e.target === img) {
                                $(img).off($.support.transition.end);
                                modal.trigger('displayed');
                            }
                        }
                    ).addClass('in');
                } else {
                    $(img).addClass('in');
                    modal.one('shown', function () {
                        modal.trigger('displayed');
                    });
                }
            } else {
                $(img).addClass('in');
                modal.trigger('displayed');
            }
        },
        abortLoad: function () {
            if (this._loadingImage) {
                this._loadingImage.onload = this._loadingImage.onerror = null;
            }
            window.clearTimeout(this._loadingTimeout);
        },
        prev: function () {
            var options = this.options;
            options.index -= 1;
            if (options.index < 0) {
                options.index = this.$links.length - 1;
            }
            this.loadImage();
        },
        next: function () {
            var options = this.options;
            options.index += 1;
            if (options.index > this.$links.length - 1) {
                options.index = 0;
            }
            this.loadImage();
        },
        keyHandler: function (e) {
            switch (e.which) {
            case 37: 
            case 38: 
                e.preventDefault();
                this.prev();
                break;
            case 39: 
            case 40: 
                e.preventDefault();
                this.next();
                break;
            }
        },
        wheelHandler: function (e) {
            e.preventDefault();
            e = e.originalEvent;
            this._wheelCounter = this._wheelCounter || 0;
            this._wheelCounter += (e.wheelDelta || e.detail || 0);
            if ((e.wheelDelta && this._wheelCounter >= 120) ||
                    (!e.wheelDelta && this._wheelCounter < 0)) {
                this.prev();
                this._wheelCounter = 0;
            } else if ((e.wheelDelta && this._wheelCounter <= -120) ||
                        (!e.wheelDelta && this._wheelCounter > 0)) {
                this.next();
                this._wheelCounter = 0;
            }
        },
        initGalleryEvents: function () {
            var $this = this,
                modal = this.$element;
            modal.find('.modal-image').on('click.modal-gallery', function (e) {
                var modalImage = $(this);
                if ($this.$links.length === 1) {
                    $this.hide();
                } else {
                    if ((e.pageX - modalImage.offset().left) / modalImage.width() <
                            $this.options.imageClickDivision) {
                        $this.prev(e);
                    } else {
                        $this.next(e);
                    }
                }
            });
            modal.find('.modal-prev').on('click.modal-gallery', function (e) {
                $this.prev(e);
            });
            modal.find('.modal-next').on('click.modal-gallery', function (e) {
                $this.next(e);
            });
            modal.find('.modal-slideshow').on('click.modal-gallery', function (e) {
                $this.toggleSlideShow(e);
            });
            $(document)
                .on('keydown.modal-gallery', function (e) {
                    $this.keyHandler(e);
                })
                .on(
                    'mousewheel.modal-gallery, DOMMouseScroll.modal-gallery',
                    function (e) {
                        $this.wheelHandler(e);
                    }
                );
        },
        destroyGalleryEvents: function () {
            var modal = this.$element;
            this.abortLoad();
            this.stopSlideShow();
            modal.find('.modal-image, .modal-prev, .modal-next, .modal-slideshow')
                .off('click.modal-gallery');
            $(document)
                .off('keydown.modal-gallery')
                .off('mousewheel.modal-gallery, DOMMouseScroll.modal-gallery');
        },
        show: function () {
            if (!this.isShown && this.$element.hasClass('modal-gallery')) {
                var modal = this.$element,
                    options = this.options,
                    windowWidth = $(window).width(),
                    windowHeight = $(window).height();
                if (modal.hasClass('modal-fullscreen')) {
                    this._loadImageOptions = {
                        maxWidth: windowWidth,
                        maxHeight: windowHeight,
                        canvas: options.canvas
                    };
                    if (modal.hasClass('modal-fullscreen-stretch')) {
                        this._loadImageOptions.minWidth = windowWidth;
                        this._loadImageOptions.minHeight = windowHeight;
                    }
                } else {
                    this._loadImageOptions = {
                        maxWidth: windowWidth - options.offsetWidth,
                        maxHeight: windowHeight - options.offsetHeight,
                        canvas: options.canvas
                    };
                }
                if (windowWidth > 767) {
                    modal.css({
                        'margin-top': -(modal.outerHeight() / 2),
                        'margin-left': -(modal.outerWidth() / 2)
                    });
                } else {
                    modal.css({
                        top: ($(window).height() - modal.outerHeight()) / 2
                    });
                }
                this.initGalleryEvents();
                this.initLinks();
                if (this.$links.length) {
                    modal.find('.modal-slideshow, .modal-prev, .modal-next')
                        .toggle(this.$links.length !== 1);
                    modal.toggleClass(
                        'modal-single',
                        this.$links.length === 1
                    );
                    this.loadImage();
                }
            }
            originalShow.apply(this, arguments);
        },
        hide: function () {
            if (this.isShown && this.$element.hasClass('modal-gallery')) {
                this.options.delegate = document;
                this.options.href = null;
                this.destroyGalleryEvents();
            }
            originalHide.apply(this, arguments);
        }
    });
    $(function () {
        $(document.body).on(
            'click.modal-gallery.data-api',
            '[data-toggle="modal-gallery"]',
            function (e) {
                var $this = $(this),
                    options = $this.data(),
                    modal = $(options.target),
                    data = modal.data('modal'),
                    link;
                if (!data) {
                    options = $.extend(modal.data(), options);
                }
                if (!options.selector) {
                    options.selector = 'a[rel=gallery]';
                }
                link = $(e.target).closest(options.selector);
                if (link.length && modal.length) {
                    e.preventDefault();
                    options.href = link.prop('href') || link.data('href');
                    options.delegate = link[0] !== this ? this : document;
                    if (data) {
                        $.extend(data.options, options);
                    }
                    modal.modal(options);
                }
            }
        );
    });
}));
