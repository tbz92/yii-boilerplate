$.editable.addInputType('bcolorpicker', {
    element : function(settings, original){

        var $input = $('<input/>').
            attr({'type':'text'}).
            css('width','100px');

        $(this).append($input);


        return $input;
    },
    plugin: function(settings, original) {

        var form = this;
        var $input = $('input', form);

        var options = $.extend({format:'hex'}, settings.colorformat || {});

        $input.colorpicker().on('changeColor', function(ev){
            $input.val(ev.color.toHex());
        });
        $('button', this).addClass('btn');

        setTimeout(function(){$input.select();},200);

    },
    reset: function(settings, original){
        var cpicker = $('input',this).colorpicker()[0];
        var picker = $(cpicker).data('colorpicker').picker;
        $(picker).remove();
        original.reset(this);
    }
});