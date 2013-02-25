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

			// XXX
			setTransitionDuration($('.magazine'), 0)

			if(action == 'on'){
				var scale = getPageTargetScale(1).value
				setMagazineScale(scale)
				//unanimated($('.magazine, .viewer'), togglePageFitMode)('on')
				togglePageFitMode('on')
			} else {
				//unanimated($('.magazine, .viewer'), togglePageFitMode)('off')
				togglePageFitMode('off')
				var scale = getPageTargetScale(PAGES_IN_RIBBON).value
				setMagazineScale(scale)
			}
			// NOTE: can't disable transitions on this one because ScrollTo
			// 		uses jQuery animation...
			setCurrentPage()
		})



/************************************************** event handlers ***/

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

function makeSwipeHandler(action){
	return function(evt, data){
		// ribbon mode...
		if(isNavigationViewRelative()){

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

		action($('.current.page'))
	}
}
var handleSwipeLeft = makeSwipeHandler(prevPage)
var handleSwipeRight = makeSwipeHandler(nextPage)

// do snap and innertia...
// NOTE: this will also handle swipeUp/swopeDown as we do not 
//		explicitly bind them...
// XXX restore all the changed values...
// XXX add an animate loop, to make the browser paint the page better...
function handleScrollRelease(evt, data){
	/*
	// this makes things snap...
	if(SNAP_TO_PAGES_IN_RIBBON || !isNavigationViewRelative()){
		setCurrentPage()
		return
	}
	*/

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

		/*
		// restore defaults...
		// XXX this is a bit dumb at this point...
		// XXX run this as a transition end handler...
		setTimeout(function(){
			//setTransitionEasing(mag, 'ease-out')
			setTransitionEasing(mag, 'cubic-bezier(0.33,0.66,0.66,1)')
			setTransitionDuration(mag, DEFAULT_TRANSITION_DURATION)
		}, t+10)
		*/

	// check scroll bounds...
	// do not let the user scroll out of view...
	} else {
		if(at > first){
			//animateElementTo(mag, first, DEFAULT_TRANSITION_DURATION, 'ease-in')
			animateElementTo(mag, first, DEFAULT_TRANSITION_DURATION, 'cubic-bezier(0.33,0.66,0.66,1)')

		} else if(at < last){
			//animateElementTo(mag, last, DEFAULT_TRANSITION_DURATION, 'ease-in')
			animateElementTo(mag, last, DEFAULT_TRANSITION_DURATION, 'cubic-bezier(0.33,0.66,0.66,1)')
		}
	}
}


// XXX this affects only the innertial part, not setCurrentPage...
var USE_TRANSITIONS_FOR_ANIMATION = false
//var MIN_STEP = 24
var MIN_STEP = 0

// XXX make this a drop-in replacement for setElementTransform...
// XXX cleanup, still flacky...
function animateElementTo(elem, to, duration, easing, speed){
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
	var pos = page.position().left//*scale

	var l = 0

	return -((w - w*scale)/2 + pos) + offset
}


function getPageNumber(page){
	page = $(page)
	if(!page.hasClass('page')){
		page = page.parents('.page')
	}
	// a page is given explicitly, get the next one...
	if(page != null){
		return $('.page').index(page)
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
	if(cur.length == 0){
		cur = $('.page').first()
	}

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

	if(USE_TRANSITIONS_FOR_ANIMATION){
		setElementTransform($('.magazine'), left)

	} else {
		animateElementTo($('.magazine'), left)
	}

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



/*********************************************************************/
// vim:set ts=4 sw=4 :
