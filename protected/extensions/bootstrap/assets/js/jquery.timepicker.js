

(function($){
	jQuery.fn.timepicker = function(){
		this.each(function(){
			
			var i = this.id;
			var v = $(this).val();
	
			
			var hrs = new Array('01','02','03','04','05','06','07','08','09','10','11','12');
			var mins = new Array('00','15','30','45');
			var ap = new Array('am','pm');
			
			
			var d = new Date;
			var h = d.getHours();
			var m = d.getMinutes();
			var p = (h >= 12 ? 'pm' : 'am');
			
			
			if(h > 12) h = h - 12;
				
			
			for(mn in mins){
				if(m <= parseInt(mins[mn])){
					m = parseInt(mins[mn]);
					break;
				}
			}
			
			
			if(m > 45){
				m = 0;
				
				switch(h){
					case(11):
						h += 1;
						p = (p == 'am' ? 'pm' : 'am');
						break;
						
					case(12):
						h = 1;
						break;
						
					default:
						h += 1;
						break;
				}
			}

			
			if(v.length == 7){
				h = parseInt(v.substr(0,2));
				m = parseInt(v.substr(3,2));
				p = v.substr(5);
			}
		    
			
			var output = '';
			
			output += '<select id="h_' + i + '" class="h timepicker">';				
			for(hr in hrs){
				output += '<option value="' + hrs[hr] + '"';
				if(parseInt(hrs[hr]) == h) output += ' selected';
				output += '>' + hrs[hr] + '</option>';
			}
			output += '</select>';
	
			output += '<select id="m_' + i + '" class="m timepicker">';				
			for(mn in mins){
				output += '<option value="' + mins[mn] + '"';
				if(parseInt(mins[mn]) == m) output += ' selected';
				output += '>' + mins[mn] + '</option>';
			}
			output += '</select>';				
	
			output += '<select id="p_' + i + '" class="p timepicker">';				
			for(pp in ap){
				output += '<option value="' + ap[pp] + '"';
				if(ap[pp] == p) output += ' selected';
				output += '>' + ap[pp] + '</option>';
			}
			output += '</select>';
    
			
			
            
			$(this).hide().after(output);
			
		});
		
		
		$('select.timepicker').change(function(){
			var i = this.id.substr(2);
			var h = $('#h_' + i).val();
			var m = $('#m_' + i).val();
			var p = $('#p_' + i).val();
			var v = h + ':' + m + p;
			$('#' + i).val(v);
		});
		
		return this;
	};
})(jQuery);




