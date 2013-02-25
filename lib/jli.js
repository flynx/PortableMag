/**********************************************************************
* JavaScript Lib
* at this point this is just a place I put most of the generic stuff I 
* use.
* 
* P.S. the name "jli" just stands for Java script LIb, like how it 
* looks...
**********************************************************************/

//var DEBUG = DEBUG != null ? DEBUG : true



/*********************************************************************/

// this will create a function that will cycle through a class_list on elem 
// calling the optional callbacks before and/or after.
// if class_list is given as a string, then this will create a toggler that 
// will turn the given class on the element on and off.
//
// elem is a jquery compatible object; default use-case: a css selector.
//
// if class_list is a string, the resulting function understands the 
// folowing arguments:
// 	- <index>		: 0 for 'off' and 1 for 'on' (see below)
// 	- 'on'			: switch mode on -- add class
// 	- 'off'			: switch mode off -- remove class
// 	- '?'			: return current state ('on'|'off')
// 	- no arguments	: toggle the state
//
// otherwise, if class_list is a list of strings:
//  - <index>		: explicitly set the state to index in class_list
//  - <class-name>	: explicitly set a class from the list
// 	- '?'			: return current state ('on'|'off')
// 	- no arguments	: set next state in cycle
//
// NOTE: a special class name 'none' means no class is set, if it is present 
// 		in the class_list then that state will be with all other state 
// 		classes removed.
// NOTE: <class-name> must be an exact match to a string given in class_list
// NOTE: of only one callback is given then it will be called after the 
// 		class change...
// 		a way around this is to pass an empty function as callback_b
//
function createCSSClassToggler(elem, class_list, callback_a, callback_b){
	var bool_action = false
	if(typeof(class_list) == typeof('')){
		class_list = ['none', class_list]
		bool_action = true
	}
	if(callback_b == null){
		var callback_pre = null
		var callback_post = callback_a
	} else {
		var callback_pre = callback_a
		var callback_post = callback_b
	}

	// XXX make this generic...
	var func = function(action){
		elem = $(elem)
		// option number...
		if(typeof(action) == typeof(1)){
			// range check...
			if(action < 0 || action >= class_list.length){
				return null
			}
			if(bool_action){
				action = action == 0 ? 'off' : 'on'
			} else {
				action = class_list[action]
			}
		}
		// we need to get the current state...
		if(action == null || action == '?'){
			// get current state...
			var cur = 'none'
			for(var i=0; i < class_list.length; i++){
				if(elem.hasClass(class_list[i])){
					cur = class_list[i]
					break
				}
			} 
			// just asking for info...
			if(action == '?'){
				return bool_action ? (cur == 'none' ? 'off' : 'on') : cur
			}

		// invalid action...
		} else if((bool_action && ['on', 'off'].indexOf(action) == -1)
				|| (!bool_action && class_list.indexOf(action) == -1)){
			return null
		}

		var cls = bool_action ? class_list[1] : action
		// get the right class...
		if(action == null){
			var i = class_list.indexOf(cur)+1
			i = i == -1 ? 0 : i
			i = i == class_list.length ? 0 : i
			cls = class_list[i]

			if(bool_action){
				action = cls == 'none' ? 'off' : 'on'
			} else {
				action = cls
			}
		}

		// pre callback...
		if(callback_a != null){
			callback_a(action)
		}
		// update the element...
		elem.removeClass(class_list.join(' '))
		if(cls != 'none' && action != 'off'){
			elem.addClass(cls)
		}
		// post callback...
		if(callback_b != null){
			callback_b(action)
		}

		return action
	}

	func.class_list = class_list
	if(bool_action){
		func.doc = 'With no arguments this will toggle between "on" and '+
			'"off".\n'+
			'If either "on" or "off" are given then this will switch '+
			'to that mode.\n'+
			'If "?" is given, this will return either "on" or "off" '+
			'depending on the current state.'
	}else{
		func.doc = 'With no arguments this will toggle between '+
			class_list +' in cycle.\n' + 
			'if any of the state names or its number is given then that '+
			'state is switched on.'+
			'If "?" is given, this will return the current state.'
	}

	return func
}



// show a jQuary opject in viewer overlay...
// XXX need to set .scrollTop(0) when showing different UI... 
// 		...and not set it when the UI is the same
// XXX this must create it's own overlay...
function showInOverlay(obj){
	obj.click(function(){ return false })
	// XXX 
	$('.viewer').addClass('overlay-mode')
	// clean things up...
	$('.overlay .content').children().remove()
	// put it in the overlay...
	$('.overlay .content').append(obj)
	// prepare the overlay...
	$('.overlay')
		.one('click', function(){
			$('.overlay')
				.fadeOut(function(){
					$('.overlay .content')
						.children()
							.remove()
					$('.overlay-mode').removeClass('overlay-mode')
				})
		})
		.fadeIn()
	return obj
}



function overlayMessage(text){
	return showInOverlay($('<div class="overlay-message">' +text+ '</div>'))
}



function unanimated(obj, func, time){
	return function(){
		if(time == null){
			time = 5
		}	
		obj = $(obj)
		obj.addClass('unanimated')
		var res = func.apply(func, arguments)
		setTimeout(function(){obj.removeClass('unanimated')}, time)
		return res
	}
}



var USE_3D_TRANSFORM = true

// NOTE: at this point this works only on the X axis...
function setElementTransform(elem, offset, scale, duration){
	elem = $(elem)
	var t3d = USE_3D_TRANSFORM ? 'translateZ(0px)' : ''

	if(offset == null){
		offset = getElementShift(elem)
	// number -- only the x coord...
	} else if(typeof(offset) == typeof(1)){
		offset = {
			left: offset,
			top: 0
		}
	// array...
	} else if(offset.indexOf){
		offset = {
			left: offset[0] ? offset[0] : 0,
			top: offset[1] ? offset[1] : 0
		}
	}
	if(scale == null){
		var scale = getElementScale(elem)
	}
	if(USE_TRANSFORM){
		var transform = 'translate('+ Math.round(offset.left) +'px, '+ Math.round(offset.top) +'px) scale('+ scale +') ' + t3d
		elem.css({
			'-ms-transform' : transform, 
			'-webkit-transform' : transform, 
			'-moz-transform' : transform, 
			'-o-transform' : transform, 
			'transform' : transform, 

			// XXX can we avoid this here?? 
			left: 0,
			// XXX is this correct???
			top: ''
		}, duration)
	} else {
		var transform = 'translate(0px, 0px) scale('+ scale +') ' + t3d
		elem.css({
			// NOTE: this will be wrong during a transition, that's why we 
			// 		can pass the pre-calculated offset as an argument...
			left: Math.round(offset.left),
			top: Math.round(offset.top),

			// XXX can we avoid this here?? 
			'-ms-transform' : transform, 
			'-webkit-transform' : transform, 
			'-moz-transform' : transform, 
			'-o-transform' : transform, 
			'transform' : transform, 
		}, duration)
	}
	return elem
}

// Return a scale value for the given element(s).
// NOTE: this will only return a single scale value...
function getElementScale(elem){
	elem = $(elem)
	//var transform = elem.css('transform')
	var vendors = ['o', 'moz', 'ms', 'webkit']
	var transform = elem.css('transform')
	var res

	// go through vendor prefixes... (hate this!)
	if(!transform || transform == 'none'){
		for(var i in vendors){
			transform = elem.css('-' + vendors[i] + '-transform')
			if(transform && transform != 'none'){
				break
			}
		}
	}
	// no transform is set...
	if(!transform || transform == 'none'){
		return 1
	}
	// get the scale value -- first argument of scale/matrix...
	return parseFloat((/(scale|matrix)\(([^,]*),.*\)/).exec(transform)[2])
}

// XXX account for other transitions...
function setElementScale(elem, scale){
	return setElementTransform(elem, null, scale)
}

function getElementShift(elem){
	elem = $(elem)
	// using transform...
	if(USE_TRANSFORM){
		var vendors = ['o', 'moz', 'ms', 'webkit']
		var transform = elem.css('transform')
		var res

		// go through vendor prefixes... (hate this!)
		if(!transform || transform == 'none'){
			for(var i in vendors){
				transform = elem.css('-' + vendors[i] + '-transform')
				if(transform && transform != 'none'){
					break
				}
			}
		}
		// no transform is set...
		if(!transform || transform == 'none'){
			return {left: 0, top: 0}
		}
		res = /(translate\(|matrix\([^,]*,[^,]*,[^,]*,[^,]*,)([^,]*),([^\)]*)\)/.exec(transform)
		return {
			left: parseFloat(res[2]),
			top: parseFloat(res[3])
		}
	// using left...
	} else {
		return {
			left: elem.position().left,
			top: elem.position().top
		}
	}
}


function setTransitionEasing(elem, ease){
	if(typeof(ms) == typeof(0)){
		ms = ms + 'ms'
	}
	return elem.css({
		'transition-timing-function': ease, 
		'-moz-transition-timing-function': ease,
		'-o-transition-timing-function': ease,
		'-ms-transition-timing-function': ease,
		'-webkit-transition-timing-function': ease
	})
}

function setTransitionDuration(elem, ms){
	if(typeof(ms) == typeof(0)){
		ms = ms + 'ms'
	}
	return elem.css({
		'transition-duration': ms, 
		'-moz-transition-duration': ms,
		'-o-transition-duration': ms,
		'-ms-transition-duration': ms,
		'-webkit-transition-duration': ms
	})
}



/************************************************* keyboard handler **/

// NOTE: don't understand why am I the one who has to write this...
var SPECIAL_KEYS = {
	// Special Keys...
	9:		'Tab',		33:		'PgUp',		45:		'Ins',		
	13:		'Enter',	34:		'PgDown',	46:		'Del',		
	16:		'Shift',	35:		'End',		80:		'Backspace',
	17:		'Ctrl',		36:		'Home',		91:		'Win',		
	18:		'Alt',		37:		'Right',	93:		'Menu',		
	20:		'Caps Lock',38:		'Up',	 
	27:		'Esc',		39:		'Left',  
	32:		'Space',	40:		'Down',  

	// Function Keys...
	112:	'F1',		116:	'F5',		120:	'F9', 
	113:	'F2',		117:	'F6',		121:	'F10',
	114:	'F3',		118:	'F7',		122:	'F11',
	115:	'F4',		119:	'F8',		123:	'F12',
}

// XXX some keys look really wrong...
function toKeyName(code){
	// check for special keys...
	var k = SPECIAL_KEYS[code]
	if(k != null){
		return k
	}
	// chars...
	k = String.fromCharCode(code)
	if(k != ''){
		return k.toLowerCase()
	}
	return null
}


// if set to false the event handlers will always return false...
var KEYBOARD_HANDLER_PROPAGATE = true

/* Basic key format:
 *
 * 		<key-code> : <callback>,
 *
 * 		<key-code> : {
 * 			'default': <callback>,
 *			// a modifier can be any single modifier, like shift or a 
 *			// combination of modifers like 'ctrl+shift', given in order 
 *			// of priority.
 *			// supported modifiers are (in order of priority):
 *			//	- ctrl
 *			//	- alt
 *			//	- shift
 * 			<modifer>: [...]
 * 		},
 *
 * 		<key-code> : [
 *			// this can be any type of handler except for an alias...
 * 			<handler>, 
 * 			<doc>
 * 		],
 *
 *		// alias...
 * 		<key-code-a> : <key-code-b>,
 *
 * XXX might need to add meta information to generate sensible help...
 */
function makeKeyboardHandler(keybindings, unhandled){
	if(unhandled == null){
		//unhandled = function(){return false}
		unhandled = function(){return KEYBOARD_HANDLER_PROPAGATE}
	}
	return function(evt){
		var did_handling = false
		var res = null
		for(var mode in keybindings){
			if($(mode).length > 0){
				var bindings = keybindings[mode]

				var key = evt.keyCode
				if(bindings.ignore == '*' 
						|| bindings.ignore != null && bindings.ignore.indexOf(key) != -1){
					// return true
					res = res == null ? true : res
					did_handling = true
					continue
				}
				// XXX ugly...
				var modifers = evt.ctrlKey ? 'ctrl' : ''
				modifers += evt.altKey ? (modifers != '' ? '+alt' : 'alt') : ''
				modifers += evt.shiftKey ? (modifers != '' ? '+shift' : 'shift') : ''

				var handler = bindings[key]

				// alias...
				while (typeof(handler) == typeof(123)) {
					handler = bindings[handler]
				}
				// no handler...
				if(handler == null){
					continue
				}
				// Array, lisp style with docs...
				// XXX for some odd reason in chrome typeof([]) == typeof({})!!!
				if(typeof(handler) == typeof([]) && handler.constructor.name == 'Array'){
					// we do not care about docs here, so just get the handler...
					handler = handler[0]
				}
				// complex handler...
				if(typeof(handler) == typeof({})){
					var callback = handler[modifers]
					if(callback == null){
						callback = handler['default']
					}
					if(callback != null){
						res = callback()
						did_handling = true
						continue
					}
				} else {
					// simple callback...
					res = handler() 
					did_handling = true
					continue
				}
			}
		}
		if(!did_handling){
			// key is unhandled by any modes...
			return unhandled(key)
		} else {
			// XXX should we handle multiple hits???
			return KEYBOARD_HANDLER_PROPAGATE&&res?true:false
		}
	}
}



// click threshold in pixels, if the distance between start and end is 
// less than this, the whole event is considered a click and not a 
// drag/swipe...
var CLICK_THRESHOLD = 10

// if the amount of time to wait beween start and end is greater than this
// the event is considered a long click.
// NOTE: this will not auto-fire the event, the user MUST release first.
var LONG_CLICK_THRESHOLD = 400

// the maximum amount of time between clicks to count them together.
// NOTE: if multi-clicks are disabled this has no effect.
// NOTE: this is reset by the timeout explicitly set in the handler...
// NOTE: this is the timeout between two consecutive clicks and not the total.
// NOTE: if multiple clicks are enabled this will introduce a lag after
// 		each click (while we wait for the next), so keep this as small 
// 		as possible.
var MULTI_CLICK_TIMEOUT = 200

// the amount of time between finger releases.
// NOTE: when this is passed all the fingers released before are ignored.
var MULTITOUCH_RELEASE_THRESHOLD = 100

// XXX add a resonable cancel scheme...
// 		... something similar to touch threshold but bigger...
// XXX handle multiple touches...
// 		- timeout on lift to count fingers...
// XXX setup basic styles for the contained element...
// XXX revise...
// XXX test on other devices...
// XXX BUG: on landing a second finger while scrolling the things goes 
// 		haywhire...
// 		...check if this is gone...
// XXX add something like a scrollTo that would understand elements as 
// 		well as explicit positions.
// XXX split this into a seporate lib...
function makeScrollHandler(root, config){
	root = $(root)

	// local data...
	var ignoring = false
	var cancelThreshold
	var scrolled
	// XXX this and scroller.state are redundent...
	var scrolling = false
	var touch = false
	var touches = 0
	var start_x
	var start_y
	var start_t
	var prev_x
	var prev_y
	var prev_t
	var bounds
	var shift
	var scale
	var x
	var y
	var t
	var dx
	var dy
	var dt
	var max_dx = 0
	var max_dy = 0

	function startMoveHandler(evt){
		var options = scroller.options
		// ignore...
		if(options.ignoreElements 
				&& $(evt.target).closest(options.ignoreElements).length > 0){
			ignoring = true
			return
		} else {
			ignoring = false
		}
		if(event.touches != null){
			touch = true
		}
		cancelThreshold = options.scrollCancelThreshold
		touches = touch ? event.touches.length : 1
		// if we are already touching then just skip on this...
		// XXX test this...
		if(touches > 1){
			return false
		}
		prev_t = event.timeStamp || Date.now();
		start_t = prev_t
		if(options.autoCancelEvents){
			bounds = {
				left: options.eventBounds,
				right: root.width() - options.eventBounds,
				top: options.eventBounds,
				bottom: root.height() - options.eventBounds 
			}
		}
		//togglePageDragging('on')
		scrolled = $(root.children()[0])
		setTransitionDuration(scrolled, 0)
		// XXX these two are redundant...
		scrolling = true
		scroller.state = 'scrolling'
		options.enabelStartEvent && root.trigger('userScrollStart')
		// XXX do we need to pass something to this?
		options.preCallback && options.preCallback()

		shift = getElementShift(scrolled)
		scale = getElementScale(scrolled)
		// get the user coords...
		prev_x = touch ? event.touches[0].pageX : evt.clientX
		start_x = prev_x
		prev_y = touch ? event.touches[0].pageY : evt.clientY
		start_y = prev_y

		return false
	}

	// XXX try and make this adaptive to stay ahead of the lags...
	// NOTE: this does not support limiting the scroll, might be done in
	// 		the future though.
	// 		The way to go about this is to track scrolled size in the 
	// 		callback...
	function moveHandler(evt){
		if(ignoring){
			return
		}
		var options = scroller.options
		evt.preventDefault()
		t = event.timeStamp || Date.now();
		// get the user coords...
		x = touch ? event.touches[0].pageX : evt.clientX
		y = touch ? event.touches[0].pageY : evt.clientY
		touches = touch ? event.touches.length : 1

		// XXX needs testing...
		// XXX do we need to account for scrollDisabled here???
		// check scroll bounds...
		if(bounds != null){
			if(options.hScroll && (x <= bounds.left || x >= bounds.right)
					|| options.vScroll && (y <= bounds.top || y >= bounds.bottom)){
				// XXX cancel the touch event and trigger the end handler...
				return endMoveHandler(evt)
			}
		}

		// do the actual scroll...
		if(!options.scrollDisabled && scrolling){
			if(options.hScroll){
				shift.left += x - prev_x
			}
			if(options.vScroll){
				shift.top += y - prev_y
			}
			setElementTransform(scrolled, shift, scale)

			// XXX these should be done every time the event is caught or 
			// 		just while scrolling?
			dx = x - prev_x
			dy = y - prev_y
			max_dx += Math.abs(dx)
			max_dy += Math.abs(dy)
			dt = t - prev_t
			prev_x = x
			prev_y = y
			prev_t = t

			options.enableUserScrollEvent && root.trigger('userScroll')
		}
		return false
	}

	function endMoveHandler(evt){
		t = event.timeStamp || Date.now();
		touches = touch ? event.touches.length : 0
		if(ignoring){
			if(touches == 0){
				ignoring = false
			}
			return
		}
		var options = scroller.options

		// XXX get real transition duration...
		scroller.resetTransitions()

		x = touch ? event.changedTouches[0].pageX : evt.clientX
		y = touch ? event.changedTouches[0].pageY : evt.clientY
		// check if we are canceling...
		if(cancelThreshold 
				&& Math.abs(start_x-x) < cancelThreshold 
				&& Math.abs(start_y-y) < cancelThreshold
				&& (max_dx > cancelThreshold 
					|| max_dy > cancelThreshold)){
			scroller.state = 'canceling'
		}

		var data = {
			orig_event: evt, 
			scroller: scroller, 
			speed: {
				x: dx/dt,
				y: dy/dt
			},
			distance: {
				x: start_x-x,
				y: start_y-y
			},
			duration: t-start_t, 
			// current touches...
			touches: touches,
			clicks: null,
		}
		// XXX stop only if no fingers are touching or let the callback decide...
		//togglePageDragging('off')
		// XXX update this with the new data model!!! (see below)
		options.enableEndEvent && root.trigger('userScrollEnd', data)
		if(options.postCallback 
				// XXX revise this....
				&& options.postCallback(data) === false 
				|| touches == 0){
			// cleanup and stop...
			touch = false
			scrolling = false
			scroller.state = 'waiting'
			scrolled = null 
			bounds = null
			max_dx = 0
			max_dy = 0
		}

		return false
	}


	var scroller = {
		options: {
			// if one of these is false, it will restrict scrolling in 
			// that direction. hScroll for horizontal and vScroll for 
			// vertical.
			// NOTE: to disable scroll completely use scrollDisabled, see
			// 		below for details.
			hScroll: true,
			vScroll: true,

			// this will disable scroll.
			// NOTE: this is the same as setting both vScroll and hScroll 
			// 		to false, but can be set and reset without affecting 
			// 		the actual settings individually...
			// NOTE: this takes priority over hScroll/vScroll.
			scrollDisabled: false,

			// sets the default transition settings while not scrolling...
			transitionDuration: 200,
			transitionEasing: 'ease',

			// items to be ignored by the scroller...
			// this is a jQuery compatible selector.
			ignoreElements: '.noScroll',
			// this is the side of the rectangle in px, if the user moves
			// out of it, and then returns back, the action will get cancelled.
			// i.e. the callback will get called with the "cancelling" state.
			scrollCancelThreshold: 100,

			// these control weather in-scroll events will get triggered.
			// NOTE: these may impact performance, especially the scroll 
			// 		event, thus they need to enabled explicitly.
			enabelStartEvent: false,
			enableUserScrollEvent: false,
			enableEndEvent: false,

			// XXX padding within the target element moving out of which 
			// 		will cancell the action...
			// XXX needs testing...
			autoCancelEvents: false,
			eventBounds: 5,

			preCallback: null,
			// callback to be called when the user lifts a finger/mouse.
			// NOTE: this may happen before the scroll is done, for instance
			// 		when one of several fingers participating in the action
			// 		gets lifted.
			// NOTE: if this returns false explicitly, this will stop scrolling.
			postCallback: postScrollCallback,

			// These are used by the default callback...
			// if true then doubleClick and multiClick events will get 
			// triggered.
			// NOTE: this will introduce a lag needed to wait for next 
			// 		clicks in a group.
			// NOTE: when this is false, shortClick is triggered for every 
			// 		single click separately.
			enableMultiClicks: false,
			// NOTE: if these are null, respective values from the env will
			// 		be used.
			clickThreshold: null,
			longClickThreshold: null,
			multiClickTimeout: null,
			multitouchTimeout: null,
		},
		// NOTE: this is updated live but not used by the system in any way...
		state: 'stopped',
		root: root,

		start: function(){
			this.state = 'waiting'
			// XXX STUB: this makes starting the scroll a bit sluggish, 
			//		find a faster way...
			//togglePageDragging('on')

			// NOTE: if we bind both touch and mouse events, on touch devices they 
			//		might start interfering with each other...
			if('ontouchmove' in window){
				root
					.on('touchstart', startMoveHandler)
					.on('touchmove', moveHandler) 
					.on('touchend', endMoveHandler)
					.on('touchcancel', endMoveHandler)
			} else {
				root
					.on('mousedown', startMoveHandler) 
					.on('mousemove', moveHandler) 
					.on('mouseup', endMoveHandler) 
			}
			return this
		},
		stop: function(){
			if('ontouchmove' in window){
				root
					.off('touchstart', startMoveHandler)
					.off('touchmove', moveHandler) 
					.off('touchend', endMoveHandler)
			} else {
				root
					.off('mousedown', startMoveHandler) 
					.off('mousemove', moveHandler) 
					.off('mouseup', endMoveHandler) 
			}
			this.state = 'stopped'
			return this
		},
		resetTransitions: function(){
			var scrolled = this.root.children().first()
			setTransitionDuration(scrolled, this.options.transitionDuration)
			setTransitionEasing(scrolled, this.options.transitionEasing)
		}
	}

	// merge the config with the defaults...
	if(config != null){
		$.extend(scroller.options, config)
	}

	return scroller
}

// default callback...
// This will provide support for the folowing events on the scroll root
// element:
// 		- scrollCancelled
//
// 		- shortClick
// 		- doubleClick
// 		- multiClick
// 			this will store the number of clicks in data.clicks
// 		- longClick
//
// 		- swipeLeft
// 		- swipeRight
// 		- swipeUp
// 		- swipeDown
//
// 		- screenReleased
//
// NOTE: data.touches passed to the event is the number of touches 
// 		released within the multitouchTimeout.
// 		this differs from what postScrollCallback actually gets in the 
// 		same field when it recieves the object.
// XXX add generic snap
// XXX add generic innertial scroll
// XXX test multiple touches...
function postScrollCallback(data){
	var scroller = data.scroller
	var options = scroller.options
	var root = scroller.root
	var clickThreshold = options.clickThreshold || CLICK_THRESHOLD
	var longClickThreshold = options.longClickThreshold || LONG_CLICK_THRESHOLD
	var multitouchTimeout = options.multitouchTimeout || MULTITOUCH_RELEASE_THRESHOLD
	var enableMultiClicks = options.enableMultiClicks
	var multiClickTimeout = options.multiClickTimeout || MULTI_CLICK_TIMEOUT

	var now = Date.now();

	// cancel event...
	if(scroller.state == 'canceling'){
		return root.trigger('scrollCancelled', data)
	}

	// handle multiple touches...
	if(data.touches > 0){
		var then = scroller._last_touch_release
		if(then == null || now - then < multitouchTimeout){
			if(scroller._touches == null){
				scroller._touches = 1
			} else {
				scroller._touches += 1
			}
		} else {
			scroller._touches = null
		}
		// wait for the next touch release...
		scroller._last_touch_release = now
		return

	// calculate how many touches did participate... 
	} else {
		data.touches = scroller._touches ? scroller._touches + 1 : 1
		scroller._last_touch_release = null
		scroller._touches = null
	}

	// clicks, double-clicks, multi-clicks and long-clicks...
	if(Math.max(
			Math.abs(data.distance.x), 
			Math.abs(data.distance.y)) < clickThreshold){
		if(data.duration > longClickThreshold){
			return root.trigger('longClick', data) 
		}
		if(!enableMultiClicks){
			return root.trigger('shortClick', data)

		} else {
			// count the clicks so far...
			if(scroller._clicks == null){
				scroller._clicks = 1
			} else {
				scroller._clicks += 1
			}

			// kill any previous waits...
			if(scroller._click_timeout_id != null){
				clearTimeout(scroller._click_timeout_id)
			}

			// wait for the next click...
			scroller._click_timeout_id = setTimeout(function(){
				var clicks = scroller._clicks
				data.clicks = clicks
				if(clicks == 1){
					root.trigger('shortClick', data)
				} else if(clicks == 2){
					root.trigger('doubleClick', data)
				} else {
					root.trigger('multiClick', data)
				}					
				scroller._clicks = null
				scroller._click_timeout_id = null
			}, multiClickTimeout)

			return
		}
	}

	// swipes...
	// XXX might be a good idea to chain these with swipe and screenReleased
	if(Math.abs(data.distance.x) > Math.abs(data.distance.y)){
		if(data.distance.x <= -clickThreshold && root.data('events').swipeLeft){
			return root.trigger('swipeLeft', data)
		} else if(data.distance.x >= clickThreshold && root.data('events').swipeRight){
			return root.trigger('swipeRight', data)
		}
	} else {
		if(data.distance.y <= -clickThreshold && root.data('events').swipeUp){
			return root.trigger('swipeUp', data)
		} else if(data.distance.y >= clickThreshold && root.data('events').swipeDown){
			return root.trigger('swipeDown', data)
		}
	}

	// this is triggered of no swipes were handled...
	return root.trigger('screenReleased', data)
} 



/************************************************ jQuery extensions **/

jQuery.fn.reverseChildren = function(){
	return $(this).each(function(_, e){
		return $(e).append($(e).children().detach().get().reverse())
	})
}



jQuery.fn.sortChildren = function(func){
	return $(this).each(function(_, e){
		return $(e).append($(e).children().detach().get().sort(func))
	})
}



/********************************************************** logger ***/

function Logger(){
	_log = null
	return {
		setup: function(){
			if(_log == null){
				_log = $('<div id="log"></div>')
					.css({
						position: 'fixed',
						background: 'silver',
						opacity: 0.5,
						width: 200,
						height: '80%',
						top: 10,
						left: 10,
						'z-index': 90000,
						overflow: 'hidden',
						padding: 10,
					})
					.text('log')
					.appendTo($('body'))
			} else {
				_log.appendTo($('body'))
			}
			return this
		},
		remove: function(){
			_log.detach()
			return this
		},
		log: function(text){
			_log.html(_log.html() + '<br>' + text + '')
			_log.scrollTop(_log.prop('scrollHeight'))
			return this
		},
		clear: function(){
			_log.html('')
			return this
		},
		get: function(){
			return _log
		},
		set: function(elem){
			_log = elem
		}
	}.setup()
}



/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
