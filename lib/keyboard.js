/**********************************************************************
* 
*
*
**********************************************************************/

//var DEBUG = DEBUG != null ? DEBUG : true



/*********************************************************************/

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



/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
