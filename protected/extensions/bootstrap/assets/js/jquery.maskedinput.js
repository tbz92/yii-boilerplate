
 
 
(function($) {
	
	function getCaretPosition(ctl){
		var res = {begin: 0, end: 0 };
		if (ctl.setSelectionRange){
			res.begin = ctl.selectionStart;
			res.end = ctl.selectionEnd;
		}else if (document.selection && document.selection.createRange){
			var range = document.selection.createRange();			
			res.begin = 0 - range.duplicate().moveStart('character', -100000);
			res.end = res.begin + range.text.length;
		}
		return res;
	};

	function setCaretPosition(ctl, pos){
		if(ctl.setSelectionRange){
			ctl.focus();
			ctl.setSelectionRange(pos,pos);
		}else if (ctl.createTextRange){
			var range = ctl.createTextRange();
			range.collapse(true);
			range.moveEnd('character', pos);
			range.moveStart('character', pos);
			range.select();
		}
	};
	
	
	var charMap={
		'9':"[0-9]",
		'a':"[A-Za-z]",
		'*':"[A-Za-z0-9]"
	};
	
	
	$.mask={
		addPlaceholder : function(c,r){
			charMap[c]=r;
		}
	};
	
	
	$.fn.mask = function(mask,settings) {	
		settings = $.extend({
			placeholder: "_",
			completed: null
		}, settings);
			
		
		var reString="^";	
		for(var i=0;i<mask.length;i++)
			reString+=(charMap[mask.charAt(i)] || ("\\"+mask.charAt(i)));					
		reString+="$";
		var re = new RegExp(reString);

		return this.each(function(){		
			var input=$(this);
			var buffer=new Array(mask.length);
			var locked=new Array(mask.length);		

			
			for(var i=0;i<mask.length;i++){
				locked[i]=charMap[mask.charAt(i)]==null;
				buffer[i]=locked[i]?mask.charAt(i):settings.placeholder;					
			}
			
			
			input.focus(function(){					
				checkVal();
				writeBuffer();
				setCaretPosition(this,0);		
			});

			input.blur(checkVal);
			
			
			if ($.browser.msie) 
				this.onpaste= function(){setTimeout(checkVal,0);};                     
			else if ($.browser.mozilla)
				this.addEventListener('input',checkVal,false);
			
			var ignore=false;  
			
			input.keydown(function(e){
				var pos=getCaretPosition(this);													
				var k = e.keyCode;
				ignore=(k < 16 || (k > 16 && k < 32 ) || (k > 32 && k < 41));
				
				
				if((pos.begin-pos.end)!=0 && (!ignore || k==8 || k==46)){
					clearBuffer(pos.begin,pos.end);
				}	
				
				if(k==8){
					while(pos.begin-->=0){
						if(!locked[pos.begin]){								
							buffer[pos.begin]=settings.placeholder;
							if($.browser.opera){
								
								writeBuffer(pos.begin);
								setCaretPosition(this,pos.begin+1);
							}else{
								writeBuffer();
								setCaretPosition(this,pos.begin);
							}									
							return false;								
						}
					}						
				}else if(k==46){
					clearBuffer(pos.begin,pos.begin+1);
					writeBuffer();
					setCaretPosition(this,pos.begin);
					return false;
				}else if (k==27){
					clearBuffer(0,mask.length);
					writeBuffer();
					setCaretPosition(this,0);
					return false;
				}
									
			});

			input.keypress(function(e){					
				if(ignore){
					ignore=false;
					return;
				}
				e=e||window.event;
				var k=e.charCode||e.keyCode||e.which;

				var pos=getCaretPosition(this);					
				var caretPos=pos.begin;	
				
				if(e.ctrlKey || e.altKey){
					return true;
				}else if ((k>=41 && k<=122) ||k==32 || k>186){
					while(pos.begin<mask.length){	
						var reString=charMap[mask.charAt(pos.begin)];
						var match;
						if(reString){
							var reChar=new RegExp(reString);
							match=String.fromCharCode(k).match(reChar);
						}else{
							pos.begin+=1;
							pos.end=pos.begin;
							caretPos+=1;
							continue;
						}

						if(match)
							buffer[pos.begin]=String.fromCharCode(k);
						else
							return false;

						while(++caretPos<mask.length){
							if(!locked[caretPos])							
								break;							
						}
						break;
					}
				}else
					return false;								

				writeBuffer();
				if(settings.completed && caretPos>=buffer.length)
					settings.completed.call(input);
				else
					setCaretPosition(this,caretPos);
				
				return false;				
			});

			
			function clearBuffer(start,end){
				for(var i=start;i<end;i++){
					if(!locked[i])
						buffer[i]=settings.placeholder;
				}				
			};
			
			function writeBuffer(pos){
				var s="";
				for(var i=0;i<mask.length;i++){
					s+=buffer[i];
					if(i==pos)
						s+=settings.placeholder;
				}
				input.val(s);
				return s;
			};
			
			function checkVal(){	
				
				var test=input.val();
				var pos=0;
				for(var i=0;i<mask.length;i++){
					if(!locked[i]){
						while(pos++<test.length){
							
							var reChar=new RegExp(charMap[mask.charAt(i)]);
							if(test.charAt(pos-1).match(reChar)){
								buffer[i]=test.charAt(pos-1);
								break;
							}									
						}
					}
				}
				var s=writeBuffer();
				if(!s.match(re)){							
					input.val("");	
					clearBuffer(0,mask.length);
				}					
			};				
		});
	};
})(jQuery);