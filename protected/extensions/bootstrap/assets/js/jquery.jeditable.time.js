$.editable.addInputType('time', {
    element : function(settings, original) {
        var hourselect = $('<select class="hour_" />');
        var minselect  = $('<select class="min_" />');


        for (var hour=0; hour <= 23; hour++) {
            if (hour < 10) {
                hour = '0' + hour;
            }
            var option = $('<option />').val(hour).append(hour);
            hourselect.append(option);
        }
        $(this).append(hourselect);

        for (var min=0; min <= 45; min = parseInt(min, 10) + 15) {
            if (min < 10) {
                min = '0' + min;
            }
            var option = $('<option />').val(min).append(min);
            minselect.append(option);
        }
        $(this).append(minselect);
                
        var hidden = $('<input type="hidden" />');
        $(this).append(hidden);
        return(hidden);
    },
    content : function(string, settings, original) {
        
        var hour = parseInt(string.substr(0,2), 10);
        var min  = parseInt(string.substr(3,2), 10);

        $('.hour_', this).children().each(function() {
            if (hour == $(this).val()) {
                $(this).attr('selected', 'selected');
            }
        });
        $('.min_', this).children().each(function() {
            if (min == $(this).val()) {
                $(this).attr('selected', 'selected');
            }
        });

    },
    submit: function (settings, original) {
        var value = $('.hour_', this).val() + ':' + $('.min_', this).val();
        $('input', this).val(value);
    }
});
