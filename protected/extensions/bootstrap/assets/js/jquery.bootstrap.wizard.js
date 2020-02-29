;(function($) {
var bootstrapWizardCreate = function(element, options) {
	var element = $(element);
	var obj = this;
	
	var $settings = $.extend({}, $.fn.bootstrapWizard.defaults, options);
	var $activeTab = null;
	var $navigation = null;
	
	this.fixNavigationButtons = function() {
		if(!$activeTab.length) {
			$navigation.find('a:first').tab('show');
			$activeTab = $navigation.find('li:first');
		}
		
		if(obj.firstIndex() >= obj.currentIndex()) {
			$('li.previous', element).addClass('disabled');
		} else{
			$('li.previous', element).removeClass('disabled');
		}
		
		if(obj.currentIndex() >= obj.navigationLength()) {
			$('li.next', element).addClass('disabled');
		} else {
			$('li.next', element).removeClass('disabled');
		}
		
		if($settings.onTabShow && typeof $settings.onTabShow === 'function' && $settings.onTabShow($activeTab, $navigation, obj.currentIndex())===false){
		    return false;
		}
	};
	
	this.next = function(e) {
		
		if(element.hasClass('last')) {
			return false;
		}
		
		if($settings.onNext && typeof $settings.onNext === 'function' && $settings.onNext($activeTab, $navigation, obj.nextIndex())===false){
		    return false;
		}
		
		$index = obj.nextIndex();
		if($index > obj.navigationLength()) {
		} else {
			$navigation.find('li:eq('+$index+') a').tab('show');
		}
    };

	this.previous = function(e) {
		
		if(element.hasClass('first')) {
			return false;
		}
		
		if($settings.onPrevious && typeof $settings.onPrevious === 'function' && $settings.onPrevious($activeTab, $navigation, obj.previousIndex())===false){
		    return false;
		}
		
      	$index = obj.previousIndex();
		if($index < 0) {
		} else {
			$navigation.find('li:eq('+$index+') a').tab('show');
		}
    };

	this.first = function(e) {
		if($settings.onFirst && typeof $settings.onFirst === 'function' && $settings.onFirst($activeTab, $navigation, obj.firstIndex())===false){
		    return false;
		}
		
		if(element.hasClass('disabled')) {
			return false;
		}
		$navigation.find('li:eq(0) a').tab('show');
		
	};
	this.last = function(e) {
		if($settings.onLast && typeof $settings.onLast === 'function' && $settings.onLast($activeTab, $navigation, obj.lastIndex())===false){
		    return false;
		}
		
		if(element.hasClass('disabled')) {
			return false;
		}
		$navigation.find('li:eq('+obj.navigationLength()+') a').tab('show');
	};
	this.currentIndex = function() {
		return $navigation.find('li').index($activeTab);
	};
	this.firstIndex = function() {
		return 0;
	};
	this.lastIndex = function() {
		return obj.navigationLength();
	};
	this.getIndex = function(elem) {
		return $navigation.find('li').index(elem);
	};
	this.nextIndex = function() {
		return $navigation.find('li').index($activeTab) + 1;
	};
	this.previousIndex = function() {
		return $navigation.find('li').index($activeTab) - 1;
	};
	this.navigationLength = function() {
		return $navigation.find('li').length - 1;
	};
	this.activeTab = function() {
		return $activeTab;
	};
	this.nextTab = function() {
		return $navigation.find('li:eq('+(obj.currentIndex()+1)+')').length ? $navigation.find('li:eq('+(obj.currentIndex()+1)+')') : null;
	};
	this.previousTab = function() {
		if(obj.currentIndex() <= 0) {
			return null;
		}
		return $navigation.find('li:eq('+parseInt(obj.currentIndex()-1)+')');
	};
	
	$navigation = element.find('ul:first', element);
	$activeTab = $navigation.find('li.active', element);
	
	if(!$navigation.hasClass($settings.class)) {
		$navigation.addClass($settings.class);
	}
	
	if($settings.onInit && typeof $settings.onInit === 'function'){
	    $settings.onInit($activeTab, $navigation, 0);
	}
	
	$($settings.nextSelector, element).bind('click', obj.next);
	$($settings.previousSelector, element).bind('click', obj.previous);
	$($settings.lastSelector, element).bind('click', obj.last);
	$($settings.firstSelector, element).bind('click', obj.first);

	if($settings.onShow && typeof $settings.onShow === 'function'){
	    $settings.onShow($activeTab, $navigation, obj.nextIndex());
	}
	
	obj.fixNavigationButtons();
	
	$('a[data-toggle="tab"]', element).on('click', function (e) {
		if($settings.onTabClick && typeof $settings.onTabClick === 'function' && $settings.onTabClick($activeTab, $navigation, obj.currentIndex())===false){
		    return false;
		}
	});
	
	$('a[data-toggle="tab"]', element).on('show', function (e) {
		$element = $(e.target).parent();
		if($element.hasClass('disabled')) {
			return false;
		}
		
	  	$activeTab = $element;
		obj.fixNavigationButtons();

	});
};
$.fn.bootstrapWizard = function(options) {	
    return this.each(function(index){
        var element = $(this);
		if (element.data('bootstrapWizard')) return;
		var wizard = new bootstrapWizardCreate(element, options);
		element.data('bootstrapWizard', wizard);
    });
};

$.fn.bootstrapWizard.defaults = {
    'class'         : 'nav nav-pills',
	'nextSelector': '.wizard li.next',
	'previousSelector': '.wizard li.previous',
	'firstSelector': '.wizard li.first',
	'lastSelector': '.wizard li.last',
	'onShow' : null,
	'onInit': null,
	'onNext': null,
	'onPrevious': null,
	'onLast': null,
	'onFirst': null,
	'onTabClick': null,
	'onTabShow': null
};

})(jQuery);
