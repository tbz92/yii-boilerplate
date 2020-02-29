$.editable.addInputType('masked', {
    element : function(settings, original) {
        var input = $('<input />').attr({'type':'text'}).css('width','100px').mask(settings.mask);
        $(this).append(input);
        return(input);
    }
});
