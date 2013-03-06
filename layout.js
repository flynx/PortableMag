/**********************************************************************
*
* XXX add copyright and licence info...
*
**********************************************************************/

var SNAP_TO_PAGES_IN_RIBBON = false

var DEFAULT_TRANSITION_DURATION = 200

var INNERTIA_SCALE = 0.25


/********************************************************** layout ***/

var toggleThemes = createCSSClassToggler('.chrome', [
	'light-viewer',
	// this is the default (no class set)...
	'none',
	'dark-viewer'
])


// NOTE: this should not change anything unless the screen size changes...
function fitScreenSizedPages(){
	var s = getPageTargetScale(1)
	var W = $('.viewer').width()
	$(SCREEN_SIZED_PAGES).width(W / s)
}

var togglePageFitMode = createCSSClassToggler(
		'.chrome', 
		'page-fit-to-viewer', 
		function(action){
			if(action == 'on'){
				var n = getPageNumber()
				var scale = getMagazineScale()
				$(RESIZABLE_PAGES)
					.width($('.viewer').width() / scale)
			} else {
				var n = getPageNumber()
				$(RESIZABLE_PAGES).width('')
			}
			fitScreenSizedPages()
			setCurrentPage(n)
		})


var togglePageView = createCSSClassToggler(
		'.chrome',
		'full-page-view-mode',
		function(action){
			var view = $('.viewer')
			var page = $('.page')

			// XXX
			setTransitionDuration($('.magazine'), 0)
			var n = getPageNumber()

			if(action == 'on'){
				var scale = getPageTargetScale(1).value
				setMagazineScale(scale)
				//unanimated($('.magazine, .viewer'), togglePageFitMode)('on')
				togglePageFitMode('on')
				$('.viewer').trigger('fullScreenMode')
			} else {
				//unanimated($('.magazine, .viewer'), togglePageFitMode)('off')
				togglePageFitMode('off')
				var scale = getPageTargetScale(PAGES_IN_RIBBON).value
				setMagazineScale(scale)
				$('.viewer').trigger('ribbonMode')
			}
			// NOTE: can't disable transitions on this one because ScrollTo
			// 		uses jQuery animation...
			setCurrentPage(n)
		})


var toggleInlineEditorMode = createCSSClassToggler('.chrome', 'inline-editor-mode')




/************************************************** event handlers ***/

// Click
// 	- in full page do the default click, if clicked on other page, select
// 	- in ribbon, open clicked page in full mode
function handleClick(evt, data){
	var target = getPageNumber(data.orig_event.target)
	if(target != -1){
		var mag = $('.magazine')

		if(togglePageView('?') == 'on'){
			setTransitionDuration(mag, DEFAULT_TRANSITION_DURATION)
		} else {
			togglePageView('on')
		}
		setCurrentPage(target)

		//setTransitionEasing(mag, 'ease')
		setTransitionEasing(mag, 'cubic-bezier(0.33,0.66,0.66,1)')
	}
}

// Click on caption...
function handleCaption(evt, data){
	elem = $(data.orig_event.target)
	if(elem.is('.image-fit-height, .image-fit') 
			|| elem.parents('.image-fit-height, .image-fit').length > 0){

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


// Long Click
// 	- in full page, go to ribbon
// 	- in ribbon, center clicked page
function handleLongClick(evt, data){
	var target = getPageNumber(data.orig_event.target)
	if(target != -1){
		var mag = $('.magazine')

		if(togglePageView('?') == 'on'){
			togglePageView('off')
		} else {
			setTransitionDuration(mag, DEFAULT_TRANSITION_DURATION)
		}
		setCurrentPage(target)

		//setTransitionEasing(mag, 'ease')
		setTransitionEasing(mag, 'cubic-bezier(0.33,0.66,0.66,1)')
	}
}


// Swipe Left/Right
// 	- in full page, next/prev page select
// 	- in ribbon, kinetic scroll
// 	- with two fingers, select next/prev article
function makeSwipeHandler(actionA, actionB){
	return function(evt, data){
		// ribbon mode...
		if(togglePageView('?') == 'off'){

			// article navigation...
			if(data.touches >= 2){
				actionB($('.current.page'))
				return
			}

			// this makes things snap...
			if(SNAP_TO_PAGES_IN_RIBBON){
				setCurrentPage()
				return
			}

			return handleScrollRelease(evt, data)
		}
		// full page view...
		var mag = $('.magazine')
		//setTransitionEasing(mag, 'ease-out')
		setTransitionEasing(mag, 'cubic-bezier(0.33,0.66,0.66,1)')

		if(data.touches >= 2){
			actionB($('.current.page'))
		} else {
			actionA($('.current.page'))
		}
	}
}
var handleSwipeLeft = makeSwipeHandler(prevPage, prevArticle)
var handleSwipeRight = makeSwipeHandler(nextPage, nextArticle)


// Scroll Release
// 	- check bounds and if out center first/last page
// 	- filter out "throw" speeds below threshold
// 	- do inertial scroll (within check bounds)
// 	- snap to pages
//
// NOTE: this will also handle swipeUp/swopeDown as we do not 
//		explicitly bind them...
// NOTE: at this point this ONLY handles horizontal scroll...
// XXX restore all the changed values...
function handleScrollRelease(evt, data){
	var speed = data.speed.x
	var pages = $('.page')
	var mag = $('.magazine')
	// innertial scroll...
	// XXX make this generic...
	var t = DEFAULT_TRANSITION_DURATION * (1+Math.abs(speed))
	// XXX this is only horizontal at this point...
	var at = getElementShift(mag).left
	var to = (at + (t*speed*INNERTIA_SCALE))
	var first = getMagazineOffset(pages.first(), null, 'center')
	var last = getMagazineOffset(pages.last(), null, 'center')
	var easing

	// filter out really small speeds...
	if(Math.abs(speed) > 0.5){
		// check bounds...
		// NOTE: need to cut the distance and time if we are going the 
		//		hit the bounds...
		if(to > first){
			// trim the time proportionally...
			var _t = t
			t = Math.abs(t * ((at-first)/(at-to)))
			to = first
			//easing = 'linear'
			easing = 'cubic-bezier(0.33,0.66,0.66,1)'
		} else if(to < last){
			// trim the time proportionally...
			var _t = t
			t = Math.abs(t * ((at-last)/(at-to)))
			to = last
			//easing = 'linear'
			easing = 'cubic-bezier(0.33,0.66,0.66,1)'

		} else {
			//easing = 'ease-out'
			easing = 'cubic-bezier(0.33,0.66,0.66,1)'
		}

		animateElementTo(mag, to, t, easing, speed)

	// check scroll bounds...
	// do not let the user scroll out of view...
	} else {
		if(at > first){
			//animateElementTo(mag, first, DEFAULT_TRANSITION_DURATION, 'ease-in')
			animateElementTo(mag, first, 
					DEFAULT_TRANSITION_DURATION, 
					'cubic-bezier(0.33,0.66,0.66,1)')

		} else if(at < last){
			//animateElementTo(mag, last, DEFAULT_TRANSITION_DURATION, 'ease-in')
			animateElementTo(mag, last, 
					DEFAULT_TRANSITION_DURATION, 
					'cubic-bezier(0.33,0.66,0.66,1)')
		}
	}
}



/********************************************************* helpers ***/

function getPageInMagazineOffset(page, scale){
	if(page == null){
		page = $('.current.page') 
	} else if(typeof(page) == typeof(7)){
		page = $($('.page')[page])
	}

	return page.position().left / (scale == null ? getMagazineScale() : scale) 
}


// XXX there is something here that depends on scale that is either not 
// 		compensated, or is over compensated...
function getMagazineOffset(page, scale, align){
	if(page == null){
		page = $('.current.page')
		// if no current page get the first...
		if(page.length == 0){
			page = $('.page').first()
		}
	}
	if(scale == null){
		scale = getMagazineScale()
	}
	if(align == null){
		align = getPageAlign(page)
	}
	var mag = $('.magazine')

	// calculate the align offset...
	if(align == 'left'){
		var offset = 0

	} else if(align == 'right'){
		var offset = $('.viewer').width() - page.width()*scale

	// center (default)
	} else {
		var offset = $('.viewer').width()/2 - (page.width()/2)*scale
	}

	// NOTE: this without scaling also represents the inner width of 
	// 		the viewer...
	var w = mag.outerWidth(true)
	// XXX this depends on scale...
	//var pos = getPageInMagazineOffset(page, scale)
	var pos = page.position().left//*scale

	var l = 0

	return -((w - w*scale)/2 + pos) + offset
}


function getPageNumber(page){
	// a page/element is given explicitly...
	if(page != null){
		page = $(page)
		if(!page.hasClass('page')){
			page = page.parents('.page')
		}
		return $('.page').index(page)
	}

	// current page index...
	if(togglePageView('?') == 'on'){
		return $('.page').index($('.current.page'))

	// get the closest page to view center... 
	// NOTE: this ignores page aligns and only gets the page who's center 
	// 		is closer to view's center
	} else {
		var scale = getMagazineScale()
		var o = -$($('.magazine')[0]).offset().left - $('.viewer').offset().left
		var W = $('.viewer').width()
		var cur = -1
		var res = $('.page').map(function(i, e){
			e = $(e)
			var l = e.position().left
			var w = e.width()*scale
			return Math.abs((l+(w/2)) - (o+(W/2)))
		}).toArray()
		cur = res.indexOf(Math.min.apply(Math, res))
		return cur
	}
}


function getMagazineScale(){
	return getElementScale($('.magazine'))
}
function setMagazineScale(scale){
	var mag = $('.magazine')
	var cur = $('.current.page')
	if(cur.length == 0){
		cur = $('.page').first()
	}

	// center-align ribbon view pages...
	var align = togglePageView('?') == 'off' ? 'center' : null
	var left = getMagazineOffset(cur, scale, align)

	setElementTransform(mag, left, scale)

	return mag
}



/********************************************************* actions ***/

function setCurrentPage(n, use_transitions){
	if(n == null){
		n = getPageNumber()
	}
	if(typeof(n) != typeof(3)){
		n = getPageNumber(n)
	}
	var l = $('.page').length
	// normalize the number...
	n = n < 0 ? l - n : n
	n = n < -l ? 0 : n
	n = n >= l ? l - 1 : n
	use_transitions = use_transitions != null ? 
						use_transitions 
						: USE_TRANSITIONS_FOR_ANIMATION

	$('.current.page').removeClass('current')
	$($('.page')[n]).addClass('current')

	var cur = $('.current.page')

	// center-align pages in ribbon view...
	var align = togglePageView('?') == 'off' ? 'center' : null
	var left = getMagazineOffset(cur, null, align)

	if(use_transitions){
		setElementTransform($('.magazine'), left)

	} else {
		animateElementTo($('.magazine'), left)
	}

	$('.viewer').trigger('pageChanged', n)

	return cur
}


function nextPage(page){
	// XXX is this the right place for this?
	setTransitionDuration($('.magazine'), DEFAULT_TRANSITION_DURATION)
	setCurrentPage(getPageNumber(page)+1)
}
function prevPage(page){
	// XXX is this the right place for this?
	setTransitionDuration($('.magazine'), DEFAULT_TRANSITION_DURATION)
	var n = getPageNumber(page)-1
	n = n < 0 ? 0 : n
	setCurrentPage(n)
}


function firstPage(){
	// XXX is this the right place for this?
	setTransitionDuration($('.magazine'), DEFAULT_TRANSITION_DURATION)
	setCurrentPage(0)
}
function lastPage(){
	// XXX is this the right place for this?
	setTransitionDuration($('.magazine'), DEFAULT_TRANSITION_DURATION)
	setCurrentPage(-1)
}




/**********************************************************************
* vim:set ts=4 sw=4 :												 */
