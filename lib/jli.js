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



/*
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
*/



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


// NOTE: this will only use the first element in a set.
// NOTE: if no element is given this will return null.
function makeCSSVendorAttrGetter(attr, dfl, callback){
	return function(elem){
		elem = $(elem)
		if(elem.length == 0){
			return null
		}
		// using the attr...
		var vendors = ['O', 'Moz', 'ms', 'webkit']
		var data = elem[0].style[attr]

		// go through vendor prefixes... (hate this!)
		if(!data || data == 'none'){
			for(var i in vendors){
				data = elem[0].style[vendors[i] + attr.capitalize()]
				if(data && data != 'none'){
					break
				}
			}
		}
		// no data is set...
		if(!data || data == 'none'){
			return dfl
		}
		return callback(data)
	}
}


// Return a scale value for the given element(s).
// NOTE: this will only return a single scale value...
var getElementScale = makeCSSVendorAttrGetter(
		'transform',
		1,
		function(data){
			return parseFloat((/(scale|matrix)\(([^),]*)\)/).exec(data)[2])
		})

var getElementShift = makeCSSVendorAttrGetter(
		'transform',
		{left: 0, top: 0},
		function(data){
			res = /(translate\(|matrix\([^,]*,[^,]*,[^,]*,[^,]*,)([^,]*),([^\)]*)\)/.exec(data)
			return {
				left: parseFloat(res[2]),
				top: parseFloat(res[3])
			}
		})


var DEFAULT_TRANSITION_DURATION = 200

var getElementTransitionDuration = makeCSSVendorAttrGetter(
		'transitionDuration', 
		DEFAULT_TRANSITION_DURATION, 
		parseInt)



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


// XXX this affects only the innertial part, not setCurrentPage...
var USE_TRANSITIONS_FOR_ANIMATION = false

// XXX make this a drop-in replacement for setElementTransform...
// XXX cleanup, still flacky...
function animateElementTo(elem, to, duration, easing, speed){
	// stop all ongoing animations on the current elem...
	stopAnimation(elem)
	// use transition for animation...
	if(USE_TRANSITIONS_FOR_ANIMATION){
		setTransitionEasing(elem, easing)
		duration == null && setTransitionDuration(elem, duration)
		setElementTransform(elem, to)

	// manually animate...
	} else {
		if(typeof(to) == typeof(1)){
			to = {
				left: to,
				top: 0,
			}
		}
		if(typeof(speed) == typeof(2)){
			speed = {
				x: speed,
				y: 0,
			}
		}
		if(duration == null){
			duration = getElementTransitionDuration(elem)
		}

		setTransitionDuration(elem, 0)

		var start = Date.now()
		var then = start + duration
		var from = getElementShift(elem)
		var cur = {
			top: from.top,
			left: from.left
		}
		var dist = {
			top: to.top - from.top,
			left: to.left - from.left,
		}
		elem.animating = true

		function animate(){
			var t = Date.now()
			// end of the animation...
			if(t >= then){
				setElementTransform(elem, to)
				return
			}
			if(!elem.animating){
				// XXX jittery...
				setElementTransform(elem, cur)
				return
			}

			// do an intermediate step...
			// XXX do propper easing...
			// XXX sometimes results in jumping around...
			// 		...result of jumping over the to position...
			if(speed != null){

				// XXX the folowing two blocks are the same...
				// XXX looks a bit too complex, revise...
				if(Math.abs(dist.top) >= 1){
					dy = ((t - start) * speed.y)
					if(Math.abs(dist.top) > Math.abs(dy)){
						dist.top -= dy
						cur.top = Math.round(cur.top + dy)
						// normalize...
						cur.top = Math.abs(dist.top) <= 1 ? to.top : cur.top
						// calc speed for next step...
						speed.y = dist.top / (duration - (t - start))
					} else {
						cur.top = to.top
					}
				}

				// XXX looks a bit too complex, revise...
				if(Math.abs(dist.left) >= 1){
					dx = ((t - start) * speed.x)
					if(Math.abs(dist.left) > Math.abs(dx)){
						dist.left -= dx
						cur.left = Math.round(cur.left + dx)
						// normalize...
						cur.left = Math.abs(dist.left) <= 1 ? to.left : cur.left
						// calc speed for next step...
						speed.x = dist.left / (duration - (t - start))
					} else {
						cur.left = to.left
					}
				}

			// XXX this is a staright forward linear function...
			} else {
				var r = (t - start) / duration
				cur.top = Math.round(from.top + (dist.top * r))
				cur.left = Math.round(from.left + (dist.left * r)) 
			}
			setElementTransform(elem, cur)
			// sched next frame...
			elem.next_frame = getAnimationFrame(animate)
		}

		animate()
	}
}

function stopAnimation(elem){
	if(elem.next_frame){
		cancelAnimationFrame(elem.next_frame)
	}
}


// XXX account for other transitions...
function setElementScale(elem, scale){
	return setElementTransform(elem, null, scale)
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



/**************************************************** JS utilities ***/

String.prototype.capitalize = function(){
	return this[0].toUpperCase() + this.slice(1)
}


var getAnimationFrame = (window.requestAnimationFrame
		|| window.webkitRequestAnimationFrame 
		|| window.mozRequestAnimationFrame
		|| window.oRequestAnimationFrame
		|| window.msRequestAnimationFrame
		|| function(callback){ 
		  window.setTimeout(callback, 1000 / 60) 
		})

var cancelAnimationFrame = (window.cancelRequestAnimationFrame 
		|| window.webkitCancelAnimationFrame 
		|| window.webkitCancelRequestAnimationFrame 
		|| window.mozCancelRequestAnimationFrame
		|| window.oCancelRequestAnimationFrame
		|| window.msCancelRequestAnimationFrame
		|| clearTimeout)




/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
