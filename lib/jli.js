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
// XXX find a better name for this... 

// this will create a function that will add/remove a css_class to elem 
// calling the optional callbacks before and/or after.
//
// elem is a jquery compatible object; default use-case: a css selector.
//
// the resulting function understands the folowing arguments:
// 	- 'on'			: switch mode on
// 	- 'off'			: switch mode off
// 	- '?'			: return current state ('on'|'off')
// 	- no arguments	: toggle the state
//
// NOTE: of only one callback is given then it will be called after the 
// 		 class change...
// 		 a way around this is to pass an empty function as callback_b
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
		obj.addClass('unanimated')
		var res = func.apply(func, arguments)
		setTimeout(function(){obj.removeClass('unanimated')}, time)
		return res
	}
}



// Return a scale value for the given element(s).
// NOTE: this will only return a single scale value...
function getElementScale(elem){
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

function setElementScale(elem, scale){
	return elem.css({
		'transform': 'scale('+scale+')',
		'-moz-transform': 'scale('+scale+')',
		'-o-transform': 'scale('+scale+')',
		'-ms-transform': 'scale('+scale+')',
		'-webkit-transform': 'scale('+scale+')',
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
	9:		'Tab',
	13:		'Enter',
	16:		'Shift',
	17:		'Ctrl',
	18:		'Alt',
	20:		'Caps Lock',
	27:		'Esc',
	32:		'Space',
	33:		'PgUp',
	34:		'PgDown',	
	35:		'End',
	36:		'Home',
	37:		'Right',
	38:		'Up',
	39:		'Left',
	40:		'Down',
	45:		'Ins',
	46:		'Del',
	80:		'Backspace',
	91:		'Win',
	93:		'Menu',
	
	112:	'F1',
	113:	'F2',
	114:	'F3',
	115:	'F4',
	116:	'F5',
	117:	'F6',
	118:	'F7',
	119:	'F8',
	120:	'F9',
	121:	'F10',
	122:	'F11',
	123:	'F12',
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




/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
