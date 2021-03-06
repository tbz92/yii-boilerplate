




(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        
        define([
            'jquery',
            'load-image',
            'canvas-to-blob',
            './jquery.fileupload'
        ], factory);
    } else {
        
        factory(
            window.jQuery,
            window.loadImage,
            window.canvasToBlob
        );
    }
}(function ($, loadImage, canvasToBlob) {
    'use strict';

    
    
    $.widget('blueimpIP.fileupload', $.blueimp.fileupload, {

        options: {
            
            
            resizeSourceFileTypes: /^image\/(gif|jpeg|png)$/,
            
            resizeSourceMaxFileSize: 20000000, 
            
            resizeMaxWidth: undefined,
            
            resizeMaxHeight: undefined,
            
            resizeMinWidth: undefined,
            
            resizeMinHeight: undefined,

            
            
            
            add: function (e, data) {
                $(this).fileupload('resize', data).done(function () {
                    data.submit();
                });
            }
        },

        
        
        _resizeImage: function (files, index, options) {
            var that = this,
                file = files[index],
                deferred = $.Deferred(),
                canvas,
                blob;
            options = options || this.options;
            loadImage(
                file,
                function (img) {
                    var width = img.width,
                        height = img.height;
                    canvas = loadImage.scale(img, {
                        maxWidth: options.resizeMaxWidth,
                        maxHeight: options.resizeMaxHeight,
                        minWidth: options.resizeMinWidth,
                        minHeight: options.resizeMinHeight,
                        canvas: true
                    });
                    if (width !== canvas.width || height !== canvas.height) {
                        canvasToBlob(canvas, function (blob) {
                            if (!blob.name) {
                                if (file.type === blob.type) {
                                    blob.name = file.name;
                                } else if (file.name) {
                                    blob.name = file.name.replace(
                                        /\..+$/,
                                        '.' + blob.type.substr(6)
                                    );
                                }
                            }
                            files[index] = blob;
                            deferred.resolveWith(that);
                        }, file);
                    } else {
                        deferred.resolveWith(that);
                    }
                }
            );
            return deferred.promise();
        },

        
        
        
        resize: function (data) {
            var that = this,
                options = $.extend({}, this.options, data),
                resizeAll = $.type(options.resizeSourceMaxFileSize) !== 'number',
                isXHRUpload = this._isXHRUpload(options);
            $.each(data.files, function (index, file) {
                if (isXHRUpload && that._resizeSupport &&
                        (options.resizeMaxWidth || options.resizeMaxHeight ||
                            options.resizeMinWidth || options.resizeMinHeight) &&
                        (resizeAll || file.size < options.resizeSourceMaxFileSize) &&
                        options.resizeSourceFileTypes.test(file.type)) {
                    that._processing += 1;
                    if (that._processing === 1) {
                        that.element.addClass('fileupload-processing');
                    }
                    that._processingQueue = that._processingQueue.pipe(function () {
                        var deferred = $.Deferred();
                        that._resizeImage(
                            data.files,
                            index,
                            options
                        ).done(function () {
                            that._processing -= 1;
                            if (that._processing === 0) {
                                that.element
                                    .removeClass('fileupload-processing');
                            }
                            deferred.resolveWith(that);
                        });
                        return deferred.promise();
                    });
                }
            });
            return this._processingQueue;
        },

        _create: function () {
            $.blueimp.fileupload.prototype._create.call(this);
            this._processing = 0;
            this._processingQueue = $.Deferred().resolveWith(this).promise();
            this._resizeSupport = canvasToBlob && canvasToBlob(
                document.createElement('canvas'),
                $.noop
            );
        }

    });

}));
