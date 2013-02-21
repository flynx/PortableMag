/**********************************************************************
*
* XXX add copyright and licence info...
*
**********************************************************************/

var PAGES_IN_RIBBON = 4

var SNAP_TO_PAGES_IN_RIBBON = false
var DEFAULT_TRANSITION_DURATION = 200
var INNERTIA_SCALE = 0.25



/********************************************************** layout ***/

var togglePageFitMode = createCSSClassToggler(
		'.viewer', 
		'.page-fit-to-viewer', 
		function(action){
			if(action == 'on'){
				var n = getPageNumber()
				var scale = getMagazineScale()
				$('.page:not(.no-resize)').width($('.viewer').width()/scale)
			} else {
				var n = getPageNumber()
				$('.page:not(.no-resize)').width('')
			}
			setCurrentPage(n)
		})


var togglePageView = createCSSClassToggler(
		'.viewer',
		'.full-page-view-mode',
		// XXX make this support transitions...
		function(action){
			var view = $('.viewer')
			var page = $('.page')

			if(action == 'on'){
				var W = view.width()
				var H = view.height()
				var w = page.width()
				var h = page.height()

				// XXX this is not correct...
				// 		...need to fit one rectangel (page) into another (viewer)
				// 		...use the implementation in magazine.js
				if(W >= H){
					// fit to width...
					var scale = W/w
				} else {
					// fit to height...
					var scale = H/h
				}
				setMagazineScale(scale)
				unanimated($('.magazine, .viewer'), togglePageFitMode)('on')
			} else {
				unanimated($('.magazine, .viewer'), togglePageFitMode)('off')

				var W = view.width()
				var H = view.height()
				var w = page.width()
				var h = page.height()

				scale = W/(w*PAGES_IN_RIBBON)
				setMagazineScale(scale)
			}
			// NOTE: can't disable transitions on this one because ScrollTo
			// 		uses jQuery animation...
			setCurrentPage()
		})



/************************************************** event handlers ***/

function handleClick(evt, data){
	// get page target and select it if it's within a page...
	var target = $(data.orig_event.target)
	target = getPageNumber(
				target.hasClass('page') ? target 
					: target.parents('.page'))
	if(target != -1){
		var mag = $('.magazine')
		setTransitionDuration(mag, DEFAULT_TRANSITION_DURATION)
		setTransitionEasing(mag, 'ease')

		togglePageView()
		setCurrentPage(target)
	}
}

function makeSwipeHandler(action){
	return function(evt, data){
		// ribbon mode...
		if(isNavigationViewRelative()){
			return handleScrollRelease(evt, data)
		}
		// full page view...
		var mag = $('.magazine')
		setTransitionDuration(mag, DEFAULT_TRANSITION_DURATION)
		setTransitionEasing(mag, 'ease-out')

		action($('.current.page'))
	}
}
var handleSwipeLeft = makeSwipeHandler(prevPage)
var handleSwipeRight = makeSwipeHandler(nextPage)

// do snap and innertia...
// NOTE: this will also handle swipeUp/swopeDown as we do not 
//		explicitly bind them...
// XXX restore all the changed values...
function handleScrollRelease(evt, data){
	// this makes things snap...
	if(SNAP_TO_PAGES_IN_RIBBON || !isNavigationViewRelative()){
		setCurrentPage()
		return
	}

	var speed = data.speed.x
	var pages = $('.page')
	var mag = $('.magazine')
	// innertial scroll...
	// XXX make this generic...
	var t = DEFAULT_TRANSITION_DURATION * (1+Math.abs(speed))
	// XXX this is only horisontal at this point...
	var at = getElementShift(mag).left
	var to = (at + (t*speed*INNERTIA_SCALE))
	var first = getMagazineOffset(pages.first(), null, 'center')
	var last = getMagazineOffset(pages.last(), null, 'center')

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
			setTransitionEasing(mag, 'linear')
		} else if(to < last){
			// trim the time proportionally...
			var _t = t
			t = Math.abs(t * ((at-last)/(at-to)))
			to = last
			setTransitionEasing(mag, 'linear')

		} else {
			setTransitionEasing(mag, 'ease-out')
		}

		setTransitionDuration(mag, t)
		setElementTransform(mag, to)

		// restore defaults...
		// XXX this is a bit dumb at this point...
		// XXX run this as a transition end handler...
		setTimeout(function(){
			setTransitionEasing(mag, 'ease-out')
			setTransitionDuration(mag, DEFAULT_TRANSITION_DURATION)
		}, t+10)

	// check scroll bounds...
	// do not let the user scroll out of view...
	} else {
		if(at > first){
			setTransitionEasing(mag, 'ease-in')
			setTransitionDuration(mag, DEFAULT_TRANSITION_DURATION)
			setElementTransform(mag, first)

		} else if(at < last){
			setTransitionEasing(mag, 'ease-in')
			setTransitionDuration(mag, DEFAULT_TRANSITION_DURATION)
			setElementTransform(mag, last)
		}
	}
}



/********************************************************* helpers ***/

// XXX make this more acurate...
// 		...should check mode or if we are in a ribbon...
var NAVIGATION_MODE_THRESHOLD = 0.7
function isNavigationViewRelative(){
	return getMagazineScale() <= NAVIGATION_MODE_THRESHOLD
}


// XXX there is something here that depends on scale that is either not 
// 		compensated, or is over compensated...
function getMagazineOffset(page, scale, align){
	if(page == null){
		page = $('.current.page')
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
	var pos = page.position().left//*scale

	var l = 0

	return -((w - w*scale)/2 + pos) + offset
}


function getPageNumber(page){
	// a page is given explicitly, get the next one...
	if(page != null){
		return $('.page').index($(page))
	}

	// get the next page relative to the current... 
	if(!isNavigationViewRelative()){
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

	// center-align ribbon view pages...
	var align = isNavigationViewRelative() ? 'center' : null
	var left = getMagazineOffset(cur, scale, align)

	setElementTransform(mag, left, scale)

	return mag
}



/********************************************************* actions ***/

function setCurrentPage(n){
	if(n == null){
		n = getPageNumber()
	}
	var scale = getMagazineScale()
	var l = $('.page').length
	// normalize the number...
	n = n < 0 ? l - n : n
	n = n < -l ? 0 : n
	n = n >= l ? l - 1 : n

	$('.current.page').removeClass('current')
	$($('.page')[n]).addClass('current')

	var cur = $('.current.page')

	// center-align pages in ribbon view...
	var align = isNavigationViewRelative() ? 'center' : null
	var left = getMagazineOffset(cur, null, align)

	setElementTransform($('.magazine'), left, scale)

	return cur
}


function nextPage(page){
	setCurrentPage(getPageNumber(page)+1)
}
function prevPage(page){
	var n = getPageNumber(page)-1
	n = n < 0 ? 0 : n
	setCurrentPage(n)
}


function firstPage(){
	setCurrentPage(0)
}
function lastPage(){
	setCurrentPage(-1)
}



/*********************************************************************/
// vim:set ts=4 sw=4 :
