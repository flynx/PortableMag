/**********************************************************************
*
* XXX add copyright and licence info...
*
**********************************************************************/

var PAGES_IN_RIBBON = 4



/********************************************************** layout ***/

var togglePageFitMode = createCSSClassToggler(
		'.viewer', 
		'.page-fit-to-viewer', 
		function(action){
			if(action == 'on'){
				console.log('fitting pages to view...')
				var n = getPageNumber()
				var scale = getMagazineScale()
				$('.page:not(.no-resize)').width($('.viewer').width()/scale)
			} else {
				console.log('restoring page sizes...')
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

// XXX make this more universal...
// 		- h/v scroll
// 		- general configuration
// 		- optional events...
// XXX should we use a callback or an event???
// XXX make this get the scrolled item automatically...
// 		...now $('.magazine') is hardcoded...
function makeScrollHandler(root, config){
	root = $(root)

	// local data...
	var scrolled
	var scrolling = false
	var touch = false
	var touches = 0
	var start_x
	var start_y
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

	function startMoveHandler(evt, callback){
		prev_t = event.timeStamp || Date.now();
		if(scroller.options.autoCancelEvents){
			bounds = {
				left: scroller.options.eventBounds,
				right: root.width() - scroller.options.eventBounds,
				top: scroller.options.eventBounds,
				bottom: root.height() - scroller.options.eventBounds 
			}
		}
		scrolled = $(root.children()[0])
		setTransitionDuration(scrolled, 0)
		if(event.touches != null){
			touch = true
		}
		scrolling = true
		scroller.state = 'scrolling'
		scroller.options.enabelStartEvent && root.trigger('userScrollStart')
		//togglePageDragging('on')
		shift = getElementShift(scrolled)
		scale = getElementScale(scrolled)
		// get the user coords...
		prev_x = touch ? event.touches[0].pageX : evt.clientX
		start_x = prev_x
		prev_y = touch ? event.touches[0].pageY : evt.clientY
		start_y = prev_y

		return false
	}
	// XXX add limits to this...
	// XXX slow down drag when at limit...
	// XXX try and make this adaptive to stay ahead of the lags...
	function moveHandler(evt){
		evt.preventDefault()
		t = event.timeStamp || Date.now();
		// get the user coords...
		x = touch ? event.touches[0].pageX : evt.clientX
		y = touch ? event.touches[0].pageY : evt.clientY
		touches = touch ? event.touches.length : 0

		// XXX needs testing...
		// check scroll bounds...
		if(bounds != null){
			if(scroller.options.hScroll && (x <= bounds.left || x >= bounds.right)
				|| scroller.options.vScroll && (y <= bounds.top || y >= bounds.bottom)){
				// XXX cancel the touch event and trigger the end handler...
				return endMoveHandler(evt)
			}
		}

		// do the actual scroll...
		if(scrolling){
			if(scroller.options.hScroll){
				shift.left += x - prev_x
			}
			if(scroller.options.vScroll){
				shift.top += y - prev_y
			}
			setElementTransform(scrolled, shift, scale)

			// XXX these should be done every time the event is caught or 
			// 		just while scrolling?
			dx = x - prev_x
			dy = y - prev_y
			dt = t - prev_t
			prev_x = x
			prev_y = y
			prev_t = t

			scroller.options.enableUserScrollEvent && root.trigger('userScroll')
		}
		return false
	}
	function endMoveHandler(evt){
		// XXX get real transition duration...
		setTransitionDuration($('.magazine'), 200)
		x = touch ? event.changedTouches[0].pageX : evt.clientX
		y = touch ? event.changedTouches[0].pageY : evt.clientY
		touch = false
		scrolling = false
		scroller.state = 'waiting'
		touches = 0
		bounds = null
		//togglePageDragging('off')
		scroller.options.enableEndEvent && root.trigger('userScrollEnd', dx, dy, dt, start_x, start_y)
		scroller.options.callback && scroller.options.callback(dx/dt, start_x-x)

		return false
	}

	var scroller = {
		options: {
			hScroll: true,
			vScroll: true,

			enabelStartEvent: false,
			enableUserScrollEvent: false,
			enableEndEvent: false,

			autoCancelEvents: false,
			eventBounds: 5,

			callback: null
		},

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
			this.state = 'stopped'
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
			return this
		},
		// XXX check...
		setCallback: function(func){
			this.callback = func
		},
		// NOTE: this is updated live but not used by the system in any way...
		state: 'stopped'
	}

	// merge the config with the defaults...
	if(config != null){
		$.extend(scroller.options, config)
	}

	return scroller
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
