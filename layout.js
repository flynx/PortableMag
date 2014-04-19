/**********************************************************************
*
* XXX add copyright and licence info...
*
**********************************************************************/

var DEFAULT_TRANSITION_DURATION = 200

var INNERTIA_SCALE = 0.25

var MAX_DISTANCE_TO_SCROLL = 1000


/********************************************************** layout ***/

var toggleThemes = createCSSClassToggler('.chrome', [
	'light-viewer',
	// this is the default (no class set)...
	'none',
	'dark-viewer'
])


// XXX this is neither final nor usable...
function prepareInlineCaptions(){
	$('.page img[title]').each(function(){
		// XXX make this add same style captions to images without changing 
		// 		layout...
	})
}



/************************************************** event handlers ***/

// Click on caption...
// XXX add inline caption support...
function handleCaption(elem){
	//elem = $(data.orig_event.target)
	elem = elem == null ? $('.current.page').find('.caption') : $(elem)

	if(elem.is('.image-fit-height, .image-fit, .image-with-caption') 
			|| elem.parents('.image-fit-height, .image-fit, .image-with-caption').length > 0){

		// prevent doing anything in ribbon mode..
		if(togglePageView('?') == 'off'){
			return
		}

		if(!elem.hasClass('caption')){
			elem = elem.parents('.page').find('.caption')
		}

		// hide and do not show empty captions...
		if(elem.text().trim() != ''){
			elem.toggleClass('hidden')
		} else {
			elem.addClass('hidden')
		}
	}
}



/**********************************************************************
* vim:set ts=4 sw=4 :												 */
