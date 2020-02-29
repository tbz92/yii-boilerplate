(function () {

var UNDEFINED,
	doc = document,
	win = window,
	math = Math,
	mathRound = math.round,
	mathFloor = math.floor,
	mathCeil = math.ceil,
	mathMax = math.max,
	mathMin = math.min,
	mathAbs = math.abs,
	mathCos = math.cos,
	mathSin = math.sin,
	mathPI = math.PI,
	deg2rad = mathPI * 2 / 360,



	userAgent = navigator.userAgent,
	isIE = /msie/i.test(userAgent) && !win.opera,
	docMode8 = doc.documentMode === 8,
	isWebKit = /AppleWebKit/.test(userAgent),
	isFirefox = /Firefox/.test(userAgent),
	SVG_NS = 'http://www.w3.org/2000/svg',
	hasSVG = !!doc.createElementNS && !!doc.createElementNS(SVG_NS, 'svg').createSVGRect,
	hasBidiBug = isFirefox && parseInt(userAgent.split('Firefox/')[1], 10) < 4,
	useCanVG = !hasSVG && !isIE && !!doc.createElement('canvas').getContext,
	Renderer,
	hasTouch = doc.documentElement.ontouchstart !== UNDEFINED,
	symbolSizes = {},
	idCounter = 0,
	garbageBin,
	defaultOptions,
	dateFormat,
	globalAnimation,
	pathAnim,
	timeUnits,
	noop = function () {},


	DIV = 'div',
	ABSOLUTE = 'absolute',
	RELATIVE = 'relative',
	HIDDEN = 'hidden',
	PREFIX = 'highcharts-',
	VISIBLE = 'visible',
	PX = 'px',
	NONE = 'none',
	M = 'M',
	L = 'L',
	
	TRACKER_FILL = 'rgba(192,192,192,' + (hasSVG ? 0.000001 : 0.002) + ')',

	NORMAL_STATE = '',
	HOVER_STATE = 'hover',
	SELECT_STATE = 'select',
	MILLISECOND = 'millisecond',
	SECOND = 'second',
	MINUTE = 'minute',
	HOUR = 'hour',
	DAY = 'day',
	WEEK = 'week',
	MONTH = 'month',
	YEAR = 'year',


	FILL = 'fill',
	LINEAR_GRADIENT = 'linearGradient',
	STOPS = 'stops',
	STROKE = 'stroke',
	STROKE_WIDTH = 'stroke-width',


	makeTime,
	getMinutes,
	getHours,
	getDay,
	getDate,
	getMonth,
	getFullYear,
	setMinutes,
	setHours,
	setDate,
	setMonth,
	setFullYear,



	seriesTypes = {};


win.Highcharts = {};


function extend(a, b) {
	var n;
	if (!a) {
		a = {};
	}
	for (n in b) {
		a[n] = b[n];
	}
	return a;
}


function hash() {
	var i = 0,
		args = arguments,
		length = args.length,
		obj = {};
	for (; i < length; i++) {
		obj[args[i++]] = args[i];
	}
	return obj;
}


function pInt(s, mag) {
	return parseInt(s, mag || 10);
}


function isString(s) {
	return typeof s === 'string';
}


function isObject(obj) {
	return typeof obj === 'object';
}


function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}


function isNumber(n) {
	return typeof n === 'number';
}

function log2lin(num) {
	return math.log(num) / math.LN10;
}
function lin2log(num) {
	return math.pow(10, num);
}


function erase(arr, item) {
	var i = arr.length;
	while (i--) {
		if (arr[i] === item) {
			arr.splice(i, 1);
			break;
		}
	}

}


function defined(obj) {
	return obj !== UNDEFINED && obj !== null;
}


function attr(elem, prop, value) {
	var key,
		setAttribute = 'setAttribute',
		ret;


	if (isString(prop)) {

		if (defined(value)) {

			elem[setAttribute](prop, value);


		} else if (elem && elem.getAttribute) {
			ret = elem.getAttribute(prop);
		}


	} else if (defined(prop) && isObject(prop)) {
		for (key in prop) {
			elem[setAttribute](key, prop[key]);
		}
	}
	return ret;
}

function splat(obj) {
	return isArray(obj) ? obj : [obj];
}



function pick() {
	var args = arguments,
		i,
		arg,
		length = args.length;
	for (i = 0; i < length; i++) {
		arg = args[i];
		if (typeof arg !== 'undefined' && arg !== null) {
			return arg;
		}
	}
}


function css(el, styles) {
	if (isIE) {
		if (styles && styles.opacity !== UNDEFINED) {
			styles.filter = 'alpha(opacity=' + (styles.opacity * 100) + ')';
		}
	}
	extend(el.style, styles);
}


function createElement(tag, attribs, styles, parent, nopad) {
	var el = doc.createElement(tag);
	if (attribs) {
		extend(el, attribs);
	}
	if (nopad) {
		css(el, {padding: 0, border: NONE, margin: 0});
	}
	if (styles) {
		css(el, styles);
	}
	if (parent) {
		parent.appendChild(el);
	}
	return el;
}


function extendClass(parent, members) {
	var object = function () {};
	object.prototype = new parent();
	extend(object.prototype, members);
	return object;
}


function getDecimals(number) {
	
	number = (number || 0).toString();
	
	return number.indexOf('.') > -1 ? 
		number.split('.')[1].length :
		0;
}


function numberFormat(number, decimals, decPoint, thousandsSep) {
	var lang = defaultOptions.lang,

		n = number,
		c = decimals === -1 ?
			getDecimals(number) :
			(isNaN(decimals = mathAbs(decimals)) ? 2 : decimals),
		d = decPoint === undefined ? lang.decimalPoint : decPoint,
		t = thousandsSep === undefined ? lang.thousandsSep : thousandsSep,
		s = n < 0 ? "-" : "",
		i = String(pInt(n = mathAbs(+n || 0).toFixed(c))),
		j = i.length > 3 ? i.length % 3 : 0;

	return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
		(c ? d + mathAbs(n - i).toFixed(c).slice(2) : "");
}


function pad(number, length) {

	return new Array((length || 2) + 1 - String(number).length).join(0) + number;
}


dateFormat = function (format, timestamp, capitalize) {
	if (!defined(timestamp) || isNaN(timestamp)) {
		return 'Invalid date';
	}
	format = pick(format, '%Y-%m-%d %H:%M:%S');

	var date = new Date(timestamp),
		key,

		hours = date[getHours](),
		day = date[getDay](),
		dayOfMonth = date[getDate](),
		month = date[getMonth](),
		fullYear = date[getFullYear](),
		lang = defaultOptions.lang,
		langWeekdays = lang.weekdays,
		


		replacements = {


			'a': langWeekdays[day].substr(0, 3),
			'A': langWeekdays[day],
			'd': pad(dayOfMonth),
			'e': dayOfMonth,





			'b': lang.shortMonths[month],
			'B': lang.months[month],
			'm': pad(month + 1),


			'y': fullYear.toString().substr(2, 2),
			'Y': fullYear,


			'H': pad(hours),
			'I': pad((hours % 12) || 12),
			'l': (hours % 12) || 12,
			'M': pad(date[getMinutes]()),
			'p': hours < 12 ? 'AM' : 'PM',
			'P': hours < 12 ? 'am' : 'pm',
			'S': pad(date.getSeconds()),
			'L': pad(mathRound(timestamp % 1000), 3)
		};



	for (key in replacements) {
		format = format.replace('%' + key, replacements[key]);
	}


	return capitalize ? format.substr(0, 1).toUpperCase() + format.substr(1) : format;
};


function normalizeTickInterval(interval, multiples, magnitude, options) {
	var normalized, i;


	magnitude = pick(magnitude, 1);
	normalized = interval / magnitude;


	if (!multiples) {
		multiples = [1, 2, 2.5, 5, 10];


		if (options && options.allowDecimals === false) {
			if (magnitude === 1) {
				multiples = [1, 2, 5, 10];
			} else if (magnitude <= 0.1) {
				multiples = [1 / magnitude];
			}
		}
	}


	for (i = 0; i < multiples.length; i++) {
		interval = multiples[i];
		if (normalized <= (multiples[i] + (multiples[i + 1] || multiples[i])) / 2) {
			break;
		}
	}


	interval *= magnitude;

	return interval;
}


function normalizeTimeTickInterval(tickInterval, unitsOption) {
	var units = unitsOption || [[
				MILLISECOND,
				[1, 2, 5, 10, 20, 25, 50, 100, 200, 500]
			], [
				SECOND,
				[1, 2, 5, 10, 15, 30]
			], [
				MINUTE,
				[1, 2, 5, 10, 15, 30]
			], [
				HOUR,
				[1, 2, 3, 4, 6, 8, 12]
			], [
				DAY,
				[1, 2]
			], [
				WEEK,
				[1, 2]
			], [
				MONTH,
				[1, 2, 3, 4, 6]
			], [
				YEAR,
				null
			]],
		unit = units[units.length - 1],
		interval = timeUnits[unit[0]],
		multiples = unit[1],
		count,
		i;
		

	for (i = 0; i < units.length; i++) {
		unit = units[i];
		interval = timeUnits[unit[0]];
		multiples = unit[1];


		if (units[i + 1]) {

			var lessThan = (interval * multiples[multiples.length - 1] +
						timeUnits[units[i + 1][0]]) / 2;


			if (tickInterval <= lessThan) {
				break;
			}
		}
	}


	if (interval === timeUnits[YEAR] && tickInterval < 5 * interval) {
		multiples = [1, 2, 5];
	}
	

	if (interval === timeUnits[YEAR] && tickInterval < 5 * interval) {
		multiples = [1, 2, 5];
	}


	count = normalizeTickInterval(tickInterval / interval, multiples);
	
	return {
		unitRange: interval,
		count: count,
		unitName: unit[0]
	};
}


function getTimeTicks(normalizedInterval, min, max, startOfWeek) {
	var tickPositions = [],
		i,
		higherRanks = {},
		useUTC = defaultOptions.global.useUTC,
		minYear,
		minDate = new Date(min),
		interval = normalizedInterval.unitRange,
		count = normalizedInterval.count;

	

	if (interval >= timeUnits[SECOND]) {
		minDate.setMilliseconds(0);
		minDate.setSeconds(interval >= timeUnits[MINUTE] ? 0 :
			count * mathFloor(minDate.getSeconds() / count));
	}

	if (interval >= timeUnits[MINUTE]) {
		minDate[setMinutes](interval >= timeUnits[HOUR] ? 0 :
			count * mathFloor(minDate[getMinutes]() / count));
	}

	if (interval >= timeUnits[HOUR]) {
		minDate[setHours](interval >= timeUnits[DAY] ? 0 :
			count * mathFloor(minDate[getHours]() / count));
	}

	if (interval >= timeUnits[DAY]) {
		minDate[setDate](interval >= timeUnits[MONTH] ? 1 :
			count * mathFloor(minDate[getDate]() / count));
	}

	if (interval >= timeUnits[MONTH]) {
		minDate[setMonth](interval >= timeUnits[YEAR] ? 0 :
			count * mathFloor(minDate[getMonth]() / count));
		minYear = minDate[getFullYear]();
	}

	if (interval >= timeUnits[YEAR]) {
		minYear -= minYear % count;
		minDate[setFullYear](minYear);
	}


	if (interval === timeUnits[WEEK]) {

		minDate[setDate](minDate[getDate]() - minDate[getDay]() +
			pick(startOfWeek, 1));
	}



	i = 1;
	minYear = minDate[getFullYear]();
	var time = minDate.getTime(),
		minMonth = minDate[getMonth](),
		minDateDate = minDate[getDate](),
		timezoneOffset = useUTC ? 
			0 : 
			(24 * 3600 * 1000 + minDate.getTimezoneOffset() * 60 * 1000) % (24 * 3600 * 1000);


	while (time < max) {
		tickPositions.push(time);


		if (interval === timeUnits[YEAR]) {
			time = makeTime(minYear + i * count, 0);


		} else if (interval === timeUnits[MONTH]) {
			time = makeTime(minYear, minMonth + i * count);



		} else if (!useUTC && (interval === timeUnits[DAY] || interval === timeUnits[WEEK])) {
			time = makeTime(minYear, minMonth, minDateDate +
				i * count * (interval === timeUnits[DAY] ? 1 : 7));


		} else {
			time += interval * count;
			

			if (interval <= timeUnits[HOUR] && time % timeUnits[DAY] === timezoneOffset) {
				higherRanks[time] = DAY;
			}
		}

		i++;
	}
	

	tickPositions.push(time);


	tickPositions.info = extend(normalizedInterval, {
		higherRanks: higherRanks,
		totalRange: interval * count
	});

	return tickPositions;
}


function ChartCounters() {
	this.color = 0;
	this.symbol = 0;
}

ChartCounters.prototype =  {
	
	wrapColor: function (length) {
		if (this.color >= length) {
			this.color = 0;
		}
	},

	
	wrapSymbol: function (length) {
		if (this.symbol >= length) {
			this.symbol = 0;
		}
	}
};



function stableSort(arr, sortFunction) {
	var length = arr.length,
		sortValue,
		i;


	for (i = 0; i < length; i++) {
		arr[i].ss_i = i;
	}

	arr.sort(function (a, b) {
		sortValue = sortFunction(a, b);
		return sortValue === 0 ? a.ss_i - b.ss_i : sortValue;
	});


	for (i = 0; i < length; i++) {
		delete arr[i].ss_i;
	}
}


function arrayMin(data) {
	var i = data.length,
		min = data[0];

	while (i--) {
		if (data[i] < min) {
			min = data[i];
		}
	}
	return min;
}


function arrayMax(data) {
	var i = data.length,
		max = data[0];

	while (i--) {
		if (data[i] > max) {
			max = data[i];
		}
	}
	return max;
}


function destroyObjectProperties(obj, except) {
	var n;
	for (n in obj) {

		if (obj[n] && obj[n] !== except && obj[n].destroy) {

			obj[n].destroy();
		}


		delete obj[n];
	}
}



function discardElement(element) {

	if (!garbageBin) {
		garbageBin = createElement(DIV);
	}


	if (element) {
		garbageBin.appendChild(element);
	}
	garbageBin.innerHTML = '';
}


function error(code, stop) {
	var msg = 'Highcharts error #' + code + ': www.highcharts.com/errors/' + code;
	if (stop) {
		throw msg;
	} else if (win.console) {
		console.log(msg);
	}
}


function correctFloat(num) {
	return parseFloat(
		num.toPrecision(14)
	);
}



timeUnits = hash(
	MILLISECOND, 1,
	SECOND, 1000,
	MINUTE, 60000,
	HOUR, 3600000,
	DAY, 24 * 3600000,
	WEEK, 7 * 24 * 3600000,
	MONTH, 30 * 24 * 3600000,
	YEAR, 31556952000
);


pathAnim = {
	
	init: function (elem, fromD, toD) {
		fromD = fromD || '';
		var shift = elem.shift,
			bezier = fromD.indexOf('C') > -1,
			numParams = bezier ? 7 : 3,
			endLength,
			slice,
			i,
			start = fromD.split(' '),
			end = [].concat(toD),
			startBaseLine,
			endBaseLine,
			sixify = function (arr) {
				i = arr.length;
				while (i--) {
					if (arr[i] === M) {
						arr.splice(i + 1, 0, arr[i + 1], arr[i + 2], arr[i + 1], arr[i + 2]);
					}
				}
			};

		if (bezier) {
			sixify(start);
			sixify(end);
		}


		if (elem.isArea) {
			startBaseLine = start.splice(start.length - 6, 6);
			endBaseLine = end.splice(end.length - 6, 6);
		}


		if (shift <= end.length / numParams) {
			while (shift--) {
				end = [].concat(end).splice(0, numParams).concat(end);
			}
		}
		elem.shift = 0;


		if (start.length) {
			endLength = end.length;
			while (start.length < endLength) {


				slice = [].concat(start).splice(start.length - numParams, numParams);
				if (bezier) {
					slice[numParams - 6] = slice[numParams - 2];
					slice[numParams - 5] = slice[numParams - 1];
				}
				start = start.concat(slice);
			}
		}

		if (startBaseLine) {
			start = start.concat(startBaseLine);
			end = end.concat(endBaseLine);
		}
		return [start, end];
	},

	
	step: function (start, end, pos, complete) {
		var ret = [],
			i = start.length,
			startVal;

		if (pos === 1) {
			ret = complete;

		} else if (i === end.length && pos < 1) {
			while (i--) {
				startVal = parseFloat(start[i]);
				ret[i] =
					isNaN(startVal) ?
						start[i] :
						pos * (parseFloat(end[i] - startVal)) + startVal;

			}
		} else {
			ret = end;
		}
		return ret;
	}
};



function setAnimation(animation, chart) {
	globalAnimation = pick(animation, chart.animation);
}




var globalAdapter = win.HighchartsAdapter,
	adapter = globalAdapter || {},




	adapterRun = adapter.adapterRun,
	getScript = adapter.getScript,
	each = adapter.each,
	grep = adapter.grep,
	offset = adapter.offset,
	map = adapter.map,
	merge = adapter.merge,
	addEvent = adapter.addEvent,
	removeEvent = adapter.removeEvent,
	fireEvent = adapter.fireEvent,
	washMouseEvent = adapter.washMouseEvent,
	animate = adapter.animate,
	stop = adapter.stop;


if (globalAdapter && globalAdapter.init) {


	globalAdapter.init(pathAnim);
}
if (!globalAdapter && win.jQuery) {
	var jQ = jQuery;

	
	getScript = jQ.getScript;
	
	
	adapterRun = function (elem, method) {
		return jQ(elem)[method]();
	};

	
	each = function (arr, fn) {
		var i = 0,
			len = arr.length;
		for (; i < len; i++) {
			if (fn.call(arr[i], arr[i], i, arr) === false) {
				return i;
			}
		}
	};

	
	grep = jQ.grep;

	
	map = function (arr, fn) {

		var results = [],
			i = 0,
			len = arr.length;
		for (; i < len; i++) {
			results[i] = fn.call(arr[i], arr[i], i, arr);
		}
		return results;

	};

	
	merge = function () {
		var args = arguments;
		return jQ.extend(true, null, args[0], args[1], args[2], args[3]);
	};

	
	offset = function (el) {
		return jQ(el).offset();
	};

	
	addEvent = function (el, event, fn) {
		jQ(el).bind(event, fn);
	};

	
	removeEvent = function (el, eventType, handler) {


		var func = doc.removeEventListener ? 'removeEventListener' : 'detachEvent';
		if (doc[func] && !el[func]) {
			el[func] = function () {};
		}

		jQ(el).unbind(eventType, handler);
	};

	
	fireEvent = function (el, type, eventArguments, defaultFunction) {
		var event = jQ.Event(type),
			detachedType = 'detached' + type,
			defaultPrevented;







		if (!isIE && eventArguments) {
			delete eventArguments.layerX;
			delete eventArguments.layerY;
		}

		extend(event, eventArguments);




		if (el[type]) {
			el[detachedType] = el[type];
			el[type] = null;
		}




		each(['preventDefault', 'stopPropagation'], function (fn) {
			var base = event[fn];
			event[fn] = function () {
				try {
					base.call(event);
				} catch (e) {
					if (fn === 'preventDefault') {
						defaultPrevented = true;
					}
				}
			};
		});


		jQ(el).trigger(event);


		if (el[detachedType]) {
			el[type] = el[detachedType];
			el[detachedType] = null;
		}

		if (defaultFunction && !event.isDefaultPrevented() && !defaultPrevented) {
			defaultFunction(event);
		}
	};
	
	
	washMouseEvent = function (e) {
		return e;
	};

	
	animate = function (el, params, options) {
		var $el = jQ(el);
		if (params.d) {
			el.toD = params.d;
			params.d = 1;
		}

		$el.stop();
		$el.animate(params, options);

	};
	
	stop = function (el) {
		jQ(el).stop();
	};




	
	jQ.extend(jQ.easing, {
		easeOutQuad: function (x, t, b, c, d) {
			return -c * (t /= d) * (t - 2) + b;
		}
	});
	


	var jFx = jQ.fx,
		jStep = jFx.step;


	each(['cur', '_default', 'width', 'height'], function (fn, i) {
		var obj = jStep,
			base,
			elem;
			

		if (fn === 'cur') {
			obj = jFx.prototype;
		
		} else if (fn === '_default' && jQ.Tween) {
			obj = jQ.Tween.propHooks[fn];
			fn = 'set';
		}


		base = obj[fn];
		if (base) {


			obj[fn] = function (fx) {


				fx = i ? fx : this;


				elem = fx.elem;



				return elem.attr ?
					elem.attr(fx.prop, fn === 'cur' ? UNDEFINED : fx.now) :
					base.apply(this, arguments);
			};
		}
	});


	jStep.d = function (fx) {
		var elem = fx.elem;





		if (!fx.started) {
			var ends = pathAnim.init(elem, elem.d, elem.toD);
			fx.start = ends[0];
			fx.end = ends[1];
			fx.started = true;
		}



		elem.attr('d', pathAnim.step(fx.start, fx.end, fx.pos, elem.toD));

	};
}


var

defaultLabelOptions = {
	enabled: true,

	align: 'center',
	x: 0,
	y: 15,
	
	style: {
		color: '#666',
		fontSize: '11px',
		lineHeight: '14px'
	}
};

defaultOptions = {
	colors: ['#4572A7', '#AA4643', '#89A54E', '#80699B', '#3D96AE',
		'#DB843D', '#92A8CD', '#A47D7C', '#B5CA92'],
	symbols: ['circle', 'diamond', 'square', 'triangle', 'triangle-down'],
	lang: {
		loading: 'Loading...',
		months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
				'August', 'September', 'October', 'November', 'December'],
		shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		decimalPoint: '.',
		resetZoom: 'Reset zoom',
		resetZoomTitle: 'Reset zoom level 1:1',
		thousandsSep: ','
	},
	global: {
		useUTC: true,
		canvasToolsURL: 'http://code.highcharts.com/2.2.5/modules/canvas-tools.js'
	},
	chart: {










		borderColor: '#4572A7',

		borderRadius: 5,
		defaultSeriesType: 'line',
		ignoreHiddenSeries: true,


		spacingTop: 10,
		spacingRight: 10,
		spacingBottom: 15,
		spacingLeft: 10,
		style: {
			fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif',
			fontSize: '12px'
		},
		backgroundColor: '#FFFFFF',

		plotBorderColor: '#C0C0C0',



		resetZoomButton: {
			theme: {
				zIndex: 20
			},
			position: {
				align: 'right',
				x: -10,

				y: 10
			}

		}
	},
	title: {
		text: 'Chart title',
		align: 'center',




		y: 15,
		style: {
			color: '#3E576F',
			fontSize: '16px'
		}

	},
	subtitle: {
		text: '',
		align: 'center',



		y: 30,
		style: {
			color: '#6D869F'
		}
	},

	plotOptions: {
		line: {
			allowPointSelect: false,
			showCheckbox: false,
			animation: {
				duration: 1000
			},





			events: {},

			lineWidth: 2,
			shadow: true,

			marker: {
				enabled: true,

				lineWidth: 0,
				radius: 4,
				lineColor: '#FFFFFF',

				states: {
					hover: {

					},
					select: {
						fillColor: '#FFFFFF',
						lineColor: '#000000',
						lineWidth: 2
					}
				}
			},
			point: {
				events: {}
			},
			dataLabels: merge(defaultLabelOptions, {
				enabled: false,
				y: -6,
				formatter: function () {
					return this.y;
				}






			}),
			cropThreshold: 300,
			pointRange: 0,


			showInLegend: true,
			states: {
				hover: {


					marker: {


					}
				},
				select: {
					marker: {}
				}
			},
			stickyTracking: true









		}
	},
	labels: {

		style: {

			position: ABSOLUTE,
			color: '#3E576F'
		}
	},
	legend: {
		enabled: true,
		align: 'center',

		layout: 'horizontal',
		labelFormatter: function () {
			return this.name;
		},
		borderWidth: 1,
		borderColor: '#909090',
		borderRadius: 5,
		navigation: {

			activeColor: '#3E576F',

			inactiveColor: '#CCC'

		},


		shadow: false,

		
		itemStyle: {
			cursor: 'pointer',
			color: '#3E576F',
			fontSize: '12px'
		},
		itemHoverStyle: {

			color: '#000'
		},
		itemHiddenStyle: {
			color: '#CCC'
		},
		itemCheckboxStyle: {
			position: ABSOLUTE,
			width: '13px',
			height: '13px'
		},

		symbolWidth: 16,
		symbolPadding: 5,
		verticalAlign: 'bottom',

		x: 0,
		y: 0
	},

	loading: {

		labelStyle: {
			fontWeight: 'bold',
			position: RELATIVE,
			top: '1em'
		},

		style: {
			position: ABSOLUTE,
			backgroundColor: 'white',
			opacity: 0.5,
			textAlign: 'center'
		}
	},

	tooltip: {
		enabled: true,

		backgroundColor: 'rgba(255, 255, 255, .85)',
		borderWidth: 2,
		borderRadius: 5,
		dateTimeLabelFormats: { 
			millisecond: '%A, %b %e, %H:%M:%S.%L',
			second: '%A, %b %e, %H:%M:%S',
			minute: '%A, %b %e, %H:%M',
			hour: '%A, %b %e, %H:%M',
			day: '%A, %b %e, %Y',
			week: 'Week from %A, %b %e, %Y',
			month: '%B %Y',
			year: '%Y'
		},

		headerFormat: '<span style="font-size: 10px">{point.key}</span><br/>',
		pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
		shadow: true,
		shared: useCanVG,
		snap: hasTouch ? 25 : 10,
		style: {
			color: '#333333',
			fontSize: '12px',
			padding: '5px',
			whiteSpace: 'nowrap'
		}




	},

	credits: {
		enabled: true,
		text: 'Highcharts.com',
		href: 'http://www.highcharts.com',
		position: {
			align: 'right',
			x: -10,
			verticalAlign: 'bottom',
			y: -5
		},
		style: {
			cursor: 'pointer',
			color: '#909090',
			fontSize: '10px'
		}
	}
};





var defaultPlotOptions = defaultOptions.plotOptions,
	defaultSeriesOptions = defaultPlotOptions.line;


setTimeMethods();




function setTimeMethods() {
	var useUTC = defaultOptions.global.useUTC,
		GET = useUTC ? 'getUTC' : 'get',
		SET = useUTC ? 'setUTC' : 'set';

	makeTime = useUTC ? Date.UTC : function (year, month, date, hours, minutes, seconds) {
		return new Date(
			year,
			month,
			pick(date, 1),
			pick(hours, 0),
			pick(minutes, 0),
			pick(seconds, 0)
		).getTime();
	};
	getMinutes =  GET + 'Minutes';
	getHours =    GET + 'Hours';
	getDay =      GET + 'Day';
	getDate =     GET + 'Date';
	getMonth =    GET + 'Month';
	getFullYear = GET + 'FullYear';
	setMinutes =  SET + 'Minutes';
	setHours =    SET + 'Hours';
	setDate =     SET + 'Date';
	setMonth =    SET + 'Month';
	setFullYear = SET + 'FullYear';

}


function setOptions(options) {
	

	
	

	defaultOptions = merge(defaultOptions, options);
	

	setTimeMethods();

	return defaultOptions;
}


function getOptions() {
	return defaultOptions;
}




var Color = function (input) {

	var rgba = [], result;

	
	function init(input) {


		result = /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]?(?:\.[0-9]+)?)\s*\)/.exec(input);
		if (result) {
			rgba = [pInt(result[1]), pInt(result[2]), pInt(result[3]), parseFloat(result[4], 10)];
		} else {
			result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(input);
			if (result) {
				rgba = [pInt(result[1], 16), pInt(result[2], 16), pInt(result[3], 16), 1];
			}
		}

	}
	
	function get(format) {
		var ret;


		if (rgba && !isNaN(rgba[0])) {
			if (format === 'rgb') {
				ret = 'rgb(' + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ')';
			} else if (format === 'a') {
				ret = rgba[3];
			} else {
				ret = 'rgba(' + rgba.join(',') + ')';
			}
		} else {
			ret = input;
		}
		return ret;
	}

	
	function brighten(alpha) {
		if (isNumber(alpha) && alpha !== 0) {
			var i;
			for (i = 0; i < 3; i++) {
				rgba[i] += pInt(alpha * 255);

				if (rgba[i] < 0) {
					rgba[i] = 0;
				}
				if (rgba[i] > 255) {
					rgba[i] = 255;
				}
			}
		}
		return this;
	}
	
	function setOpacity(alpha) {
		rgba[3] = alpha;
		return this;
	}


	init(input);


	return {
		get: get,
		brighten: brighten,
		setOpacity: setOpacity
	};
};



function SVGElement() {}

SVGElement.prototype = {
	
	init: function (renderer, nodeName) {
		var wrapper = this;
		wrapper.element = nodeName === 'span' ?
			createElement(nodeName) :
			doc.createElementNS(SVG_NS, nodeName);
		wrapper.renderer = renderer;
		
		wrapper.attrSetters = {};
	},
	
	animate: function (params, options, complete) {
		var animOptions = pick(options, globalAnimation, true);
		stop(this);
		if (animOptions) {
			animOptions = merge(animOptions);
			if (complete) {
				animOptions.complete = complete;
			}
			animate(this, params, animOptions);
		} else {
			this.attr(params);
			if (complete) {
				complete();
			}
		}
	},
	
	attr: function (hash, val) {
		var wrapper = this,
			key,
			value,
			result,
			i,
			child,
			element = wrapper.element,
			nodeName = element.nodeName,
			renderer = wrapper.renderer,
			skipAttr,
			titleNode,
			attrSetters = wrapper.attrSetters,
			shadows = wrapper.shadows,
			hasSetSymbolSize,
			doTransform,
			ret = wrapper;


		if (isString(hash) && defined(val)) {
			key = hash;
			hash = {};
			hash[key] = val;
		}


		if (isString(hash)) {
			key = hash;
			if (nodeName === 'circle') {
				key = { x: 'cx', y: 'cy' }[key] || key;
			} else if (key === 'strokeWidth') {
				key = 'stroke-width';
			}
			ret = attr(element, key) || wrapper[key] || 0;

			if (key !== 'd' && key !== 'visibility') {
				ret = parseFloat(ret);
			}


		} else {

			for (key in hash) {
				skipAttr = false;
				value = hash[key];


				result = attrSetters[key] && attrSetters[key](value, key);

				if (result !== false) {
					if (result !== UNDEFINED) {
						value = result;
					}


					if (key === 'd') {
						if (value && value.join) {
							value = value.join(' ');
						}
						if (/(NaN| {2}|^$)/.test(value)) {
							value = 'M 0 0';
						}



					} else if (key === 'x' && nodeName === 'text') {
						for (i = 0; i < element.childNodes.length; i++) {
							child = element.childNodes[i];

							if (attr(child, 'x') === attr(element, 'x')) {

								attr(child, 'x', value);
							}
						}

						if (wrapper.rotation) {
							attr(element, 'transform', 'rotate(' + wrapper.rotation + ' ' + value + ' ' +
								pInt(hash.y || attr(element, 'y')) + ')');
						}


					} else if (key === 'fill') {
						value = renderer.color(value, element, key);


					} else if (nodeName === 'circle' && (key === 'x' || key === 'y')) {
						key = { x: 'cx', y: 'cy' }[key] || key;


					} else if (nodeName === 'rect' && key === 'r') {
						attr(element, {
							rx: value,
							ry: value
						});
						skipAttr = true;


					} else if (key === 'translateX' || key === 'translateY' || key === 'rotation' || key === 'verticalAlign') {
						doTransform = true;
						skipAttr = true;


					} else if (key === 'stroke') {
						value = renderer.color(value, element, key);


					} else if (key === 'dashstyle') {
						key = 'stroke-dasharray';
						value = value && value.toLowerCase();
						if (value === 'solid') {
							value = NONE;
						} else if (value) {
							value = value
								.replace('shortdashdotdot', '3,1,1,1,1,1,')
								.replace('shortdashdot', '3,1,1,1')
								.replace('shortdot', '1,1,')
								.replace('shortdash', '3,1,')
								.replace('longdash', '8,3,')
								.replace(/dot/g, '1,3,')
								.replace('dash', '4,3,')
								.replace(/,$/, '')
								.split(',');

							i = value.length;
							while (i--) {
								value[i] = pInt(value[i]) * hash['stroke-width'];
							}
							value = value.join(',');
						}


					} else if (key === 'isTracker') {
						wrapper[key] = value;



					} else if (key === 'width') {
						value = pInt(value);


					} else if (key === 'align') {
						key = 'text-anchor';
						value = { left: 'start', center: 'middle', right: 'end' }[value];


					} else if (key === 'title') {
						titleNode = element.getElementsByTagName('title')[0];
						if (!titleNode) {
							titleNode = doc.createElementNS(SVG_NS, 'title');
							element.appendChild(titleNode);
						}
						titleNode.textContent = value;
					}


					if (key === 'strokeWidth') {
						key = 'stroke-width';
					}


					if (isWebKit && key === 'stroke-width' && value === 0) {
						value = 0.000001;
					}


					if (wrapper.symbolName && /^(x|y|width|height|r|start|end|innerR|anchorX|anchorY)/.test(key)) {


						if (!hasSetSymbolSize) {
							wrapper.symbolAttr(hash);
							hasSetSymbolSize = true;
						}
						skipAttr = true;
					}


					if (shadows && /^(width|height|visibility|x|y|d|transform)$/.test(key)) {
						i = shadows.length;
						while (i--) {
							attr(
								shadows[i], 
								key, 
								key === 'height' ? 
									mathMax(value - (shadows[i].cutHeight || 0), 0) :
									value
							);
						}
					}


					if ((key === 'width' || key === 'height') && nodeName === 'rect' && value < 0) {
						value = 0;
					}


					wrapper[key] = value;
					

					if (doTransform) {
						wrapper.updateTransform();
					}


					if (key === 'text') {

						wrapper.textStr = value;
						if (wrapper.added) {
							renderer.buildText(wrapper);
						}
					} else if (!skipAttr) {
						attr(element, key, value);
					}

				}

			}

		}
		


		if (isWebKit && /Chrome\/(18|19)/.test(userAgent)) {
			if (nodeName === 'text' && (hash.x !== UNDEFINED || hash.y !== UNDEFINED)) {
				var parent = element.parentNode,
					next = element.nextSibling;
			
				if (parent) {
					parent.removeChild(element);
					if (next) {
						parent.insertBefore(element, next);
					} else {
						parent.appendChild(element);
					}
				}
			}
		}

		
		return ret;
	},

	
	symbolAttr: function (hash) {
		var wrapper = this;

		each(['x', 'y', 'r', 'start', 'end', 'width', 'height', 'innerR', 'anchorX', 'anchorY'], function (key) {
			wrapper[key] = pick(hash[key], wrapper[key]);
		});

		wrapper.attr({
			d: wrapper.renderer.symbols[wrapper.symbolName](wrapper.x, wrapper.y, wrapper.width, wrapper.height, wrapper)
		});
	},

	
	clip: function (clipRect) {
		return this.attr('clip-path', 'url(' + this.renderer.url + '#' + clipRect.id + ')');
	},

	
	crisp: function (strokeWidth, x, y, width, height) {

		var wrapper = this,
			key,
			attribs = {},
			values = {},
			normalizer;

		strokeWidth = strokeWidth || wrapper.strokeWidth || (wrapper.attr && wrapper.attr('stroke-width')) || 0;
		normalizer = mathRound(strokeWidth) % 2 / 2;


		values.x = mathFloor(x || wrapper.x || 0) + normalizer;
		values.y = mathFloor(y || wrapper.y || 0) + normalizer;
		values.width = mathFloor((width || wrapper.width || 0) - 2 * normalizer);
		values.height = mathFloor((height || wrapper.height || 0) - 2 * normalizer);
		values.strokeWidth = strokeWidth;

		for (key in values) {
			if (wrapper[key] !== values[key]) {
				wrapper[key] = attribs[key] = values[key];
			}
		}

		return attribs;
	},

	
	css: function (styles) {
		
		var elemWrapper = this,
			elem = elemWrapper.element,
			textWidth = styles && styles.width && elem.nodeName === 'text',
			n,
			serializedCss = '',
			hyphenate = function (a, b) { return '-' + b.toLowerCase(); };
		


		if (styles && styles.color) {
			styles.fill = styles.color;
		}


		styles = extend(
			elemWrapper.styles,
			styles
		);


		elemWrapper.styles = styles;


		if (isIE && !hasSVG) {
			if (textWidth) {
				delete styles.width;
			}
			css(elemWrapper.element, styles);
		} else {
			for (n in styles) {
				serializedCss += n.replace(/([A-Z])/g, hyphenate) + ':' + styles[n] + ';';
			}
			elemWrapper.attr({
				style: serializedCss
			});
		}



		if (textWidth && elemWrapper.added) {
			elemWrapper.renderer.buildText(elemWrapper);
		}

		return elemWrapper;
	},

	
	on: function (eventType, handler) {
		var fn = handler;

		if (hasTouch && eventType === 'click') {
			eventType = 'touchstart';
			fn = function (e) {
				e.preventDefault();
				handler();
			};
		}

		this.element['on' + eventType] = fn;
		return this;
	},
	
	
	setRadialReference: function (coordinates) {
		this.element.radialReference = coordinates;
		return this;
	},

	
	translate: function (x, y) {
		return this.attr({
			translateX: x,
			translateY: y
		});
	},

	
	invert: function () {
		var wrapper = this;
		wrapper.inverted = true;
		wrapper.updateTransform();
		return wrapper;
	},

	
	htmlCss: function (styles) {
		var wrapper = this,
			element = wrapper.element,
			textWidth = styles && element.tagName === 'SPAN' && styles.width;

		if (textWidth) {
			delete styles.width;
			wrapper.textWidth = textWidth;
			wrapper.updateTransform();
		}

		wrapper.styles = extend(wrapper.styles, styles);
		css(wrapper.element, styles);

		return wrapper;
	},



	

	htmlGetBBox: function (refresh) {
		var wrapper = this,
			element = wrapper.element,
			bBox = wrapper.bBox;


		if (!bBox || refresh) {

			if (element.nodeName === 'text') {
				element.style.position = ABSOLUTE;
			}

			bBox = wrapper.bBox = {
				x: element.offsetLeft,
				y: element.offsetTop,
				width: element.offsetWidth,
				height: element.offsetHeight
			};
		}

		return bBox;
	},

	
	htmlUpdateTransform: function () {

		if (!this.added) {
			this.alignOnAdd = true;
			return;
		}

		var wrapper = this,
			renderer = wrapper.renderer,
			elem = wrapper.element,
			translateX = wrapper.translateX || 0,
			translateY = wrapper.translateY || 0,
			x = wrapper.x || 0,
			y = wrapper.y || 0,
			align = wrapper.textAlign || 'left',
			alignCorrection = { left: 0, center: 0.5, right: 1 }[align],
			nonLeft = align && align !== 'left',
			shadows = wrapper.shadows;


		if (translateX || translateY) {
			css(elem, {
				marginLeft: translateX,
				marginTop: translateY
			});
			if (shadows) {
				each(shadows, function (shadow) {
					css(shadow, {
						marginLeft: translateX + 1,
						marginTop: translateY + 1
					});
				});
			}
		}


		if (wrapper.inverted) {
			each(elem.childNodes, function (child) {
				renderer.invertChild(child, elem);
			});
		}

		if (elem.tagName === 'SPAN') {

			var width, height,
				rotation = wrapper.rotation,
				baseline,
				radians = 0,
				costheta = 1,
				sintheta = 0,
				quad,
				textWidth = pInt(wrapper.textWidth),
				xCorr = wrapper.xCorr || 0,
				yCorr = wrapper.yCorr || 0,
				currentTextTransform = [rotation, align, elem.innerHTML, wrapper.textWidth].join(',');

			if (currentTextTransform !== wrapper.cTT) {

				if (defined(rotation)) {
					radians = rotation * deg2rad;
					costheta = mathCos(radians);
					sintheta = mathSin(radians);






					css(elem, {
						filter: rotation ? ['progid:DXImageTransform.Microsoft.Matrix(M11=', costheta,
							', M12=', -sintheta, ', M21=', sintheta, ', M22=', costheta,
							', sizingMethod=\'auto expand\')'].join('') : NONE
					});
				}

				width = pick(wrapper.elemWidth, elem.offsetWidth);
				height = pick(wrapper.elemHeight, elem.offsetHeight);


				if (width > textWidth && /[ \-]/.test(elem.innerText)) {
					css(elem, {
						width: textWidth + PX,
						display: 'block',
						whiteSpace: 'normal'
					});
					width = textWidth;
				}


				baseline = renderer.fontMetrics(elem.style.fontSize).b;
				xCorr = costheta < 0 && -width;
				yCorr = sintheta < 0 && -height;


				quad = costheta * sintheta < 0;
				xCorr += sintheta * baseline * (quad ? 1 - alignCorrection : alignCorrection);
				yCorr -= costheta * baseline * (rotation ? (quad ? alignCorrection : 1 - alignCorrection) : 1);


				if (nonLeft) {
					xCorr -= width * alignCorrection * (costheta < 0 ? -1 : 1);
					if (rotation) {
						yCorr -= height * alignCorrection * (sintheta < 0 ? -1 : 1);
					}
					css(elem, {
						textAlign: align
					});
				}


				wrapper.xCorr = xCorr;
				wrapper.yCorr = yCorr;
			}


			css(elem, {
				left: (x + xCorr) + PX,
				top: (y + yCorr) + PX
			});


			wrapper.cTT = currentTextTransform;
		}
	},

	
	updateTransform: function () {
		var wrapper = this,
			translateX = wrapper.translateX || 0,
			translateY = wrapper.translateY || 0,
			inverted = wrapper.inverted,
			rotation = wrapper.rotation,
			transform = [];


		if (inverted) {
			translateX += wrapper.attr('width');
			translateY += wrapper.attr('height');
		}


		if (translateX || translateY) {
			transform.push('translate(' + translateX + ',' + translateY + ')');
		}


		if (inverted) {
			transform.push('rotate(90) scale(-1,1)');
		} else if (rotation) {
			transform.push('rotate(' + rotation + ' ' + (wrapper.x || 0) + ' ' + (wrapper.y || 0) + ')');
		}

		if (transform.length) {
			attr(wrapper.element, 'transform', transform.join(' '));
		}
	},
	
	toFront: function () {
		var element = this.element;
		element.parentNode.appendChild(element);
		return this;
	},


	
	align: function (alignOptions, alignByTranslate, box) {
		var elemWrapper = this;

		if (!alignOptions) {
			alignOptions = elemWrapper.alignOptions;
			alignByTranslate = elemWrapper.alignByTranslate;
		} else {
			elemWrapper.alignOptions = alignOptions;
			elemWrapper.alignByTranslate = alignByTranslate;
			if (!box) {
				elemWrapper.renderer.alignedObjects.push(elemWrapper);
			}
		}

		box = pick(box, elemWrapper.renderer);

		var align = alignOptions.align,
			vAlign = alignOptions.verticalAlign,
			x = (box.x || 0) + (alignOptions.x || 0),
			y = (box.y || 0) + (alignOptions.y || 0),
			attribs = {};



		if (/^(right|center)$/.test(align)) {
			x += (box.width - (alignOptions.width || 0)) /
					{ right: 1, center: 2 }[align];
		}
		attribs[alignByTranslate ? 'translateX' : 'x'] = mathRound(x);



		if (/^(bottom|middle)$/.test(vAlign)) {
			y += (box.height - (alignOptions.height || 0)) /
					({ bottom: 1, middle: 2 }[vAlign] || 1);

		}
		attribs[alignByTranslate ? 'translateY' : 'y'] = mathRound(y);


		elemWrapper[elemWrapper.placed ? 'animate' : 'attr'](attribs);
		elemWrapper.placed = true;
		elemWrapper.alignAttr = attribs;

		return elemWrapper;
	},

	
	getBBox: function (refresh) {
		var wrapper = this,
			bBox,
			width,
			height,
			rotation = wrapper.rotation,
			element = wrapper.element,
			rad = rotation * deg2rad;


		if (element.namespaceURI === SVG_NS || wrapper.renderer.forExport) {
			try {
				
				bBox = element.getBBox ?


					extend({}, element.getBBox()) :

					{
						width: element.offsetWidth,
						height: element.offsetHeight
					};
			} catch (e) {}
			


			if (!bBox || bBox.width < 0) {
				bBox = { width: 0, height: 0 };
			}
			
			width = bBox.width;
			height = bBox.height;


			if (rotation) {
				bBox.width = mathAbs(height * mathSin(rad)) + mathAbs(width * mathCos(rad));
				bBox.height = mathAbs(height * mathCos(rad)) + mathAbs(width * mathSin(rad));
			}


		} else {
			bBox = wrapper.htmlGetBBox(refresh);
		}

		return bBox;
	},

	
	show: function () {
		return this.attr({ visibility: VISIBLE });
	},

	
	hide: function () {
		return this.attr({ visibility: HIDDEN });
	},

	
	add: function (parent) {

		var renderer = this.renderer,
			parentWrapper = parent || renderer,
			parentNode = parentWrapper.element || renderer.box,
			childNodes = parentNode.childNodes,
			element = this.element,
			zIndex = attr(element, 'zIndex'),
			otherElement,
			otherZIndex,
			i,
			inserted;


		this.parentInverted = parent && parent.inverted;


		if (this.textStr !== undefined) {
			renderer.buildText(this);
		}


		if (zIndex) {
			parentWrapper.handleZ = true;
			zIndex = pInt(zIndex);
		}


		if (parentWrapper.handleZ) {
			for (i = 0; i < childNodes.length; i++) {
				otherElement = childNodes[i];
				otherZIndex = attr(otherElement, 'zIndex');
				if (otherElement !== element && (

						pInt(otherZIndex) > zIndex ||

						(!defined(zIndex) && defined(otherZIndex))

						)) {
					parentNode.insertBefore(element, otherElement);
					inserted = true;
					break;
				}
			}
		}


		if (!inserted) {
			parentNode.appendChild(element);
		}


		this.added = true;


		fireEvent(this, 'add');

		return this;
	},

	
	safeRemoveChild: function (element) {
		var parentNode = element.parentNode;
		if (parentNode) {
			parentNode.removeChild(element);
		}
	},

	
	destroy: function () {
		var wrapper = this,
			element = wrapper.element || {},
			shadows = wrapper.shadows,
			box = wrapper.box,
			key,
			i;


		element.onclick = element.onmouseout = element.onmouseover = element.onmousemove = null;
		stop(wrapper);

		if (wrapper.clipPath) {
			wrapper.clipPath = wrapper.clipPath.destroy();
		}


		if (wrapper.stops) {
			for (i = 0; i < wrapper.stops.length; i++) {
				wrapper.stops[i] = wrapper.stops[i].destroy();
			}
			wrapper.stops = null;
		}


		wrapper.safeRemoveChild(element);


		if (shadows) {
			each(shadows, function (shadow) {
				wrapper.safeRemoveChild(shadow);
			});
		}


		if (box) {
			box.destroy();
		}


		erase(wrapper.renderer.alignedObjects, wrapper);

		for (key in wrapper) {
			delete wrapper[key];
		}

		return null;
	},

	
	empty: function () {
		var element = this.element,
			childNodes = element.childNodes,
			i = childNodes.length;

		while (i--) {
			element.removeChild(childNodes[i]);
		}
	},

	
	shadow: function (apply, group, cutOff) {
		var shadows = [],
			i,
			shadow,
			element = this.element,
			strokeWidth,


			transform = this.parentInverted ? '(-1,-1)' : '(1,1)';


		if (apply) {
			for (i = 1; i <= 3; i++) {
				shadow = element.cloneNode(0);
				strokeWidth = 7 - 2 * i;
				attr(shadow, {
					'isShadow': 'true',
					'stroke': 'rgb(0, 0, 0)',
					'stroke-opacity': 0.05 * i,
					'stroke-width': strokeWidth,
					'transform': 'translate' + transform,
					'fill': NONE
				});
				if (cutOff) {
					attr(shadow, 'height', mathMax(attr(shadow, 'height') - strokeWidth, 0));
					shadow.cutHeight = strokeWidth;
				}

				if (group) {
					group.element.appendChild(shadow);
				} else {
					element.parentNode.insertBefore(shadow, element);
				}

				shadows.push(shadow);
			}

			this.shadows = shadows;
		}
		return this;

	}
};



var SVGRenderer = function () {
	this.init.apply(this, arguments);
};
SVGRenderer.prototype = {
	Element: SVGElement,

	
	init: function (container, width, height, forExport) {
		var renderer = this,
			loc = location,
			boxWrapper;

		boxWrapper = renderer.createElement('svg')
			.attr({
				xmlns: SVG_NS,
				version: '1.1'
			});
		container.appendChild(boxWrapper.element);


		renderer.isSVG = true;
		renderer.box = boxWrapper.element;
		renderer.boxWrapper = boxWrapper;
		renderer.alignedObjects = [];
		renderer.url = isIE ? '' : loc.href.replace(/#.*?$/, '')
			.replace(/([\('\)])/g, '\\$1');
		renderer.defs = this.createElement('defs').add();
		renderer.forExport = forExport;
		renderer.gradients = {};

		renderer.setSize(width, height, false);









		var subPixelFix, rect;
		if (isFirefox && container.getBoundingClientRect) {
			renderer.subPixelFix = subPixelFix = function () {
				css(container, { left: 0, top: 0 });
				rect = container.getBoundingClientRect();
				css(container, {
					left: (mathCeil(rect.left) - rect.left) + PX,
					top: (mathCeil(rect.top) - rect.top) + PX
				});
			};


			subPixelFix();


			addEvent(win, 'resize', subPixelFix);
		}
	},

	
	isHidden: function () {
		return !this.boxWrapper.getBBox().width;			
	},

	
	destroy: function () {
		var renderer = this,
			rendererDefs = renderer.defs;
		renderer.box = null;
		renderer.boxWrapper = renderer.boxWrapper.destroy();


		destroyObjectProperties(renderer.gradients || {});
		renderer.gradients = null;



		if (rendererDefs) {
			renderer.defs = rendererDefs.destroy();
		}




		if (renderer.subPixelFix) {
			removeEvent(win, 'resize', renderer.subPixelFix);
		}

		renderer.alignedObjects = null;

		return null;
	},

	
	createElement: function (nodeName) {
		var wrapper = new this.Element();
		wrapper.init(this, nodeName);
		return wrapper;
	},

	
	draw: function () {},

	
	buildText: function (wrapper) {
		var textNode = wrapper.element,
			lines = pick(wrapper.textStr, '').toString()
				.replace(/<(b|strong)>/g, '<span style="font-weight:bold">')
				.replace(/<(i|em)>/g, '<span style="font-style:italic">')
				.replace(/<a/g, '<span')
				.replace(/<\/(b|strong|i|em|a)>/g, '</span>')
				.split(/<br.*?>/g),
			childNodes = textNode.childNodes,
			styleRegex = /style="([^"]+)"/,
			hrefRegex = /href="([^"]+)"/,
			parentX = attr(textNode, 'x'),
			textStyles = wrapper.styles,
			width = textStyles && pInt(textStyles.width),
			textLineHeight = textStyles && textStyles.lineHeight,
			lastLine,
			GET_COMPUTED_STYLE = 'getComputedStyle',
			i = childNodes.length,
			linePositions = [];


		function getLineHeightByBBox(lineNo) {
			linePositions[lineNo] = textNode.getBBox().height;
			return mathRound(linePositions[lineNo] - (linePositions[lineNo - 1] || 0));
		}


		while (i--) {
			textNode.removeChild(childNodes[i]);
		}

		if (width && !wrapper.added) {
			this.box.appendChild(textNode);
		}


		if (lines[lines.length - 1] === '') {
			lines.pop();
		}


		each(lines, function (line, lineNo) {
			var spans, spanNo = 0, lineHeight;

			line = line.replace(/<span/g, '|||<span').replace(/<\/span>/g, '</span>|||');
			spans = line.split('|||');

			each(spans, function (span) {
				if (span !== '' || spans.length === 1) {
					var attributes = {},
						tspan = doc.createElementNS(SVG_NS, 'tspan');
					if (styleRegex.test(span)) {
						attr(
							tspan,
							'style',
							span.match(styleRegex)[1].replace(/(;| |^)color([ :])/, '$1fill$2')
						);
					}
					if (hrefRegex.test(span)) {
						attr(tspan, 'onclick', 'location.href=\"' + span.match(hrefRegex)[1] + '\"');
						css(tspan, { cursor: 'pointer' });
					}

					span = (span.replace(/<(.|\n)*?>/g, '') || ' ')
						.replace(/&lt;/g, '<')
						.replace(/&gt;/g, '>');


					


					tspan.appendChild(doc.createTextNode(span));

					if (!spanNo) {
						attributes.x = parentX;
					} else {

						attributes.dx = 3;
					}


					if (!spanNo) {
						if (lineNo) {


							if (!hasSVG && wrapper.renderer.forExport) {
								css(tspan, { display: 'block' });
							}



							lineHeight = win[GET_COMPUTED_STYLE] &&
								pInt(win[GET_COMPUTED_STYLE](lastLine, null).getPropertyValue('line-height'));

							if (!lineHeight || isNaN(lineHeight)) {
								lineHeight = textLineHeight || lastLine.offsetHeight || getLineHeightByBBox(lineNo) || 18;
							}
							attr(tspan, 'dy', lineHeight);
						}
						lastLine = tspan;
					}


					attr(tspan, attributes);


					textNode.appendChild(tspan);

					spanNo++;


					if (width) {
						var words = span.replace(/-/g, '- ').split(' '),
							tooLong,
							actualWidth,
							rest = [];

						while (words.length || rest.length) {
							actualWidth = wrapper.getBBox().width;
							tooLong = actualWidth > width;
							if (!tooLong || words.length === 1) {
								words = rest;
								rest = [];
								if (words.length) {
									tspan = doc.createElementNS(SVG_NS, 'tspan');
									attr(tspan, {
										dy: textLineHeight || 16,
										x: parentX
									});
									textNode.appendChild(tspan);

									if (actualWidth > width) {
										width = actualWidth;
									}
								}
							} else {
								tspan.removeChild(tspan.firstChild);
								rest.unshift(words.pop());
							}
							if (words.length) {
								tspan.appendChild(doc.createTextNode(words.join(' ').replace(/- /g, '-')));
							}
						}
					}
				}
			});
		});
	},

	
	button: function (text, x, y, callback, normalState, hoverState, pressedState) {
		var label = this.label(text, x, y),
			curState = 0,
			stateOptions,
			stateStyle,
			normalStyle,
			hoverStyle,
			pressedStyle,
			STYLE = 'style',
			verticalGradient = { x1: 0, y1: 0, x2: 0, y2: 1 };


		
		normalState = merge(hash(
			STROKE_WIDTH, 1,
			STROKE, '#999',
			FILL, hash(
				LINEAR_GRADIENT, verticalGradient,
				STOPS, [
					[0, '#FFF'],
					[1, '#DDD']
				]
			),
			'r', 3,
			'padding', 3,
			STYLE, hash(
				'color', 'black'
			)
		), normalState);
		
		normalStyle = normalState[STYLE];
		delete normalState[STYLE];

		
		hoverState = merge(normalState, hash(
			STROKE, '#68A',
			FILL, hash(
				LINEAR_GRADIENT, verticalGradient,
				STOPS, [
					[0, '#FFF'],
					[1, '#ACF']
				]
			)
		), hoverState);
		
		hoverStyle = hoverState[STYLE];
		delete hoverState[STYLE];

		
		pressedState = merge(normalState, hash(
			STROKE, '#68A',
			FILL, hash(
				LINEAR_GRADIENT, verticalGradient,
				STOPS, [
					[0, '#9BD'],
					[1, '#CDF']
				]
			)
		), pressedState);
		
		pressedStyle = pressedState[STYLE];
		delete pressedState[STYLE];


		addEvent(label.element, 'mouseenter', function () {
			label.attr(hoverState)
				.css(hoverStyle);
		});
		addEvent(label.element, 'mouseleave', function () {
			stateOptions = [normalState, hoverState, pressedState][curState];
			stateStyle = [normalStyle, hoverStyle, pressedStyle][curState];
			label.attr(stateOptions)
				.css(stateStyle);
		});

		label.setState = function (state) {
			curState = state;
			if (!state) {
				label.attr(normalState)
					.css(normalStyle);
			} else if (state === 2) {
				label.attr(pressedState)
					.css(pressedStyle);
			}
		};

		return label
			.on('click', function () {
				callback.call(label);
			})
			.attr(normalState)
			.css(extend({ cursor: 'default' }, normalStyle));
	},

	
	crispLine: function (points, width) {


		if (points[1] === points[4]) {
			points[1] = points[4] = mathRound(points[1]) + (width % 2 / 2);
		}
		if (points[2] === points[5]) {
			points[2] = points[5] = mathRound(points[2]) + (width % 2 / 2);
		}
		return points;
	},


	
	path: function (path) {
		var attr = {
			fill: NONE
		};
		if (isArray(path)) {
			attr.d = path;
		} else if (isObject(path)) {
			extend(attr, path);
		}
		return this.createElement('path').attr(attr);
	},

	
	circle: function (x, y, r) {
		var attr = isObject(x) ?
			x :
			{
				x: x,
				y: y,
				r: r
			};

		return this.createElement('circle').attr(attr);
	},

	
	arc: function (x, y, r, innerR, start, end) {



		if (isObject(x)) {
			y = x.y;
			r = x.r;
			innerR = x.innerR;
			start = x.start;
			end = x.end;
			x = x.x;
		}
		return this.symbol('arc', x || 0, y || 0, r || 0, r || 0, {
			innerR: innerR || 0,
			start: start || 0,
			end: end || 0
		});
	},
	
	
	rect: function (x, y, width, height, r, strokeWidth) {
		
		r = isObject(x) ? x.r : r;
		
		var wrapper = this.createElement('rect').attr({
				rx: r,
				ry: r,
				fill: NONE
			});
		return wrapper.attr(
				isObject(x) ? 
					x : 

					wrapper.crisp(strokeWidth, x, y, mathMax(width, 0), mathMax(height, 0))
			);
	},

	
	setSize: function (width, height, animate) {
		var renderer = this,
			alignedObjects = renderer.alignedObjects,
			i = alignedObjects.length;

		renderer.width = width;
		renderer.height = height;

		renderer.boxWrapper[pick(animate, true) ? 'animate' : 'attr']({
			width: width,
			height: height
		});

		while (i--) {
			alignedObjects[i].align();
		}
	},

	
	g: function (name) {
		var elem = this.createElement('g');
		return defined(name) ? elem.attr({ 'class': PREFIX + name }) : elem;
	},

	
	image: function (src, x, y, width, height) {
		var attribs = {
				preserveAspectRatio: NONE
			},
			elemWrapper;


		if (arguments.length > 1) {
			extend(attribs, {
				x: x,
				y: y,
				width: width,
				height: height
			});
		}

		elemWrapper = this.createElement('image').attr(attribs);


		if (elemWrapper.element.setAttributeNS) {
			elemWrapper.element.setAttributeNS('http://www.w3.org/1999/xlink',
				'href', src);
		} else {


			elemWrapper.element.setAttribute('hc-svg-href', src);
	}

		return elemWrapper;
	},

	
	symbol: function (symbol, x, y, width, height, options) {

		var obj,


			symbolFn = this.symbols[symbol],


			path = symbolFn && symbolFn(
				mathRound(x),
				mathRound(y),
				width,
				height,
				options
			),

			imageRegex = /^url\((.*?)\)$/,
			imageSrc,
			imageSize,
			centerImage;

		if (path) {

			obj = this.path(path);

			extend(obj, {
				symbolName: symbol,
				x: x,
				y: y,
				width: width,
				height: height
			});
			if (options) {
				extend(obj, options);
			}



		} else if (imageRegex.test(symbol)) {


			centerImage = function (img, size) {
				img.attr({
					width: size[0],
					height: size[1]
				});

				if (!img.alignByTranslate) {
					img.translate(
						-mathRound(size[0] / 2),
						-mathRound(size[1] / 2)
					);
				}
			};

			imageSrc = symbol.match(imageRegex)[1];
			imageSize = symbolSizes[imageSrc];


			obj = this.image(imageSrc)
				.attr({
					x: x,
					y: y
				});

			if (imageSize) {
				centerImage(obj, imageSize);
			} else {

				obj.attr({ width: 0, height: 0 });


				createElement('img', {
					onload: function () {
						var img = this;

						centerImage(obj, symbolSizes[imageSrc] = [img.width, img.height]);
					},
					src: imageSrc
				});
			}
		}

		return obj;
	},

	
	symbols: {
		'circle': function (x, y, w, h) {
			var cpw = 0.166 * w;
			return [
				M, x + w / 2, y,
				'C', x + w + cpw, y, x + w + cpw, y + h, x + w / 2, y + h,
				'C', x - cpw, y + h, x - cpw, y, x + w / 2, y,
				'Z'
			];
		},

		'square': function (x, y, w, h) {
			return [
				M, x, y,
				L, x + w, y,
				x + w, y + h,
				x, y + h,
				'Z'
			];
		},

		'triangle': function (x, y, w, h) {
			return [
				M, x + w / 2, y,
				L, x + w, y + h,
				x, y + h,
				'Z'
			];
		},

		'triangle-down': function (x, y, w, h) {
			return [
				M, x, y,
				L, x + w, y,
				x + w / 2, y + h,
				'Z'
			];
		},
		'diamond': function (x, y, w, h) {
			return [
				M, x + w / 2, y,
				L, x + w, y + h / 2,
				x + w / 2, y + h,
				x, y + h / 2,
				'Z'
			];
		},
		'arc': function (x, y, w, h, options) {
			var start = options.start,
				radius = options.r || w || h,
				end = options.end - 0.000001,
				innerRadius = options.innerR,
				open = options.open,
				cosStart = mathCos(start),
				sinStart = mathSin(start),
				cosEnd = mathCos(end),
				sinEnd = mathSin(end),
				longArc = options.end - start < mathPI ? 0 : 1;

			return [
				M,
				x + radius * cosStart,
				y + radius * sinStart,
				'A',
				radius,
				radius,
				0,
				longArc,
				1,
				x + radius * cosEnd,
				y + radius * sinEnd,
				open ? M : L,
				x + innerRadius * cosEnd,
				y + innerRadius * sinEnd,
				'A',
				innerRadius,
				innerRadius,
				0,
				longArc,
				0,
				x + innerRadius * cosStart,
				y + innerRadius * sinStart,

				open ? '' : 'Z'
			];
		}
	},

	
	clipRect: function (x, y, width, height) {
		var wrapper,
			id = PREFIX + idCounter++,

			clipPath = this.createElement('clipPath').attr({
				id: id
			}).add(this.defs);

		wrapper = this.rect(x, y, width, height, 0).add(clipPath);
		wrapper.id = id;
		wrapper.clipPath = clipPath;

		return wrapper;
	},


	
	color: function (color, elem, prop) {
		var renderer = this,
			colorObject,
			regexRgba = /^rgba/,
			gradName;
		

		if (color && color.linearGradient) {
			gradName = 'linearGradient';
		} else if (color && color.radialGradient) {
			gradName = 'radialGradient';
		}
		
		if (gradName) {
			var gradAttr = color[gradName],
				gradients = renderer.gradients,
				gradientObject,
				stopColor,
				stopOpacity,
				radialReference = elem.radialReference;
			

			if (!gradAttr.id || !gradients[gradAttr.id]) {
				

				if (isArray(gradAttr)) {
					color[gradName] = gradAttr = {
						x1: gradAttr[0],
						y1: gradAttr[1],
						x2: gradAttr[2],
						y2: gradAttr[3],
						gradientUnits: 'userSpaceOnUse'
					};				
				}
				

				if (gradName === 'radialGradient' && radialReference && !defined(gradAttr.gradientUnits)) {
					extend(gradAttr, {
						cx: (radialReference[0] - radialReference[2] / 2) + gradAttr.cx * radialReference[2],
						cy: (radialReference[1] - radialReference[2] / 2) + gradAttr.cy * radialReference[2],
						r: gradAttr.r * radialReference[2],
						gradientUnits: 'userSpaceOnUse'
					});
				}


				gradAttr.id = PREFIX + idCounter++;
				gradients[gradAttr.id] = gradientObject = renderer.createElement(gradName)
					.attr(gradAttr)
					.add(renderer.defs);
				
				

				gradientObject.stops = [];
				each(color.stops, function (stop) {
					var stopObject;
					if (regexRgba.test(stop[1])) {
						colorObject = Color(stop[1]);
						stopColor = colorObject.get('rgb');
						stopOpacity = colorObject.get('a');
					} else {
						stopColor = stop[1];
						stopOpacity = 1;
					}
					stopObject = renderer.createElement('stop').attr({
						offset: stop[0],
						'stop-color': stopColor,
						'stop-opacity': stopOpacity
					}).add(gradientObject);


					gradientObject.stops.push(stopObject);
				});
			}


			return 'url(' + renderer.url + '#' + gradAttr.id + ')';
			

		} else if (regexRgba.test(color)) {
			colorObject = Color(color);
			attr(elem, prop + '-opacity', colorObject.get('a'));

			return colorObject.get('rgb');


		} else {

			elem.removeAttribute(prop + '-opacity');

			return color;
		}

	},


	
	text: function (str, x, y, useHTML) {


		var renderer = this,
			defaultChartStyle = defaultOptions.chart.style,
			wrapper;

		if (useHTML && !renderer.forExport) {
			return renderer.html(str, x, y);
		}

		x = mathRound(pick(x, 0));
		y = mathRound(pick(y, 0));

		wrapper = renderer.createElement('text')
			.attr({
				x: x,
				y: y,
				text: str
			})
			.css({
				fontFamily: defaultChartStyle.fontFamily,
				fontSize: defaultChartStyle.fontSize
			});

		wrapper.x = x;
		wrapper.y = y;
		return wrapper;
	},


	
	html: function (str, x, y) {
		var defaultChartStyle = defaultOptions.chart.style,
			wrapper = this.createElement('span'),
			attrSetters = wrapper.attrSetters,
			element = wrapper.element,
			renderer = wrapper.renderer;


		attrSetters.text = function (value) {
			element.innerHTML = value;
			return false;
		};


		attrSetters.x = attrSetters.y = attrSetters.align = function (value, key) {
			if (key === 'align') {
				key = 'textAlign';
			}
			wrapper[key] = value;
			wrapper.htmlUpdateTransform();
			return false;
		};


		wrapper.attr({
				text: str,
				x: mathRound(x),
				y: mathRound(y)
			})
			.css({
				position: ABSOLUTE,
				whiteSpace: 'nowrap',
				fontFamily: defaultChartStyle.fontFamily,
				fontSize: defaultChartStyle.fontSize
			});


		wrapper.css = wrapper.htmlCss;


		if (renderer.isSVG) {
			wrapper.add = function (svgGroupWrapper) {

				var htmlGroup,
					htmlGroupStyle,
					container = renderer.box.parentNode;


				if (svgGroupWrapper) {
					htmlGroup = svgGroupWrapper.div;
					if (!htmlGroup) {
						htmlGroup = svgGroupWrapper.div = createElement(DIV, {
							className: attr(svgGroupWrapper.element, 'class')
						}, {
							position: ABSOLUTE,
							left: svgGroupWrapper.attr('translateX') + PX,
							top: svgGroupWrapper.attr('translateY') + PX
						}, container);


						htmlGroupStyle = htmlGroup.style;
						extend(svgGroupWrapper.attrSetters, {
							translateX: function (value) {
								htmlGroupStyle.left = value + PX;
							},
							translateY: function (value) {
								htmlGroupStyle.top = value + PX;
							},
							visibility: function (value, key) {
								htmlGroupStyle[key] = value;
							}
						});

					}
				} else {
					htmlGroup = container;
				}

				htmlGroup.appendChild(element);


				wrapper.added = true;
				if (wrapper.alignOnAdd) {
					wrapper.htmlUpdateTransform();
				}

				return wrapper;
			};
		}
		return wrapper;
	},

	
	fontMetrics: function (fontSize) {
		fontSize = pInt(fontSize || 11);
		


		var lineHeight = fontSize < 24 ? fontSize + 4 : mathRound(fontSize * 1.2),
			baseline = mathRound(lineHeight * 0.8);
		
		return {
			h: lineHeight, 
			b: baseline
		};
	},

	
	label: function (str, x, y, shape, anchorX, anchorY, useHTML, baseline, className) {

		var renderer = this,
			wrapper = renderer.g(className),
			text = renderer.text('', 0, 0, useHTML)
				.attr({
					zIndex: 1
				})
				.add(wrapper),
			box,
			bBox,
			alignFactor = 0,
			padding = 3,
			width,
			height,
			wrapperX,
			wrapperY,
			crispAdjust = 0,
			deferredAttr = {},
			baselineOffset,
			attrSetters = wrapper.attrSetters;

		
		function updateBoxSize() {
			var boxY,
				style = text.element.style;
				
			bBox = (width === undefined || height === undefined || wrapper.styles.textAlign) &&
				text.getBBox(true);
			wrapper.width = (width || bBox.width || 0) + 2 * padding;
			wrapper.height = (height || bBox.height || 0) + 2 * padding;
			

			baselineOffset = padding + renderer.fontMetrics(style && style.fontSize).b;
			
			

			if (!box) {
				boxY = baseline ? -baselineOffset : 0;
			
				wrapper.box = box = shape ?
					renderer.symbol(shape, -alignFactor * padding, boxY, wrapper.width, wrapper.height) :
					renderer.rect(-alignFactor * padding, boxY, wrapper.width, wrapper.height, 0, deferredAttr[STROKE_WIDTH]);
				box.add(wrapper);
			}


			box.attr(merge({
				width: wrapper.width,
				height: wrapper.height
			}, deferredAttr));
			deferredAttr = null;
		}

		
		function updateTextPadding() {
			var styles = wrapper.styles,
				textAlign = styles && styles.textAlign,
				x = padding * (1 - alignFactor),
				y;
			

			y = baseline ? 0 : baselineOffset;


			if (defined(width) && (textAlign === 'center' || textAlign === 'right')) {
				x += { center: 0.5, right: 1 }[textAlign] * (width - bBox.width);
			}


			if (x !== text.x || y !== text.y) {
				text.attr({
					x: x,
					y: y
				});
			}


			text.x = x;
			text.y = y;
		}

		
		function boxAttr(key, value) {
			if (box) {
				box.attr(key, value);
			} else {
				deferredAttr[key] = value;
			}
		}

		function getSizeAfterAdd() {
			wrapper.attr({
				text: str,
				x: x,
				y: y
			});
			
			if (defined(anchorX)) {
				wrapper.attr({
					anchorX: anchorX,
					anchorY: anchorY
				});
			}
		}

		
		addEvent(wrapper, 'add', getSizeAfterAdd);

		


		attrSetters.width = function (value) {
			width = value;
			return false;
		};
		attrSetters.height = function (value) {
			height = value;
			return false;
		};
		attrSetters.padding = function (value) {
			if (defined(value) && value !== padding) {
				padding = value;
				updateTextPadding();
			}

			return false;
		};


		attrSetters.align = function (value) {
			alignFactor = { left: 0, center: 0.5, right: 1 }[value];
			return false;
		};
		

		attrSetters.text = function (value, key) {
			text.attr(key, value);
			updateBoxSize();
			updateTextPadding();
			return false;
		};


		attrSetters[STROKE_WIDTH] = function (value, key) {
			crispAdjust = value % 2 / 2;
			boxAttr(key, value);
			return false;
		};
		attrSetters.stroke = attrSetters.fill = attrSetters.r = function (value, key) {
			boxAttr(key, value);
			return false;
		};
		attrSetters.anchorX = function (value, key) {
			anchorX = value;
			boxAttr(key, value + crispAdjust - wrapperX);
			return false;
		};
		attrSetters.anchorY = function (value, key) {
			anchorY = value;
			boxAttr(key, value - wrapperY);
			return false;
		};
		

		attrSetters.x = function (value) {
			wrapper.x = value;
			value -= alignFactor * ((width || bBox.width) + padding);
			wrapperX = mathRound(value); 
			
			wrapper.attr('translateX', wrapperX);
			return false;
		};
		attrSetters.y = function (value) {
			wrapperY = wrapper.y = mathRound(value);
			wrapper.attr('translateY', value);
			return false;
		};


		var baseCss = wrapper.css;
		return extend(wrapper, {
			
			css: function (styles) {
				if (styles) {
					var textStyles = {};
					styles = merge({}, styles);
					each(['fontSize', 'fontWeight', 'fontFamily', 'color', 'lineHeight', 'width'], function (prop) {
						if (styles[prop] !== UNDEFINED) {
							textStyles[prop] = styles[prop];
							delete styles[prop];
						}
					});
					text.css(textStyles);
				}
				return baseCss.call(wrapper, styles);
			},
			
			getBBox: function () {
				return box.getBBox();
			},
			
			shadow: function (b) {
				box.shadow(b);
				return wrapper;
			},
			
			destroy: function () {
				removeEvent(wrapper, 'add', getSizeAfterAdd);


				removeEvent(wrapper.element, 'mouseenter');
				removeEvent(wrapper.element, 'mouseleave');

				if (text) {

					text = text.destroy();
				}

				SVGElement.prototype.destroy.call(wrapper);
			}
		});
	}
};



Renderer = SVGRenderer;





var VMLRenderer;
if (!hasSVG && !useCanVG) {


var VMLElement = {

	
	init: function (renderer, nodeName) {
		var wrapper = this,
			markup =  ['<', nodeName, ' filled="f" stroked="f"'],
			style = ['position: ', ABSOLUTE, ';'];


		if (nodeName === 'shape' || nodeName === DIV) {
			style.push('left:0;top:0;width:1px;height:1px;');
		}
		if (docMode8) {
			style.push('visibility: ', nodeName === DIV ? HIDDEN : VISIBLE);
		}

		markup.push(' style="', style.join(''), '"/>');


		if (nodeName) {
			markup = nodeName === DIV || nodeName === 'span' || nodeName === 'img' ?
				markup.join('')
				: renderer.prepVML(markup);
			wrapper.element = createElement(markup);
		}

		wrapper.renderer = renderer;
		wrapper.attrSetters = {};
	},

	
	add: function (parent) {
		var wrapper = this,
			renderer = wrapper.renderer,
			element = wrapper.element,
			box = renderer.box,
			inverted = parent && parent.inverted,


			parentNode = parent ?
				parent.element || parent :
				box;



		if (inverted) {
			renderer.invertChild(element, parentNode);
		}


		if (docMode8 && parentNode.gVis === HIDDEN) {
			css(element, { visibility: HIDDEN });
		}


		parentNode.appendChild(element);


		wrapper.added = true;
		if (wrapper.alignOnAdd && !wrapper.deferUpdateTransform) {
			wrapper.updateTransform();
		}


		fireEvent(wrapper, 'add');

		return wrapper;
	},

	
	toggleChildren: function (element, visibility) {
		var childNodes = element.childNodes,
			i = childNodes.length;
			
		while (i--) {
			

			css(childNodes[i], { visibility: visibility });
			

			if (childNodes[i].nodeName === 'DIV') {
				this.toggleChildren(childNodes[i], visibility);
			}
		}
	},

	
	updateTransform: SVGElement.prototype.htmlUpdateTransform,

	
	attr: function (hash, val) {
		var wrapper = this,
			key,
			value,
			i,
			result,
			element = wrapper.element || {},
			elemStyle = element.style,
			nodeName = element.nodeName,
			renderer = wrapper.renderer,
			symbolName = wrapper.symbolName,
			hasSetSymbolSize,
			shadows = wrapper.shadows,
			skipAttr,
			attrSetters = wrapper.attrSetters,
			ret = wrapper;


		if (isString(hash) && defined(val)) {
			key = hash;
			hash = {};
			hash[key] = val;
		}


		if (isString(hash)) {
			key = hash;
			if (key === 'strokeWidth' || key === 'stroke-width') {
				ret = wrapper.strokeweight;
			} else {
				ret = wrapper[key];
			}


		} else {
			for (key in hash) {
				value = hash[key];
				skipAttr = false;


				result = attrSetters[key] && attrSetters[key](value, key);

				if (result !== false && value !== null) {

					if (result !== UNDEFINED) {
						value = result;
					}




					if (symbolName && /^(x|y|r|start|end|width|height|innerR|anchorX|anchorY)/.test(key)) {



						if (!hasSetSymbolSize) {
							wrapper.symbolAttr(hash);

							hasSetSymbolSize = true;
						}
						skipAttr = true;

					} else if (key === 'd') {
						value = value || [];
						wrapper.d = value.join(' ');


						i = value.length;
						var convertedPath = [];
						while (i--) {




							if (isNumber(value[i])) {
								convertedPath[i] = mathRound(value[i] * 10) - 5;
							} else if (value[i] === 'Z') {
								convertedPath[i] = 'x';
							} else {
								convertedPath[i] = value[i];
							}

						}
						value = convertedPath.join(' ') || 'x';
						element.path = value;


						if (shadows) {
							i = shadows.length;
							while (i--) {
								shadows[i].path = shadows[i].cutOff ? this.cutOffPath(value, shadows[i].cutOff) : value;
							}
						}
						skipAttr = true;


					} else if (key === 'zIndex' || key === 'visibility') {


						if (docMode8 && key === 'visibility' && nodeName === 'DIV') {
							element.gVis = value;
							wrapper.toggleChildren(element, value);
							if (value === VISIBLE) {
								value = null;
							}
						}

						if (value) {
							elemStyle[key] = value;
						}



						skipAttr = true;


					} else if (key === 'width' || key === 'height') {
						
						value = mathMax(0, value);
						
						this[key] = value;


						if (wrapper.updateClipping) {
							wrapper[key] = value;
							wrapper.updateClipping();
						} else {

							elemStyle[key] = value;
						}

						skipAttr = true;


					} else if (key === 'x' || key === 'y') {

						wrapper[key] = value;
						elemStyle[{ x: 'left', y: 'top' }[key]] = value;


					} else if (key === 'class') {

						element.className = value;


					} else if (key === 'stroke') {

						value = renderer.color(value, element, key);

						key = 'strokecolor';


					} else if (key === 'stroke-width' || key === 'strokeWidth') {
						element.stroked = value ? true : false;
						key = 'strokeweight';
						wrapper[key] = value;
						if (isNumber(value)) {
							value += PX;
						}


					} else if (key === 'dashstyle') {
						var strokeElem = element.getElementsByTagName('stroke')[0] ||
							createElement(renderer.prepVML(['<stroke/>']), null, null, element);
						strokeElem[key] = value || 'solid';
						wrapper.dashstyle = value; 
						skipAttr = true;


					} else if (key === 'fill') {

						if (nodeName === 'SPAN') {
							elemStyle.color = value;
						} else {
							element.filled = value !== NONE ? true : false;

							value = renderer.color(value, element, key);

							key = 'fillcolor';
						}
						

					} else if (nodeName === 'shape' && key === 'rotation') {
						wrapper[key] = value;


					} else if (key === 'translateX' || key === 'translateY' || key === 'rotation') {
						wrapper[key] = value;
						wrapper.updateTransform();

						skipAttr = true;


					} else if (key === 'text') {
						this.bBox = null;
						element.innerHTML = value;
						skipAttr = true;
					}


					if (shadows && key === 'visibility') {
						i = shadows.length;
						while (i--) {
							shadows[i].style[key] = value;
						}
					}



					if (!skipAttr) {
						if (docMode8) {
							element[key] = value;
						} else {
							attr(element, key, value);
						}
					}

				}
			}
		}
		return ret;
	},

	
	clip: function (clipRect) {
		var wrapper = this,
			clipMembers = clipRect.members,
			element = wrapper.element,
			parentNode = element.parentNode;

		clipMembers.push(wrapper);
		wrapper.destroyClip = function () {
			erase(clipMembers, wrapper);
		};
		

		if (parentNode && parentNode.className === 'highcharts-tracker' && !docMode8) {
			css(element, { visibility: HIDDEN });
		}
		
		return wrapper.css(clipRect.getCSS(wrapper));
	},

	
	css: SVGElement.prototype.htmlCss,

	
	safeRemoveChild: function (element) {


		var parentNode = element.parentNode;
		if (parentNode) {
			discardElement(element);
		}
	},

	
	destroy: function () {
		var wrapper = this;

		if (wrapper.destroyClip) {
			wrapper.destroyClip();
		}

		return SVGElement.prototype.destroy.apply(wrapper);
	},

	
	empty: function () {
		var element = this.element,
			childNodes = element.childNodes,
			i = childNodes.length,
			node;

		while (i--) {
			node = childNodes[i];
			node.parentNode.removeChild(node);
		}
	},

	
	on: function (eventType, handler) {

		this.element['on' + eventType] = function () {
			var evt = win.event;
			evt.target = evt.srcElement;
			handler(evt);
		};
		return this;
	},
	
	
	cutOffPath: function (path, length) {
		
		var len;
		
		path = path.split(/[ ,]/);
		len = path.length;
		
		if (len === 9 || len === 11) {
			path[len - 4] = path[len - 2] = pInt(path[len - 2]) - 10 * length;
		}
		return path.join(' ');		
	},

	
	shadow: function (apply, group, cutOff) {
		var shadows = [],
			i,
			element = this.element,
			renderer = this.renderer,
			shadow,
			elemStyle = element.style,
			markup,
			path = element.path,
			strokeWidth,
			modifiedPath;


		if (path && typeof path.value !== 'string') {
			path = 'x';
		}
		modifiedPath = path;

		if (apply) {
			for (i = 1; i <= 3; i++) {
				
				strokeWidth = 7 - 2 * i;
				

				if (cutOff) {
					modifiedPath = this.cutOffPath(path.value, strokeWidth + 0.5);
				}
				
				markup = ['<shape isShadow="true" strokeweight="', (7 - 2 * i),
					'" filled="false" path="', modifiedPath,
					'" coordsize="10 10" style="', element.style.cssText, '" />'];
				
				shadow = createElement(renderer.prepVML(markup),
					null, {
						left: pInt(elemStyle.left) + 1,
						top: pInt(elemStyle.top) + 1
					}
				);
				if (cutOff) {
					shadow.cutOff = strokeWidth + 1;
				}
				

				markup = ['<stroke color="black" opacity="', (0.05 * i), '"/>'];
				createElement(renderer.prepVML(markup), null, null, shadow);



				if (group) {
					group.element.appendChild(shadow);
				} else {
					element.parentNode.insertBefore(shadow, element);
				}


				shadows.push(shadow);

			}

			this.shadows = shadows;
		}
		return this;

	}
};
VMLElement = extendClass(SVGElement, VMLElement);


var VMLRendererExtension = {

	Element: VMLElement,
	isIE8: userAgent.indexOf('MSIE 8.0') > -1,


	
	init: function (container, width, height) {
		var renderer = this,
			boxWrapper,
			box;

		renderer.alignedObjects = [];

		boxWrapper = renderer.createElement(DIV);
		box = boxWrapper.element;
		box.style.position = RELATIVE;
		container.appendChild(boxWrapper.element);



		renderer.box = box;
		renderer.boxWrapper = boxWrapper;


		renderer.setSize(width, height, false);




		if (!doc.namespaces.hcv) {

			doc.namespaces.add('hcv', 'urn:schemas-microsoft-com:vml');


			doc.createStyleSheet().cssText =
				'hcv\\:fill, hcv\\:path, hcv\\:shape, hcv\\:stroke' +
				'{ behavior:url(#default#VML); display: inline-block; } ';

		}
	},
	
	
	
	isHidden: function () {
		return !this.box.offsetWidth;			
	},

	
	clipRect: function (x, y, width, height) {


		var clipRect = this.createElement();


		return extend(clipRect, {
			members: [],
			left: x,
			top: y,
			width: width,
			height: height,
			getCSS: function (wrapper) {
				var inverted = wrapper.inverted,
					rect = this,
					top = rect.top,
					left = rect.left,
					right = left + rect.width,
					bottom = top + rect.height,
					ret = {
						clip: 'rect(' +
							mathRound(inverted ? left : top) + 'px,' +
							mathRound(inverted ? bottom : right) + 'px,' +
							mathRound(inverted ? right : bottom) + 'px,' +
							mathRound(inverted ? top : left) + 'px)'
					};


				if (!inverted && docMode8 && wrapper.element.nodeName !== 'IMG') {
					extend(ret, {
						width: right + PX,
						height: bottom + PX
					});
				}
				
				return ret;
			},


			updateClipping: function () {
				each(clipRect.members, function (member) {
					member.css(clipRect.getCSS(member));
				});
			}
		});

	},


	
	color: function (color, elem, prop) {
		var colorObject,
			regexRgba = /^rgba/,
			markup,
			fillType,
			ret = NONE;


		if (color && color.linearGradient) {
			fillType = 'gradient';
		} else if (color && color.radialGradient) {
			fillType = 'pattern';
		}
		
		
		if (fillType) {

			var stopColor,
				stopOpacity,
				gradient = color.linearGradient || color.radialGradient,
				x1,
				y1, 
				x2,
				y2,
				angle,
				opacity1,
				opacity2,
				color1,
				color2,
				fillAttr = '',
				stops = color.stops,
				firstStop,
				lastStop,
				colors = [];
			

			firstStop = stops[0];
			lastStop = stops[stops.length - 1];
			if (firstStop[0] > 0) {
				stops.unshift([
					0,
					firstStop[1]
				]);
			}
			if (lastStop[0] < 1) {
				stops.push([
					1,
					lastStop[1]
				]);
			}


			each(stops, function (stop, i) {
				if (regexRgba.test(stop[1])) {
					colorObject = Color(stop[1]);
					stopColor = colorObject.get('rgb');
					stopOpacity = colorObject.get('a');
				} else {
					stopColor = stop[1];
					stopOpacity = 1;
				}
				

				colors.push((stop[0] * 100) + '% ' + stopColor); 


				if (!i) {
					opacity1 = stopOpacity;
					color2 = stopColor;
				} else {
					opacity2 = stopOpacity;
					color1 = stopColor;
				}
			});
			

			if (fillType === 'gradient') {
				x1 = gradient.x1 || gradient[0] || 0;
				y1 = gradient.y1 || gradient[1] || 0;
				x2 = gradient.x2 || gradient[2] || 0;
				y2 = gradient.y2 || gradient[3] || 0;
				angle = 90  - math.atan(
					(y2 - y1) /
					(x2 - x1)
					) * 180 / mathPI;
				

			} else { 








				var r = gradient.r,
					size = r * 2,
					cx = gradient.cx,
					cy = gradient.cy;

				



				fillAttr = 'src="http://code.highcharts.com/gfx/radial-gradient.png" ' +
					'size="' + size + ',' + size + '" ' +
					'origin="0.5,0.5" ' +
					'position="' + cx + ',' + cy + '" ' +
					'color2="' + color2 + '" ';
				


				ret = color1;
			}
			
			


			if (prop === 'fill') {
				


				markup = ['<fill colors="' + colors.join(',') + '" angle="', angle,
					'" opacity="', opacity2, '" o:opacity2="', opacity1,
					'" type="', fillType, '" ', fillAttr, 'focus="100%" method="any" />'];
				createElement(this.prepVML(markup), null, null, elem);
			

			} else {
				ret = stopColor;
			}




		} else if (regexRgba.test(color) && elem.tagName !== 'IMG') {

			colorObject = Color(color);

			markup = ['<', prop, ' opacity="', colorObject.get('a'), '"/>'];
			createElement(this.prepVML(markup), null, null, elem);

			ret = colorObject.get('rgb');


		} else {
			var strokeNodes = elem.getElementsByTagName(prop);
			if (strokeNodes.length) {
				strokeNodes[0].opacity = 1;
			}
			ret = color;
		}

		return ret;
	},

	
	prepVML: function (markup) {
		var vmlStyle = 'display:inline-block;behavior:url(#default#VML);',
			isIE8 = this.isIE8;

		markup = markup.join('');

		if (isIE8) {
			markup = markup.replace('/>', ' xmlns="urn:schemas-microsoft-com:vml" />');
			if (markup.indexOf('style="') === -1) {
				markup = markup.replace('/>', ' style="' + vmlStyle + '" />');
			} else {
				markup = markup.replace('style="', 'style="' + vmlStyle);
			}

		} else {
			markup = markup.replace('<', '<hcv:');
		}

		return markup;
	},

	
	text: SVGRenderer.prototype.html,

	
	path: function (path) {
		var attr = {

			coordsize: '10 10'
		};
		if (isArray(path)) {
			attr.d = path;
		} else if (isObject(path)) {
			extend(attr, path);
		}

		return this.createElement('shape').attr(attr);
	},

	
	circle: function (x, y, r) {
		return this.symbol('circle').attr({ x: x - r, y: y - r, width: 2 * r, height: 2 * r });
	},

	
	g: function (name) {
		var wrapper,
			attribs;


		if (name) {
			attribs = { 'className': PREFIX + name, 'class': PREFIX + name };
		}


		wrapper = this.createElement(DIV).attr(attribs);

		return wrapper;
	},

	
	image: function (src, x, y, width, height) {
		var obj = this.createElement('img')
			.attr({ src: src });

		if (arguments.length > 1) {
			obj.css({
				left: x,
				top: y,
				width: width,
				height: height
			});
		}
		return obj;
	},

	
	rect: function (x, y, width, height, r, strokeWidth) {

		if (isObject(x)) {
			y = x.y;
			width = x.width;
			height = x.height;
			strokeWidth = x.strokeWidth;
			x = x.x;
		}
		var wrapper = this.symbol('rect');
		wrapper.r = r;

		return wrapper.attr(wrapper.crisp(strokeWidth, x, y, mathMax(width, 0), mathMax(height, 0)));
	},

	
	invertChild: function (element, parentNode) {
		var parentStyle = parentNode.style;
		css(element, {
			flip: 'x',
			left: pInt(parentStyle.width) - 1,
			top: pInt(parentStyle.height) - 1,
			rotation: -90
		});
	},

	
	symbols: {

		arc: function (x, y, w, h, options) {
			var start = options.start,
				end = options.end,
				radius = options.r || w || h,
				cosStart = mathCos(start),
				sinStart = mathSin(start),
				cosEnd = mathCos(end),
				sinEnd = mathSin(end),
				innerRadius = options.innerR,
				circleCorrection = 0.08 / radius,
				innerCorrection = (innerRadius && 0.1 / innerRadius) || 0,
				ret;

			if (end - start === 0) {
				return ['x'];

			} else if (2 * mathPI - end + start < circleCorrection) {

				cosEnd = -circleCorrection;
			} else if (end - start < innerCorrection) {
				cosEnd = mathCos(start + innerCorrection);
			}

			ret = [
				'wa',
				x - radius,
				y - radius,
				x + radius,
				y + radius,
				x + radius * cosStart,
				y + radius * sinStart,
				x + radius * cosEnd,
				y + radius * sinEnd
			];

			if (options.open) {
				ret.push(
					M, 
					x - innerRadius, 
					y - innerRadius
				);
			}

			ret.push(
				'at',
				x - innerRadius,
				y - innerRadius,
				x + innerRadius,
				y + innerRadius,
				x + innerRadius * cosEnd,
				y + innerRadius * sinEnd,
				x + innerRadius * cosStart,
				y + innerRadius * sinStart,
				'x',
				'e'
			);
			
			return ret;

		},

		circle: function (x, y, w, h) {

			return [
				'wa',
				x,
				y,
				x + w,
				y + h,
				x + w,
				y + h / 2,
				x + w,
				y + h / 2,

				'e'
			];
		},
		

		rect: function (left, top, width, height, options) {
			
			var right = left + width,
				bottom = top + height,
				ret,
				r;


			if (!defined(options) || !options.r) {
				ret = SVGRenderer.prototype.symbols.square.apply(0, arguments);
				

			} else {
			
				r = mathMin(options.r, width, height);
				ret = [
					M,
					left + r, top,
	
					L,
					right - r, top,
					'wa',
					right - 2 * r, top,
					right, top + 2 * r,
					right - r, top,
					right, top + r,
	
					L,
					right, bottom - r,
					'wa',
					right - 2 * r, bottom - 2 * r,
					right, bottom,
					right, bottom - r,
					right - r, bottom,
	
					L,
					left + r, bottom,
					'wa',
					left, bottom - 2 * r,
					left + 2 * r, bottom,
					left + r, bottom,
					left, bottom - r,
	
					L,
					left, top + r,
					'wa',
					left, top,
					left + 2 * r, top + 2 * r,
					left, top + r,
					left + r, top,
	
	
					'x',
					'e'
				];
			}
			return ret;
		}
	}
};
VMLRenderer = function () {
	this.init.apply(this, arguments);
};
VMLRenderer.prototype = merge(SVGRenderer.prototype, VMLRendererExtension);


	Renderer = VMLRenderer;
}



var CanVGRenderer,
	CanVGController;

if (useCanVG) {
	
	CanVGRenderer = function () {

	};

	
	CanVGRenderer.prototype.symbols = {};

	
	CanVGController = (function () {

		var deferredRenderCalls = [];

		
		function drawDeferred() {
			var callLength = deferredRenderCalls.length,
				callIndex;


			for (callIndex = 0; callIndex < callLength; callIndex++) {
				deferredRenderCalls[callIndex]();
			}

			deferredRenderCalls = [];
		}

		return {
			push: function (func, scriptLocation) {

				if (deferredRenderCalls.length === 0) {
					getScript(scriptLocation, drawDeferred);
				}

				deferredRenderCalls.push(func);
			}
		};
	}());
}




Renderer = VMLRenderer || CanVGRenderer || SVGRenderer;

function Tick(axis, pos, type) {
	this.axis = axis;
	this.pos = pos;
	this.type = type || '';
	this.isNew = true;

	if (!type) {
		this.addLabel();
	}
}

Tick.prototype = {
	
	addLabel: function () {
		var tick = this,
			axis = tick.axis,
			options = axis.options,
			chart = axis.chart,
			horiz = axis.horiz,
			categories = axis.categories,
			pos = tick.pos,
			labelOptions = options.labels,
			str,
			tickPositions = axis.tickPositions,
			width = (categories && horiz && categories.length &&
				!labelOptions.step && !labelOptions.staggerLines &&
				!labelOptions.rotation &&
				chart.plotWidth / tickPositions.length) ||
				(!horiz && chart.plotWidth / 2),
			isFirst = pos === tickPositions[0],
			isLast = pos === tickPositions[tickPositions.length - 1],
			css,
			attr,
			value = categories && defined(categories[pos]) ? categories[pos] : pos,
			label = tick.label,
			tickPositionInfo = tickPositions.info,
			dateTimeLabelFormat;



		if (axis.isDatetimeAxis && tickPositionInfo) {
			dateTimeLabelFormat = options.dateTimeLabelFormats[tickPositionInfo.higherRanks[pos] || tickPositionInfo.unitName];
		}


		tick.isFirst = isFirst;
		tick.isLast = isLast;


		str = axis.labelFormatter.call({
			axis: axis,
			chart: chart,
			isFirst: isFirst,
			isLast: isLast,
			dateTimeLabelFormat: dateTimeLabelFormat,
			value: axis.isLog ? correctFloat(lin2log(value)) : value
		});


		css = width && { width: mathMax(1, mathRound(width - 2 * (labelOptions.padding || 10))) + PX };
		css = extend(css, labelOptions.style);


		if (!defined(label)) {
			attr = {
				align: labelOptions.align
			};
			if (isNumber(labelOptions.rotation)) {
				attr.rotation = labelOptions.rotation;
			}			
			tick.label =
				defined(str) && labelOptions.enabled ?
					chart.renderer.text(
							str,
							0,
							0,
							labelOptions.useHTML
						)
						.attr(attr)

						.css(css)
						.add(axis.axisGroup) :
					null;


		} else if (label) {
			label.attr({
					text: str
				})
				.css(css);
		}
	},

	
	getLabelSize: function () {
		var label = this.label,
			axis = this.axis;
		return label ?
			((this.labelBBox = label.getBBox(true)))[axis.horiz ? 'height' : 'width'] :
			0;
	},

	
	getLabelSides: function () {
		var bBox = this.labelBBox,
			axis = this.axis,
			options = axis.options,
			labelOptions = options.labels,
			width = bBox.width,
			leftSide = width * { left: 0, center: 0.5, right: 1 }[labelOptions.align] - labelOptions.x;

		return [-leftSide, width - leftSide];
	},

	
	handleOverflow: function (index, xy) {
		var show = true,
			axis = this.axis,
			chart = axis.chart,
			isFirst = this.isFirst,
			isLast = this.isLast,
			x = xy.x,
			reversed = axis.reversed,
			tickPositions = axis.tickPositions;

		if (isFirst || isLast) {

			var sides = this.getLabelSides(),
				leftSide = sides[0],
				rightSide = sides[1],
				plotLeft = chart.plotLeft,
				plotRight = plotLeft + axis.len,
				neighbour = axis.ticks[tickPositions[index + (isFirst ? 1 : -1)]],
				neighbourEdge = neighbour && neighbour.label.xy.x + neighbour.getLabelSides()[isFirst ? 0 : 1];

			if ((isFirst && !reversed) || (isLast && reversed)) {

				if (x + leftSide < plotLeft) {


					x = plotLeft - leftSide;


					if (neighbour && x + rightSide > neighbourEdge) {
						show = false;
					}
				}

			} else {

				if (x + rightSide > plotRight) {


					x = plotRight - rightSide;


					if (neighbour && x + leftSide < neighbourEdge) {
						show = false;
					}

				}
			}


			xy.x = x;
		}
		return show;
	},

	
	getPosition: function (horiz, pos, tickmarkOffset, old) {
		var axis = this.axis,
			chart = axis.chart,
			cHeight = (old && chart.oldChartHeight) || chart.chartHeight;
		
		return {
			x: horiz ?
				axis.translate(pos + tickmarkOffset, null, null, old) + axis.transB :
				axis.left + axis.offset + (axis.opposite ? ((old && chart.oldChartWidth) || chart.chartWidth) - axis.right - axis.left : 0),

			y: horiz ?
				cHeight - axis.bottom + axis.offset - (axis.opposite ? axis.height : 0) :
				cHeight - axis.translate(pos + tickmarkOffset, null, null, old) - axis.transB
		};
		
	},
	
	
	getLabelPosition: function (x, y, label, horiz, labelOptions, tickmarkOffset, index, step) {
		var axis = this.axis,
			transA = axis.transA,
			reversed = axis.reversed,
			staggerLines = axis.staggerLines;
			
		x = x + labelOptions.x - (tickmarkOffset && horiz ?
			tickmarkOffset * transA * (reversed ? -1 : 1) : 0);
		y = y + labelOptions.y - (tickmarkOffset && !horiz ?
			tickmarkOffset * transA * (reversed ? 1 : -1) : 0);
		

		if (!defined(labelOptions.y)) {
			y += pInt(label.styles.lineHeight) * 0.9 - label.getBBox().height / 2;
		}
		

		if (staggerLines) {
			y += (index / (step || 1) % staggerLines) * 16;
		}
		
		return {
			x: x,
			y: y
		};
	},
	
	
	getMarkPath: function (x, y, tickLength, tickWidth, horiz, renderer) {
		return renderer.crispLine([
				M,
				x,
				y,
				L,
				x + (horiz ? 0 : -tickLength),
				y + (horiz ? tickLength : 0)
			], tickWidth);
	},

	
	render: function (index, old) {
		var tick = this,
			axis = tick.axis,
			options = axis.options,
			chart = axis.chart,
			renderer = chart.renderer,
			horiz = axis.horiz,
			type = tick.type,
			label = tick.label,
			pos = tick.pos,
			labelOptions = options.labels,
			gridLine = tick.gridLine,
			gridPrefix = type ? type + 'Grid' : 'grid',
			tickPrefix = type ? type + 'Tick' : 'tick',
			gridLineWidth = options[gridPrefix + 'LineWidth'],
			gridLineColor = options[gridPrefix + 'LineColor'],
			dashStyle = options[gridPrefix + 'LineDashStyle'],
			tickLength = options[tickPrefix + 'Length'],
			tickWidth = options[tickPrefix + 'Width'] || 0,
			tickColor = options[tickPrefix + 'Color'],
			tickPosition = options[tickPrefix + 'Position'],
			gridLinePath,
			mark = tick.mark,
			markPath,
			step = labelOptions.step,
			attribs,
			show = true,
			tickmarkOffset = (options.categories && options.tickmarkPlacement === 'between') ? 0.5 : 0,
			xy = tick.getPosition(horiz, pos, tickmarkOffset, old),
			x = xy.x,
			y = xy.y,
			staggerLines = axis.staggerLines;
		

		if (gridLineWidth) {
			gridLinePath = axis.getPlotLinePath(pos + tickmarkOffset, gridLineWidth, old);

			if (gridLine === UNDEFINED) {
				attribs = {
					stroke: gridLineColor,
					'stroke-width': gridLineWidth
				};
				if (dashStyle) {
					attribs.dashstyle = dashStyle;
				}
				if (!type) {
					attribs.zIndex = 1;
				}
				tick.gridLine = gridLine =
					gridLineWidth ?
						renderer.path(gridLinePath)
							.attr(attribs).add(axis.gridGroup) :
						null;
			}



			if (!old && gridLine && gridLinePath) {
				gridLine[tick.isNew ? 'attr' : 'animate']({
					d: gridLinePath
				});
			}
		}


		if (tickWidth) {


			if (tickPosition === 'inside') {
				tickLength = -tickLength;
			}
			if (axis.opposite) {
				tickLength = -tickLength;
			}

			markPath = tick.getMarkPath(x, y, tickLength, tickWidth, horiz, renderer);

			if (mark) {
				mark.animate({
					d: markPath
				});
			} else {
				tick.mark = renderer.path(
					markPath
				).attr({
					stroke: tickColor,
					'stroke-width': tickWidth
				}).add(axis.axisGroup);
			}
		}


		if (label && !isNaN(x)) {
			label.xy = xy = tick.getLabelPosition(x, y, label, horiz, labelOptions, tickmarkOffset, index, step);


			if ((tick.isFirst && !pick(options.showFirstLabel, 1)) ||
					(tick.isLast && !pick(options.showLastLabel, 1))) {
				show = false;


			} else if (!staggerLines && horiz && labelOptions.overflow === 'justify' && !tick.handleOverflow(index, xy)) {
				show = false;
			}


			if (step && index % step) {

				show = false;
			}


			if (show) {
				label[tick.isNew ? 'attr' : 'animate'](xy);
				label.show();
				tick.isNew = false;
			} else {
				label.hide();
			}
		}
	},

	
	destroy: function () {
		destroyObjectProperties(this, this.axis);
	}
};


function PlotLineOrBand(axis, options) {
	this.axis = axis;

	if (options) {
		this.options = options;
		this.id = options.id;
	}


	return this;
}

PlotLineOrBand.prototype = {
	
	
	render: function () {
		var plotLine = this,
			axis = plotLine.axis,
			horiz = axis.horiz,
			halfPointRange = (axis.pointRange || 0) / 2,
			options = plotLine.options,
			optionsLabel = options.label,
			label = plotLine.label,
			width = options.width,
			to = options.to,
			from = options.from,
			isBand = defined(from) && defined(to),
			value = options.value,
			dashStyle = options.dashStyle,
			svgElem = plotLine.svgElem,
			path = [],
			addEvent,
			eventType,
			xs,
			ys,
			x,
			y,
			color = options.color,
			zIndex = options.zIndex,
			events = options.events,
			attribs,
			renderer = axis.chart.renderer;


		if (axis.isLog) {
			from = log2lin(from);
			to = log2lin(to);
			value = log2lin(value);
		}


		if (width) {
			path = axis.getPlotLinePath(value, width);
			attribs = {
				stroke: color,
				'stroke-width': width
			};
			if (dashStyle) {
				attribs.dashstyle = dashStyle;
			}
		} else if (isBand) {
			

			from = mathMax(from, axis.min - halfPointRange);
			to = mathMin(to, axis.max + halfPointRange);
			
			path = axis.getPlotBandPath(from, to, options);
			attribs = {
				fill: color
			};
			if (options.borderWidth) {
				attribs.stroke = options.borderColor;
				attribs['stroke-width'] = options.borderWidth;
			}
		} else {
			return;
		}

		if (defined(zIndex)) {
			attribs.zIndex = zIndex;
		}


		if (svgElem) {
			if (path) {
				svgElem.animate({
					d: path
				}, null, svgElem.onGetPath);
			} else {
				svgElem.hide();
				svgElem.onGetPath = function () {
					svgElem.show();
				};
			}
		} else if (path && path.length) {
			plotLine.svgElem = svgElem = renderer.path(path)
				.attr(attribs).add();


			if (events) {
				addEvent = function (eventType) {
					svgElem.on(eventType, function (e) {
						events[eventType].apply(plotLine, [e]);
					});
				};
				for (eventType in events) {
					addEvent(eventType);
				}
			}
		}


		if (optionsLabel && defined(optionsLabel.text) && path && path.length && axis.width > 0 && axis.height > 0) {

			optionsLabel = merge({
				align: horiz && isBand && 'center',
				x: horiz ? !isBand && 4 : 10,
				verticalAlign : !horiz && isBand && 'middle',
				y: horiz ? isBand ? 16 : 10 : isBand ? 6 : -4,
				rotation: horiz && !isBand && 90
			}, optionsLabel);


			if (!label) {
				plotLine.label = label = renderer.text(
						optionsLabel.text,
						0,
						0
					)
					.attr({
						align: optionsLabel.textAlign || optionsLabel.align,
						rotation: optionsLabel.rotation,
						zIndex: zIndex
					})
					.css(optionsLabel.style)
					.add();
			}


			xs = [path[1], path[4], pick(path[6], path[1])];
			ys = [path[2], path[5], pick(path[7], path[2])];
			x = arrayMin(xs);
			y = arrayMin(ys);

			label.align(optionsLabel, false, {
				x: x,
				y: y,
				width: arrayMax(xs) - x,
				height: arrayMax(ys) - y
			});
			label.show();

		} else if (label) {
			label.hide();
		}


		return plotLine;
	},

	
	destroy: function () {
		var plotLine = this,
			axis = plotLine.axis;


		erase(axis.plotLinesAndBands, plotLine);

		destroyObjectProperties(plotLine, this.axis);
	}
};

function StackItem(axis, options, isNegative, x, stackOption) {
	var inverted = axis.chart.inverted;

	this.axis = axis;


	this.isNegative = isNegative;


	this.options = options;


	this.x = x;


	this.stack = stackOption;




	this.alignOptions = {
		align: options.align || (inverted ? (isNegative ? 'left' : 'right') : 'center'),
		verticalAlign: options.verticalAlign || (inverted ? 'middle' : (isNegative ? 'bottom' : 'top')),
		y: pick(options.y, inverted ? 4 : (isNegative ? 14 : -6)),
		x: pick(options.x, inverted ? (isNegative ? -6 : 6) : 0)
	};

	this.textAlign = options.textAlign || (inverted ? (isNegative ? 'right' : 'left') : 'center');
}

StackItem.prototype = {
	destroy: function () {
		destroyObjectProperties(this, this.axis);
	},

	
	setTotal: function (total) {
		this.total = total;
		this.cum = total;
	},

	
	render: function (group) {
		var str = this.options.formatter.call(this);


		if (this.label) {
			this.label.attr({text: str, visibility: HIDDEN});

		} else {
			this.label =
				this.axis.chart.renderer.text(str, 0, 0)
					.css(this.options.style)
					.attr({align: this.textAlign,
						rotation: this.options.rotation,
						visibility: HIDDEN })
					.add(group);
		}
	},

	
	setOffset: function (xOffset, xWidth) {
		var stackItem = this,
			axis = stackItem.axis,
			chart = axis.chart,
			inverted = chart.inverted,
			neg = this.isNegative,
			y = axis.translate(this.total, 0, 0, 0, 1),
			yZero = axis.translate(0),
			h = mathAbs(y - yZero),
			x = chart.xAxis[0].translate(this.x) + xOffset,
			plotHeight = chart.plotHeight,
			stackBox = {
					x: inverted ? (neg ? y : y - h) : x,
					y: inverted ? plotHeight - x - xWidth : (neg ? (plotHeight - y - h) : plotHeight - y),
					width: inverted ? h : xWidth,
					height: inverted ? xWidth : h
			};

		if (this.label) {
			this.label
				.align(this.alignOptions, null, stackBox)
				.attr({visibility: VISIBLE});
		}
		
	}
};

function Axis() {
	this.init.apply(this, arguments);
}

Axis.prototype = {
	
	
	defaultOptions: {



		dateTimeLabelFormats: {
			millisecond: '%H:%M:%S.%L',
			second: '%H:%M:%S',
			minute: '%H:%M',
			hour: '%H:%M',
			day: '%e. %b',
			week: '%e. %b',
			month: '%b \'%y',
			year: '%Y'
		},
		endOnTick: false,
		gridLineColor: '#C0C0C0',



	
		labels: defaultLabelOptions,

		lineColor: '#C0D0E0',
		lineWidth: 1,



		minPadding: 0.01,
		maxPadding: 0.01,

		minorGridLineColor: '#E0E0E0',

		minorGridLineWidth: 1,
		minorTickColor: '#A0A0A0',

		minorTickLength: 2,
		minorTickPosition: 'outside',

















		startOfWeek: 1,
		startOnTick: false,
		tickColor: '#C0D0E0',

		tickLength: 5,
		tickmarkPlacement: 'between',
		tickPixelInterval: 100,
		tickPosition: 'outside',
		tickWidth: 1,
		title: {

			align: 'middle',



			style: {
				color: '#6D869F',

				fontWeight: 'bold'
			}


		},
		type: 'linear'
	},
	
	
	defaultYAxisOptions: {
		endOnTick: true,
		gridLineWidth: 1,
		tickPixelInterval: 72,
		showLastLabel: true,
		labels: {
			align: 'right',
			x: -8,
			y: 3
		},
		lineWidth: 0,
		maxPadding: 0.05,
		minPadding: 0.05,
		startOnTick: true,
		tickWidth: 0,
		title: {
			rotation: 270,
			text: 'Y-values'
		},
		stackLabels: {
			enabled: false,






			formatter: function () {
				return this.total;
			},
			style: defaultLabelOptions.style
		}
	},
	
	
	defaultLeftAxisOptions: {
		labels: {
			align: 'right',
			x: -8,
			y: null
		},
		title: {
			rotation: 270
		}
	},
	
	
	defaultRightAxisOptions: {
		labels: {
			align: 'left',
			x: 8,
			y: null
		},
		title: {
			rotation: 90
		}
	},
	
	
	defaultBottomAxisOptions: {
		labels: {
			align: 'center',
			x: 0,
			y: 14


		},
		title: {
			rotation: 0
		}
	},
	
	defaultTopAxisOptions: {
		labels: {
			align: 'center',
			x: 0,
			y: -5


		},
		title: {
			rotation: 0
		}
	},
	
	
	init: function (chart, userOptions) {
			
		
		var isXAxis = userOptions.isX,
			axis = this;
	

		axis.horiz = chart.inverted ? !isXAxis : isXAxis;
		

		axis.isXAxis = isXAxis;
		axis.xOrY = isXAxis ? 'x' : 'y';
	
	
		axis.opposite = userOptions.opposite;
		axis.side = axis.horiz ?
				(axis.opposite ? 0 : 2) :
				(axis.opposite ? 1 : 3);
	
		axis.setOptions(userOptions);
		
	
		var options = this.options,
			type = options.type,
			isDatetimeAxis = type === 'datetime';
	
		axis.labelFormatter = options.labels.formatter || axis.defaultLabelFormatter;
	
	

		axis.staggerLines = axis.horiz && options.labels.staggerLines;
		axis.userOptions = userOptions;
	

		axis.minPixelPadding = 0;


	
		axis.chart = chart;
		axis.reversed = options.reversed;
	

		axis.categories = options.categories;
	





	

		axis.isLog = type === 'logarithmic';
	

		axis.isLinked = defined(options.linkedTo);


	

		axis.isDatetimeAxis = isDatetimeAxis;
	


	
		





	

		axis.ticks = {};

		axis.minorTicks = {};

	

		axis.plotLinesAndBands = [];
	

		axis.alternateBands = {};
	










		axis.len = 0;





		axis.minRange = axis.userMinRange = options.minRange || options.maxZoom;
		axis.range = options.range;
		axis.offset = options.offset || 0;
	
	

		axis.stacks = {};
	



	

		axis.max = null;
		axis.min = null;
	





		
		var eventType,
			events = axis.options.events;


		chart.axes.push(axis);
		chart[isXAxis ? 'xAxis' : 'yAxis'].push(axis);

		axis.series = [];


		if (chart.inverted && isXAxis && axis.reversed === UNDEFINED) {
			axis.reversed = true;
		}

		axis.removePlotBand = axis.removePlotBandOrLine;
		axis.removePlotLine = axis.removePlotBandOrLine;
		axis.addPlotBand = axis.addPlotBandOrLine;
		axis.addPlotLine = axis.addPlotBandOrLine;



		for (eventType in events) {
			addEvent(axis, eventType, events[eventType]);
		}


		if (axis.isLog) {
			axis.val2lin = log2lin;
			axis.lin2val = lin2log;
		}
	},
	
	
	setOptions: function (userOptions) {
		this.options = merge(
			this.defaultOptions,
			this.isXAxis ? {} : this.defaultYAxisOptions,
			[this.defaultTopAxisOptions, this.defaultRightAxisOptions,
				this.defaultBottomAxisOptions, this.defaultLeftAxisOptions][this.side],
			userOptions
		);
	},
	
	
	
	defaultLabelFormatter: function () {
		var axis = this.axis,
			value = this.value,
			categories = axis.categories,
			tickInterval = axis.tickInterval,
			dateTimeLabelFormat = this.dateTimeLabelFormat,
			ret;

		if (categories) {
			ret = value;
		
		} else if (dateTimeLabelFormat) {
			ret = dateFormat(dateTimeLabelFormat, value);

		} else if (tickInterval % 1000000 === 0) {
			ret = (value / 1000000) + 'M';

		} else if (tickInterval % 1000 === 0) {
			ret = (value / 1000) + 'k';

		} else if (value >= 1000) {
			ret = numberFormat(value, 0);

		} else {
			ret = numberFormat(value, -1);
		}
		return ret;
	},
	
	
	getSeriesExtremes: function () {
		var axis = this,
			chart = axis.chart,
			stacks = axis.stacks,
			posStack = [],
			negStack = [],
			i;


		axis.dataMin = axis.dataMax = null;


		each(axis.series, function (series) {

			if (series.visible || !chart.options.chart.ignoreHiddenSeries) {

				var seriesOptions = series.options,
					stacking,
					posPointStack,
					negPointStack,
					stackKey,
					stackOption,
					negKey,
					xData,
					yData,
					x,
					y,
					threshold = seriesOptions.threshold,
					yDataLength,
					activeYData = [],
					activeCounter = 0;
					

				if (axis.isLog && threshold <= 0) {
					threshold = seriesOptions.threshold = null;
				}


				if (axis.isXAxis) {
					xData = series.xData;
					if (xData.length) {
						axis.dataMin = mathMin(pick(axis.dataMin, xData[0]), arrayMin(xData));
						axis.dataMax = mathMax(pick(axis.dataMax, xData[0]), arrayMax(xData));
					}


				} else {
					var isNegative,
						pointStack,
						key,
						cropped = series.cropped,
						xExtremes = series.xAxis.getExtremes(),


						j,
						hasModifyValue = !!series.modifyValue;



					stacking = seriesOptions.stacking;
					axis.usePercentage = stacking === 'percent';


					if (stacking) {
						stackOption = seriesOptions.stack;
						stackKey = series.type + pick(stackOption, '');
						negKey = '-' + stackKey;
						series.stackKey = stackKey;

						posPointStack = posStack[stackKey] || [];
						posStack[stackKey] = posPointStack;

						negPointStack = negStack[negKey] || [];
						negStack[negKey] = negPointStack;
					}
					if (axis.usePercentage) {
						axis.dataMin = 0;
						axis.dataMax = 99;
					}




					xData = series.processedXData;
					yData = series.processedYData;
					yDataLength = yData.length;


					for (i = 0; i < yDataLength; i++) {
						x = xData[i];
						y = yData[i];
						if (y !== null && y !== UNDEFINED) {



							if (stacking) {
								isNegative = y < threshold;
								pointStack = isNegative ? negPointStack : posPointStack;
								key = isNegative ? negKey : stackKey;

								y = pointStack[x] =
									defined(pointStack[x]) ?
									pointStack[x] + y : y;



								if (!stacks[key]) {
									stacks[key] = {};
								}



								if (!stacks[key][x]) {
									stacks[key][x] = new StackItem(axis, axis.options.stackLabels, isNegative, x, stackOption);
								}
								stacks[key][x].setTotal(y);



							} else if (hasModifyValue) {
								y = series.modifyValue(y);
							}


							



							if (cropped || ((xData[i + 1] || x) >= xExtremes.min && (xData[i - 1] || x) <= xExtremes.max)) {

								j = y.length;
								if (j) {
									while (j--) {
										if (y[j] !== null) {
											activeYData[activeCounter++] = y[j];
										}
									}
								} else {
									activeYData[activeCounter++] = y;
								}
							}
						}
					}


					



					if (!axis.usePercentage && activeYData.length) {
						axis.dataMin = mathMin(pick(axis.dataMin, activeYData[0]), arrayMin(activeYData));
						axis.dataMax = mathMax(pick(axis.dataMax, activeYData[0]), arrayMax(activeYData));
					}


					if (defined(threshold)) {
						if (axis.dataMin >= threshold) {
							axis.dataMin = threshold;
							axis.ignoreMinPadding = true;
						} else if (axis.dataMax < threshold) {
							axis.dataMax = threshold;
							axis.ignoreMaxPadding = true;
						}
					}
				}
			}
		});
	},

	
	translate: function (val, backwards, cvsCoord, old, handleLog) {
		var axis = this,
			axisLength = axis.len,
			sign = 1,
			cvsOffset = 0,
			localA = old ? axis.oldTransA : axis.transA,
			localMin = old ? axis.oldMin : axis.min,
			returnValue,
			postTranslate = axis.options.ordinal || (axis.isLog && handleLog);

		if (!localA) {
			localA = axis.transA;
		}

		if (cvsCoord) {
			sign *= -1;
			cvsOffset = axisLength;
		}
		if (axis.reversed) {
			sign *= -1;
			cvsOffset -= sign * axisLength;
		}

		if (backwards) {
			if (axis.reversed) {
				val = axisLength - val;
			}
			returnValue = val / localA + localMin;
			if (postTranslate) {
				returnValue = axis.lin2val(returnValue);
			}

		} else {
			if (postTranslate) {
				val = axis.val2lin(val);
			}

			returnValue = sign * (val - localMin) * localA + cvsOffset + (sign * axis.minPixelPadding);
		}

		return returnValue;
	},

	
	getPlotLinePath: function (value, lineWidth, old) {
		var axis = this,
			chart = axis.chart,
			axisLeft = axis.left,
			axisTop = axis.top,
			x1,
			y1,
			x2,
			y2,
			translatedValue = axis.translate(value, null, null, old),
			cHeight = (old && chart.oldChartHeight) || chart.chartHeight,
			cWidth = (old && chart.oldChartWidth) || chart.chartWidth,
			skip,
			transB = axis.transB;

		x1 = x2 = mathRound(translatedValue + transB);
		y1 = y2 = mathRound(cHeight - translatedValue - transB);

		if (isNaN(translatedValue)) {
			skip = true;

		} else if (axis.horiz) {
			y1 = axisTop;
			y2 = cHeight - axis.bottom;
			if (x1 < axisLeft || x1 > axisLeft + axis.width) {
				skip = true;
			}
		} else {
			x1 = axisLeft;
			x2 = cWidth - axis.right;

			if (y1 < axisTop || y1 > axisTop + axis.height) {
				skip = true;
			}
		}
		return skip ?
			null :
			chart.renderer.crispLine([M, x1, y1, L, x2, y2], lineWidth || 0);
	},
	
	
	getPlotBandPath: function (from, to) {

		var toPath = this.getPlotLinePath(to),
			path = this.getPlotLinePath(from);
			
		if (path && toPath) {
			path.push(
				toPath[4],
				toPath[5],
				toPath[1],
				toPath[2]
			);
		} else {
			path = null;
		}
		
		return path;
	},
	
	
	getLinearTickPositions: function (tickInterval, min, max) {
		var pos,
			lastPos,
			roundedMin = correctFloat(mathFloor(min / tickInterval) * tickInterval),
			roundedMax = correctFloat(mathCeil(max / tickInterval) * tickInterval),
			tickPositions = [];


		pos = roundedMin;
		while (pos <= roundedMax) {


			tickPositions.push(pos);


			pos = correctFloat(pos + tickInterval);



			if (pos === lastPos) {
				break;
			}


			lastPos = pos;
		}
		return tickPositions;
	},
	
	
	getLogTickPositions: function (interval, min, max, minor) {
		var axis = this,
			options = axis.options,
			axisLength = axis.len;



		var positions = []; 
		

		if (!minor) {
			axis._minorAutoInterval = null;
		}
		

		if (interval >= 0.5) {
			interval = mathRound(interval);
			positions = axis.getLinearTickPositions(interval, min, max);
			


		} else if (interval >= 0.08) {
			var roundedMin = mathFloor(min),
				intermediate,
				i,
				j,
				len,
				pos,
				lastPos,
				break2;
				
			if (interval > 0.3) {
				intermediate = [1, 2, 4];
			} else if (interval > 0.15) {
				intermediate = [1, 2, 4, 6, 8];
			} else {
				intermediate = [1, 2, 3, 4, 5, 6, 7, 8, 9];
			}
			
			for (i = roundedMin; i < max + 1 && !break2; i++) {
				len = intermediate.length;
				for (j = 0; j < len && !break2; j++) {
					pos = log2lin(lin2log(i) * intermediate[j]);
					
					if (pos > min) {
						positions.push(lastPos);
					}
					
					if (lastPos > max) {
						break2 = true;
					}
					lastPos = pos;
				}
			}
			



		} else {
			var realMin = lin2log(min),
				realMax = lin2log(max),
				tickIntervalOption = options[minor ? 'minorTickInterval' : 'tickInterval'],
				filteredTickIntervalOption = tickIntervalOption === 'auto' ? null : tickIntervalOption,
				tickPixelIntervalOption = options.tickPixelInterval / (minor ? 5 : 1),
				totalPixelLength = minor ? axisLength / axis.tickPositions.length : axisLength;
			
			interval = pick(
				filteredTickIntervalOption,
				axis._minorAutoInterval,
				(realMax - realMin) * tickPixelIntervalOption / (totalPixelLength || 1)
			);
			
			interval = normalizeTickInterval(
				interval, 
				null, 
				math.pow(10, mathFloor(math.log(interval) / math.LN10))
			);
			
			positions = map(axis.getLinearTickPositions(
				interval, 
				realMin,
				realMax	
			), log2lin);
			
			if (!minor) {
				axis._minorAutoInterval = interval / 5;
			}
		}
		

		if (!minor) {
			axis.tickInterval = interval;
		}
		return positions;
	},

	
	getMinorTickPositions: function () {
		var axis = this,
			tickPositions = axis.tickPositions,
			minorTickInterval = axis.minorTickInterval;

		var minorTickPositions = [],
			pos,
			i,
			len;
		
		if (axis.isLog) {
			len = tickPositions.length;
			for (i = 1; i < len; i++) {
				minorTickPositions = minorTickPositions.concat(
					axis.getLogTickPositions(minorTickInterval, tickPositions[i - 1], tickPositions[i], true)
				);	
			}
		
		} else {			
			for (pos = axis.min + (tickPositions[0] - axis.min) % minorTickInterval; pos <= axis.max; pos += minorTickInterval) {
				minorTickPositions.push(pos);	
			}
		}
		
		return minorTickPositions;
	},

	
	adjustForMinRange: function () {
		var axis = this,
			options = axis.options,
			min = axis.min,
			max = axis.max,
			zoomOffset,
			spaceAvailable = axis.dataMax - axis.dataMin >= axis.minRange,
			closestDataRange,
			i,
			distance,
			xData,
			loopLength,
			minArgs,
			maxArgs;


		if (axis.isXAxis && axis.minRange === UNDEFINED && !axis.isLog) {

			if (defined(options.min) || defined(options.max)) {
				axis.minRange = null;

			} else {



				each(axis.series, function (series) {
					xData = series.xData;
					loopLength = series.xIncrement ? 1 : xData.length - 1;
					for (i = loopLength; i > 0; i--) {
						distance = xData[i] - xData[i - 1];
						if (closestDataRange === UNDEFINED || distance < closestDataRange) {
							closestDataRange = distance;
						}
					}
				});
				axis.minRange = mathMin(closestDataRange * 5, axis.dataMax - axis.dataMin);
			}
		}


		if (max - min < axis.minRange) {
			var minRange = axis.minRange;
			zoomOffset = (minRange - max + min) / 2;


			minArgs = [min - zoomOffset, pick(options.min, min - zoomOffset)];
			if (spaceAvailable) {
				minArgs[2] = axis.dataMin;
			}
			min = arrayMax(minArgs);

			maxArgs = [min + minRange, pick(options.max, min + minRange)];
			if (spaceAvailable) {
				maxArgs[2] = axis.dataMax;
			}

			max = arrayMin(maxArgs);


			if (max - min < minRange) {
				minArgs[0] = max - minRange;
				minArgs[1] = pick(options.min, max - minRange);
				min = arrayMax(minArgs);
			}
		}
		

		axis.min = min;
		axis.max = max;
	},

	
	setAxisTranslation: function () {
		var axis = this,
			range = axis.max - axis.min,
			pointRange = 0,
			closestPointRange,
			seriesClosestPointRange,
			transA = axis.transA;


		if (axis.isXAxis) {
			if (axis.isLinked) {
				pointRange = axis.linkedParent.pointRange;
			} else {
				each(axis.series, function (series) {
					pointRange = mathMax(pointRange, series.pointRange);
					seriesClosestPointRange = series.closestPointRange;
					if (!series.noSharedTooltip && defined(seriesClosestPointRange)) {
						closestPointRange = defined(closestPointRange) ?
							mathMin(closestPointRange, seriesClosestPointRange) :
							seriesClosestPointRange;
					}
				});
			}


			axis.pointRange = pointRange;




			axis.closestPointRange = closestPointRange;
		}


		axis.oldTransA = transA;
		axis.translationSlope = axis.transA = transA = axis.len / ((range + pointRange) || 1);
		axis.transB = axis.horiz ? axis.left : axis.bottom;
		axis.minPixelPadding = transA * (pointRange / 2);
	},

	
	setTickPositions: function (secondPass) {
		var axis = this,
			chart = axis.chart,
			options = axis.options,
			isLog = axis.isLog,
			isDatetimeAxis = axis.isDatetimeAxis,
			isXAxis = axis.isXAxis,
			isLinked = axis.isLinked,
			tickPositioner = axis.options.tickPositioner,
			magnitude,
			maxPadding = options.maxPadding,
			minPadding = options.minPadding,
			length,
			linkedParentExtremes,
			tickIntervalOption = options.tickInterval,
			tickPixelIntervalOption = options.tickPixelInterval,
			tickPositions,
			categories = axis.categories;


		if (isLinked) {
			axis.linkedParent = chart[isXAxis ? 'xAxis' : 'yAxis'][options.linkedTo];
			linkedParentExtremes = axis.linkedParent.getExtremes();
			axis.min = pick(linkedParentExtremes.min, linkedParentExtremes.dataMin);
			axis.max = pick(linkedParentExtremes.max, linkedParentExtremes.dataMax);
			if (options.type !== axis.linkedParent.options.type) {
				error(11, 1);
			}
		} else {
			axis.min = pick(axis.userMin, options.min, axis.dataMin);
			axis.max = pick(axis.userMax, options.max, axis.dataMax);
		}

		if (isLog) {
			if (!secondPass && mathMin(axis.min, pick(axis.dataMin, axis.min)) <= 0) {
				error(10, 1);
			}
			axis.min = correctFloat(log2lin(axis.min));
			axis.max = correctFloat(log2lin(axis.max));
		}


		if (axis.range) {
			axis.userMin = axis.min = mathMax(axis.min, axis.max - axis.range);
			axis.userMax = axis.max;
			if (secondPass) {
				axis.range = null;
			}
		}


		axis.adjustForMinRange();


		if (!categories && !axis.usePercentage && !isLinked && defined(axis.min) && defined(axis.max)) {
			length = (axis.max - axis.min) || 1;
			if (!defined(options.min) && !defined(axis.userMin) && minPadding && (axis.dataMin < 0 || !axis.ignoreMinPadding)) {
				axis.min -= length * minPadding;
			}
			if (!defined(options.max) && !defined(axis.userMax)  && maxPadding && (axis.dataMax > 0 || !axis.ignoreMaxPadding)) {
				axis.max += length * maxPadding;
			}
		}


		if (axis.min === axis.max || axis.min === undefined || axis.max === undefined) {
			axis.tickInterval = 1;
		} else if (isLinked && !tickIntervalOption &&
				tickPixelIntervalOption === axis.linkedParent.options.tickPixelInterval) {
			axis.tickInterval = axis.linkedParent.tickInterval;
		} else {
			axis.tickInterval = pick(
				tickIntervalOption,
				categories ?
					1 :
					(axis.max - axis.min) * tickPixelIntervalOption / (axis.len || 1)
			);
		}



		if (isXAxis && !secondPass) {
			each(axis.series, function (series) {
				series.processData(axis.min !== axis.oldMin || axis.max !== axis.oldMax);
			});
		}


		axis.setAxisTranslation();


		if (axis.beforeSetTickPositions) {
			axis.beforeSetTickPositions();
		}
		

		if (axis.postProcessTickInterval) {
			axis.tickInterval = axis.postProcessTickInterval(axis.tickInterval);
		}


		if (!isDatetimeAxis && !isLog) {
			magnitude = math.pow(10, mathFloor(math.log(axis.tickInterval) / math.LN10));
			if (!defined(options.tickInterval)) {
				axis.tickInterval = normalizeTickInterval(axis.tickInterval, null, magnitude, options);
			}
		}


		axis.minorTickInterval = options.minorTickInterval === 'auto' && axis.tickInterval ?
				axis.tickInterval / 5 : options.minorTickInterval;


		axis.tickPositions = tickPositions = options.tickPositions || (tickPositioner && tickPositioner.apply(axis, [axis.min, axis.max]));
		if (!tickPositions) {
			if (isDatetimeAxis) {
				tickPositions = (axis.getNonLinearTimeTicks || getTimeTicks)(
					normalizeTimeTickInterval(axis.tickInterval, options.units),
					axis.min,
					axis.max,
					options.startOfWeek,
					axis.ordinalPositions,
					axis.closestPointRange,
					true
				);
			} else if (isLog) {
				tickPositions = axis.getLogTickPositions(axis.tickInterval, axis.min, axis.max);
			} else {
				tickPositions = axis.getLinearTickPositions(axis.tickInterval, axis.min, axis.max);
			}
			axis.tickPositions = tickPositions;
		}

		if (!isLinked) {


			var roundedMin = tickPositions[0],
				roundedMax = tickPositions[tickPositions.length - 1];

			if (options.startOnTick) {
				axis.min = roundedMin;
			} else if (axis.min > roundedMin) {
				tickPositions.shift();
			}

			if (options.endOnTick) {
				axis.max = roundedMax;
			} else if (axis.max < roundedMax) {
				tickPositions.pop();
			}
			
		}
	},
	
	
	setMaxTicks: function () {
		
		var chart = this.chart,
			maxTicks = chart.maxTicks,
			tickPositions = this.tickPositions,
			xOrY = this.xOrY;
		
		if (!maxTicks) {
			maxTicks = {
				x: 0,
				y: 0
			};
		}

		if (!this.isLinked && !this.isDatetimeAxis && tickPositions.length > maxTicks[xOrY] && this.options.alignTicks !== false) {
			maxTicks[xOrY] = tickPositions.length;
		}
		chart.maxTicks = maxTicks;
	},

	
	adjustTickAmount: function () {
		var axis = this,
			chart = axis.chart,
			xOrY = axis.xOrY,
			tickPositions = axis.tickPositions,
			maxTicks = chart.maxTicks;

		if (maxTicks && maxTicks[xOrY] && !axis.isDatetimeAxis && !axis.categories && !axis.isLinked && axis.options.alignTicks !== false) {
			var oldTickAmount = axis.tickAmount,
				calculatedTickAmount = tickPositions.length,
				tickAmount;


			axis.tickAmount = tickAmount = maxTicks[xOrY];

			if (calculatedTickAmount < tickAmount) {
				while (tickPositions.length < tickAmount) {
					tickPositions.push(correctFloat(
						tickPositions[tickPositions.length - 1] + axis.tickInterval
					));
				}
				axis.transA *= (calculatedTickAmount - 1) / (tickAmount - 1);
				axis.max = tickPositions[tickPositions.length - 1];

			}
			if (defined(oldTickAmount) && tickAmount !== oldTickAmount) {
				axis.isDirty = true;
			}
		}
	},

	
	setScale: function () {
		var axis = this,
			stacks = axis.stacks,
			type,
			i,
			isDirtyData,
			isDirtyAxisLength;

		axis.oldMin = axis.min;
		axis.oldMax = axis.max;
		axis.oldAxisLength = axis.len;


		axis.setAxisSize();

		isDirtyAxisLength = axis.len !== axis.oldAxisLength;


		each(axis.series, function (series) {
			if (series.isDirtyData || series.isDirty ||
					series.xAxis.isDirty) {
				isDirtyData = true;
			}
		});
		

		if (isDirtyAxisLength || isDirtyData || axis.isLinked ||
			axis.userMin !== axis.oldUserMin || axis.userMax !== axis.oldUserMax) {


			axis.getSeriesExtremes();


			axis.setTickPositions();


			axis.oldUserMin = axis.userMin;
			axis.oldUserMax = axis.userMax;


			if (!axis.isDirty) {
				axis.isDirty = isDirtyAxisLength || axis.min !== axis.oldMin || axis.max !== axis.oldMax;
			}
		}
		
		

		if (!axis.isXAxis) {
			for (type in stacks) {
				for (i in stacks[type]) {
					stacks[type][i].cum = stacks[type][i].total;
				}
			}
		}
		

		axis.setMaxTicks();
	},

	
	setExtremes: function (newMin, newMax, redraw, animation, eventArguments) {
		var axis = this,
			chart = axis.chart;

		redraw = pick(redraw, true);


		eventArguments = extend(eventArguments, {
			min: newMin,
			max: newMax
		});


		fireEvent(axis, 'setExtremes', eventArguments, function () {

			axis.userMin = newMin;
			axis.userMax = newMax;


			axis.isDirtyExtremes = true;


			if (redraw) {
				chart.redraw(animation);
			}
		});
	},
	
	
	setAxisSize: function () {
		var axis = this,
			chart = axis.chart,
			options = axis.options;

		var offsetLeft = options.offsetLeft || 0,
			offsetRight = options.offsetRight || 0;



		axis.left = pick(options.left, chart.plotLeft + offsetLeft);
		axis.top = pick(options.top, chart.plotTop);
		axis.width = pick(options.width, chart.plotWidth - offsetLeft + offsetRight);
		axis.height = pick(options.height, chart.plotHeight);
		axis.bottom = chart.chartHeight - axis.height - axis.top;
		axis.right = chart.chartWidth - axis.width - axis.left;
		axis.len = mathMax(axis.horiz ? axis.width : axis.height, 0);
	},

	
	getExtremes: function () {
		var axis = this,
			isLog = axis.isLog;

		return {
			min: isLog ? correctFloat(lin2log(axis.min)) : axis.min,
			max: isLog ? correctFloat(lin2log(axis.max)) : axis.max,
			dataMin: axis.dataMin,
			dataMax: axis.dataMax,
			userMin: axis.userMin,
			userMax: axis.userMax
		};
	},

	
	getThreshold: function (threshold) {
		var axis = this,
			isLog = axis.isLog;

		var realMin = isLog ? lin2log(axis.min) : axis.min,
			realMax = isLog ? lin2log(axis.max) : axis.max;
		
		if (realMin > threshold || threshold === null) {
			threshold = realMin;
		} else if (realMax < threshold) {
			threshold = realMax;
		}

		return axis.translate(threshold, 0, 1, 0, 1);
	},

	
	addPlotBandOrLine: function (options) {
		var obj = new PlotLineOrBand(this, options).render();
		this.plotLinesAndBands.push(obj);
		return obj;
	},

	
	getOffset: function () {
		var axis = this,
			chart = axis.chart,
			renderer = chart.renderer,
			options = axis.options,
			tickPositions = axis.tickPositions,
			ticks = axis.ticks,
			horiz = axis.horiz,
			side = axis.side,
			hasData,
			showAxis,
			titleOffset = 0,
			titleOffsetOption,
			titleMargin = 0,
			axisTitleOptions = options.title,
			labelOptions = options.labels,
			labelOffset = 0,
			axisOffset = chart.axisOffset,
			directionFactor = [-1, 1, 1, -1][side],
			n;
			
			

		axis.hasData = hasData = axis.series.length && defined(axis.min) && defined(axis.max);
		axis.showAxis = showAxis = hasData || pick(options.showEmpty, true);


		if (!axis.axisGroup) {
			axis.axisGroup = renderer.g('axis')
				.attr({ zIndex: options.zIndex || 7 })
				.add();
			axis.gridGroup = renderer.g('grid')
				.attr({ zIndex: options.gridZIndex || 1 })
				.add();
		}

		if (hasData || axis.isLinked) {
			each(tickPositions, function (pos) {
				if (!ticks[pos]) {
					ticks[pos] = new Tick(axis, pos);
				} else {
					ticks[pos].addLabel();
				}

			});

			each(tickPositions, function (pos) {

				if (side === 0 || side === 2 || { 1: 'left', 3: 'right' }[side] === labelOptions.align) {


					labelOffset = mathMax(
						ticks[pos].getLabelSize(),
						labelOffset
					);
				}

			});

			if (axis.staggerLines) {
				labelOffset += (axis.staggerLines - 1) * 16;
			}

		} else {
			for (n in ticks) {
				ticks[n].destroy();
				delete ticks[n];
			}
		}

		if (axisTitleOptions && axisTitleOptions.text) {
			if (!axis.axisTitle) {
				axis.axisTitle = renderer.text(
					axisTitleOptions.text,
					0,
					0,
					axisTitleOptions.useHTML
				)
				.attr({
					zIndex: 7,
					rotation: axisTitleOptions.rotation || 0,
					align:
						axisTitleOptions.textAlign ||
						{ low: 'left', middle: 'center', high: 'right' }[axisTitleOptions.align]
				})
				.css(axisTitleOptions.style)
				.add(axis.axisGroup);
				axis.axisTitle.isNew = true;
			}

			if (showAxis) {
				titleOffset = axis.axisTitle.getBBox()[horiz ? 'height' : 'width'];
				titleMargin = pick(axisTitleOptions.margin, horiz ? 5 : 10);
				titleOffsetOption = axisTitleOptions.offset;
			}


			axis.axisTitle[showAxis ? 'show' : 'hide']();
		}
		

		axis.offset = directionFactor * pick(options.offset, axisOffset[side]);
		
		
		axis.axisTitleMargin =
			pick(titleOffsetOption,
				labelOffset + titleMargin +
				(side !== 2 && labelOffset && directionFactor * options.labels[horiz ? 'y' : 'x'])
			);

		axisOffset[side] = mathMax(
			axisOffset[side],
			axis.axisTitleMargin + titleOffset + directionFactor * axis.offset
		);

	},
	
	
	getLinePath: function (lineWidth) {
		var chart = this.chart,
			opposite = this.opposite,
			offset = this.offset,
			horiz = this.horiz,
			lineLeft = this.left + (opposite ? this.width : 0) + offset,
			lineTop = chart.chartHeight - this.bottom - (opposite ? this.height : 0) + offset;

		return chart.renderer.crispLine([
				M,
				horiz ?
					this.left :
					lineLeft,
				horiz ?
					lineTop :
					this.top,
				L,
				horiz ?
					chart.chartWidth - this.right :
					lineLeft,
				horiz ?
					lineTop :
					chart.chartHeight - this.bottom
			], lineWidth);
	},
	
	
	getTitlePosition: function () {

		var horiz = this.horiz,
			axisLeft = this.left,
			axisTop = this.top,
			axisLength = this.len,
			axisTitleOptions = this.options.title,			
			margin = horiz ? axisLeft : axisTop,
			opposite = this.opposite,
			offset = this.offset,
			fontSize = pInt(axisTitleOptions.style.fontSize || 12),
			

			alongAxis = {
				low: margin + (horiz ? 0 : axisLength),
				middle: margin + axisLength / 2,
				high: margin + (horiz ? axisLength : 0)
			}[axisTitleOptions.align],
	

			offAxis = (horiz ? axisTop + this.height : axisLeft) +
				(horiz ? 1 : -1) *
				(opposite ? -1 : 1) *
				this.axisTitleMargin +
				(this.side === 2 ? fontSize : 0);

		return {
			x: horiz ?
				alongAxis :
				offAxis + (opposite ? this.width : 0) + offset +
					(axisTitleOptions.x || 0),
			y: horiz ?
				offAxis - (opposite ? this.height : 0) + offset :
				alongAxis + (axisTitleOptions.y || 0)
		};
	},
	
	
	render: function () {
		var axis = this,
			chart = axis.chart,
			renderer = chart.renderer,
			options = axis.options,
			isLog = axis.isLog,
			isLinked = axis.isLinked,
			tickPositions = axis.tickPositions,
			axisTitle = axis.axisTitle,
			stacks = axis.stacks,
			ticks = axis.ticks,
			minorTicks = axis.minorTicks,
			alternateBands = axis.alternateBands,
			stackLabelOptions = options.stackLabels,
			alternateGridColor = options.alternateGridColor,
			lineWidth = options.lineWidth,
			linePath,
			hasRendered = chart.hasRendered,
			slideInTicks = hasRendered && defined(axis.oldMin) && !isNaN(axis.oldMin),
			hasData = axis.hasData,
			showAxis = axis.showAxis,
			from,
			to;


		if (hasData || isLinked) {


			if (axis.minorTickInterval && !axis.categories) {
				each(axis.getMinorTickPositions(), function (pos) {
					if (!minorTicks[pos]) {
						minorTicks[pos] = new Tick(axis, pos, 'minor');
					}


					if (slideInTicks && minorTicks[pos].isNew) {
						minorTicks[pos].render(null, true);
					}


					minorTicks[pos].isActive = true;
					minorTicks[pos].render();
				});
			}



			each(tickPositions.slice(1).concat([tickPositions[0]]), function (pos, i) {


				i = (i === tickPositions.length - 1) ? 0 : i + 1;


				if (!isLinked || (pos >= axis.min && pos <= axis.max)) {

					if (!ticks[pos]) {
						ticks[pos] = new Tick(axis, pos);
					}


					if (slideInTicks && ticks[pos].isNew) {
						ticks[pos].render(i, true);
					}

					ticks[pos].isActive = true;
					ticks[pos].render(i);
				}

			});


			if (alternateGridColor) {
				each(tickPositions, function (pos, i) {
					if (i % 2 === 0 && pos < axis.max) {
						if (!alternateBands[pos]) {
							alternateBands[pos] = new PlotLineOrBand(axis);
						}
						from = pos;
						to = tickPositions[i + 1] !== UNDEFINED ? tickPositions[i + 1] : axis.max;
						alternateBands[pos].options = {
							from: isLog ? lin2log(from) : from,
							to: isLog ? lin2log(to) : to,
							color: alternateGridColor
						};
						alternateBands[pos].render();
						alternateBands[pos].isActive = true;
					}
				});
			}


			if (!axis._addedPlotLB) {
				each((options.plotLines || []).concat(options.plotBands || []), function (plotLineOptions) {

					axis.addPlotBandOrLine(plotLineOptions);
				});
				axis._addedPlotLB = true;
			}

		}


		each([ticks, minorTicks, alternateBands], function (coll) {
			var pos;
			for (pos in coll) {
				if (!coll[pos].isActive) {
					coll[pos].destroy();
					delete coll[pos];
				} else {
					coll[pos].isActive = false;
				}
			}
		});




		if (lineWidth) {
			linePath = axis.getLinePath(lineWidth);
			if (!axis.axisLine) {
				axis.axisLine = renderer.path(linePath)
					.attr({
						stroke: options.lineColor,
						'stroke-width': lineWidth,
						zIndex: 7
					})
					.add();
			} else {
				axis.axisLine.animate({ d: linePath });
			}


			axis.axisLine[showAxis ? 'show' : 'hide']();

		}

		if (axisTitle && showAxis) {
			
			axisTitle[axisTitle.isNew ? 'attr' : 'animate'](
				axis.getTitlePosition()
			);
			axisTitle.isNew = false;
		}


		if (stackLabelOptions && stackLabelOptions.enabled) {
			var stackKey, oneStack, stackCategory,
				stackTotalGroup = axis.stackTotalGroup;


			if (!stackTotalGroup) {
				axis.stackTotalGroup = stackTotalGroup =
					renderer.g('stack-labels')
						.attr({
							visibility: VISIBLE,
							zIndex: 6
						})
						.add();
			}



			stackTotalGroup.translate(chart.plotLeft, chart.plotTop);


			for (stackKey in stacks) {
				oneStack = stacks[stackKey];
				for (stackCategory in oneStack) {
					oneStack[stackCategory].render(stackTotalGroup);
				}
			}
		}


		axis.isDirty = false;
	},

	
	removePlotBandOrLine: function (id) {
		var plotLinesAndBands = this.plotLinesAndBands,
			i = plotLinesAndBands.length;
		while (i--) {
			if (plotLinesAndBands[i].id === id) {
				plotLinesAndBands[i].destroy();
			}
		}
	},

	
	setTitle: function (newTitleOptions, redraw) {
		var axis = this,
			chart = axis.chart,
			options = axis.options,
			axisTitle;

		options.title = merge(options.title, newTitleOptions);

		axis.axisTitle = axisTitle && axisTitle.destroy();
		axis.isDirty = true;

		if (pick(redraw, true)) {
			chart.redraw();
		}
	},

	
	redraw: function () {
		var axis = this,
			chart = axis.chart;


		if (chart.tracker.resetTracker) {
			chart.tracker.resetTracker(true);
		}


		axis.render();


		each(axis.plotLinesAndBands, function (plotLine) {
			plotLine.render();
		});


		each(axis.series, function (series) {
			series.isDirty = true;
		});

	},

	
	setCategories: function (newCategories, doRedraw) {
		var axis = this,
			chart = axis.chart;


		axis.categories = axis.userOptions.categories = newCategories;


		each(axis.series, function (series) {
			series.translate();
			series.setTooltipPoints(true);
		});



		axis.isDirty = true;

		if (pick(doRedraw, true)) {
			chart.redraw();
		}
	},

	
	destroy: function () {
		var axis = this,
			stacks = axis.stacks,
			stackKey;


		removeEvent(axis);


		for (stackKey in stacks) {
			destroyObjectProperties(stacks[stackKey]);

			stacks[stackKey] = null;
		}


		each([axis.ticks, axis.minorTicks, axis.alternateBands, axis.plotLinesAndBands], function (coll) {
			destroyObjectProperties(coll);
		});


		each(['stackTotalGroup', 'axisLine', 'axisGroup', 'gridGroup', 'axisTitle'], function (prop) {
			if (axis[prop]) {
				axis[prop] = axis[prop].destroy();
			}
		});
	}

	
};


function Tooltip(chart, options) {
	var borderWidth = options.borderWidth,
		style = options.style,
		shared = options.shared,
		padding = pInt(style.padding);


	this.chart = chart;
	this.options = options;


	style.padding = 0;





	this.crosshairs = [];


	this.currentX = 0;
	this.currentY = 0;





	this.tooltipIsHidden = true;


	this.label = chart.renderer.label('', 0, 0, null, null, null, options.useHTML, null, 'tooltip')
		.attr({
			padding: padding,
			fill: options.backgroundColor,
			'stroke-width': borderWidth,
			r: options.borderRadius,
			zIndex: 8
		})
		.css(style)
		.hide()
		.add();



	if (!useCanVG) {
		this.label.shadow(options.shadow);
	}


	this.shared = shared;
}

Tooltip.prototype = {
	
	destroy: function () {
		each(this.crosshairs, function (crosshair) {
			if (crosshair) {
				crosshair.destroy();
			}
		});


		if (this.label) {
			this.label = this.label.destroy();
		}
	},

	
	move: function (finalX, finalY) {
		var tooltip = this;


		tooltip.currentX = tooltip.tooltipIsHidden ? finalX : (2 * tooltip.currentX + finalX) / 3;
		tooltip.currentY = tooltip.tooltipIsHidden ? finalY : (tooltip.currentY + finalY) / 2;


		tooltip.label.attr({ x: tooltip.currentX, y: tooltip.currentY });


		if (mathAbs(finalX - tooltip.currentX) > 1 || mathAbs(finalY - tooltip.currentY) > 1) {
			tooltip.tooltipTick = function () {
				tooltip.move(finalX, finalY);
			};
		} else {
			tooltip.tooltipTick = null;
		}
	},

	
	hide: function () {
		if (!this.tooltipIsHidden) {
			var hoverPoints = this.chart.hoverPoints;

			this.label.hide();


			if (hoverPoints) {
				each(hoverPoints, function (point) {
					point.setState();
				});
			}

			this.chart.hoverPoints = null;
			this.tooltipIsHidden = true;
		}
	},

	
	hideCrosshairs: function () {
		each(this.crosshairs, function (crosshair) {
			if (crosshair) {
				crosshair.hide();
			}
		});
	},
	
	
	getAnchor: function (points, mouseEvent) {
		var ret,
			chart = this.chart,
			inverted = chart.inverted,
			plotX = 0,
			plotY = 0;
		
		points = splat(points);
		

		ret = points[0].tooltipPos;
		

		if (!ret) {
			each(points, function (point) {
				plotX += point.plotX;
				plotY += point.plotLow ? (point.plotLow + point.plotHigh) / 2 : point.plotY;
			});
			
			plotX /= points.length;
			plotY /= points.length;
			
			ret = [
				inverted ? chart.plotWidth - plotY : plotX,
				this.shared && !inverted && points.length > 1 && mouseEvent ? 
					mouseEvent.chartY - chart.plotTop :
					inverted ? chart.plotHeight - plotX : plotY
			];
		}

		return map(ret, mathRound);
	},
	
	
	getPosition: function (boxWidth, boxHeight, point) {
		

		var chart = this.chart,
			plotLeft = chart.plotLeft,
			plotTop = chart.plotTop,
			plotWidth = chart.plotWidth,
			plotHeight = chart.plotHeight,
			distance = pick(this.options.distance, 12),
			pointX = point.plotX,
			pointY = point.plotY,
			x = pointX + plotLeft + (chart.inverted ? distance : -boxWidth - distance),
			y = pointY - boxHeight + plotTop + 15,
			alignedRight;
	

		if (x < 7) {
			x = plotLeft + pointX + distance;
		}
	


		if ((x + boxWidth) > (plotLeft + plotWidth)) {
			x -= (x + boxWidth) - (plotLeft + plotWidth);
			y = pointY - boxHeight + plotTop - distance;
			alignedRight = true;
		}
	

		if (y < plotTop + 5) {
			y = plotTop + 5;
	

			if (alignedRight && pointY >= y && pointY <= (y + boxHeight)) {
				y = pointY + plotTop + distance;
			}
		} 
	


		if (y + boxHeight > plotTop + plotHeight) {
			y = mathMax(plotTop, plotTop + plotHeight - boxHeight - distance);
		}
		
	
		return {x: x, y: y};
	},

	
	refresh: function (point, mouseEvent) {
		var tooltip = this,
			chart = tooltip.chart,
			label = tooltip.label,
			options = tooltip.options;

		
		function defaultFormatter() {
			var pThis = this,
				items = pThis.points || splat(pThis),
				series = items[0].series,
				s;


			s = [series.tooltipHeaderFormatter(items[0].key)];


			each(items, function (item) {
				series = item.series;
				s.push((series.tooltipFormatter && series.tooltipFormatter(item)) ||
					item.point.tooltipFormatter(series.tooltipOptions.pointFormat));
			});


			s.push(options.footerFormat || '');

			return s.join('');
		}

		var x,
			y,
			show,
			anchor,
			textConfig = {},
			text,
			pointConfig = [],
			formatter = options.formatter || defaultFormatter,
			hoverPoints = chart.hoverPoints,
			placedTooltipPoint,
			borderColor,
			crosshairsOptions = options.crosshairs,
			shared = tooltip.shared,
			currentSeries;
			

		anchor = tooltip.getAnchor(point, mouseEvent);
		x = anchor[0];
		y = anchor[1];


		if (shared && !(point.series && point.series.noSharedTooltip)) {
			

			if (hoverPoints) {
				each(hoverPoints, function (point) {
					point.setState();
				});
			}
			chart.hoverPoints = point;

			each(point, function (item) {
				item.setState(HOVER_STATE);

				pointConfig.push(item.getLabelConfig());
			});

			textConfig = {
				x: point[0].category,
				y: point[0].y
			};
			textConfig.points = pointConfig;
			point = point[0];


		} else {
			textConfig = point.getLabelConfig();
		}
		text = formatter.call(textConfig);


		currentSeries = point.series;



		show = shared || !currentSeries.isCartesian || currentSeries.tooltipOutsidePlot || chart.isInsidePlot(x, y);


		if (text === false || !show) {
			this.hide();
		} else {


			if (tooltip.tooltipIsHidden) {
				label.show();
			}


			label.attr({
				text: text
			});


			borderColor = options.borderColor || point.color || currentSeries.color || '#606060';
			label.attr({
				stroke: borderColor
			});

			placedTooltipPoint = (options.positioner || tooltip.getPosition).call(
				tooltip,
				label.width,
				label.height,
				{ plotX: x, plotY: y }
			);


			tooltip.move(mathRound(placedTooltipPoint.x), mathRound(placedTooltipPoint.y));
			
			
			tooltip.tooltipIsHidden = false;
		}


		if (crosshairsOptions) {
			crosshairsOptions = splat(crosshairsOptions);

			var path,
				i = crosshairsOptions.length,
				attribs,
				axis;

			while (i--) {
				axis = point.series[i ? 'yAxis' : 'xAxis'];
				if (crosshairsOptions[i] && axis) {

					path = axis.getPlotLinePath(
						i ? pick(point.stackY, point.y) : point.x,
						1
					);

					if (tooltip.crosshairs[i]) {
						tooltip.crosshairs[i].attr({ d: path, visibility: VISIBLE });
					} else {
						attribs = {
							'stroke-width': crosshairsOptions[i].width || 1,
							stroke: crosshairsOptions[i].color || '#C0C0C0',
							zIndex: crosshairsOptions[i].zIndex || 2
						};
						if (crosshairsOptions[i].dashStyle) {
							attribs.dashstyle = crosshairsOptions[i].dashStyle;
						}
						tooltip.crosshairs[i] = chart.renderer.path(path)
							.attr(attribs)
							.add();
					}
				}
			}
		}
		fireEvent(chart, 'tooltipRefresh', {
				text: text,
				x: x + chart.plotLeft,
				y: y + chart.plotTop,
				borderColor: borderColor
			});
	},

	
	tick: function () {
		if (this.tooltipTick) {
			this.tooltipTick();
		}
	}
};

function MouseTracker(chart, options) {
	var zoomType = useCanVG ? '' : options.chart.zoomType;


	this.zoomX = /x/.test(zoomType);
	this.zoomY = /y/.test(zoomType);


	this.options = options;


	this.chart = chart;
















	this.init(chart, options.tooltip);
}

MouseTracker.prototype = {
	
	normalizeMouseEvent: function (e) {
		var chartPosition,
			chartX,
			chartY,
			ePos;


		e = e || win.event;
		if (!e.target) {
			e.target = e.srcElement;
		}


		if (e.originalEvent) {
			e = e.originalEvent;
		}


		if (e.event) {
			e = e.event;
		}


		ePos = e.touches ? e.touches.item(0) : e;


		this.chartPosition = chartPosition = offset(this.chart.container);


		if (ePos.pageX === UNDEFINED) {
			chartX = e.x;
			chartY = e.y;
		} else {
			chartX = ePos.pageX - chartPosition.left;
			chartY = ePos.pageY - chartPosition.top;
		}

		return extend(e, {
			chartX: mathRound(chartX),
			chartY: mathRound(chartY)
		
		});
	},

	
	getMouseCoordinates: function (e) {
		var coordinates = {
				xAxis: [],
				yAxis: []
			},
			chart = this.chart;

		each(chart.axes, function (axis) {
			var isXAxis = axis.isXAxis,
				isHorizontal = chart.inverted ? !isXAxis : isXAxis;

			coordinates[isXAxis ? 'xAxis' : 'yAxis'].push({
				axis: axis,
				value: axis.translate(
					isHorizontal ?
						e.chartX - chart.plotLeft :
						chart.plotHeight - e.chartY + chart.plotTop,
					true
				)
			});
		});
		return coordinates;
	},

	
	onmousemove: function (e) {
		var mouseTracker = this,
			chart = mouseTracker.chart,
			series = chart.series,
			point,
			points,
			hoverPoint = chart.hoverPoint,
			hoverSeries = chart.hoverSeries,
			i,
			j,
			distance = chart.chartWidth,

			index = chart.inverted ? chart.plotHeight + chart.plotTop - e.chartY : e.chartX - chart.plotLeft;


		if (chart.tooltip && mouseTracker.options.tooltip.shared && !(hoverSeries && hoverSeries.noSharedTooltip)) {
			points = [];


			i = series.length;
			for (j = 0; j < i; j++) {
				if (series[j].visible &&
						series[j].options.enableMouseTracking !== false &&
						!series[j].noSharedTooltip && series[j].tooltipPoints.length) {
					point = series[j].tooltipPoints[index];
					point._dist = mathAbs(index - point.plotX);
					distance = mathMin(distance, point._dist);
					points.push(point);
				}
			}

			i = points.length;
			while (i--) {
				if (points[i]._dist > distance) {
					points.splice(i, 1);
				}
			}

			if (points.length && (points[0].plotX !== mouseTracker.hoverX)) {
				chart.tooltip.refresh(points, e);
				mouseTracker.hoverX = points[0].plotX;
			}
		}


		if (hoverSeries && hoverSeries.tracker) {


			point = hoverSeries.tooltipPoints[index];


			if (point && point !== hoverPoint) {


				point.onMouseOver();

			}
		}
	},



	
	resetTracker: function (allowMove) {
		var mouseTracker = this,
			chart = mouseTracker.chart,
			hoverSeries = chart.hoverSeries,
			hoverPoint = chart.hoverPoint,
			tooltipPoints = chart.hoverPoints || hoverPoint,
			tooltip = chart.tooltip;
			

		allowMove = allowMove && tooltip && tooltipPoints;
			

		if (allowMove && splat(tooltipPoints)[0].plotX === UNDEFINED) {
			allowMove = false;
		}	


		if (allowMove) {
			tooltip.refresh(tooltipPoints);


		} else {

			if (hoverPoint) {
				hoverPoint.onMouseOut();
			}

			if (hoverSeries) {
				hoverSeries.onMouseOut();
			}

			if (tooltip) {
				tooltip.hide();
				tooltip.hideCrosshairs();
			}

			mouseTracker.hoverX = null;

		}
	},

	
	setDOMEvents: function () {
		var lastWasOutsidePlot = true,
			mouseTracker = this,
			chart = mouseTracker.chart,
			container = chart.container,
			hasDragged,
			zoomHor = (mouseTracker.zoomX && !chart.inverted) || (mouseTracker.zoomY && chart.inverted),
			zoomVert = (mouseTracker.zoomY && !chart.inverted) || (mouseTracker.zoomX && chart.inverted);

		
		function drop() {
			if (mouseTracker.selectionMarker) {
				var selectionData = {
						xAxis: [],
						yAxis: []
					},
					selectionBox = mouseTracker.selectionMarker.getBBox(),
					selectionLeft = selectionBox.x - chart.plotLeft,
					selectionTop = selectionBox.y - chart.plotTop,
					runZoom;


				if (hasDragged) {


					each(chart.axes, function (axis) {
						if (axis.options.zoomEnabled !== false) {
							var isXAxis = axis.isXAxis,
								isHorizontal = chart.inverted ? !isXAxis : isXAxis,
								selectionMin = axis.translate(
									isHorizontal ?
										selectionLeft :
										chart.plotHeight - selectionTop - selectionBox.height,
									true,
									0,
									0,
									1
								),
								selectionMax = axis.translate(
									isHorizontal ?
										selectionLeft + selectionBox.width :
										chart.plotHeight - selectionTop,
									true,
									0,
									0,
									1
								);

								if (!isNaN(selectionMin) && !isNaN(selectionMax)) {
									selectionData[isXAxis ? 'xAxis' : 'yAxis'].push({
										axis: axis,
										min: mathMin(selectionMin, selectionMax),
										max: mathMax(selectionMin, selectionMax)
									});
									runZoom = true;
								}
						}
					});
					if (runZoom) {
						fireEvent(chart, 'selection', selectionData, function (args) { chart.zoom(args); });
					}

				}
				mouseTracker.selectionMarker = mouseTracker.selectionMarker.destroy();
			}

			if (chart) {
				css(container, { cursor: 'auto' });
				chart.cancelClick = hasDragged;
				chart.mouseIsDown = hasDragged = false;
			}

			removeEvent(doc, hasTouch ? 'touchend' : 'mouseup', drop);
		}

		
		mouseTracker.hideTooltipOnMouseMove = function (e) {


			washMouseEvent(e);


			if (mouseTracker.chartPosition && chart.hoverSeries && chart.hoverSeries.isCartesian &&
				!chart.isInsidePlot(e.pageX - mouseTracker.chartPosition.left - chart.plotLeft,
				e.pageY - mouseTracker.chartPosition.top - chart.plotTop)) {
					mouseTracker.resetTracker();
			}
		};

		
		mouseTracker.hideTooltipOnMouseLeave = function () {
			mouseTracker.resetTracker();
			mouseTracker.chartPosition = null;
		};


		
		container.onmousedown = function (e) {
			e = mouseTracker.normalizeMouseEvent(e);


			if (!hasTouch && e.preventDefault) {
				e.preventDefault();
			}


			chart.mouseIsDown = true;
			chart.cancelClick = false;
			chart.mouseDownX = mouseTracker.mouseDownX = e.chartX;
			mouseTracker.mouseDownY = e.chartY;

			addEvent(doc, hasTouch ? 'touchend' : 'mouseup', drop);
		};


		var mouseMove = function (e) {


			if (e && e.touches && e.touches.length > 1) {
				return;
			}


			e = mouseTracker.normalizeMouseEvent(e);
			if (!hasTouch) {
				e.returnValue = false;
			}

			var chartX = e.chartX,
				chartY = e.chartY,
				isOutsidePlot = !chart.isInsidePlot(chartX - chart.plotLeft, chartY - chart.plotTop);


			if (hasTouch && e.type === 'touchstart') {
				if (attr(e.target, 'isTracker')) {
					if (!chart.runTrackerClick) {
						e.preventDefault();
					}
				} else if (!chart.runChartClick && !isOutsidePlot) {
					e.preventDefault();
				}
			}


			if (isOutsidePlot) {

				



				if (chartX < chart.plotLeft) {
					chartX = chart.plotLeft;
				} else if (chartX > chart.plotLeft + chart.plotWidth) {
					chartX = chart.plotLeft + chart.plotWidth;
				}

				if (chartY < chart.plotTop) {
					chartY = chart.plotTop;
				} else if (chartY > chart.plotTop + chart.plotHeight) {
					chartY = chart.plotTop + chart.plotHeight;
				}
			}

			if (chart.mouseIsDown && e.type !== 'touchstart') {


				hasDragged = Math.sqrt(
					Math.pow(mouseTracker.mouseDownX - chartX, 2) +
					Math.pow(mouseTracker.mouseDownY - chartY, 2)
				);
				if (hasDragged > 10) {
					var clickedInside = chart.isInsidePlot(mouseTracker.mouseDownX - chart.plotLeft, mouseTracker.mouseDownY - chart.plotTop);


					if (chart.hasCartesianSeries && (mouseTracker.zoomX || mouseTracker.zoomY) && clickedInside) {
						if (!mouseTracker.selectionMarker) {
							mouseTracker.selectionMarker = chart.renderer.rect(
								chart.plotLeft,
								chart.plotTop,
								zoomHor ? 1 : chart.plotWidth,
								zoomVert ? 1 : chart.plotHeight,
								0
							)
							.attr({
								fill: mouseTracker.options.chart.selectionMarkerFill || 'rgba(69,114,167,0.25)',
								zIndex: 7
							})
							.add();
						}
					}


					if (mouseTracker.selectionMarker && zoomHor) {
						var xSize = chartX - mouseTracker.mouseDownX;
						mouseTracker.selectionMarker.attr({
							width: mathAbs(xSize),
							x: (xSize > 0 ? 0 : xSize) + mouseTracker.mouseDownX
						});
					}

					if (mouseTracker.selectionMarker && zoomVert) {
						var ySize = chartY - mouseTracker.mouseDownY;
						mouseTracker.selectionMarker.attr({
							height: mathAbs(ySize),
							y: (ySize > 0 ? 0 : ySize) + mouseTracker.mouseDownY
						});
					}


					if (clickedInside && !mouseTracker.selectionMarker && mouseTracker.options.chart.panning) {
						chart.pan(chartX);
					}
				}

			} else if (!isOutsidePlot) {

				mouseTracker.onmousemove(e);
			}

			lastWasOutsidePlot = isOutsidePlot;


			return isOutsidePlot || !chart.hasCartesianSeries;
		};

		
		container.onmousemove = mouseMove;

		
		addEvent(container, 'mouseleave', mouseTracker.hideTooltipOnMouseLeave);




		addEvent(doc, 'mousemove', mouseTracker.hideTooltipOnMouseMove);

		container.ontouchstart = function (e) {

			if (mouseTracker.zoomX || mouseTracker.zoomY) {
				container.onmousedown(e);
			}

			mouseMove(e);
		};

		
		container.ontouchmove = mouseMove;

		
		container.ontouchend = function () {
			if (hasDragged) {
				mouseTracker.resetTracker();
			}
		};



		container.onclick = function (e) {
			var hoverPoint = chart.hoverPoint, 
				plotX,
				plotY;
			e = mouseTracker.normalizeMouseEvent(e);

			e.cancelBubble = true;


			if (!chart.cancelClick) {

				if (hoverPoint && (attr(e.target, 'isTracker') || attr(e.target.parentNode, 'isTracker'))) {
					plotX = hoverPoint.plotX;
					plotY = hoverPoint.plotY;


					extend(hoverPoint, {
						pageX: mouseTracker.chartPosition.left + chart.plotLeft +
							(chart.inverted ? chart.plotWidth - plotY : plotX),
						pageY: mouseTracker.chartPosition.top + chart.plotTop +
							(chart.inverted ? chart.plotHeight - plotX : plotY)
					});


					fireEvent(hoverPoint.series, 'click', extend(e, {
						point: hoverPoint
					}));


					hoverPoint.firePointEvent('click', e);

				} else {
					extend(e, mouseTracker.getMouseCoordinates(e));


					if (chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) {
						fireEvent(chart, 'click', e);
					}
				}


			}
		};

	},

	
	destroy: function () {
		var mouseTracker = this,
			chart = mouseTracker.chart,
			container = chart.container;


		if (chart.trackerGroup) {
			chart.trackerGroup = chart.trackerGroup.destroy();
		}

		removeEvent(container, 'mouseleave', mouseTracker.hideTooltipOnMouseLeave);
		removeEvent(doc, 'mousemove', mouseTracker.hideTooltipOnMouseMove);
		container.onclick = container.onmousedown = container.onmousemove = container.ontouchstart = container.ontouchend = container.ontouchmove = null;


		clearInterval(this.tooltipInterval);
	},


	init: function (chart, options) {
		if (!chart.trackerGroup) {
			chart.trackerGroup = chart.renderer.g('tracker')
				.attr({ zIndex: 9 })
				.add();
		}

		if (options.enabled) {
			chart.tooltip = new Tooltip(chart, options);


			this.tooltipInterval = setInterval(function () { chart.tooltip.tick(); }, 32);
		}

		this.setDOMEvents();
	}
};

function Legend(chart) {

	this.init(chart);
}

Legend.prototype = {
	
	
	init: function (chart) {
		var legend = this,
			options = legend.options = chart.options.legend;
	
		if (!options.enabled) {
			return;
		}
	
		var
			itemStyle = options.itemStyle,
			padding = pick(options.padding, 8),
			itemMarginTop = options.itemMarginTop || 0;
	
		legend.baseline = pInt(itemStyle.fontSize) + 3 + itemMarginTop;
		legend.itemStyle = itemStyle;
		legend.itemHiddenStyle = merge(itemStyle, options.itemHiddenStyle);
		legend.itemMarginTop = itemMarginTop;
		legend.padding = padding;
		legend.initialItemX = padding;
		legend.initialItemY = padding - 5;
		legend.maxItemWidth = 0;
		legend.chart = chart;




		legend.itemHeight = 0;
		legend.lastLineHeight = 0;



	





		legend.render();


		addEvent(legend.chart, 'endResize', function () { legend.positionCheckboxes(); });


	},

	
	colorizeItem: function (item, visible) {
		var legend = this,
			options = legend.options,
			legendItem = item.legendItem,
			legendLine = item.legendLine,
			legendSymbol = item.legendSymbol,
			hiddenColor = legend.itemHiddenStyle.color,
			textColor = visible ? options.itemStyle.color : hiddenColor,
			symbolColor = visible ? item.color : hiddenColor;

		if (legendItem) {
			legendItem.css({ fill: textColor });
		}
		if (legendLine) {
			legendLine.attr({ stroke: symbolColor });
		}
		if (legendSymbol) {
			legendSymbol.attr({
				stroke: symbolColor,
				fill: symbolColor
			});
		}
	},

	
	positionItem: function (item) {
		var legend = this,
			options = legend.options,
			symbolPadding = options.symbolPadding,
			ltr = !options.rtl,
			legendItemPos = item._legendItemPos,
			itemX = legendItemPos[0],
			itemY = legendItemPos[1],
			checkbox = item.checkbox;

		if (item.legendGroup) {
			item.legendGroup.translate(
				ltr ? itemX : legend.legendWidth - itemX - 2 * symbolPadding - 4,
				itemY
			);
		}

		if (checkbox) {
			checkbox.x = itemX;
			checkbox.y = itemY;
		}
	},

	
	destroyItem: function (item) {
		var checkbox = item.checkbox;


		each(['legendItem', 'legendLine', 'legendSymbol', 'legendGroup'], function (key) {
			if (item[key]) {
				item[key].destroy();
			}
		});

		if (checkbox) {
			discardElement(item.checkbox);
		}
	},

	
	destroy: function () {
		var legend = this,
			legendGroup = legend.group,
			box = legend.box;

		if (box) {
			legend.box = box.destroy();
		}

		if (legendGroup) {
			legend.group = legendGroup.destroy();
		}
	},

	
	positionCheckboxes: function () {
		var legend = this;

		each(legend.allItems, function (item) {
			var checkbox = item.checkbox,
				alignAttr = legend.group.alignAttr;
			if (checkbox) {
				css(checkbox, {
					left: (alignAttr.translateX + item.legendItemWidth + checkbox.x - 20) + PX,
					top: (alignAttr.translateY + checkbox.y + 3) + PX
				});
			}
		});
	},

	
	renderItem: function (item) {
		var legend = this,
			chart = legend.chart,
			renderer = chart.renderer,
			options = legend.options,
			horizontal = options.layout === 'horizontal',
			symbolWidth = options.symbolWidth,
			symbolPadding = options.symbolPadding,
			itemStyle = legend.itemStyle,
			itemHiddenStyle = legend.itemHiddenStyle,
			padding = legend.padding,
			ltr = !options.rtl,
			itemHeight,
			widthOption = options.width,
			itemMarginBottom = options.itemMarginBottom || 0,
			itemMarginTop = legend.itemMarginTop,
			initialItemX = legend.initialItemX,
			bBox,
			itemWidth,
			li = item.legendItem,
			series = item.series || item,
			itemOptions = series.options,
			showCheckbox = itemOptions.showCheckbox;

		if (!li) {



			item.legendGroup = renderer.g('legend-item')
				.attr({ zIndex: 1 })
				.add(legend.scrollGroup);


			series.drawLegendSymbol(legend, item);


			item.legendItem = li = renderer.text(
					options.labelFormatter.call(item),
					ltr ? symbolWidth + symbolPadding : -symbolPadding,
					legend.baseline,
					options.useHTML
				)
				.css(merge(item.visible ? itemStyle : itemHiddenStyle))
				.attr({
					align: ltr ? 'left' : 'right',
					zIndex: 2
				})
				.add(item.legendGroup);


			item.legendGroup.on('mouseover', function () {
					item.setState(HOVER_STATE);
					li.css(legend.options.itemHoverStyle);
				})
				.on('mouseout', function () {
					li.css(item.visible ? itemStyle : itemHiddenStyle);
					item.setState();
				})
				.on('click', function (event) {
					var strLegendItemClick = 'legendItemClick',
						fnLegendItemClick = function () {
							item.setVisible();
						};
						

					event = {
						browserEvent: event
					};


					if (item.firePointEvent) {
						item.firePointEvent(strLegendItemClick, event, fnLegendItemClick);
					} else {
						fireEvent(item, strLegendItemClick, event, fnLegendItemClick);
					}
				});


			legend.colorizeItem(item, item.visible);


			if (itemOptions && showCheckbox) {
				item.checkbox = createElement('input', {
					type: 'checkbox',
					checked: item.selected,
					defaultChecked: item.selected
				}, options.itemCheckboxStyle, chart.container);

				addEvent(item.checkbox, 'click', function (event) {
					var target = event.target;
					fireEvent(item, 'checkboxClick', {
							checked: target.checked
						},
						function () {
							item.select();
						}
					);
				});
			}
		}


		bBox = li.getBBox();

		itemWidth = item.legendItemWidth =
			options.itemWidth || symbolWidth + symbolPadding + bBox.width + padding +
			(showCheckbox ? 20 : 0);
		legend.itemHeight = itemHeight = bBox.height;


		if (horizontal && legend.itemX - initialItemX + itemWidth >
				(widthOption || (chart.chartWidth - 2 * padding - initialItemX))) {
			legend.itemX = initialItemX;
			legend.itemY += itemMarginTop + legend.lastLineHeight + itemMarginBottom;
			legend.lastLineHeight = 0;
		}


		


		legend.maxItemWidth = mathMax(legend.maxItemWidth, itemWidth);
		legend.lastItemY = itemMarginTop + legend.itemY + itemMarginBottom;
		legend.lastLineHeight = mathMax(itemHeight, legend.lastLineHeight);


		item._legendItemPos = [legend.itemX, legend.itemY];


		if (horizontal) {
			legend.itemX += itemWidth;

		} else {
			legend.itemY += itemMarginTop + itemHeight + itemMarginBottom;
			legend.lastLineHeight = itemHeight;
		}


		legend.offsetWidth = widthOption || mathMax(
			horizontal ? legend.itemX - initialItemX : itemWidth,
			legend.offsetWidth
		);
	},

	
	render: function () {
		var legend = this,
			chart = legend.chart,
			renderer = chart.renderer,
			legendGroup = legend.group,
			allItems,
			display,
			legendWidth,
			legendHeight,
			box = legend.box,
			options = legend.options,
			padding = legend.padding,
			legendBorderWidth = options.borderWidth,
			legendBackgroundColor = options.backgroundColor;

		legend.itemX = legend.initialItemX;
		legend.itemY = legend.initialItemY;
		legend.offsetWidth = 0;
		legend.lastItemY = 0;

		if (!legendGroup) {
			legend.group = legendGroup = renderer.g('legend')



				.attr({ zIndex: 7 }) 
				.add();
			legend.contentGroup = renderer.g()
				.attr({ zIndex: 1 })
				.add(legendGroup);
			legend.scrollGroup = renderer.g()
				.add(legend.contentGroup);
			legend.clipRect = renderer.clipRect(0, 0, 9999, chart.chartHeight);
			legend.contentGroup.clip(legend.clipRect);
		}


		allItems = [];
		each(chart.series, function (serie) {
			var seriesOptions = serie.options;

			if (!seriesOptions.showInLegend) {
				return;
			}


			allItems = allItems.concat(
					serie.legendItems ||
					(seriesOptions.legendType === 'point' ?
							serie.data :
							serie)
			);
		});


		stableSort(allItems, function (a, b) {
			return (a.options.legendIndex || 0) - (b.options.legendIndex || 0);
		});


		if (options.reversed) {
			allItems.reverse();
		}

		legend.allItems = allItems;
		legend.display = display = !!allItems.length;


		each(allItems, function (item) {
			legend.renderItem(item); 
		});


		legendWidth = options.width || legend.offsetWidth;
		legendHeight = legend.lastItemY + legend.lastLineHeight;
		
		
		legendHeight = legend.handleOverflow(legendHeight);

		if (legendBorderWidth || legendBackgroundColor) {
			legendWidth += padding;
			legendHeight += padding;

			if (!box) {
				legend.box = box = renderer.rect(
					0,
					0,
					legendWidth,
					legendHeight,
					options.borderRadius,
					legendBorderWidth || 0
				).attr({
					stroke: options.borderColor,
					'stroke-width': legendBorderWidth || 0,
					fill: legendBackgroundColor || NONE
				})
				.add(legendGroup)
				.shadow(options.shadow);
				box.isNew = true;

			} else if (legendWidth > 0 && legendHeight > 0) {
				box[box.isNew ? 'attr' : 'animate'](
					box.crisp(null, null, null, legendWidth, legendHeight)
				);
				box.isNew = false;
			}


			box[display ? 'show' : 'hide']();
		}
		
		legend.legendWidth = legendWidth;
		legend.legendHeight = legendHeight;



		each(allItems, function (item) {
			legend.positionItem(item);
		});


		

		if (display) {
			legendGroup.align(extend({
				width: legendWidth,
				height: legendHeight
			}, options), true, chart.spacingBox);
		}

		if (!chart.isResizing) {
			this.positionCheckboxes();
		}
	},
	
	
	handleOverflow: function (legendHeight) {
		var legend = this,
			chart = this.chart,
			renderer = chart.renderer,
			pageCount,
			options = this.options,
			optionsY = options.y,
			alignTop = options.verticalAlign === 'top',
			spaceHeight = chart.spacingBox.height + (alignTop ? -optionsY : optionsY) - this.padding,
			maxHeight = options.maxHeight,
			clipHeight,
			clipRect = this.clipRect,
			navOptions = options.navigation,
			animation = pick(navOptions.animation, true),
			arrowSize = navOptions.arrowSize || 12,
			nav = this.nav;
			

		if (options.layout === 'horizontal') {
			spaceHeight /= 2;
		}
		if (maxHeight) {
			spaceHeight = mathMin(spaceHeight, maxHeight);
		}
		

		if (legendHeight > spaceHeight) {
			
			this.clipHeight = clipHeight = spaceHeight - 20;
			this.pageCount = pageCount = mathCeil(legendHeight / clipHeight);
			this.currentPage = pick(this.currentPage, 1);
			this.fullHeight = legendHeight;
			
			clipRect.attr({
				height: clipHeight
			});
			

			if (!nav) {
				this.nav = nav = renderer.g().attr({ zIndex: 1 }).add(this.group);
				this.up = renderer.symbol('triangle', 0, 0, arrowSize, arrowSize)
					.on('click', function () {
						legend.scroll(-1, animation);
					})
					.add(nav);
				this.pager = renderer.text('', 15, 10)
					.css(navOptions.style)
					.add(nav);
				this.down = renderer.symbol('triangle-down', 0, 0, arrowSize, arrowSize)
					.on('click', function () {
						legend.scroll(1, animation);
					})
					.add(nav);
			}
			

			legend.scroll(0);
			
			legendHeight = spaceHeight;
			
		} else if (nav) {
			clipRect.attr({
				height: chart.chartHeight
			});
			nav.hide();
			this.scrollGroup.attr({
				translateY: 1
			});
		}
		
		return legendHeight;
	},
	
	
	scroll: function (scrollBy, animation) {
		var pageCount = this.pageCount,
			currentPage = this.currentPage + scrollBy,
			clipHeight = this.clipHeight,
			navOptions = this.options.navigation,
			activeColor = navOptions.activeColor,
			inactiveColor = navOptions.inactiveColor,
			pager = this.pager,
			padding = this.padding;
		

		if (currentPage > pageCount) {
			currentPage = pageCount;
		}
		
		if (currentPage > 0) {
			
			if (animation !== UNDEFINED) {
				setAnimation(animation, this.chart);
			}
			
			this.nav.attr({
				translateX: padding,
				translateY: clipHeight + 7,
				visibility: VISIBLE
			});
			this.up.attr({
					fill: currentPage === 1 ? inactiveColor : activeColor
				})
				.css({
					cursor: currentPage === 1 ? 'default' : 'pointer'
				});
			pager.attr({
				text: currentPage + '/' + this.pageCount
			});
			this.down.attr({
					x: 18 + this.pager.getBBox().width,
					fill: currentPage === pageCount ? inactiveColor : activeColor
				})
				.css({
					cursor: currentPage === pageCount ? 'default' : 'pointer'
				});
			
			this.scrollGroup.animate({
				translateY: -mathMin(clipHeight * (currentPage - 1), this.fullHeight - clipHeight + padding) + 1
			});
			pager.attr({
				text: currentPage + '/' + pageCount
			});
			
			
			this.currentPage = currentPage;
		}
			
	}
	
};



function Chart(userOptions, callback) {

	var options,
		seriesOptions = userOptions.series;
	userOptions.series = null;
	options = merge(defaultOptions, userOptions);
	options.series = userOptions.series = seriesOptions;

	var optionsChart = options.chart,
		optionsMargin = optionsChart.margin,
		margin = isObject(optionsMargin) ?
			optionsMargin :
			[optionsMargin, optionsMargin, optionsMargin, optionsMargin];

	this.optionsMarginTop = pick(optionsChart.marginTop, margin[0]);
	this.optionsMarginRight = pick(optionsChart.marginRight, margin[1]);
	this.optionsMarginBottom = pick(optionsChart.marginBottom, margin[2]);
	this.optionsMarginLeft = pick(optionsChart.marginLeft, margin[3]);

	var chartEvents = optionsChart.events;

	this.runChartClick = chartEvents && !!chartEvents.click;
	this.callback = callback;
	this.isResizing = 0;
	this.options = options;



	this.axes = [];
	this.series = [];
	this.hasCartesianSeries = optionsChart.showAxes;






























	this.init(chartEvents);
}

Chart.prototype = {

	
	initSeries: function (options) {
		var chart = this,
			optionsChart = chart.options.chart,
			type = options.type || optionsChart.type || optionsChart.defaultSeriesType,
			series = new seriesTypes[type]();

		series.init(this, options);
		return series;
	},

	
	addSeries: function (options, redraw, animation) {
		var series,
			chart = this;

		if (options) {
			setAnimation(animation, chart);
			redraw = pick(redraw, true);

			fireEvent(chart, 'addSeries', { options: options }, function () {
				chart.initSeries(options);



				chart.isDirtyLegend = true;
				if (redraw) {
					chart.redraw();
				}
			});
		}

		return series;
	},

	
	isInsidePlot: function (x, y) {
		return x >= 0 &&
			x <= this.plotWidth &&
			y >= 0 &&
			y <= this.plotHeight;
	},

	
	adjustTickAmounts: function () {
		if (this.options.chart.alignTicks !== false) {
			each(this.axes, function (axis) {
				axis.adjustTickAmount();
			});
		}
		this.maxTicks = null;
	},

	
	redraw: function (animation) {
		var chart = this,
			axes = chart.axes,
			series = chart.series,
			tracker = chart.tracker,
			legend = chart.legend,
			redrawLegend = chart.isDirtyLegend,
			hasStackedSeries,
			isDirtyBox = chart.isDirtyBox,
			seriesLength = series.length,
			i = seriesLength,
			clipRect = chart.clipRect,
			serie,
			renderer = chart.renderer,
			isHiddenChart = renderer.isHidden();
			
		setAnimation(animation, chart);
		
		if (isHiddenChart) {
			chart.cloneRenderTo();
		}


		while (i--) {
			serie = series[i];
			if (serie.isDirty && serie.options.stacking) {
				hasStackedSeries = true;
				break;
			}
		}
		if (hasStackedSeries) {
			i = seriesLength;
			while (i--) {
				serie = series[i];
				if (serie.options.stacking) {
					serie.isDirty = true;
				}
			}
		}


		each(series, function (serie) {
			if (serie.isDirty) {
				if (serie.options.legendType === 'point') {
					redrawLegend = true;
				}
			}
		});


		if (redrawLegend && legend.options.enabled) {

			legend.render();

			chart.isDirtyLegend = false;
		}


		if (chart.hasCartesianSeries) {
			if (!chart.isResizing) {


				chart.maxTicks = null;


				each(axes, function (axis) {
					axis.setScale();
				});
			}
			chart.adjustTickAmounts();
			chart.getMargins();


			each(axes, function (axis) {
				

				if (axis.isDirtyExtremes) {
					axis.isDirtyExtremes = false;
					fireEvent(axis, 'afterSetExtremes', axis.getExtremes());
				}
								
				if (axis.isDirty || isDirtyBox || hasStackedSeries) {
					axis.redraw();
					isDirtyBox = true;
				}
			});


		}


		if (isDirtyBox) {
			chart.drawChartBox();


			if (clipRect) {
				stop(clipRect);
				clipRect.animate({
					width: chart.plotSizeX,
					height: chart.plotSizeY + 1
				});
			}

		}



		each(series, function (serie) {
			if (serie.isDirty && serie.visible &&
					(!serie.isCartesian || serie.xAxis)) {
				serie.redraw();
			}
		});



		if (tracker && tracker.resetTracker) {
			tracker.resetTracker(true);
		}


		renderer.draw();


		fireEvent(chart, 'redraw');
		
		if (isHiddenChart) {
			chart.cloneRenderTo(true);
		}
	},



	
	showLoading: function (str) {
		var chart = this,
			options = chart.options,
			loadingDiv = chart.loadingDiv;

		var loadingOptions = options.loading;


		if (!loadingDiv) {
			chart.loadingDiv = loadingDiv = createElement(DIV, {
				className: PREFIX + 'loading'
			}, extend(loadingOptions.style, {
				left: chart.plotLeft + PX,
				top: chart.plotTop + PX,
				width: chart.plotWidth + PX,
				height: chart.plotHeight + PX,
				zIndex: 10,
				display: NONE
			}), chart.container);

			chart.loadingSpan = createElement(
				'span',
				null,
				loadingOptions.labelStyle,
				loadingDiv
			);

		}


		chart.loadingSpan.innerHTML = str || options.lang.loading;


		if (!chart.loadingShown) {
			css(loadingDiv, { opacity: 0, display: '' });
			animate(loadingDiv, {
				opacity: loadingOptions.style.opacity
			}, {
				duration: loadingOptions.showDuration || 0
			});
			chart.loadingShown = true;
		}
	},

	
	hideLoading: function () {
		var options = this.options,
			loadingDiv = this.loadingDiv;

		if (loadingDiv) {
			animate(loadingDiv, {
				opacity: 0
			}, {
				duration: options.loading.hideDuration || 100,
				complete: function () {
					css(loadingDiv, { display: NONE });
				}
			});
		}
		this.loadingShown = false;
	},

	
	get: function (id) {
		var chart = this,
			axes = chart.axes,
			series = chart.series;

		var i,
			j,
			points;


		for (i = 0; i < axes.length; i++) {
			if (axes[i].options.id === id) {
				return axes[i];
			}
		}


		for (i = 0; i < series.length; i++) {
			if (series[i].options.id === id) {
				return series[i];
			}
		}


		for (i = 0; i < series.length; i++) {
			points = series[i].points || [];
			for (j = 0; j < points.length; j++) {
				if (points[j].id === id) {
					return points[j];
				}
			}
		}
		return null;
	},

	
	getAxes: function () {
		var chart = this,
			options = this.options;

		var xAxisOptions = options.xAxis || {},
			yAxisOptions = options.yAxis || {},
			optionsArray,
			axis;


		xAxisOptions = splat(xAxisOptions);
		each(xAxisOptions, function (axis, i) {
			axis.index = i;
			axis.isX = true;
		});

		yAxisOptions = splat(yAxisOptions);
		each(yAxisOptions, function (axis, i) {
			axis.index = i;
		});


		optionsArray = xAxisOptions.concat(yAxisOptions);

		each(optionsArray, function (axisOptions) {
			axis = new Axis(chart, axisOptions);
		});

		chart.adjustTickAmounts();
	},


	
	getSelectedPoints: function () {
		var points = [];
		each(this.series, function (serie) {
			points = points.concat(grep(serie.points, function (point) {
				return point.selected;
			}));
		});
		return points;
	},

	
	getSelectedSeries: function () {
		return grep(this.series, function (serie) {
			return serie.selected;
		});
	},

	
	showResetZoom: function () {
		var chart = this,
			lang = defaultOptions.lang,
			btnOptions = chart.options.chart.resetZoomButton,
			theme = btnOptions.theme,
			states = theme.states,
			box = btnOptions.relativeTo === 'chart' ? null : {
				x: chart.plotLeft,
				y: chart.plotTop,
				width: chart.plotWidth,
				height: chart.plotHeight
			};
		this.resetZoomButton = chart.renderer.button(lang.resetZoom, null, null, function () { chart.zoomOut(); }, theme, states && states.hover)
			.attr({
				align: btnOptions.position.align,
				title: lang.resetZoomTitle
			})
			.add()
			.align(btnOptions.position, false, box);
	},

	
	zoomOut: function () {
		var chart = this,
			resetZoomButton = chart.resetZoomButton;

		fireEvent(chart, 'selection', { resetSelection: true }, function () { chart.zoom(); });
		if (resetZoomButton) {
			chart.resetZoomButton = resetZoomButton.destroy();
		}
	},

	
	zoom: function (event) {
		var chart = this,
			optionsChart = chart.options.chart;


		var hasZoomed;

		if (chart.resetZoomEnabled !== false && !chart.resetZoomButton) {
			chart.showResetZoom();
		}


		if (!event || event.resetSelection) {
			each(chart.axes, function (axis) {
				if (axis.options.zoomEnabled !== false) {
					axis.setExtremes(null, null, false);
					hasZoomed = true;
				}
			});
		} else {
			each(event.xAxis.concat(event.yAxis), function (axisData) {
				var axis = axisData.axis;


				if (chart.tracker[axis.isXAxis ? 'zoomX' : 'zoomY']) {
					axis.setExtremes(axisData.min, axisData.max, false);
					hasZoomed = true;
				}
			});
		}


		if (hasZoomed) {
			chart.redraw(
				pick(optionsChart.animation, chart.pointCount < 100)
			);
		}
	},

	
	pan: function (chartX) {
		var chart = this;

		var xAxis = chart.xAxis[0],
			mouseDownX = chart.mouseDownX,
			halfPointRange = xAxis.pointRange / 2,
			extremes = xAxis.getExtremes(),
			newMin = xAxis.translate(mouseDownX - chartX, true) + halfPointRange,
			newMax = xAxis.translate(mouseDownX + chart.plotWidth - chartX, true) - halfPointRange,
			hoverPoints = chart.hoverPoints;


		if (hoverPoints) {
			each(hoverPoints, function (point) {
				point.setState();
			});
		}

		if (xAxis.series.length && newMin > mathMin(extremes.dataMin, extremes.min) && newMax < mathMax(extremes.dataMax, extremes.max)) {
			xAxis.setExtremes(newMin, newMax, true, false);
		}

		chart.mouseDownX = chartX;
		css(chart.container, { cursor: 'move' });
	},

	
	setTitle: function (titleOptions, subtitleOptions) {
		var chart = this,
			options = chart.options,
			chartTitleOptions,
			chartSubtitleOptions;

		chart.chartTitleOptions = chartTitleOptions = merge(options.title, titleOptions);
		chart.chartSubtitleOptions = chartSubtitleOptions = merge(options.subtitle, subtitleOptions);


		each([
			['title', titleOptions, chartTitleOptions],
			['subtitle', subtitleOptions, chartSubtitleOptions]
		], function (arr) {
			var name = arr[0],
				title = chart[name],
				titleOptions = arr[1],
				chartTitleOptions = arr[2];

			if (title && titleOptions) {
				title = title.destroy();
			}
			if (chartTitleOptions && chartTitleOptions.text && !title) {
				chart[name] = chart.renderer.text(
					chartTitleOptions.text,
					0,
					0,
					chartTitleOptions.useHTML
				)
				.attr({
					align: chartTitleOptions.align,
					'class': PREFIX + name,
					zIndex: chartTitleOptions.zIndex || 4
				})
				.css(chartTitleOptions.style)
				.add()
				.align(chartTitleOptions, false, chart.spacingBox);
			}
		});

	},

	
	getChartSize: function () {
		var chart = this,
			optionsChart = chart.options.chart,
			renderTo = chart.renderToClone || chart.renderTo;


		chart.containerWidth = adapterRun(renderTo, 'width');
		chart.containerHeight = adapterRun(renderTo, 'height');
		
		chart.chartWidth = optionsChart.width || chart.containerWidth || 600;
		chart.chartHeight = optionsChart.height ||

			(chart.containerHeight > 19 ? chart.containerHeight : 400);
	},

	
	cloneRenderTo: function (revert) {
		var clone = this.renderToClone,
			container = this.container;
		

		if (revert) {
			if (clone) {
				this.renderTo.appendChild(container);
				discardElement(clone);
				delete this.renderToClone;
			}
		

		} else {
			if (container) {
				this.renderTo.removeChild(container);
			}
			this.renderToClone = clone = this.renderTo.cloneNode(0);
			css(clone, {
				position: ABSOLUTE,
				top: '-9999px',
				display: 'block'
			});
			doc.body.appendChild(clone);
			if (container) {
				clone.appendChild(container);
			}
		}
	},

	
	getContainer: function () {
		var chart = this,
			container,
			optionsChart = chart.options.chart,
			chartWidth,
			chartHeight,
			renderTo,
			containerId;

		chart.renderTo = renderTo = optionsChart.renderTo;
		containerId = PREFIX + idCounter++;

		if (isString(renderTo)) {
			chart.renderTo = renderTo = doc.getElementById(renderTo);
		}
		

		if (!renderTo) {
			error(13, true);
		}


		renderTo.innerHTML = '';





		if (!renderTo.offsetWidth) {
			chart.cloneRenderTo();
		}


		chart.getChartSize();
		chartWidth = chart.chartWidth;
		chartHeight = chart.chartHeight;


		chart.container = container = createElement(DIV, {
				className: PREFIX + 'container' +
					(optionsChart.className ? ' ' + optionsChart.className : ''),
				id: containerId
			}, extend({
				position: RELATIVE,
				overflow: HIDDEN,

				width: chartWidth + PX,
				height: chartHeight + PX,
				textAlign: 'left',
				lineHeight: 'normal'
			}, optionsChart.style),
			chart.renderToClone || renderTo
		);

		chart.renderer =
			optionsChart.forExport ?
				new SVGRenderer(container, chartWidth, chartHeight, true) :
				new Renderer(container, chartWidth, chartHeight);

		if (useCanVG) {


			chart.renderer.create(chart, container, chartWidth, chartHeight);
		}
	},

	
	getMargins: function () {
		var chart = this,
			optionsChart = chart.options.chart,
			spacingTop = optionsChart.spacingTop,
			spacingRight = optionsChart.spacingRight,
			spacingBottom = optionsChart.spacingBottom,
			spacingLeft = optionsChart.spacingLeft,
			axisOffset,
			legend = chart.legend,
			optionsMarginTop = chart.optionsMarginTop,
			optionsMarginLeft = chart.optionsMarginLeft,
			optionsMarginRight = chart.optionsMarginRight,
			optionsMarginBottom = chart.optionsMarginBottom,
			chartTitleOptions = chart.chartTitleOptions,
			chartSubtitleOptions = chart.chartSubtitleOptions,
			legendOptions = chart.options.legend,
			legendMargin = pick(legendOptions.margin, 10),
			legendX = legendOptions.x,
			legendY = legendOptions.y,
			align = legendOptions.align,
			verticalAlign = legendOptions.verticalAlign,
			titleOffset;

		chart.resetMargins();
		axisOffset = chart.axisOffset;


		if ((chart.title || chart.subtitle) && !defined(chart.optionsMarginTop)) {
			titleOffset = mathMax(
				(chart.title && !chartTitleOptions.floating && !chartTitleOptions.verticalAlign && chartTitleOptions.y) || 0,
				(chart.subtitle && !chartSubtitleOptions.floating && !chartSubtitleOptions.verticalAlign && chartSubtitleOptions.y) || 0
			);
			if (titleOffset) {
				chart.plotTop = mathMax(chart.plotTop, titleOffset + pick(chartTitleOptions.margin, 15) + spacingTop);
			}
		}

		if (legend.display && !legendOptions.floating) {
			if (align === 'right') {
				if (!defined(optionsMarginRight)) {
					chart.marginRight = mathMax(
						chart.marginRight,
						legend.legendWidth - legendX + legendMargin + spacingRight
					);
				}
			} else if (align === 'left') {
				if (!defined(optionsMarginLeft)) {
					chart.plotLeft = mathMax(
						chart.plotLeft,
						legend.legendWidth + legendX + legendMargin + spacingLeft
					);
				}

			} else if (verticalAlign === 'top') {
				if (!defined(optionsMarginTop)) {
					chart.plotTop = mathMax(
						chart.plotTop,
						legend.legendHeight + legendY + legendMargin + spacingTop
					);
				}

			} else if (verticalAlign === 'bottom') {
				if (!defined(optionsMarginBottom)) {
					chart.marginBottom = mathMax(
						chart.marginBottom,
						legend.legendHeight - legendY + legendMargin + spacingBottom
					);
				}
			}
		}


		if (chart.extraBottomMargin) {
			chart.marginBottom += chart.extraBottomMargin;
		}
		if (chart.extraTopMargin) {
			chart.plotTop += chart.extraTopMargin;
		}


		if (chart.hasCartesianSeries) {
			each(chart.axes, function (axis) {
				axis.getOffset();
			});
		}
		
		if (!defined(optionsMarginLeft)) {
			chart.plotLeft += axisOffset[3];
		}
		if (!defined(optionsMarginTop)) {
			chart.plotTop += axisOffset[0];
		}
		if (!defined(optionsMarginBottom)) {
			chart.marginBottom += axisOffset[2];
		}
		if (!defined(optionsMarginRight)) {
			chart.marginRight += axisOffset[1];
		}

		chart.setChartSize();

	},

	
	initReflow: function () {
		var chart = this,
			optionsChart = chart.options.chart,
			renderTo = chart.renderTo;

		var reflowTimeout;
		function reflow(e) {
			var width = optionsChart.width || adapterRun(renderTo, 'width'),
				height = optionsChart.height || adapterRun(renderTo, 'height'),
				target = e ? e.target : win;
				


			if (width && height && (target === win || target === doc)) {
				
				if (width !== chart.containerWidth || height !== chart.containerHeight) {
					clearTimeout(reflowTimeout);
					reflowTimeout = setTimeout(function () {
						chart.resize(width, height, false);
					}, 100);
				}
				chart.containerWidth = width;
				chart.containerHeight = height;
			}
		}
		addEvent(win, 'resize', reflow);
		addEvent(chart, 'destroy', function () {
			removeEvent(win, 'resize', reflow);
		});
	},

	
	fireEndResize: function () {
		var chart = this;

		if (chart) {
			fireEvent(chart, 'endResize', null, function () {
				chart.isResizing -= 1;
			});
		}
	},

	

	resize: function (width, height, animation) {
		var chart = this,
			chartWidth,
			chartHeight,
			spacingBox,
			chartTitle = chart.title,
			chartSubtitle = chart.subtitle;

		chart.isResizing += 1;


		setAnimation(animation, chart);

		chart.oldChartHeight = chart.chartHeight;
		chart.oldChartWidth = chart.chartWidth;
		if (defined(width)) {
			chart.chartWidth = chartWidth = mathRound(width);
		}
		if (defined(height)) {
			chart.chartHeight = chartHeight = mathRound(height);
		}

		css(chart.container, {
			width: chartWidth + PX,
			height: chartHeight + PX
		});
		chart.renderer.setSize(chartWidth, chartHeight, animation);


		chart.plotWidth = chartWidth - chart.plotLeft - chart.marginRight;
		chart.plotHeight = chartHeight - chart.plotTop - chart.marginBottom;


		chart.maxTicks = null;
		each(chart.axes, function (axis) {
			axis.isDirty = true;
			axis.setScale();
		});


		each(chart.series, function (serie) {
			serie.isDirty = true;
		});

		chart.isDirtyLegend = true;
		chart.isDirtyBox = true;

		chart.getMargins();


		spacingBox = chart.spacingBox;
		if (chartTitle) {
			chartTitle.align(null, null, spacingBox);
		}
		if (chartSubtitle) {
			chartSubtitle.align(null, null, spacingBox);
		}

		chart.redraw(animation);


		chart.oldChartHeight = null;
		fireEvent(chart, 'resize');



		if (globalAnimation === false) {
			chart.fireEndResize();
		} else {
			setTimeout(chart.fireEndResize, (globalAnimation && globalAnimation.duration) || 500);
		}
	},

	
	setChartSize: function () {
		var chart = this,
			inverted = chart.inverted,
			chartWidth = chart.chartWidth,
			chartHeight = chart.chartHeight,
			optionsChart = chart.options.chart,
			spacingTop = optionsChart.spacingTop,
			spacingRight = optionsChart.spacingRight,
			spacingBottom = optionsChart.spacingBottom,
			spacingLeft = optionsChart.spacingLeft;

		chart.plotLeft = mathRound(chart.plotLeft);
		chart.plotTop = mathRound(chart.plotTop);
		chart.plotWidth = mathRound(chartWidth - chart.plotLeft - chart.marginRight);
		chart.plotHeight = mathRound(chartHeight - chart.plotTop - chart.marginBottom);

		chart.plotSizeX = inverted ? chart.plotHeight : chart.plotWidth;
		chart.plotSizeY = inverted ? chart.plotWidth : chart.plotHeight;

		chart.spacingBox = {
			x: spacingLeft,
			y: spacingTop,
			width: chartWidth - spacingLeft - spacingRight,
			height: chartHeight - spacingTop - spacingBottom
		};

		each(chart.axes, function (axis) {
			axis.setAxisSize();
			axis.setAxisTranslation();
		});
	},

	
	resetMargins: function () {
		var chart = this,
			optionsChart = chart.options.chart,
			spacingTop = optionsChart.spacingTop,
			spacingRight = optionsChart.spacingRight,
			spacingBottom = optionsChart.spacingBottom,
			spacingLeft = optionsChart.spacingLeft;

		chart.plotTop = pick(chart.optionsMarginTop, spacingTop);
		chart.marginRight = pick(chart.optionsMarginRight, spacingRight);
		chart.marginBottom = pick(chart.optionsMarginBottom, spacingBottom);
		chart.plotLeft = pick(chart.optionsMarginLeft, spacingLeft);
		chart.axisOffset = [0, 0, 0, 0];
	},

	
	drawChartBox: function () {
		var chart = this,
			optionsChart = chart.options.chart,
			renderer = chart.renderer,
			chartWidth = chart.chartWidth,
			chartHeight = chart.chartHeight,
			chartBackground = chart.chartBackground,
			plotBackground = chart.plotBackground,
			plotBorder = chart.plotBorder,
			plotBGImage = chart.plotBGImage,
			chartBorderWidth = optionsChart.borderWidth || 0,
			chartBackgroundColor = optionsChart.backgroundColor,
			plotBackgroundColor = optionsChart.plotBackgroundColor,
			plotBackgroundImage = optionsChart.plotBackgroundImage,
			mgn,
			bgAttr,
			plotSize = {
				x: chart.plotLeft,
				y: chart.plotTop,
				width: chart.plotWidth,
				height: chart.plotHeight
			};


		mgn = chartBorderWidth + (optionsChart.shadow ? 8 : 0);

		if (chartBorderWidth || chartBackgroundColor) {
			if (!chartBackground) {
				
				bgAttr = {
					fill: chartBackgroundColor || NONE
				};
				if (chartBorderWidth) {
					bgAttr.stroke = optionsChart.borderColor;
					bgAttr['stroke-width'] = chartBorderWidth;
				}
				chart.chartBackground = renderer.rect(mgn / 2, mgn / 2, chartWidth - mgn, chartHeight - mgn,
						optionsChart.borderRadius, chartBorderWidth)
					.attr(bgAttr)
					.add()
					.shadow(optionsChart.shadow);
			} else {
				chartBackground.animate(
					chartBackground.crisp(null, null, null, chartWidth - mgn, chartHeight - mgn)
				);
			}
		}



		if (plotBackgroundColor) {
			if (!plotBackground) {
				chart.plotBackground = renderer.rect(chart.plotLeft, chart.plotTop, chart.plotWidth, chart.plotHeight, 0)
					.attr({
						fill: plotBackgroundColor
					})
					.add()
					.shadow(optionsChart.plotShadow);
			} else {
				plotBackground.animate(plotSize);
			}
		}
		if (plotBackgroundImage) {
			if (!plotBGImage) {
				chart.plotBGImage = renderer.image(plotBackgroundImage, chart.plotLeft, chart.plotTop, chart.plotWidth, chart.plotHeight)
					.add();
			} else {
				plotBGImage.animate(plotSize);
			}
		}


		if (optionsChart.plotBorderWidth) {
			if (!plotBorder) {
				chart.plotBorder = renderer.rect(chart.plotLeft, chart.plotTop, chart.plotWidth, chart.plotHeight, 0, optionsChart.plotBorderWidth)
					.attr({
						stroke: optionsChart.plotBorderColor,
						'stroke-width': optionsChart.plotBorderWidth,
						zIndex: 4
					})
					.add();
			} else {
				plotBorder.animate(
					plotBorder.crisp(null, chart.plotLeft, chart.plotTop, chart.plotWidth, chart.plotHeight)
				);
			}
		}


		chart.isDirtyBox = false;
	},

	
	propFromSeries: function () {
		var chart = this,
			optionsChart = chart.options.chart,
			klass,
			seriesOptions = chart.options.series,
			i,
			value;
			
			
		each(['inverted', 'angular', 'polar'], function (key) {
			

			klass = seriesTypes[optionsChart.type || optionsChart.defaultSeriesType];
			

			value = (
				chart[key] ||
				optionsChart[key] ||
				(klass && klass.prototype[key])
			);
	

			i = seriesOptions && seriesOptions.length;
			while (!value && i--) {
				klass = seriesTypes[seriesOptions[i].type];
				if (klass && klass.prototype[key]) {
					value = true;
				}
			}
	

			chart[key] = value;	
		});
		
	},

	
	render: function () {
		var chart = this,
			axes = chart.axes,
			renderer = chart.renderer,
			options = chart.options;

		var labels = options.labels,
			credits = options.credits,
			creditsHref;


		chart.setTitle();



		chart.legend = new Legend(chart);



		each(axes, function (axis) {
			axis.setScale();
		});
		chart.getMargins();

		chart.maxTicks = null;
		each(axes, function (axis) {
			axis.setTickPositions(true);
			axis.setMaxTicks();
		});
		chart.adjustTickAmounts();
		chart.getMargins();



		chart.drawChartBox();		



		if (chart.hasCartesianSeries) {
			each(axes, function (axis) {
				axis.render();
			});
		}


		if (!chart.seriesGroup) {
			chart.seriesGroup = renderer.g('series-group')
				.attr({ zIndex: 3 })
				.add();
		}
		each(chart.series, function (serie) {
			serie.translate();
			serie.setTooltipPoints();
			serie.render();
		});


		if (labels.items) {
			each(labels.items, function () {
				var style = extend(labels.style, this.style),
					x = pInt(style.left) + chart.plotLeft,
					y = pInt(style.top) + chart.plotTop + 12;


				delete style.left;
				delete style.top;

				renderer.text(
					this.html,
					x,
					y
				)
				.attr({ zIndex: 2 })
				.css(style)
				.add();

			});
		}


		if (credits.enabled && !chart.credits) {
			creditsHref = credits.href;
			chart.credits = renderer.text(
				credits.text,
				0,
				0
			)
			.on('click', function () {
				if (creditsHref) {
					location.href = creditsHref;
				}
			})
			.attr({
				align: credits.position.align,
				zIndex: 8
			})
			.css(credits.style)
			.add()
			.align(credits.position);
		}


		chart.hasRendered = true;

	},

	
	destroy: function () {
		var chart = this,
			axes = chart.axes,
			series = chart.series,
			container = chart.container;

		var i,
			parentNode = container && container.parentNode;




		if (chart === null) {
			return;
		}


		fireEvent(chart, 'destroy');


		removeEvent(chart);



		i = axes.length;
		while (i--) {
			axes[i] = axes[i].destroy();
		}


		i = series.length;
		while (i--) {
			series[i] = series[i].destroy();
		}


		each(['title', 'subtitle', 'chartBackground', 'plotBackground', 'plotBGImage', 'plotBorder', 'seriesGroup', 'clipRect', 'credits', 'tracker', 'scroller', 'rangeSelector', 'legend', 'resetZoomButton', 'tooltip', 'renderer'], function (name) {
			var prop = chart[name];

			if (prop) {
				chart[name] = prop.destroy();
			}
		});


		if (container) {
			container.innerHTML = '';
			removeEvent(container);
			if (parentNode) {
				discardElement(container);
			}


			container = null;
		}


		for (i in chart) {
			delete chart[i];
		}

		chart.options = null;
		chart = null;
	},

	
	firstRender: function () {
		var chart = this,
			options = chart.options,
			callback = chart.callback;



		var ONREADYSTATECHANGE = 'onreadystatechange',
		COMPLETE = 'complete';

		
		if ((!hasSVG && (win == win.top && doc.readyState !== COMPLETE)) || (useCanVG && !win.canvg)) {
		
			if (useCanVG) {

				CanVGController.push(function () { chart.firstRender(); }, options.global.canvasToolsURL);
			} else {
				doc.attachEvent(ONREADYSTATECHANGE, function () {
					doc.detachEvent(ONREADYSTATECHANGE, chart.firstRender);
					if (doc.readyState === COMPLETE) {
						chart.firstRender();
					}
				});
			}
			return;
		}


		chart.getContainer();


		fireEvent(chart, 'init');


		if (Highcharts.RangeSelector && options.rangeSelector.enabled) {
			chart.rangeSelector = new Highcharts.RangeSelector(chart);
		}

		chart.resetMargins();
		chart.setChartSize();


		chart.propFromSeries();


		chart.getAxes();


		each(options.series || [], function (serieOptions) {
			chart.initSeries(serieOptions);
		});





		if (Highcharts.Scroller && (options.navigator.enabled || options.scrollbar.enabled)) {
			chart.scroller = new Highcharts.Scroller(chart);
		}


		chart.tracker = new MouseTracker(chart, options);

		chart.render();


		chart.renderer.draw();

		if (callback) {
			callback.apply(chart, [chart]);
		}
		each(chart.callbacks, function (fn) {
			fn.apply(chart, [chart]);
		});
		
		

		chart.cloneRenderTo(true);

		fireEvent(chart, 'load');

	},

	init: function (chartEvents) {
		var chart = this,
			optionsChart = chart.options.chart,
			eventType;




		if (optionsChart.reflow !== false) {
			addEvent(chart, 'load', chart.initReflow);
		}


		if (chartEvents) {
			for (eventType in chartEvents) {
				addEvent(chart, eventType, chartEvents[eventType]);
			}
		}

		chart.xAxis = [];
		chart.yAxis = [];


		chart.animation = useCanVG ? false : pick(optionsChart.animation, true);
		chart.setSize = chart.resize;
		chart.pointCount = 0;
		chart.counters = new ChartCounters();
		

		chart.firstRender();
	}
};


Chart.prototype.callbacks = [];

var Point = function () {};
Point.prototype = {

	
	init: function (series, options, x) {
		var point = this,
			counters = series.chart.counters,
			defaultColors;
		point.series = series;
		point.applyOptions(options, x);
		point.pointAttr = {};

		if (series.options.colorByPoint) {
			defaultColors = series.chart.options.colors;
			if (!point.options) {
				point.options = {};
			}
			point.color = point.options.color = point.color || defaultColors[counters.color++];


			counters.wrapColor(defaultColors.length);
		}

		series.chart.pointCount++;
		return point;
	},
	
	applyOptions: function (options, x) {
		var point = this,
			series = point.series,
			optionsType = typeof options;

		point.config = options;


		if (optionsType === 'number' || options === null) {
			point.y = options;
		} else if (typeof options[0] === 'number') {
			point.x = options[0];
			point.y = options[1];
		} else if (optionsType === 'object' && typeof options.length !== 'number') {

			extend(point, options);
			point.options = options;
			


			if (options.dataLabels) {
				series._hasPointLabels = true;
			}
		} else if (typeof options[0] === 'string') {
			point.name = options[0];
			point.y = options[1];
		}
		
		

		if (point.x === UNDEFINED) {
			point.x = x === UNDEFINED ? series.autoIncrement() : x;
		}
		
		

	},

	
	destroy: function () {
		var point = this,
			series = point.series,
			chart = series.chart,
			hoverPoints = chart.hoverPoints,
			prop;

		chart.pointCount--;

		if (hoverPoints) {
			point.setState();
			erase(hoverPoints, point);
			if (!hoverPoints.length) {
				chart.hoverPoints = null;
			}

		}
		if (point === chart.hoverPoint) {
			point.onMouseOut();
		}
		

		if (point.graphic || point.dataLabel) {
			removeEvent(point);
			point.destroyElements();
		}

		if (point.legendItem) {
			chart.legend.destroyItem(point);
		}

		for (prop in point) {
			point[prop] = null;
		}


	},

	
	destroyElements: function () {
		var point = this,
			props = ['graphic', 'tracker', 'dataLabel', 'group', 'connector', 'shadowGroup'],
			prop,
			i = 6;
		while (i--) {
			prop = props[i];
			if (point[prop]) {
				point[prop] = point[prop].destroy();
			}
		}
	},

	
	getLabelConfig: function () {
		var point = this;
		return {
			x: point.category,
			y: point.y,
			key: point.name || point.category,
			series: point.series,
			point: point,
			percentage: point.percentage,
			total: point.total || point.stackTotal
		};
	},

	
	select: function (selected, accumulate) {
		var point = this,
			series = point.series,
			chart = series.chart;

		selected = pick(selected, !point.selected);


		point.firePointEvent(selected ? 'select' : 'unselect', { accumulate: accumulate }, function () {
			point.selected = selected;
			point.setState(selected && SELECT_STATE);


			if (!accumulate) {
				each(chart.getSelectedPoints(), function (loopPoint) {
					if (loopPoint.selected && loopPoint !== point) {
						loopPoint.selected = false;
						loopPoint.setState(NORMAL_STATE);
						loopPoint.firePointEvent('unselect');
					}
				});
			}
		});
	},

	onMouseOver: function () {
		var point = this,
			series = point.series,
			chart = series.chart,
			tooltip = chart.tooltip,
			hoverPoint = chart.hoverPoint;


		if (hoverPoint && hoverPoint !== point) {
			hoverPoint.onMouseOut();
		}


		point.firePointEvent('mouseOver');


		if (tooltip && (!tooltip.shared || series.noSharedTooltip)) {
			tooltip.refresh(point);
		}


		point.setState(HOVER_STATE);
		chart.hoverPoint = point;
	},

	onMouseOut: function () {
		var point = this;
		point.firePointEvent('mouseOut');

		point.setState();
		point.series.chart.hoverPoint = null;
	},

	
	tooltipFormatter: function (pointFormat) {
		var point = this,
			series = point.series,
			seriesTooltipOptions = series.tooltipOptions,
			match = pointFormat.match(/\{(series|point)\.[a-zA-Z]+\}/g),
			splitter = /[{\.}]/,
			obj,
			key,
			replacement,
			repOptionKey,
			parts,
			prop,
			i,
			cfg = {
				y: 0,
				open: 0,
				high: 0,
				low: 0,
				close: 0,
				percentage: 1,
				total: 1
			};
		

		seriesTooltipOptions.valuePrefix = seriesTooltipOptions.valuePrefix || seriesTooltipOptions.yPrefix;
		seriesTooltipOptions.valueDecimals = seriesTooltipOptions.valueDecimals || seriesTooltipOptions.yDecimals;
		seriesTooltipOptions.valueSuffix = seriesTooltipOptions.valueSuffix || seriesTooltipOptions.ySuffix;


		for (i in match) {
			key = match[i];
			if (isString(key) && key !== pointFormat) {
				

				parts = (' ' + key).split(splitter);
				obj = { 'point': point, 'series': series }[parts[1]];
				prop = parts[2];
				

				if (obj === point && cfg.hasOwnProperty(prop)) {
					repOptionKey = cfg[prop] ? prop : 'value';
					replacement = (seriesTooltipOptions[repOptionKey + 'Prefix'] || '') + 
						numberFormat(point[prop], pick(seriesTooltipOptions[repOptionKey + 'Decimals'], -1)) +
						(seriesTooltipOptions[repOptionKey + 'Suffix'] || '');
				

				} else {
					replacement = obj[prop];
				}
				
				pointFormat = pointFormat.replace(key, replacement);
			}
		}
		
		return pointFormat;
	},

	
	update: function (options, redraw, animation) {
		var point = this,
			series = point.series,
			graphic = point.graphic,
			i,
			data = series.data,
			dataLength = data.length,
			chart = series.chart;

		redraw = pick(redraw, true);


		point.firePointEvent('update', { options: options }, function () {

			point.applyOptions(options);


			if (isObject(options)) {
				series.getAttribs();
				if (graphic) {
					graphic.attr(point.pointAttr[series.state]);
				}
			}


			for (i = 0; i < dataLength; i++) {
				if (data[i] === point) {
					series.xData[i] = point.x;
					series.yData[i] = point.y;
					series.options.data[i] = options;
					break;
				}
			}


			series.isDirty = true;
			series.isDirtyData = true;
			if (redraw) {
				chart.redraw(animation);
			}
		});
	},

	
	remove: function (redraw, animation) {
		var point = this,
			series = point.series,
			chart = series.chart,
			i,
			data = series.data,
			dataLength = data.length;

		setAnimation(animation, chart);
		redraw = pick(redraw, true);


		point.firePointEvent('remove', null, function () {



			for (i = 0; i < dataLength; i++) {
				if (data[i] === point) {


					data.splice(i, 1);
					series.options.data.splice(i, 1);
					series.xData.splice(i, 1);
					series.yData.splice(i, 1);
					break;
				}
			}

			point.destroy();



			series.isDirty = true;
			series.isDirtyData = true;
			if (redraw) {
				chart.redraw();
			}
		});


	},

	
	firePointEvent: function (eventType, eventArgs, defaultFunction) {
		var point = this,
			series = this.series,
			seriesOptions = series.options;


		if (seriesOptions.point.events[eventType] || (point.options && point.options.events && point.options.events[eventType])) {
			this.importEvents();
		}


		if (eventType === 'click' && seriesOptions.allowPointSelect) {
			defaultFunction = function (event) {

				point.select(null, event.ctrlKey || event.metaKey || event.shiftKey);
			};
		}

		fireEvent(this, eventType, eventArgs, defaultFunction);
	},
	
	importEvents: function () {
		if (!this.hasImportedEvents) {
			var point = this,
				options = merge(point.series.options.point, point.options),
				events = options.events,
				eventType;

			point.events = events;

			for (eventType in events) {
				addEvent(point, eventType, events[eventType]);
			}
			this.hasImportedEvents = true;

		}
	},

	
	setState: function (state) {
		var point = this,
			plotX = point.plotX,
			plotY = point.plotY,
			series = point.series,
			stateOptions = series.options.states,
			markerOptions = defaultPlotOptions[series.type].marker && series.options.marker,
			normalDisabled = markerOptions && !markerOptions.enabled,
			markerStateOptions = markerOptions && markerOptions.states[state],
			stateDisabled = markerStateOptions && markerStateOptions.enabled === false,
			stateMarkerGraphic = series.stateMarkerGraphic,
			chart = series.chart,
			radius,
			pointAttr = point.pointAttr;

		state = state || NORMAL_STATE;

		if (

				state === point.state ||

				(point.selected && state !== SELECT_STATE) ||

				(stateOptions[state] && stateOptions[state].enabled === false) ||

				(state && (stateDisabled || (normalDisabled && !markerStateOptions.enabled)))

			) {
			return;
		}


		if (point.graphic) {
			radius = markerOptions && point.graphic.symbolName && pointAttr[state].r;
			point.graphic.attr(merge(
				pointAttr[state],
				radius ? {
					x: plotX - radius,
					y: plotY - radius,
					width: 2 * radius,
					height: 2 * radius
				} : {}
			));
		} else {


			if (state && markerStateOptions) {
				if (!stateMarkerGraphic) {
					radius = markerStateOptions.radius;
					series.stateMarkerGraphic = stateMarkerGraphic = chart.renderer.symbol(
						series.symbol,
						-radius,
						-radius,
						2 * radius,
						2 * radius
					)
					.attr(pointAttr[state])
					.add(series.group);
				}

				stateMarkerGraphic.translate(
					plotX,
					plotY
				);
			}

			if (stateMarkerGraphic) {
				stateMarkerGraphic[state ? 'show' : 'hide']();
			}
		}

		point.state = state;
	}
};


var Series = function () {};

Series.prototype = {

	isCartesian: true,
	type: 'line',
	pointClass: Point,
	sorted: true,
	pointAttrToOptions: {
		stroke: 'lineColor',
		'stroke-width': 'lineWidth',
		fill: 'fillColor',
		r: 'radius'
	},
	init: function (chart, options) {
		var series = this,
			eventType,
			events,

			index = chart.series.length;

		series.chart = chart;
		series.options = options = series.setOptions(options);
		

		series.bindAxes();


		extend(series, {
			index: index,
			name: options.name || 'Series ' + (index + 1),
			state: NORMAL_STATE,
			pointAttr: {},
			visible: options.visible !== false,
			selected: options.selected === true
		});
		

		if (useCanVG) {
			options.animation = false;
		}


		events = options.events;
		for (eventType in events) {
			addEvent(series, eventType, events[eventType]);
		}
		if (
			(events && events.click) ||
			(options.point && options.point.events && options.point.events.click) ||
			options.allowPointSelect
		) {
			chart.runTrackerClick = true;
		}

		series.getColor();
		series.getSymbol();


		series.setData(options.data, false);
		

		if (series.isCartesian) {
			chart.hasCartesianSeries = true;
		}


		chart.series.push(series);
	},
	
	
	bindAxes: function () {
		var series = this,
			seriesOptions = series.options,
			chart = series.chart,
			axisOptions;
			
		if (series.isCartesian) {
			
			each(['xAxis', 'yAxis'], function (AXIS) {
				
				each(chart[AXIS], function (axis) {
					
					axisOptions = axis.options;
					


					if ((seriesOptions[AXIS] === axisOptions.index) ||
							(seriesOptions[AXIS] === UNDEFINED && axisOptions.index === 0)) {
						

						axis.series.push(series);
						

						series[AXIS] = axis;
						

						axis.isDirty = true;
					}
				});
				
			});
		}
	},


	
	autoIncrement: function () {
		var series = this,
			options = series.options,
			xIncrement = series.xIncrement;

		xIncrement = pick(xIncrement, options.pointStart, 0);

		series.pointInterval = pick(series.pointInterval, options.pointInterval, 1);

		series.xIncrement = xIncrement + series.pointInterval;
		return xIncrement;
	},

	
	getSegments: function () {
		var series = this,
			lastNull = -1,
			segments = [],
			i,
			points = series.points,
			pointsLength = points.length;

		if (pointsLength) {
			

			if (series.options.connectNulls) {
				i = pointsLength;
				while (i--) {
					if (points[i].y === null) {
						points.splice(i, 1);
					}
				}
				if (points.length) {
					segments = [points];
				}
				

			} else {
				each(points, function (point, i) {
					if (point.y === null) {
						if (i > lastNull + 1) {
							segments.push(points.slice(lastNull + 1, i));
						}
						lastNull = i;
					} else if (i === pointsLength - 1) {
						segments.push(points.slice(lastNull + 1, i + 1));
					}
				});
			}
		}
		

		series.segments = segments;
	},
	
	setOptions: function (itemOptions) {
		var series = this,
			chart = series.chart,
			chartOptions = chart.options,
			plotOptions = chartOptions.plotOptions,
			data = itemOptions.data,
			options;

		itemOptions.data = null;

		options = merge(
			plotOptions[this.type],
			plotOptions.series,
			itemOptions
		);
		

		options.data = itemOptions.data = data;
		

		series.tooltipOptions = merge(chartOptions.tooltip, options.tooltip);
		
		return options;

	},
	
	getColor: function () {
		var options = this.options,
			defaultColors = this.chart.options.colors,
			counters = this.chart.counters;
		this.color = options.color ||
			(!options.colorByPoint && defaultColors[counters.color++]) || 'gray';
		counters.wrapColor(defaultColors.length);
	},
	
	getSymbol: function () {
		var series = this,
			seriesMarkerOption = series.options.marker,
			chart = series.chart,
			defaultSymbols = chart.options.symbols,
			counters = chart.counters;
		series.symbol = seriesMarkerOption.symbol || defaultSymbols[counters.symbol++];
		

		if (/^url/.test(series.symbol)) {
			seriesMarkerOption.radius = 0;
		}
		counters.wrapSymbol(defaultSymbols.length);
	},

	
	drawLegendSymbol: function (legend) {
		
		var options = this.options,
			markerOptions = options.marker,
			radius,
			legendOptions = legend.options,
			legendSymbol,
			symbolWidth = legendOptions.symbolWidth,
			renderer = this.chart.renderer,
			legendItemGroup = this.legendGroup,
			baseline = legend.baseline,
			attr;
			

		if (options.lineWidth) {
			attr = {
				'stroke-width': options.lineWidth
			};
			if (options.dashStyle) {
				attr.dashstyle = options.dashStyle;
			}
			this.legendLine = renderer.path([
				M,
				0,
				baseline - 4,
				L,
				symbolWidth,
				baseline - 4
			])
			.attr(attr)
			.add(legendItemGroup);
		}
		

		if (markerOptions && markerOptions.enabled) {
			radius = markerOptions.radius;
			this.legendSymbol = legendSymbol = renderer.symbol(
				this.symbol,
				(symbolWidth / 2) - radius,
				baseline - 4 - radius,
				2 * radius,
				2 * radius
			)
			.attr(this.pointAttr[NORMAL_STATE])
			.add(legendItemGroup);
		}
	},

	
	addPoint: function (options, redraw, shift, animation) {
		var series = this,
			data = series.data,
			graph = series.graph,
			area = series.area,
			chart = series.chart,
			xData = series.xData,
			yData = series.yData,
			currentShift = (graph && graph.shift) || 0,
			dataOptions = series.options.data,
			point;


		setAnimation(animation, chart);


		if (graph && shift) { 
			graph.shift = currentShift + 1;
		}
		if (area) {
			if (shift) {
				area.shift = currentShift + 1;
			}
			area.isArea = true;
		}
		

		redraw = pick(redraw, true);



		point = { series: series };
		series.pointClass.prototype.applyOptions.apply(point, [options]);
		xData.push(point.x);
		yData.push(series.valueCount === 4 ? [point.open, point.high, point.low, point.close] : point.y);
		dataOptions.push(options);




		if (shift) {
			if (data[0] && data[0].remove) {
				data[0].remove(false);
			} else {
				data.shift();
				xData.shift();
				yData.shift();
				dataOptions.shift();
			}
		}
		series.getAttribs();


		series.isDirty = true;
		series.isDirtyData = true;
		if (redraw) {
			chart.redraw();
		}
	},

	
	setData: function (data, redraw) {
		var series = this,
			oldData = series.points,
			options = series.options,
			initialColor = series.initialColor,
			chart = series.chart,
			firstPoint = null,
			xAxis = series.xAxis,
			i,
			pointProto = series.pointClass.prototype;


		series.xIncrement = null;
		series.pointRange = (xAxis && xAxis.categories && 1) || options.pointRange;

		if (defined(initialColor)) {
			chart.counters.color = initialColor;
		}
		

		var xData = [],
			yData = [],
			dataLength = data ? data.length : [],
			turboThreshold = options.turboThreshold || 1000,
			pt,
			valueCount = series.valueCount;





		if (dataLength > turboThreshold) {
			

			i = 0;
			while (firstPoint === null && i < dataLength) {
				firstPoint = data[i];
				i++;
			}
		
		
			if (isNumber(firstPoint)) {
				var x = pick(options.pointStart, 0),
					pointInterval = pick(options.pointInterval, 1);

				for (i = 0; i < dataLength; i++) {
					xData[i] = x;
					yData[i] = data[i];
					x += pointInterval;
				}
				series.xIncrement = x;
			} else if (isArray(firstPoint)) {
				if (valueCount) {
					for (i = 0; i < dataLength; i++) {
						pt = data[i];
						xData[i] = pt[0];
						yData[i] = pt.slice(1, valueCount + 1);
					}
				} else {
					for (i = 0; i < dataLength; i++) {
						pt = data[i];
						xData[i] = pt[0];
						yData[i] = pt[1];
					}
				}
			} 
		} else {
			for (i = 0; i < dataLength; i++) {
				pt = { series: series };
				pointProto.applyOptions.apply(pt, [data[i]]);
				xData[i] = pt.x;
				yData[i] = pointProto.toYData ? pointProto.toYData.apply(pt) : pt.y;
			}
		}

		series.data = [];
		series.options.data = data;
		series.xData = xData;
		series.yData = yData;


		i = (oldData && oldData.length) || 0;
		while (i--) {
			if (oldData[i] && oldData[i].destroy) {
				oldData[i].destroy();
			}
		}


		if (xAxis) {
			xAxis.minRange = xAxis.userMinRange;
		}


		series.isDirty = series.isDirtyData = chart.isDirtyBox = true;
		if (pick(redraw, true)) {
			chart.redraw(false);
		}
	},

	

	remove: function (redraw, animation) {
		var series = this,
			chart = series.chart;
		redraw = pick(redraw, true);

		if (!series.isRemoving) {  
			series.isRemoving = true;


			fireEvent(series, 'remove', null, function () {



				series.destroy();



				chart.isDirtyLegend = chart.isDirtyBox = true;
				if (redraw) {
					chart.redraw(animation);
				}
			});

		}
		series.isRemoving = false;
	},

	
	processData: function (force) {
		var series = this,
			processedXData = series.xData,
			processedYData = series.yData,
			dataLength = processedXData.length,
			cropStart = 0,
			cropEnd = dataLength,
			cropped,
			distance,
			closestPointRange,
			xAxis = series.xAxis,
			i,
			options = series.options,
			cropThreshold = options.cropThreshold,
			isCartesian = series.isCartesian;



		if (isCartesian && !series.isDirty && !xAxis.isDirty && !series.yAxis.isDirty && !force) {
			return false;
		}


		if (isCartesian && series.sorted && (!cropThreshold || dataLength > cropThreshold || series.forceCrop)) {
			var extremes = xAxis.getExtremes(),
				min = extremes.min,
				max = extremes.max;


			if (processedXData[dataLength - 1] < min || processedXData[0] > max) {
				processedXData = [];
				processedYData = [];
			

			} else if (processedXData[0] < min || processedXData[dataLength - 1] > max) {


				for (i = 0; i < dataLength; i++) {
					if (processedXData[i] >= min) {
						cropStart = mathMax(0, i - 1);
						break;
					}
				}

				for (; i < dataLength; i++) {
					if (processedXData[i] > max) {
						cropEnd = i + 1;
						break;
					}
					
				}
				processedXData = processedXData.slice(cropStart, cropEnd);
				processedYData = processedYData.slice(cropStart, cropEnd);
				cropped = true;
			}
		}
		
		

		for (i = processedXData.length - 1; i > 0; i--) {
			distance = processedXData[i] - processedXData[i - 1];
			if (distance > 0 && (closestPointRange === UNDEFINED || distance < closestPointRange)) {
				closestPointRange = distance;
			}
		}
		

		series.cropped = cropped;
		series.cropStart = cropStart;
		series.processedXData = processedXData;
		series.processedYData = processedYData;
		
		if (options.pointRange === null) {
			series.pointRange = closestPointRange || 1;
		}
		series.closestPointRange = closestPointRange;
		
	},

	
	generatePoints: function () {
		var series = this,
			options = series.options,
			dataOptions = options.data,
			data = series.data,
			dataLength,
			processedXData = series.processedXData,
			processedYData = series.processedYData,
			pointClass = series.pointClass,
			processedDataLength = processedXData.length,
			cropStart = series.cropStart || 0,
			cursor,
			hasGroupedData = series.hasGroupedData,
			point,
			points = [],
			i;

		if (!data && !hasGroupedData) {
			var arr = [];
			arr.length = dataOptions.length;
			data = series.data = arr;
		}

		for (i = 0; i < processedDataLength; i++) {
			cursor = cropStart + i;
			if (!hasGroupedData) {
				if (data[cursor]) {
					point = data[cursor];
				} else if (dataOptions[cursor] !== UNDEFINED) {
					data[cursor] = point = (new pointClass()).init(series, dataOptions[cursor], processedXData[i]);
				}
				points[i] = point;
			} else {

				points[i] = (new pointClass()).init(series, [processedXData[i]].concat(splat(processedYData[i])));
			}
		}



		if (data && (processedDataLength !== (dataLength = data.length) || hasGroupedData)) {
			for (i = 0; i < dataLength; i++) {
				if (i === cropStart && !hasGroupedData) {
					i += processedDataLength;
				}
				if (data[i]) {
					data[i].destroyElements();
					data[i].plotX = UNDEFINED;
				}
			}
		}

		series.data = data;
		series.points = points;
	},

	
	translate: function () {
		if (!this.processedXData) {
			this.processData();
		}
		this.generatePoints();
		var series = this,
			chart = series.chart,
			options = series.options,
			stacking = options.stacking,
			xAxis = series.xAxis,
			categories = xAxis.categories,
			yAxis = series.yAxis,
			points = series.points,
			dataLength = points.length,
			hasModifyValue = !!series.modifyValue,
			isLastSeries,
			allStackSeries = yAxis.series,
			i = allStackSeries.length;
			

		while (i--) {
			if (allStackSeries[i].visible) {
				if (i === series.index) {
					isLastSeries = true;
				}
				break;
			}
		}
		

		for (i = 0; i < dataLength; i++) {
			var point = points[i],
				xValue = point.x,
				yValue = point.y,
				yBottom = point.low,
				stack = yAxis.stacks[(yValue < options.threshold ? '-' : '') + series.stackKey],
				pointStack,
				pointStackTotal;
				


			point.plotX = xAxis.translate(xValue, 0, 0, 0, 1);


			if (stacking && series.visible && stack && stack[xValue]) {
				pointStack = stack[xValue];
				pointStackTotal = pointStack.total;
				pointStack.cum = yBottom = pointStack.cum - yValue;
				yValue = yBottom + yValue;
				
				if (isLastSeries) {
					yBottom = options.threshold;
				}
				
				if (stacking === 'percent') {
					yBottom = pointStackTotal ? yBottom * 100 / pointStackTotal : 0;
					yValue = pointStackTotal ? yValue * 100 / pointStackTotal : 0;
				}

				point.percentage = pointStackTotal ? point.y * 100 / pointStackTotal : 0;
				point.stackTotal = pointStackTotal;
				point.stackY = yValue;
			}


			point.yBottom = defined(yBottom) ? 
				yAxis.translate(yBottom, 0, 1, 0, 1) :
				null;
			

			if (hasModifyValue) {
				yValue = series.modifyValue(yValue, point);
			}


			point.plotY = (typeof yValue === 'number') ? 
				mathRound(yAxis.translate(yValue, 0, 1, 0, 1) * 10) / 10 :
				UNDEFINED;


			point.clientX = chart.inverted ?
				chart.plotHeight - point.plotX :
				point.plotX;


			point.category = categories && categories[point.x] !== UNDEFINED ?
				categories[point.x] : point.x;


		}


		series.getSegments();
	},
	
	setTooltipPoints: function (renew) {
		var series = this,
			chart = series.chart,
			points = [],
			pointsLength,
			plotSize = chart.plotSizeX,
			low,
			high,
			xAxis = series.xAxis,
			point,
			i,
			tooltipPoints = [];


		if (series.options.enableMouseTracking === false) {
			return;
		}


		if (renew) {
			series.tooltipPoints = null;
		}


		each(series.segments || series.points, function (segment) {
			points = points.concat(segment);
		});



		if (xAxis && xAxis.reversed) {
			points = points.reverse();
		}


		pointsLength = points.length;
		for (i = 0; i < pointsLength; i++) {
			point = points[i];
			low = points[i - 1] ? points[i - 1]._high + 1 : 0;
			point._high = high = points[i + 1] ?
				mathMax(0, mathFloor((point.plotX + (points[i + 1] ? points[i + 1].plotX : plotSize)) / 2)) :
				plotSize;

			while (low >= 0 && low <= high) {
				tooltipPoints[low++] = point;
			}
		}
		series.tooltipPoints = tooltipPoints;
	},

	
	tooltipHeaderFormatter: function (key) {
		var series = this,
			tooltipOptions = series.tooltipOptions,
			xDateFormat = tooltipOptions.xDateFormat,
			xAxis = series.xAxis,
			isDateTime = xAxis && xAxis.options.type === 'datetime',
			n;
			

		if (isDateTime && !xDateFormat) {
			for (n in timeUnits) {
				if (timeUnits[n] >= xAxis.closestPointRange) {
					xDateFormat = tooltipOptions.dateTimeLabelFormats[n];
					break;
				}	
			}		
		}
		
		return tooltipOptions.headerFormat
			.replace('{point.key}', isDateTime ? dateFormat(xDateFormat, key) :  key)
			.replace('{series.name}', series.name)
			.replace('{series.color}', series.color);
	},

	
	onMouseOver: function () {
		var series = this,
			chart = series.chart,
			hoverSeries = chart.hoverSeries;

		if (!hasTouch && chart.mouseIsDown) {
			return;
		}


		if (hoverSeries && hoverSeries !== series) {
			hoverSeries.onMouseOut();
		}



		if (series.options.events.mouseOver) {
			fireEvent(series, 'mouseOver');
		}


		series.setState(HOVER_STATE);
		chart.hoverSeries = series;
	},

	
	onMouseOut: function () {

		var series = this,
			options = series.options,
			chart = series.chart,
			tooltip = chart.tooltip,
			hoverPoint = chart.hoverPoint;


		if (hoverPoint) {
			hoverPoint.onMouseOut();
		}


		if (series && options.events.mouseOut) {
			fireEvent(series, 'mouseOut');
		}



		if (tooltip && !options.stickyTracking && !tooltip.shared) {
			tooltip.hide();
		}


		series.setState();
		chart.hoverSeries = null;
	},

	
	animate: function (init) {
		var series = this,
			chart = series.chart,
			clipRect = series.clipRect,
			animation = series.options.animation;

		if (animation && !isObject(animation)) {
			animation = {};
		}

		if (init) {
			if (!clipRect.isAnimating) {
				clipRect.attr('width', 0);
				clipRect.isAnimating = true;
			}

		} else {
			clipRect.animate({
				width: chart.plotSizeX
			}, animation);


			this.animate = null;
		}
	},


	
	drawPoints: function () {
		var series = this,
			pointAttr,
			points = series.points,
			chart = series.chart,
			plotX,
			plotY,
			i,
			point,
			radius,
			symbol,
			isImage,
			graphic;

		if (series.options.marker.enabled) {
			i = points.length;
			while (i--) {
				point = points[i];
				plotX = point.plotX;
				plotY = point.plotY;
				graphic = point.graphic;


				if (plotY !== UNDEFINED && !isNaN(plotY)) {


					pointAttr = point.pointAttr[point.selected ? SELECT_STATE : NORMAL_STATE];
					radius = pointAttr.r;
					symbol = pick(point.marker && point.marker.symbol, series.symbol);
					isImage = symbol.indexOf('url') === 0;

					if (graphic) {
						graphic.animate(extend({
							x: plotX - radius,
							y: plotY - radius
						}, graphic.symbolName ? {
							width: 2 * radius,
							height: 2 * radius
						} : {}));
					} else if (radius > 0 || isImage) {
						point.graphic = chart.renderer.symbol(
							symbol,
							plotX - radius,
							plotY - radius,
							2 * radius,
							2 * radius
						)
						.attr(pointAttr)
						.add(series.group);
					}
				}
			}
		}

	},

	
	convertAttribs: function (options, base1, base2, base3) {
		var conversion = this.pointAttrToOptions,
			attr,
			option,
			obj = {};

		options = options || {};
		base1 = base1 || {};
		base2 = base2 || {};
		base3 = base3 || {};

		for (attr in conversion) {
			option = conversion[attr];
			obj[attr] = pick(options[option], base1[attr], base2[attr], base3[attr]);
		}
		return obj;
	},

	
	getAttribs: function () {
		var series = this,
			normalOptions = defaultPlotOptions[series.type].marker ? series.options.marker : series.options,
			stateOptions = normalOptions.states,
			stateOptionsHover = stateOptions[HOVER_STATE],
			pointStateOptionsHover,
			seriesColor = series.color,
			normalDefaults = {
				stroke: seriesColor,
				fill: seriesColor
			},
			points = series.points || [],
			i,
			point,
			seriesPointAttr = [],
			pointAttr,
			pointAttrToOptions = series.pointAttrToOptions,
			hasPointSpecificOptions,
			key;


		if (series.options.marker) {


			stateOptionsHover.radius = stateOptionsHover.radius || normalOptions.radius + 2;
			stateOptionsHover.lineWidth = stateOptionsHover.lineWidth || normalOptions.lineWidth + 1;

		} else {


			stateOptionsHover.color = stateOptionsHover.color ||
				Color(stateOptionsHover.color || seriesColor)
					.brighten(stateOptionsHover.brightness).get();
		}


		seriesPointAttr[NORMAL_STATE] = series.convertAttribs(normalOptions, normalDefaults);


		each([HOVER_STATE, SELECT_STATE], function (state) {
			seriesPointAttr[state] =
					series.convertAttribs(stateOptions[state], seriesPointAttr[NORMAL_STATE]);
		});


		series.pointAttr = seriesPointAttr;





		i = points.length;
		while (i--) {
			point = points[i];
			normalOptions = (point.options && point.options.marker) || point.options;
			if (normalOptions && normalOptions.enabled === false) {
				normalOptions.radius = 0;
			}
			hasPointSpecificOptions = false;


			if (point.options) {
				for (key in pointAttrToOptions) {
					if (defined(normalOptions[pointAttrToOptions[key]])) {
						hasPointSpecificOptions = true;
					}
				}
			}





			if (hasPointSpecificOptions) {

				pointAttr = [];
				stateOptions = normalOptions.states || {};
				pointStateOptionsHover = stateOptions[HOVER_STATE] = stateOptions[HOVER_STATE] || {};


				if (!series.options.marker) {
					pointStateOptionsHover.color =
						Color(pointStateOptionsHover.color || point.options.color)
							.brighten(pointStateOptionsHover.brightness ||
								stateOptionsHover.brightness).get();

				}


				pointAttr[NORMAL_STATE] = series.convertAttribs(normalOptions, seriesPointAttr[NORMAL_STATE]);


				pointAttr[HOVER_STATE] = series.convertAttribs(
					stateOptions[HOVER_STATE],
					seriesPointAttr[HOVER_STATE],
					pointAttr[NORMAL_STATE]
				);

				pointAttr[SELECT_STATE] = series.convertAttribs(
					stateOptions[SELECT_STATE],
					seriesPointAttr[SELECT_STATE],
					pointAttr[NORMAL_STATE]
				);





			} else {
				pointAttr = seriesPointAttr;
			}

			point.pointAttr = pointAttr;

		}

	},


	
	destroy: function () {
		var series = this,
			chart = series.chart,
			seriesClipRect = series.clipRect,
			issue134 = /AppleWebKit\/533/.test(userAgent),
			destroy,
			i,
			data = series.data || [],
			point,
			prop,
			axis;


		fireEvent(series, 'destroy');


		removeEvent(series);
		

		each(['xAxis', 'yAxis'], function (AXIS) {
			axis = series[AXIS];
			if (axis) {
				erase(axis.series, series);
				axis.isDirty = true;
			}
		});


		if (series.legendItem) {
			series.chart.legend.destroyItem(series);
		}


		i = data.length;
		while (i--) {
			point = data[i];
			if (point && point.destroy) {
				point.destroy();
			}
		}
		series.points = null;



		if (seriesClipRect && seriesClipRect !== chart.clipRect) {
			series.clipRect = seriesClipRect.destroy();
		}


		each(['area', 'graph', 'dataLabelsGroup', 'group', 'tracker', 'trackerGroup'], function (prop) {
			if (series[prop]) {


				destroy = issue134 && prop === 'group' ?
					'hide' :
					'destroy';

				series[prop][destroy]();
			}
		});


		if (chart.hoverSeries === series) {
			chart.hoverSeries = null;
		}
		erase(chart.series, series);


		for (prop in series) {
			delete series[prop];
		}
	},

	
	drawDataLabels: function () {
		
		var series = this,
			seriesOptions = series.options,
			options = seriesOptions.dataLabels;
		
		if (options.enabled || series._hasPointLabels) {
			var x,
				y,
				points = series.points,
				pointOptions,
				generalOptions,
				str,
				dataLabelsGroup = series.dataLabelsGroup,
				chart = series.chart,
				xAxis = series.xAxis,
				groupLeft = xAxis ? xAxis.left : chart.plotLeft,
				yAxis = series.yAxis,
				groupTop = yAxis ? yAxis.top : chart.plotTop,
				renderer = chart.renderer,
				inverted = chart.inverted,
				seriesType = series.type,
				stacking = seriesOptions.stacking,
				isBarLike = seriesType === 'column' || seriesType === 'bar',
				vAlignIsNull = options.verticalAlign === null,
				yIsNull = options.y === null,
				fontMetrics = renderer.fontMetrics(options.style.fontSize),
				fontLineHeight = fontMetrics.h,
				fontBaseline = fontMetrics.b,
				dataLabel,
				enabled;

			if (isBarLike) {
				var defaultYs = {
					top: fontBaseline, 
					middle: fontBaseline - fontLineHeight / 2, 
					bottom: -fontLineHeight + fontBaseline
				};
				if (stacking) {

					if (vAlignIsNull) {
						options = merge(options, {verticalAlign: 'middle'});
					}


					if (yIsNull) {
						options = merge(options, { y: defaultYs[options.verticalAlign]});
					}
				} else {

					if (vAlignIsNull) {
						options = merge(options, {verticalAlign: 'top'});
					

					} else if (yIsNull) {
						options = merge(options, { y: defaultYs[options.verticalAlign]});
					}
					
				}
			}



			if (!dataLabelsGroup) {
				dataLabelsGroup = series.dataLabelsGroup =
					renderer.g('data-labels')
						.attr({
							visibility: series.visible ? VISIBLE : HIDDEN,
							zIndex: 6
						})
						.translate(groupLeft, groupTop)
						.add();
			} else {
				dataLabelsGroup.translate(groupLeft, groupTop);
			}
			

			generalOptions = options;
			each(points, function (point) {
				
				dataLabel = point.dataLabel;
				

				options = generalOptions;
				pointOptions = point.options;
				if (pointOptions && pointOptions.dataLabels) {
					options = merge(options, pointOptions.dataLabels);
				}
				enabled = options.enabled;
				

				if (enabled) {
					var plotX = (point.barX && point.barX + point.barW / 2) || pick(point.plotX, -999),
						plotY = pick(point.plotY, -999),
						


						individualYDelta = options.y === null ? 
							(point.y >= seriesOptions.threshold ? 
								-fontLineHeight + fontBaseline :
								fontBaseline) :
							options.y;
					
					x = (inverted ? chart.plotWidth - plotY : plotX) + options.x;
					y = mathRound((inverted ? chart.plotHeight - plotX : plotY) + individualYDelta);
					
				}
				

				if (dataLabel && series.isCartesian && (!chart.isInsidePlot(x, y) || !enabled)) {
					point.dataLabel = dataLabel.destroy();
				


				} else if (enabled) {
					
					var align = options.align,
						attr,
						name;
				

					str = options.formatter.call(point.getLabelConfig(), options);
					

					if (seriesType === 'column') {
						x += { left: -1, right: 1 }[align] * point.barW / 2 || 0;
					}
	
					if (!stacking && inverted && point.y < 0) {
						align = 'right';
						x -= 10;
					}
					

					options.style.color = pick(options.color, options.style.color, series.color, 'black');
	
					

					if (dataLabel) {

						dataLabel
							.attr({
								text: str
							}).animate({
								x: x,
								y: y
							});

					} else if (defined(str)) {
						attr = {
							align: align,
							fill: options.backgroundColor,
							stroke: options.borderColor,
							'stroke-width': options.borderWidth,
							r: options.borderRadius || 0,
							rotation: options.rotation,
							padding: options.padding,
							zIndex: 1
						};

						for (name in attr) {
							if (attr[name] === UNDEFINED) {
								delete attr[name];
							}
						}
						
						dataLabel = point.dataLabel = renderer[options.rotation ? 'text' : 'label'](
							str,
							x,
							y,
							null,
							null,
							null,
							options.useHTML,
							true
						)
						.attr(attr)
						.css(options.style)
						.add(dataLabelsGroup)
						.shadow(options.shadow);
					}
	
					if (isBarLike && seriesOptions.stacking && dataLabel) {
						var barX = point.barX,
							barY = point.barY,
							barW = point.barW,
							barH = point.barH;
	
						dataLabel.align(options, null,
							{
								x: inverted ? chart.plotWidth - barY - barH : barX,
								y: inverted ? chart.plotHeight - barX - barW : barY,
								width: inverted ? barH : barW,
								height: inverted ? barW : barH
							});
					}
					
					
				}
			});
		}
	},
	
	
	getSegmentPath: function (segment) {		
		var series = this,
			segmentPath = [];
		

		each(segment, function (point, i) {

			if (series.getPointSpline) {
				segmentPath.push.apply(segmentPath, series.getPointSpline(segment, point, i));

			} else {


				segmentPath.push(i ? L : M);


				if (i && series.options.step) {
					var lastPoint = segment[i - 1];
					segmentPath.push(
						point.plotX,
						lastPoint.plotY
					);
				}


				segmentPath.push(
					point.plotX,
					point.plotY
				);
			}
		});
		
		return segmentPath;
	},

	
	drawGraph: function () {
		var series = this,
			options = series.options,
			chart = series.chart,
			graph = series.graph,
			graphPath = [],
			group = series.group,
			color = options.lineColor || series.color,
			lineWidth = options.lineWidth,
			dashStyle =  options.dashStyle,
			segmentPath,
			renderer = chart.renderer,
			singlePoints = [],
			attribs;


		each(series.segments, function (segment) {
			
			segmentPath = series.getSegmentPath(segment);
			

			if (segment.length > 1) {
				graphPath = graphPath.concat(segmentPath);
			} else {
				singlePoints.push(segment[0]);
			}
		});


		series.graphPath = graphPath;
		series.singlePoints = singlePoints;


		if (graph) {
			stop(graph);
			graph.animate({ d: graphPath });

		} else {
			if (lineWidth) {
				attribs = {
					stroke: color,
					'stroke-width': lineWidth
				};
				if (dashStyle) {
					attribs.dashstyle = dashStyle;
				}

				series.graph = renderer.path(graphPath)
					.attr(attribs).add(group).shadow(options.shadow);
			}
		}
	},

	
	invertGroups: function () {
		var series = this,
			group = series.group,
			trackerGroup = series.trackerGroup,
			chart = series.chart;
		

		function setInvert() {			
			var size = {
				width: series.yAxis.len,
				height: series.xAxis.len
			};
			

			group.attr(size).invert();
			

			if (trackerGroup) {
				trackerGroup.attr(size).invert();
			}
		}

		addEvent(chart, 'resize', setInvert);
		addEvent(series, 'destroy', function () {
			removeEvent(chart, 'resize', setInvert);
		});


		setInvert();
		

		series.invertGroups = setInvert;
	},
	
	
	createGroup: function () {
		
		var chart = this.chart,
			group = this.group = chart.renderer.g('series');

		group.attr({
				visibility: this.visible ? VISIBLE : HIDDEN,
				zIndex: this.options.zIndex
			})
			.translate(this.xAxis.left, this.yAxis.top)
			.add(chart.seriesGroup);
		

		this.createGroup = noop;
	},

	
	render: function () {
		var series = this,
			chart = series.chart,
			group,
			options = series.options,
			doClip = options.clip !== false,
			animation = options.animation,
			doAnimation = animation && series.animate,
			duration = doAnimation ? (animation && animation.duration) || 500 : 0,
			clipRect = series.clipRect,
			renderer = chart.renderer;








		if (!clipRect) {
			clipRect = series.clipRect = !chart.hasRendered && chart.clipRect ?
				chart.clipRect :
				renderer.clipRect(0, 0, chart.plotSizeX, chart.plotSizeY + 1);
			if (!chart.clipRect) {
				chart.clipRect = clipRect;
			}
		}
		


		series.createGroup();
		group = series.group;
		
		
		series.drawDataLabels();


		if (doAnimation) {
			series.animate(true);
		}


		series.getAttribs();


		if (series.drawGraph) {
			series.drawGraph();
		}


		series.drawPoints();


		if (series.options.enableMouseTracking !== false) {
			series.drawTracker();
		}
		

		if (chart.inverted) {
			series.invertGroups();
		}
		

		if (doClip && !series.hasRendered) {
			group.clip(clipRect);
			if (series.trackerGroup) {
				series.trackerGroup.clip(chart.clipRect);
			}
		}
			


		if (doAnimation) {
			series.animate();
		}


		setTimeout(function () {
			clipRect.isAnimating = false;
			group = series.group;
			if (group && clipRect !== chart.clipRect && clipRect.renderer) {
				if (doClip) {
					group.clip((series.clipRect = chart.clipRect));
				}
				clipRect.destroy();
			}
		}, duration);

		series.isDirty = series.isDirtyData = false;

		series.hasRendered = true;
	},

	
	redraw: function () {
		var series = this,
			chart = series.chart,
			wasDirtyData = series.isDirtyData,
			group = series.group;


		if (group) {
			if (chart.inverted) {
				group.attr({
					width: chart.plotWidth,
					height: chart.plotHeight
				});
			}

			group.animate({
				translateX: series.xAxis.left,
				translateY: series.yAxis.top
			});
		}

		series.translate();
		series.setTooltipPoints(true);

		series.render();
		if (wasDirtyData) {
			fireEvent(series, 'updatedData');
		}
	},

	
	setState: function (state) {
		var series = this,
			options = series.options,
			graph = series.graph,
			stateOptions = options.states,
			lineWidth = options.lineWidth;

		state = state || NORMAL_STATE;

		if (series.state !== state) {
			series.state = state;

			if (stateOptions[state] && stateOptions[state].enabled === false) {
				return;
			}

			if (state) {
				lineWidth = stateOptions[state].lineWidth || lineWidth + 1;
			}

			if (graph && !graph.dashstyle) {
				graph.attr({
					'stroke-width': lineWidth
				}, state ? 0 : 500);
			}
		}
	},

	
	setVisible: function (vis, redraw) {
		var series = this,
			chart = series.chart,
			legendItem = series.legendItem,
			seriesGroup = series.group,
			seriesTracker = series.tracker,
			dataLabelsGroup = series.dataLabelsGroup,
			showOrHide,
			i,
			points = series.points,
			point,
			ignoreHiddenSeries = chart.options.chart.ignoreHiddenSeries,
			oldVisibility = series.visible;


		series.visible = vis = vis === UNDEFINED ? !oldVisibility : vis;
		showOrHide = vis ? 'show' : 'hide';


		if (seriesGroup) {
			seriesGroup[showOrHide]();
		}


		if (seriesTracker) {
			seriesTracker[showOrHide]();
		} else if (points) {
			i = points.length;
			while (i--) {
				point = points[i];
				if (point.tracker) {
					point.tracker[showOrHide]();
				}
			}
		}


		if (dataLabelsGroup) {
			dataLabelsGroup[showOrHide]();
		}

		if (legendItem) {
			chart.legend.colorizeItem(series, vis);
		}



		series.isDirty = true;

		if (series.options.stacking) {
			each(chart.series, function (otherSeries) {
				if (otherSeries.options.stacking && otherSeries.visible) {
					otherSeries.isDirty = true;
				}
			});
		}

		if (ignoreHiddenSeries) {
			chart.isDirtyBox = true;
		}
		if (redraw !== false) {
			chart.redraw();
		}

		fireEvent(series, showOrHide);
	},

	
	show: function () {
		this.setVisible(true);
	},

	
	hide: function () {
		this.setVisible(false);
	},


	
	select: function (selected) {
		var series = this;

		series.selected = selected = (selected === UNDEFINED) ? !series.selected : selected;

		if (series.checkbox) {
			series.checkbox.checked = selected;
		}

		fireEvent(series, selected ? 'select' : 'unselect');
	},

	
	drawTrackerGroup: function () {
		var trackerGroup = this.trackerGroup,
			chart = this.chart;
		
		if (this.isCartesian) {
		

			if (!trackerGroup) {	
				this.trackerGroup = trackerGroup = chart.renderer.g()
					.attr({
						zIndex: this.options.zIndex || 1
					})
					.add(chart.trackerGroup);
					
			}

			trackerGroup.translate(this.xAxis.left, this.yAxis.top);
			
		}
		
		return trackerGroup;
	},
	
	
	drawTracker: function () {
		var series = this,
			options = series.options,
			trackByArea = options.trackByArea,
			trackerPath = [].concat(trackByArea ? series.areaPath : series.graphPath),
			trackerPathLength = trackerPath.length,
			chart = series.chart,
			renderer = chart.renderer,
			snap = chart.options.tooltip.snap,
			tracker = series.tracker,
			cursor = options.cursor,
			css = cursor && { cursor: cursor },
			singlePoints = series.singlePoints,
			trackerGroup = series.drawTrackerGroup(),
			singlePoint,
			i;



		if (trackerPathLength && !trackByArea) {
			i = trackerPathLength + 1;
			while (i--) {
				if (trackerPath[i] === M) {
					trackerPath.splice(i + 1, 0, trackerPath[i + 1] - snap, trackerPath[i + 2], L);
				}
				if ((i && trackerPath[i] === M) || i === trackerPathLength) {
					trackerPath.splice(i, 0, L, trackerPath[i - 2] + snap, trackerPath[i - 1]);
				}
			}
		}


		for (i = 0; i < singlePoints.length; i++) {
			singlePoint = singlePoints[i];
			trackerPath.push(M, singlePoint.plotX - snap, singlePoint.plotY,
				L, singlePoint.plotX + snap, singlePoint.plotY);
		}
		
		


		if (tracker) {
			tracker.attr({ d: trackerPath });

		} else {
				
			series.tracker = renderer.path(trackerPath)
				.attr({
					isTracker: true,
					'stroke-linejoin': 'bevel',
					visibility: series.visible ? VISIBLE : HIDDEN,
					stroke: TRACKER_FILL,
					fill: trackByArea ? TRACKER_FILL : NONE,
					'stroke-width' : options.lineWidth + (trackByArea ? 0 : 2 * snap)
				})
				.on(hasTouch ? 'touchstart' : 'mouseover', function () {
					if (chart.hoverSeries !== series) {
						series.onMouseOver();
					}
				})
				.on('mouseout', function () {
					if (!options.stickyTracking) {
						series.onMouseOut();
					}
				})
				.css(css)
				.add(trackerGroup);
		}

	}

};



var LineSeries = extendClass(Series);
seriesTypes.line = LineSeries;


defaultPlotOptions.area = merge(defaultSeriesOptions, {
	threshold: 0




});


var AreaSeries = extendClass(Series, {
	type: 'area',
	
	
	getSegmentPath: function (segment) {
		
		var segmentPath = Series.prototype.getSegmentPath.call(this, segment),
			areaSegmentPath = [].concat(segmentPath),
			i,
			options = this.options,
			segLength = segmentPath.length,
			translatedThreshold = this.yAxis.getThreshold(options.threshold);
		
		if (segLength === 3) {
			areaSegmentPath.push(L, segmentPath[1], segmentPath[2]);
		}
		if (options.stacking && this.type !== 'areaspline') {
			



			for (i = segment.length - 1; i >= 0; i--) {
			

				if (i < segment.length - 1 && options.step) {
					areaSegmentPath.push(segment[i + 1].plotX, segment[i].yBottom);
				}
				
				areaSegmentPath.push(segment[i].plotX, segment[i].yBottom);
			}

		} else {
			areaSegmentPath.push(
				L,
				segment[segment.length - 1].plotX,
				translatedThreshold,
				L,
				segment[0].plotX,
				translatedThreshold
			);
		}
		this.areaPath = this.areaPath.concat(areaSegmentPath);
		
		return segmentPath;
	},
	
	
	drawGraph: function () {
		

		this.areaPath = [];
		

		Series.prototype.drawGraph.apply(this);
		

		var areaPath = this.areaPath,
			options = this.options,
			area = this.area;
		

		if (area) {
			area.animate({ d: areaPath });

		} else {
			this.area = this.chart.renderer.path(areaPath)
				.attr({
					fill: pick(
						options.fillColor,
						Color(this.color).setOpacity(options.fillOpacity || 0.75).get()
					)
				}).add(this.group);
		}
	},
	
	
	drawLegendSymbol: function (legend, item) {
		
		item.legendSymbol = this.chart.renderer.rect(
			0,
			legend.baseline - 11,
			legend.options.symbolWidth,
			12,
			2
		).attr({
			zIndex: 3
		}).add(item.legendGroup);		
		
	}
});

seriesTypes.area = AreaSeries;
defaultPlotOptions.spline = merge(defaultSeriesOptions);


var SplineSeries = extendClass(Series, {
	type: 'spline',

	
	getPointSpline: function (segment, point, i) {
		var smoothing = 1.5,
			denom = smoothing + 1,
			plotX = point.plotX,
			plotY = point.plotY,
			lastPoint = segment[i - 1],
			nextPoint = segment[i + 1],
			leftContX,
			leftContY,
			rightContX,
			rightContY,
			ret;


		if (i && i < segment.length - 1) {
			var lastX = lastPoint.plotX,
				lastY = lastPoint.plotY,
				nextX = nextPoint.plotX,
				nextY = nextPoint.plotY,
				correction;

			leftContX = (smoothing * plotX + lastX) / denom;
			leftContY = (smoothing * plotY + lastY) / denom;
			rightContX = (smoothing * plotX + nextX) / denom;
			rightContY = (smoothing * plotY + nextY) / denom;


			correction = ((rightContY - leftContY) * (rightContX - plotX)) /
				(rightContX - leftContX) + plotY - rightContY;

			leftContY += correction;
			rightContY += correction;



			if (leftContY > lastY && leftContY > plotY) {
				leftContY = mathMax(lastY, plotY);
				rightContY = 2 * plotY - leftContY;
			} else if (leftContY < lastY && leftContY < plotY) {
				leftContY = mathMin(lastY, plotY);
				rightContY = 2 * plotY - leftContY;
			}
			if (rightContY > nextY && rightContY > plotY) {
				rightContY = mathMax(nextY, plotY);
				leftContY = 2 * plotY - rightContY;
			} else if (rightContY < nextY && rightContY < plotY) {
				rightContY = mathMin(nextY, plotY);
				leftContY = 2 * plotY - rightContY;
			}


			point.rightContX = rightContX;
			point.rightContY = rightContY;

		}


		if (!i) {
			ret = [M, plotX, plotY];
		} else {
			ret = [
				'C',
				lastPoint.rightContX || lastPoint.plotX,
				lastPoint.rightContY || lastPoint.plotY,
				leftContX || plotX,
				leftContY || plotY,
				plotX,
				plotY
			];
			lastPoint.rightContX = lastPoint.rightContY = null;
		}
		return ret;
	}
});
seriesTypes.spline = SplineSeries;


defaultPlotOptions.areaspline = merge(defaultPlotOptions.area);


var areaProto = AreaSeries.prototype,
	AreaSplineSeries = extendClass(SplineSeries, {
		type: 'areaspline',
		

		getSegmentPath: areaProto.getSegmentPath,
		drawGraph: areaProto.drawGraph
	});
seriesTypes.areaspline = AreaSplineSeries;


defaultPlotOptions.column = merge(defaultSeriesOptions, {
	borderColor: '#FFFFFF',
	borderWidth: 1,
	borderRadius: 0,

	groupPadding: 0.2,
	marker: null,
	pointPadding: 0.1,

	minPointLength: 0,
	cropThreshold: 50,
	pointRange: null,
	states: {
		hover: {
			brightness: 0.1,
			shadow: false
		},
		select: {
			color: '#C0C0C0',
			borderColor: '#000000',
			shadow: false
		}
	},
	dataLabels: {
		y: null,
		verticalAlign: null
	},
	threshold: 0
});


var ColumnSeries = extendClass(Series, {
	type: 'column',
	tooltipOutsidePlot: true,
	pointAttrToOptions: {
		stroke: 'borderColor',
		'stroke-width': 'borderWidth',
		fill: 'color',
		r: 'borderRadius'
	},
	init: function () {
		Series.prototype.init.apply(this, arguments);

		var series = this,
			chart = series.chart;



		if (chart.hasRendered) {
			each(chart.series, function (otherSeries) {
				if (otherSeries.type === series.type) {
					otherSeries.isDirty = true;
				}
			});
		}
	},

	
	translate: function () {
		var series = this,
			chart = series.chart,
			options = series.options,
			stacking = options.stacking,
			borderWidth = options.borderWidth,
			columnCount = 0,
			xAxis = series.xAxis,
			reversedXAxis = xAxis.reversed,
			stackGroups = {},
			stackKey,
			columnIndex;

		Series.prototype.translate.apply(series);




		each(chart.series, function (otherSeries) {
			if (otherSeries.type === series.type && otherSeries.visible &&
					series.options.group === otherSeries.options.group) {
				if (otherSeries.options.stacking) {
					stackKey = otherSeries.stackKey;
					if (stackGroups[stackKey] === UNDEFINED) {
						stackGroups[stackKey] = columnCount++;
					}
					columnIndex = stackGroups[stackKey];
				} else {
					columnIndex = columnCount++;
				}
				otherSeries.columnIndex = columnIndex;
			}
		});




		var points = series.points,
			categoryWidth = mathAbs(xAxis.transA) * (xAxis.ordinalSlope || options.pointRange || xAxis.closestPointRange || 1),
			groupPadding = categoryWidth * options.groupPadding,
			groupWidth = categoryWidth - 2 * groupPadding,
			pointOffsetWidth = groupWidth / columnCount,
			optionPointWidth = options.pointWidth,
			pointPadding = defined(optionPointWidth) ? (pointOffsetWidth - optionPointWidth) / 2 :
				pointOffsetWidth * options.pointPadding,
			pointWidth = pick(optionPointWidth, pointOffsetWidth - 2 * pointPadding),
			barW = mathCeil(mathMax(pointWidth, 1 + 2 * borderWidth)),
			colIndex = (reversedXAxis ? columnCount -
				series.columnIndex : series.columnIndex) || 0,
			pointXOffset = pointPadding + (groupPadding + colIndex *
				pointOffsetWidth - (categoryWidth / 2)) *
				(reversedXAxis ? -1 : 1),
			threshold = options.threshold,
			translatedThreshold = series.yAxis.getThreshold(threshold),
			minPointLength = pick(options.minPointLength, 5);


		each(points, function (point) {
			var plotY = point.plotY,
				yBottom = pick(point.yBottom, translatedThreshold),
				barX = point.plotX + pointXOffset,
				barY = mathCeil(mathMin(plotY, yBottom)),
				barH = mathCeil(mathMax(plotY, yBottom) - barY),
				stack = series.yAxis.stacks[(point.y < 0 ? '-' : '') + series.stackKey],
				shapeArgs;


			if (stacking && series.visible && stack && stack[point.x]) {
				stack[point.x].setOffset(pointXOffset, barW);
			}


			if (mathAbs(barH) < minPointLength) {
				if (minPointLength) {
					barH = minPointLength;
					barY =
						mathAbs(barY - translatedThreshold) > minPointLength ?
							yBottom - minPointLength :
							translatedThreshold - (plotY <= translatedThreshold ? minPointLength : 0);
				}
			}

			extend(point, {
				barX: barX,
				barY: barY,
				barW: barW,
				barH: barH,
				pointWidth: pointWidth
			});


			point.shapeType = 'rect';
			point.shapeArgs = shapeArgs = chart.renderer.Element.prototype.crisp.call(0, borderWidth, barX, barY, barW, barH); 
			
			if (borderWidth % 2) {
				shapeArgs.y -= 1;
				shapeArgs.height += 1;
			}


			point.trackerArgs = mathAbs(barH) < 3 && merge(point.shapeArgs, {
				height: 6,
				y: barY - 3
			});
		});

	},

	getSymbol: function () {
	},
	
	
	drawLegendSymbol: AreaSeries.prototype.drawLegendSymbol,
	
	
	
	drawGraph: function () {},

	
	drawPoints: function () {
		var series = this,
			options = series.options,
			renderer = series.chart.renderer,
			graphic,
			shapeArgs;



		each(series.points, function (point) {
			var plotY = point.plotY;
			if (plotY !== UNDEFINED && !isNaN(plotY) && point.y !== null) {
				graphic = point.graphic;
				shapeArgs = point.shapeArgs;
				if (graphic) {
					stop(graphic);
					graphic.animate(merge(shapeArgs));

				} else {
					point.graphic = graphic = renderer[point.shapeType](shapeArgs)
						.attr(point.pointAttr[point.selected ? SELECT_STATE : NORMAL_STATE])
						.add(series.group)
						.shadow(options.shadow, null, options.stacking && !options.borderRadius);
				}

			}
		});
	},
	
	drawTracker: function () {
		var series = this,
			chart = series.chart,
			renderer = chart.renderer,
			shapeArgs,
			tracker,
			trackerLabel = +new Date(),
			options = series.options,
			cursor = options.cursor,
			css = cursor && { cursor: cursor },
			trackerGroup = series.drawTrackerGroup(),
			rel,
			plotY,
			validPlotY;
			
		each(series.points, function (point) {
			tracker = point.tracker;
			shapeArgs = point.trackerArgs || point.shapeArgs;
			plotY = point.plotY;
			validPlotY = !series.isCartesian || (plotY !== UNDEFINED && !isNaN(plotY));
			delete shapeArgs.strokeWidth;
			if (point.y !== null && validPlotY) {
				if (tracker) {
					tracker.attr(shapeArgs);

				} else {
					point.tracker =
						renderer[point.shapeType](shapeArgs)
						.attr({
							isTracker: trackerLabel,
							fill: TRACKER_FILL,
							visibility: series.visible ? VISIBLE : HIDDEN
						})
						.on(hasTouch ? 'touchstart' : 'mouseover', function (event) {
							rel = event.relatedTarget || event.fromElement;
							if (chart.hoverSeries !== series && attr(rel, 'isTracker') !== trackerLabel) {
								series.onMouseOver();
							}
							point.onMouseOver();

						})
						.on('mouseout', function (event) {
							if (!options.stickyTracking) {
								rel = event.relatedTarget || event.toElement;
								if (attr(rel, 'isTracker') !== trackerLabel) {
									series.onMouseOut();
								}
							}
						})
						.css(css)
						.add(point.group || trackerGroup);
				}
			}
		});
	},


	
	animate: function (init) {
		var series = this,
			points = series.points,
			options = series.options;

		if (!init) {
			

			each(points, function (point) {
				var graphic = point.graphic,
					shapeArgs = point.shapeArgs,
					yAxis = series.yAxis,
					threshold = options.threshold;

				if (graphic) {

					graphic.attr({
						height: 0,
						y: defined(threshold) ? 
							yAxis.getThreshold(threshold) :
							yAxis.translate(yAxis.getExtremes().min, 0, 1, 0, 1)
					});


					graphic.animate({
						height: shapeArgs.height,
						y: shapeArgs.y
					}, options.animation);
				}
			});



			series.animate = null;
		}

	},
	
	remove: function () {
		var series = this,
			chart = series.chart;



		if (chart.hasRendered) {
			each(chart.series, function (otherSeries) {
				if (otherSeries.type === series.type) {
					otherSeries.isDirty = true;
				}
			});
		}

		Series.prototype.remove.apply(series, arguments);
	}
});
seriesTypes.column = ColumnSeries;

defaultPlotOptions.bar = merge(defaultPlotOptions.column, {
	dataLabels: {
		align: 'left',
		x: 5,
		y: null,
		verticalAlign: 'middle'
	}
});

var BarSeries = extendClass(ColumnSeries, {
	type: 'bar',
	inverted: true
});
seriesTypes.bar = BarSeries;


defaultPlotOptions.scatter = merge(defaultSeriesOptions, {
	lineWidth: 0,
	states: {
		hover: {
			lineWidth: 0
		}
	},
	tooltip: {
		headerFormat: '<span style="font-size: 10px; color:{series.color}">{series.name}</span><br/>',
		pointFormat: 'x: <b>{point.x}</b><br/>y: <b>{point.y}</b><br/>'
	}
});


var ScatterSeries = extendClass(Series, {
	type: 'scatter',
	sorted: false,
	
	translate: function () {
		var series = this;

		Series.prototype.translate.apply(series);

		each(series.points, function (point) {
			point.shapeType = 'circle';
			point.shapeArgs = {
				x: point.plotX,
				y: point.plotY,
				r: series.chart.options.tooltip.snap
			};
		});
	},

	
	drawTracker: function () {
		var series = this,
			cursor = series.options.cursor,
			css = cursor && { cursor: cursor },
			points = series.points,
			i = points.length,
			graphic;


		while (i--) {
			graphic = points[i].graphic;
			if (graphic) {
				graphic.element._i = i; 
			}
		}
		

		if (!series._hasTracking) {
			series.group
				.attr({
					isTracker: true
				})
				.on(hasTouch ? 'touchstart' : 'mouseover', function (e) {
					series.onMouseOver();
					if (e.target._i !== UNDEFINED) {
						points[e.target._i].onMouseOver();
					}
				})
				.on('mouseout', function () {
					if (!series.options.stickyTracking) {
						series.onMouseOut();
					}
				})
				.css(css);
		} else {
			series._hasTracking = true;
		}

	}
});
seriesTypes.scatter = ScatterSeries;


defaultPlotOptions.pie = merge(defaultSeriesOptions, {
	borderColor: '#FFFFFF',
	borderWidth: 1,
	center: ['50%', '50%'],
	colorByPoint: true,
	dataLabels: {




		distance: 30,
		enabled: true,
		formatter: function () {
			return this.point.name;
		},

		y: 5
	},

	legendType: 'point',
	marker: null,
	size: '75%',
	showInLegend: false,
	slicedOffset: 10,
	states: {
		hover: {
			brightness: 0.1,
			shadow: false
		}
	}
});


var PiePoint = extendClass(Point, {
	
	init: function () {

		Point.prototype.init.apply(this, arguments);

		var point = this,
			toggleSlice;


		extend(point, {
			visible: point.visible !== false,
			name: pick(point.name, 'Slice')
		});


		toggleSlice = function () {
			point.slice();
		};
		addEvent(point, 'select', toggleSlice);
		addEvent(point, 'unselect', toggleSlice);

		return point;
	},

	
	setVisible: function (vis) {
		var point = this,
			chart = point.series.chart,
			tracker = point.tracker,
			dataLabel = point.dataLabel,
			connector = point.connector,
			shadowGroup = point.shadowGroup,
			method;


		point.visible = vis = vis === UNDEFINED ? !point.visible : vis;

		method = vis ? 'show' : 'hide';

		point.group[method]();
		if (tracker) {
			tracker[method]();
		}
		if (dataLabel) {
			dataLabel[method]();
		}
		if (connector) {
			connector[method]();
		}
		if (shadowGroup) {
			shadowGroup[method]();
		}
		if (point.legendItem) {
			chart.legend.colorizeItem(point, vis);
		}
	},

	
	slice: function (sliced, redraw, animation) {
		var point = this,
			series = point.series,
			chart = series.chart,
			slicedTranslation = point.slicedTranslation,
			translation;

		setAnimation(animation, chart);


		redraw = pick(redraw, true);


		sliced = point.sliced = defined(sliced) ? sliced : !point.sliced;

		translation = {
			translateX: (sliced ? slicedTranslation[0] : chart.plotLeft),
			translateY: (sliced ? slicedTranslation[1] : chart.plotTop)
		};
		point.group.animate(translation);
		if (point.shadowGroup) {
			point.shadowGroup.animate(translation);
		}

	}
});


var PieSeries = {
	type: 'pie',
	isCartesian: false,
	pointClass: PiePoint,
	pointAttrToOptions: {
		stroke: 'borderColor',
		'stroke-width': 'borderWidth',
		fill: 'color'
	},

	
	getColor: function () {

		this.initialColor = this.chart.counters.color;
	},

	
	animate: function () {
		var series = this,
			points = series.points;

		each(points, function (point) {
			var graphic = point.graphic,
				args = point.shapeArgs,
				up = -mathPI / 2;

			if (graphic) {

				graphic.attr({
					r: 0,
					start: up,
					end: up
				});


				graphic.animate({
					r: args.r,
					start: args.start,
					end: args.end
				}, series.options.animation);
			}
		});


		series.animate = null;

	},

	
	setData: function (data, redraw) {
		Series.prototype.setData.call(this, data, false);
		this.processData();
		this.generatePoints();
		if (pick(redraw, true)) {
			this.chart.redraw();
		} 
	},
	
	
	getCenter: function () {
		
		var options = this.options,
			chart = this.chart,
			plotWidth = chart.plotWidth,
			plotHeight = chart.plotHeight,
			positions = options.center.concat([options.size, options.innerSize || 0]),
			smallestSize = mathMin(plotWidth, plotHeight),
			isPercent;			
		
		return map(positions, function (length, i) {

			isPercent = /%$/.test(length);
			return isPercent ?




				[plotWidth, plotHeight, smallestSize, smallestSize][i] *
					pInt(length) / 100 :
				length;
		});
	},
	
	
	translate: function () {
		this.generatePoints();
		
		var total = 0,
			series = this,
			cumulative = -0.25,
			precision = 1000,
			options = series.options,
			slicedOffset = options.slicedOffset,
			connectorOffset = slicedOffset + options.borderWidth,
			positions,
			chart = series.chart,
			start,
			end,
			angle,
			points = series.points,
			circ = 2 * mathPI,
			fraction,
			radiusX,
			radiusY,
			labelDistance = options.dataLabels.distance;


		series.center = positions = series.getCenter();


		series.getX = function (y, left) {

			angle = math.asin((y - positions[1]) / (positions[2] / 2 + labelDistance));

			return positions[0] +
				(left ? -1 : 1) *
				(mathCos(angle) * (positions[2] / 2 + labelDistance));
		};


		each(points, function (point) {
			total += point.y;
		});

		each(points, function (point) {

			fraction = total ? point.y / total : 0;
			start = mathRound(cumulative * circ * precision) / precision;
			cumulative += fraction;
			end = mathRound(cumulative * circ * precision) / precision;


			point.shapeType = 'arc';
			point.shapeArgs = {
				x: positions[0],
				y: positions[1],
				r: positions[2] / 2,
				innerR: positions[3] / 2,
				start: start,
				end: end
			};


			angle = (end + start) / 2;
			point.slicedTranslation = map([
				mathCos(angle) * slicedOffset + chart.plotLeft,
				mathSin(angle) * slicedOffset + chart.plotTop
			], mathRound);


			radiusX = mathCos(angle) * positions[2] / 2;
			radiusY = mathSin(angle) * positions[2] / 2;
			point.tooltipPos = [
				positions[0] + radiusX * 0.7,
				positions[1] + radiusY * 0.7
			];


			point.labelPos = [
				positions[0] + radiusX + mathCos(angle) * labelDistance,
				positions[1] + radiusY + mathSin(angle) * labelDistance,
				positions[0] + radiusX + mathCos(angle) * connectorOffset,
				positions[1] + radiusY + mathSin(angle) * connectorOffset,
				positions[0] + radiusX,
				positions[1] + radiusY,
				labelDistance < 0 ?
					'center' :
					angle < circ / 4 ? 'left' : 'right',
				angle
			];
			

			point.percentage = fraction * 100;
			point.total = total;

		});


		this.setTooltipPoints();
	},

	
	render: function () {
		var series = this;


		series.getAttribs();

		this.drawPoints();


		if (series.options.enableMouseTracking !== false) {
			series.drawTracker();
		}

		this.drawDataLabels();

		if (series.options.animation && series.animate) {
			series.animate();
		}


		series.isDirty = false;
	},

	
	drawPoints: function () {
		var series = this,
			chart = series.chart,
			renderer = chart.renderer,
			groupTranslation,

			graphic,
			group,
			shadow = series.options.shadow,
			shadowGroup,
			shapeArgs;


		each(series.points, function (point) {
			graphic = point.graphic;
			shapeArgs = point.shapeArgs;
			group = point.group;
			shadowGroup = point.shadowGroup;


			if (shadow && !shadowGroup) {
				shadowGroup = point.shadowGroup = renderer.g('shadow')
					.attr({ zIndex: 4 })
					.add();
			}


			if (!group) {
				group = point.group = renderer.g('point')
					.attr({ zIndex: 5 })
					.add();
			}


			groupTranslation = point.sliced ? point.slicedTranslation : [chart.plotLeft, chart.plotTop];
			group.translate(groupTranslation[0], groupTranslation[1]);
			if (shadowGroup) {
				shadowGroup.translate(groupTranslation[0], groupTranslation[1]);
			}


			if (graphic) {
				graphic.animate(shapeArgs);
			} else {
				point.graphic = graphic = renderer.arc(shapeArgs)
					.setRadialReference(series.center)
					.attr(extend(
						point.pointAttr[NORMAL_STATE],
						{ 'stroke-linejoin': 'round' }
					))
					.add(point.group)
					.shadow(shadow, shadowGroup);
				
			}


			if (point.visible === false) {
				point.setVisible(false);
			}

		});

	},

	
	drawDataLabels: function () {
		var series = this,
			data = series.data,
			point,
			chart = series.chart,
			options = series.options.dataLabels,
			connectorPadding = pick(options.connectorPadding, 10),
			connectorWidth = pick(options.connectorWidth, 1),
			connector,
			connectorPath,
			softConnector = pick(options.softConnector, true),
			distanceOption = options.distance,
			seriesCenter = series.center,
			radius = seriesCenter[2] / 2,
			centerY = seriesCenter[1],
			outside = distanceOption > 0,
			dataLabel,
			labelPos,
			labelHeight,
			halves = [
				[],
				[]
			],
			x,
			y,
			visibility,
			rankArr,
			sort,
			i = 2,
			j;


		if (!options.enabled) {
			return;
		}


		Series.prototype.drawDataLabels.apply(series);


		each(data, function (point) {
			if (point.dataLabel) {
				halves[
					point.labelPos[7] < mathPI / 2 ? 0 : 1
				].push(point);
			}
		});
		halves[1].reverse();


		sort = function (a, b) {
			return b.y - a.y;
		};


		labelHeight = halves[0][0] && halves[0][0].dataLabel && (halves[0][0].dataLabel.getBBox().height || 21);

		
		while (i--) {

			var slots = [],
				slotsLength,
				usedSlots = [],
				points = halves[i],
				pos,
				length = points.length,
				slotIndex;


			if (distanceOption > 0) {
				

				for (pos = centerY - radius - distanceOption; pos <= centerY + radius + distanceOption; pos += labelHeight) {
					slots.push(pos);

					
				}
				slotsLength = slots.length;
	

				if (length > slotsLength) {

					rankArr = [].concat(points);
					rankArr.sort(sort);
					j = length;
					while (j--) {
						rankArr[j].rank = j;
					}
					j = length;
					while (j--) {
						if (points[j].rank >= slotsLength) {
							points.splice(j, 1);
						}
					}
					length = points.length;
				}
	


				for (j = 0; j < length; j++) {
	
					point = points[j];
					labelPos = point.labelPos;
	
					var closest = 9999,
						distance,
						slotI;
	

					for (slotI = 0; slotI < slotsLength; slotI++) {
						distance = mathAbs(slots[slotI] - labelPos[1]);
						if (distance < closest) {
							closest = distance;
							slotIndex = slotI;
						}
					}
	


					if (slotIndex < j && slots[j] !== null) {
						slotIndex = j;
					} else if (slotsLength  < length - j + slotIndex && slots[j] !== null) {
						slotIndex = slotsLength - length + j;
						while (slots[slotIndex] === null) {
							slotIndex++;
						}
					} else {


						while (slots[slotIndex] === null) {
							slotIndex++;
						}
					}
	
					usedSlots.push({ i: slotIndex, y: slots[slotIndex] });
					slots[slotIndex] = null;
				}

				usedSlots.sort(sort);
			}


			for (j = 0; j < length; j++) {
				
				var slot, naturalY;

				point = points[j];
				labelPos = point.labelPos;
				dataLabel = point.dataLabel;
				visibility = point.visible === false ? HIDDEN : VISIBLE;
				naturalY = labelPos[1];
				
				if (distanceOption > 0) {
					slot = usedSlots.pop();
					slotIndex = slot.i;



					y = slot.y;
					if ((naturalY > y && slots[slotIndex + 1] !== null) ||
							(naturalY < y &&  slots[slotIndex - 1] !== null)) {
						y = naturalY;
					}
					
				} else {
					y = naturalY;
				}



				x = options.justify ? 
					seriesCenter[0] + (i ? -1 : 1) * (radius + distanceOption) :
					series.getX(slotIndex === 0 || slotIndex === slots.length - 1 ? naturalY : y, i);
				

				dataLabel
					.attr({
						visibility: visibility,
						align: labelPos[6]
					})[dataLabel.moved ? 'animate' : 'attr']({
						x: x + options.x +
							({ left: connectorPadding, right: -connectorPadding }[labelPos[6]] || 0),
						y: y + options.y
					});
				dataLabel.moved = true;


				if (outside && connectorWidth) {
					connector = point.connector;

					connectorPath = softConnector ? [
						M,
						x + (labelPos[6] === 'left' ? 5 : -5), y,
						'C',
						x, y,
						2 * labelPos[2] - labelPos[4], 2 * labelPos[3] - labelPos[5],
						labelPos[2], labelPos[3],
						L,
						labelPos[4], labelPos[5]
					] : [
						M,
						x + (labelPos[6] === 'left' ? 5 : -5), y,
						L,
						labelPos[2], labelPos[3],
						L,
						labelPos[4], labelPos[5]
					];

					if (connector) {
						connector.animate({ d: connectorPath });
						connector.attr('visibility', visibility);

					} else {
						point.connector = connector = series.chart.renderer.path(connectorPath).attr({
							'stroke-width': connectorWidth,
							stroke: options.connectorColor || point.color || '#606060',
							visibility: visibility,
							zIndex: 3
						})
						.translate(chart.plotLeft, chart.plotTop)
						.add();
					}
				}
			}
		}
	},

	
	drawTracker: ColumnSeries.prototype.drawTracker,

	
	drawLegendSymbol: AreaSeries.prototype.drawLegendSymbol,

	
	getSymbol: function () {}

};
PieSeries = extendClass(Series, PieSeries);
seriesTypes.pie = PieSeries;



extend(Highcharts, {
	

	Axis: Axis,
	CanVGRenderer: CanVGRenderer,
	Chart: Chart,
	Color: Color,
	Legend: Legend,
	Point: Point,
	Tick: Tick,
	Tooltip: Tooltip,
	Renderer: Renderer,
	Series: Series,
	SVGRenderer: SVGRenderer,
	VMLRenderer: VMLRenderer,
	

	dateFormat: dateFormat,
	pathAnim: pathAnim,
	getOptions: getOptions,
	hasBidiBug: hasBidiBug,
	numberFormat: numberFormat,
	seriesTypes: seriesTypes,
	setOptions: setOptions,
	addEvent: addEvent,
	removeEvent: removeEvent,
	createElement: createElement,
	discardElement: discardElement,
	css: css,
	each: each,
	extend: extend,
	map: map,
	merge: merge,
	pick: pick,
	splat: splat,
	extendClass: extendClass,
	pInt: pInt,
	product: 'Highcharts',
	version: '2.2.5'
});
}());
