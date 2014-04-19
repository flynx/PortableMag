/**********************************************************************
*
* XXX add copyright and licence info...
*
**********************************************************************/

//var DEBUG = DEBUG != null ? DEBUG : true

// number of pages to display in ribbon...
// NOTE: it is best to keep this odd-ish, so as to give the user the 
// 		impession of pages continuing off-screen...
var PAGES_IN_RIBBON = 4.0

// if true, expand a page to fit the whole view in single page mode...
// NOTE: if one of the NO_RESIZE_CLASSES is set on a page then this 
// 		will not have effect on the that page...
var FIT_PAGE_TO_VIEW = true

// if false, this will force all pages to be fit to screen size in full 
// page view...
var USE_REAL_PAGE_SIZES = true

// default page alignment in full view...
// supported values:
// 	- 'center'
// 	- 'left'
// 	- 'right'
// NOTE: page local align values take priority over this.
// NOTE: this has no effect on thumbnail view.
// NOTE: this has no effect if FIT_PAGE_TO_VIEW is true and a page has 
// 		one of the NO_RESIZE_CLASSES classes set.
// 		also, USE_REAL_PAGE_SIZES if set to false will make this have 
// 		no effect.
var FULL_PAGE_ALIGN = 'center'

// if true will make page resizes after window resize animated...
var ANIMATE_WINDOW_RESIZE = true

// if false will disable page dragging in single page mode...
var DRAG_FULL_PAGE = true

// if true this will make each page flip update the hash url...
// if false, only direct linking will update the url.
// NOTE: this can slow down navigation...
var UPDATE_HASH_URL_POSITION = false

// if true this will enable history for local page navigation regardless
// of weather UPDATE_HASH_URL_POSITION state.
// NOTE: UPDATE_HASH_URL_POSITION implicitly enables full browser history
// 		based navigation.
// NOTE: this, if enabled, can slow down navigation...
// NOTE: partial history navigation over links will still work.
var FULL_HISTORY_ENABLED = false

// if true, use CSS3 transforms to scroll, of false, use left.
var USE_TRANSFORM = true

var SCROLL_TIME = 400

var BOUNCE_LENGTH = 10
var BOUNCE_TIME_DIVIDER = 5


// list of css classes of pages that will not allow page fitting.
var NO_RESIZE_CLASSES = [
	'no-resize',
	'page-align-left',
	'page-align-center',
	'page-align-right',
	'caption-top-arrow',
	'caption-bottom-arrow'
]
// NOTE: to alter the following, just update the NO_RESIZE_CLASSES above...
var RESIZABLE_PAGES = '.page' + ($(NO_RESIZE_CLASSES)
							.map(function(_, e){ return ':not(.' + e + ')' })
							.toArray()
							.join(''))
var NON_RESIZABLE_PAGES = $(NO_RESIZE_CLASSES)
							.map(function(_, e){ return '.page.' + e + '' })
							.toArray()
							.join(', ')

var SCREEN_SIZED_PAGE_CLASSES = [
	'screen-size',
	'image-fit',
]
var SCREEN_SIZED_PAGES = $(SCREEN_SIZED_PAGE_CLASSES)
							.map(function(_, e){ return '.page.' + e + '' })
							.toArray()
							.join(', ')



/*********************************************************** modes ***/

// toggles .dragging CSS class on the viewer while dragging is in 
// progress.
// NOTE: this is used mostly for styling and drag assisting...
var togglePageDragging = createCSSClassToggler('.viewer', 'dragging')

// toggle global editor mode...
var toggleEditorMode = createCSSClassToggler('.viewer', 'editor-mode')

// toggles the editor mode, used for inline magazine editor...
var toggleInlineEditorMode = createCSSClassToggler('.viewer', 'inline-editor-mode noSwipe')

// toggle between viewer themes...
var toggleThemes = createCSSClassToggler('.viewer', [
	'light-viewer',
	// this is the default (no class set)...
	'none',
	'dark-viewer'
])

// toggle box-shadows, this is here mostly for performance reasons...
var toggleShadows = createCSSClassToggler('.viewer', ['none', 'shadowless'])



// this is here only for speed, helps with dragging...
// DO NOT USE DIRECTLY!
var _PAGE_VIEW

// toggle between the two main modes:
// 	- single page mode (.page-view-mode)
// 	- thumbnail/ribbon mode
var togglePageView = createCSSClassToggler(
	'.chrome', 
	'page-view-mode',
	// post-change callback...
	function(action){
		if(action == 'on'){
			fitNPages(1, !FIT_PAGE_TO_VIEW)
			MagazineScroller.options.momentum = false
			_PAGE_VIEW = true
		} else {
			fitNPages(PAGES_IN_RIBBON)
			MagazineScroller.options.momentum = true
			_PAGE_VIEW = false
		}
	})



// this will simply update the current view...
function updateView(){
	return togglePageView(togglePageView('?'))
}



/********************************************************* helpers ***/

function centeredPageNumber(){
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
function centeredPage(){
	return $('.page').eq(centeredPageNumber())
}


function visiblePages(partial){
	var W = $('.viewer').width()
	var scale = getMagazineScale()

	return $('.page').filter(function(_, page){
		page = $(page)

		// XXX this calculates the offset from the document rather than the magazine...
		var o = page.offset().left

		// page out of view (right)...
		if(o >= W){
			return false
		}

		var w = page.width() * scale 

		if(o < 0){
			// partial left...
			if(partial && o + w > 0){
				return true
			}

			// page out of view (left)...
			return false
		}

		// partial right...
		if(partial && W - o < w){
			return true
		}

		// page compleately in view...
		if(W - o >= w){
			return true
		}

		// NOTE: we should not get here but just in case...
		return false
	})
}


function isPageResizable(page){
	if(page == null){
		page = $('.current.page')
	} else {
		page = $(page)
	}
	if(!USE_REAL_PAGE_SIZES){
		return false
	}

	var mag = $('.magazine')
	var group = page.parents('.group').first()
	var article = page.parents('.article').first()

	// first check the page...
	// NOTE: check for all classes that make the page unresizable...
	return ($(NO_RESIZE_CLASSES)
				.filter(function(){ return page.hasClass(this) })
				.length > 0 ? false 
			// then the group...
			: group.hasClass('no-resize') ? false
			// then the article...
			: article.hasClass('no-resize') ? false
			// then the magazine...
			: mag.hasClass('no-resize') ? false 
			// now for default...
			: true)
}


// this will get the current active alignment...
// NOTE: align can be set for:
// 		- page
// 		- article
// 		- magazine
// 		- app (via. FULL_PAGE_ALIGN)
// NOTE: the more local setting takes priority over the more general.
function getPageAlign(page){
	if(page == null){
		page = $('.current.page')
	} else {
		page = $(page)
	}

	var mag = $('.magazine')
	var group = page.parents('.group').first()
	var article = page.parents('.article').first()

	// first check the page...
	return (page.hasClass('page-align-center') ? 'center' 
			: page.hasClass('page-align-left') ? 'left' 
			: page.hasClass('page-align-right') ? 'right' 
			// page captions...
			: page.hasClass('caption-top-arrow') ? 'right' 
			: page.hasClass('caption-bottom-arrow') ? 'right' 
			// then the group...
			: group.hasClass('page-align-center') ? 'center' 
			: group.hasClass('page-align-left') ? 'left' 
			: group.hasClass('page-align-right') ? 'right' 
			// then the article...
			: article.hasClass('page-align-center') ? 'center' 
			: article.hasClass('page-align-left') ? 'left' 
			: article.hasClass('page-align-right') ? 'right' 
			// then the magazine...
			: mag.hasClass('page-align-center') ? 'center' 
			: mag.hasClass('page-align-left') ? 'left' 
			: mag.hasClass('page-align-right') ? 'right' 
			// now for the app default...
			: FULL_PAGE_ALIGN)
}


// NOTE: this will only produce a title if a magazine is loaded and it 
// 		has a title, otherwise undefined is returned....
function getMagazineTitle(){
	return ($('.magazine').attr('title') 
				|| $('.magazine').attr('name'))
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
	//var left = getMagazineOffset(cur, scale, align)

	//setElementTransform(mag, left, scale)
	MagazineScroller.zoom(scale)

	return mag
}


// NOTE: if page is not given get the current page number...
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
		return centeredPageNumber()
	}
}




// NOTE: negative values will yield results from the tail...
function getPageAt(n){
	var page = $('.page')
	if(n < 0){
		n = page.length + n
	}
	return $(page).eq(n)
}

function shiftMagazineTo(offset){
	MagazineScroller.scrollTo(offset, 0, 200)
	//setElementTransform($('.magazine'), offset)
}

// XXX this is almost the same as getElementScale...
function getMagazineShift(){
	return getElementShift($('.magazine')).left
}

function getPageTargetScale(n, fit_to_content){
	var view = $('.viewer')
	var content = $('.content')

	var W = view.width()
	var H = view.height()
	var cW = content.width()
	var cH = content.height()

	var scale = {
		value: getMagazineScale(),
		width: null,
		height: null,
		result_width: cW,

		valueOf: function(){return this.value},
	}

	if(fit_to_content){
		if(USE_REAL_PAGE_SIZES){
			scale.width = 'auto'
			scale.height = 'auto'
		} else {
			scale.width = cW
			scale.height = cH
		}
		if(W/H > (cW*n)/cH){
			scale.value = H/cH
		} else {
			scale.value = W/(cW*n)
		}

		// resulting page width...
		scale.result_width = cW

	} else {
		// need to calc width only...
		if(W/H > (cW*n)/cH){
			scale.value = H/cH
			scale.width = W/scale
			scale.height = cH

		// need to calc height only...
		} else if(W/H > (cW*n)/cH){
			scale.value = W/(cW*n)
			scale.height = H/scale
			scale.width = cW

		// set both width and height to defaults (content and page ratios match)...
		} else {
			scale.value = W/(cW*n)
			scale.height = cH
			scale.width = cW
		}

		// resulting page width...
		scale.result_width = W/scale
	}

	return scale
}


/************************************************** event handlers ***/

// #URL handler...
var RELATIVE_URLS = [
	'back', 'forward',
	'next', 'prev',
	'nextArticle', 'prevArticle',
	'nextBookmark', 'prevBookmark',
	'bookmark',
	'hideLayers'
]
// NOTE: most of the handling actually happens in loadURLState...
function hashChangeHandler(e){
	e.preventDefault()

	var anchor = window.location.hash.split('#')[1]

	// skip empty #URL...
	if(anchor == ''){
		return false
	}

	var r = loadURLState()
	var n = getPageNumber()

	// for relative #URLs remove them from hash...
	if(RELATIVE_URLS.indexOf(anchor) >= 0 && !UPDATE_HASH_URL_POSITION){
		window.location.hash = ''
	}

	// if we are dealing with history actions the browser will 
	// do the work for us...
	if(r == 'back'){
		// we shift by 2 to compensate for the back/forward URL itself...
		window.history.go(-2)
	} else if(r == 'forward'){
		window.history.go(2)
	} else if(r != n){

		/* XXX this will put this into an endless loop...
		 * 		...mainly because it changes the #URL from within the handler
		if(!UPDATE_HASH_URL_POSITION){
			// push current position...
			// NOTE: this will enable partial history navigation, but only 
			// 		on actions envolving actual links...
			window.history.pushState(null, null, '#' + getPageNumber())
		}
		*/

		setCurrentPage(r)
	}
}


// window resize event handler...
function viewResizeHandler(){
	if(ANIMATE_WINDOW_RESIZE){
		updateView()
	} else {
		unanimated($('.scaler'), updateView, 30)()
	}
}



/********************************************************** layout ***/

// mode can be:
// 	- viewer
// 	- content
//
// XXX should this calculate offset????
function fitPagesTo(mode, cur, time, scale){
	mode = mode == null ? 'content' : mode
	cur = cur == null ? centeredPageNumber() : cur
	time = time == null ? 0 : time
	scale = scale == null ? getMagazineScale() : scale

	// fit to content...
	if(mode == 'content'){
		var target_width = 'auto'
		var target_height = 'auto'

	// fit to viewer...
	} else if(mode == 'viewer'){
		var viewer = $('.viewer')
		var W = viewer.width()
		var H = viewer.height()

		// XXX is this a good way to sample content size???
		var content = $('.content')
		var w = content.width()
		var h = content.height()

		// need to calc width only...
		if(W/H > w/h){
			s = H/h
			w = W/s
			h = h

		// need to calc height only...
		} else if(W/H > w/h){
			s = W/w
			h = H/s
			w = w

		// set both width and height to defaults (content and page ratios match)...
		} else {
			s = W/h
			h = h
			w = w
		}
		var target_width = w
		var target_height = h

	// bad mode...
	} else {
		return
	}

	var pages = $('.page')
	var offset = 0 

	$(RESIZABLE_PAGES)
		.each(function(_, e){
			var E = $(e)
			var w = target_width == 'auto' ? E.find('.content').width() : target_width
			var h = target_height == 'auto' ? E.find('.content').height() : target_height

			// offset...
			if(pages.index(e) < cur){
				offset += (E.width() - w)
			}
			// offset half the current page...
			if(pages.index(e) == cur){
				// XXX to be more accurate we can use distance from page 
				// 		center rather than 1/2...
				offset += ((E.width() - w)/2)
			}

			if(time <= 0){
				e.style.width = w 
				e.style.height = h
			} else {
				E.animate({
					width: w,
					height: h,
				}, time, 'linear')
			}
		})

	//$(NON_RESIZABLE_PAGES).width('auto')
	$(NON_RESIZABLE_PAGES)
		.each(function(_, e){
			e.style.width = 'auto'
			e.style.height = 'auto'
		})

	MagazineScroller.scrollBy(offset*scale, 0, time)

	setTimeout(function(){
		MagazineScroller.refresh()
	}, 0)
}


// NOTE: if n is not given then it defaults to 1
// NOTE: if n > 1 and fit_to_content is not given it defaults to true
// NOTE: if n is 1 then fit_to_content bool argument controls wether:
// 			- the page will be stretched to viewer (false)
// 			- or to content (true)
// XXX need to align/focus the corrent page...
//		case:
//			when current page is pushed off center by a resized page...
function fitNPages(n, fit_to_content){
	n = n == null ? 1 : n
	var scale = getPageTargetScale(n, fit_to_content)
	if(n == 1){
		fitPagesTo('viewer')
	} else {
		fitPagesTo('content')
	}
	MagazineScroller.zoom(scale)
	MagazineScroller.refresh()
}



/********************************************************* actions ***/

// Set the .current class...
//
// page can be:
// 	- null		- centered page in view
// 	- number	- page number/index
// 	- page		- a page element
// 	- elem		- resolves to a containing page element
function setCurrent(page){
	var pages = $('.page')
	page = page == null ? pages.eq(centeredPageNumber()) 
		: typeof(page) == typeof(123) ? pages.eq(Math.max(0, Math.min(page, pages.length-1)))
		: !$(page).eq(0).hasClass('page') ? $(page).eq(0).parents('.page').eq(0)
		: $(page).eq(0)

	if(page.hasClass('current')){
		return page
	}

	// set the class...
	$('.current.page').removeClass('current')
	return page.addClass('current')
}


// Focus a page...
//
// NOTE: n is a setCurrent(..) compatible value...
// NOTE: if n is out of bounds (n < 0 | n >= length) this will focus the
// 		first/last page and bounce...
function focusPage(n, align, time){
	// XXX the default needs to depend on the scale...
	align = align == null ? 'auto' : align
	time = time == null ? SCROLL_TIME : time

	var page = setCurrent(n)
	var pages = $('.page')

	align = align == 'auto' ? getPageAlign(page) : align

	// magazine offset...
	var m = page.position().left
	// base value for 'left' align...
	var o = 0 

	var w = page.width() * getMagazineScale()
	var W = $('.viewer').width()

	if(align != 'left'){

		// right...
		if(align == 'right'){
			o = W - w

		// center / default...
		} else {
			o = W/2 - w/2
		}
	}

	// compensate for first/last page align to screen (optional???)...
	var offset = page.offset().left
	var f = pages.first().offset().left
	if(f + o - offset >= 0){
		o = 0
		m = 0
	}
	var last = $('.page').last()
	var l = last.offset().left
	if(l + o - offset <= W - w){
		o = 0
		m = last.position().left + last.width()*getMagazineScale() - W
	}

	// do the bounce...
	if(time > 0){
		var i = pages.index(page)	
		var l = pages.length
		if(n < 0){
			o += BOUNCE_LENGTH*getMagazineScale()
			time /= BOUNCE_TIME_DIVIDER
		}
		if(n >= l){
			o -= BOUNCE_LENGTH*getMagazineScale()
			time /= BOUNCE_TIME_DIVIDER
		}
	}

	// NOTE: this does not care about the zoom...
	MagazineScroller.scrollTo(-m + o, 0, time)

	return page
}


// Focus first/last page...
//
// NOTE: if we are already at the first/last page, do a bounce...
function first(align){
	// visually show that we are at the start...
	if($('.magazine').offset().left >= 0){
		return focusPage(-1, align)
	}
	return focusPage(0, align)
}
function last(align){
	var mag = $('.magazine')
	var l = mag.offset().left
	var end = mag.offset().left + mag.width()*getMagazineScale()
	var i = $('.page').length-1

	if(end <= $('.viewer').width()+1){
		return focusPage(i+1, align)
	}
	return focusPage(i, align)
}


// Focus a page of class cls adjacent to current in direction...
//
// direction can be:
// 	- 'next'		- next page
// 	- 'prev'		- previous page
//
// If cls is not given, then all pages (.page) are considered.
//
// NOTE: if we are already at the first/last page and direction is 
// 		prev/next resp. then do a bounce...
function step(direction, cls, align){
	cls = cls == null ? '' : cls

	var page = visiblePages(true).filter('.current').eq(0)
	var pages = $('.page')

	if(page.length == 0){
		page = setCurrent()
	}

	var i = pages.index(page)
	var l = pages.length

	// if we are at the first/last page do the bounce dance...
	// bounce first...
	if(i == 0 && direction == 'prev'){
		return focusPage(-1, align)
	}

	// bounce last...
	if(i == l-1 && direction == 'next'){
		return focusPage(l, align)
	}

	var to = page[direction+'All']('.page'+cls)

	// if we have no pages on the same level, to a deeper search...
	if(to.length == 0){
		if(direction == 'next'){
			to = pages.slice(i+1).filter('.page'+cls).first()
		} else {
			to = pages.slice(0, i).filter('.page'+cls).last()
		}
	}

	// still no candidates, then we can't do a thing...
	if(to.length == 0){
		to = page
	}

	return focusPage(to.eq(0), align)
}


// Focus next/prev page shorthands...
//
function nextPage(cls, align){ return step('next', cls, align) }
function prevPage(cls, align){ return step('prev', cls, align) }


// Focus next/prev cover page shorthands...
//
function nextCover(cls, align){ 
	cls = cls == null ? '' : cls
	return step('next', '.cover'+cls, align) 
}
function prevCover(cls, align){ 
	cls = cls == null ? '' : cls
	return step('prev', '.cover'+cls, align) 
}


// Move the view a screen width (.viewer) left/right...
//
// NOTE: if we are at magazine start/end and try to move left/right resp.
// 		this will do a bounce...
function nextScreen(time){
	time = time == null ? SCROLL_TIME : time
	var W = $('.viewer').width()
	var mag = $('.magazine')
	var o = mag.position().left
	var w = mag.width()*getMagazineScale()

	// we reached the end...
	if(w + o < 2*W){
		// NOTE: we use focusPage(..) to handle stuff like bounces...
		return focusPage($('.page').length)
	}

	MagazineScroller.scrollTo(o-W, 0, time)
	return setCurrent()
}
function prevScreen(time){
	time = time == null ? SCROLL_TIME : time
	var W = $('.viewer').width()
	var o = $('.magazine').position().left

	// we reached the start...
	if(-o < W){
		// NOTE: we use focusPage(..) to handle stuff like bounces...
		return focusPage(-1)
	}

	MagazineScroller.scrollTo(o+W, 0, time)
	return setCurrent()
}


// Mode-aware next/prev high-level actions...
//
// Supported modes:
// 	- page view		- focus next/prev page
// 	- magazine view	- view next/prev screen
//
function next(){
	if(togglePageView('?') == 'on'){
		return nextPage()
	} else {
		return nextScreen()
	}
}
function prev(){
	if(togglePageView('?') == 'on'){
		return prevPage()
	} else {
		return prevScreen()
	}
}



/******************************************************* bookmarks ***/

// setup bookmarking active zones in page...
function setupBookmarkTouchZones(){
	$('.bookmark-toggler').remove()
	var page = $('.page')
	page.each(function(i, e){
		$('<div/>')
			.prependTo($(e))
			.addClass('bookmark-toggler')
			.attr({
				title: 'Toggle bookmark (B)'
			})
			.on('click', function(){
				toggleBookmark($(e))
			})
			/*
			.swipe({
				click: function(){
					toggleBookmark($(e))
				}
			})
			*/
	})	
}

// load bookmarks from list...
function loadBookmarks(lst){
	clearBookmarks()
	// setup/set bookmarks...
	$(lst).each(function(i, e){toggleBookmark(e)})
}
// build bookmark list...
function buildBookmarkList(){
	var res = []
	$('.magazine .page .bookmark').each(function(_, e){
		res.push(getPageNumber($(e).parents('.page')))
	})
	return res
}

// NOTE: will trigger 'bookmarksCleared' event on the viewer
function clearBookmarks(){
	$('.magazine .page .bookmark').remove()

	$('.viewer').trigger('bookmarksCleared')
}


// NOTE: this will trigger the folowing events on the viewer:
// 		- bookmarkAdded(n)
// 		- bookmarkRemoved(n)
// XXX rewrite...
function toggleBookmark(n){
	if(n == null){
		n = getPageNumber()
	} else if(typeof(n) != typeof(1)){
		n = getPageNumber(n)
	}
	var res
	var cur = getPageAt(n)

	if(cur.children('.bookmark').length == 0){
		var res = $('<div><div/></div>')
			.prependTo(cur)
			.addClass('bookmark justcreated')
			.attr({
				title: 'Toggle bookmark (B)'
			})

		$('.viewer').trigger('bookmarkAdded', n)

		setTimeout(function(){
			res.removeClass('justcreated')
		}, 1000)

	} else {
		cur.children('.bookmark').remove()

		$('.viewer').trigger('bookmarkRemoved', n)
	}

	return res
}

function nextBookmark(cls, align){ 
	cls = cls == null ? '' : cls
	return step('next', '.bookmark'+cls, align) 
}
function prevBookmark(cls, align){ 
	cls = cls == null ? '' : cls
	return step('prev', '.bookmark'+cls, align) 
}



/*********************************************************** state ****
*
*  Local state consists of:
*  	- current page
*  	- bookmarks
* 
*  Two types of store are used for local state:
*  	- #URL
*  		stores current page number
*  		is used for special URLs like #home, #next, etc.
*  	- localStorage
*  		stores current page (overriden by #URL if both are present)
*  		stores bookmarks
* 
*  NOTE: localStorage is magazine specific.
* 
*
**********************************************************************/

URL_HANDLERS = {
	// basic navigation...
	home: function(){
		return 0
	},
	end: function(){
		return $('.page').length-1
	},

	// relative URLs...
	next: function(){
		nextPage()
		return getPageNumber()
	},
	prev: function(){
		prevPage()
		return getPageNumber()
	},
	nextArticle: function(){
		nextArticle()
		return getPageNumber()
	},
	prevArticle: function(){
		prevArticle()
		return getPageNumber()
	},
	nextBookmark: function(){
		nextBookmark()
		return getPageNumber()
	},
	prevBookmark: function(){
		prevBookmark()
		return getPageNumber()
	},

	// actions...
	// XXX this scrolls someplace odd...
	thumbnails: function(){
		n = getPageNumber()
		togglePageView('off')
		return n
	},
	bookmark: function(){
		toggleBookmark()
		return getPageNumber()
	},
	// hide all visible layers on current page...
	hideLayers: function(){
		$('.current.page .shown')
			.addClass('hidden')
			.removeClass('shown')
		return getPageNumber()
	},

	// history...
	// NOTE: these are handled by hashChangeHandler()
	back: function(){
		return 'back'
	},
	forward: function(){
		return anchor
	},
}

// XXX make URLs magazine-specific...
// 		...for extrnal linking we'll need the magazine ID, or make each 
// 		magazine a seporate path...
// 		the #URL should be of the form:
// 			#<Name>					- local links
// 			#<magazine>/<name>		- global urls
// 		the later can be conviniently searched with: 
// 			$('[title="<magazine>"] [name="<name>"]')
// XXX BUG: if the hash url part coresponds to a real anchor the browser 
// 		shifts the page, need to disable this...
//
// URL state managers...
// NOTE: loadURLState will have no side-effects on the URL, it will just 
// 		get the state from the URL and return it.
// NOTE: this will also do the apropriate action depending on #URL...
function loadURLState(){
	if(window.location.hash == ''){
		return null
	}
	var anchor = window.location.hash.split('#')[1]
	var n = parseInt(anchor)
	if(typeof(n) == typeof(1) && n >= 0){
		return n
	}

	if(anchor in URL_HANDLERS){
		return URL_HANDLERS[anchor]()
	}

	// show a layer...
	var elem = $('[name='+anchor+']')
	n = getPageNumber(elem.parents('.page'))
	// toggle hidden/shown elements...
	if(elem.hasClass('hidden')){
		elem
			.addClass('shown')
			.removeClass('hidden')
	} else if(elem.hasClass('shown')){
		elem
			.addClass('hidden')
			.removeClass('shown')
	}
	return n
}
// save current state to URL...
function saveURLState(){
	var anchor = window.location.hash.split('#')[1]
	var elem = $('[name='+anchor+']')
	var page = elem
	if(!page.hasClass('page')){
		page = page.parents('.page')
	}
	var n = getPageNumber()

	// decide which #URLs stay in the URL and which get replaces with a
	// page number...
	if(!elem.hasClass('shown') && !elem.hasClass('hidden')){
		// XXX use real aliases...
		// do not replace these urls with page numbers...
		if(n == getPageNumber(page)
				|| (anchor == 'home' && n == 0)
				|| (anchor == 'end' && n == $('.page').length-1)){
			return anchor
		}
	}

	// set the #URL to current mapge number...
	if(UPDATE_HASH_URL_POSITION){
		window.location.hash = n

	// push history state...
	} else if(FULL_HISTORY_ENABLED){
		window.history.pushState(null, null, '#' + n)

	// clear the url if it does not match the current page...
	} else {
		// XXX need to do this AFTER the page is changed, and not befor...
		if(n != parseInt(anchor) 
				// do not remove linked pages...
				|| (elem.hasClass('page') && n != getPageNumber(elem))
				|| n != getPageNumber($(elem).parents('.page'))){
			window.location.hash = ''
		}
	}
	return n
}


// local storage state managers...
function loadStorageState(title){
	if(title == null){
		title = getMagazineTitle()
	}
	var data = $.jStorage.get(title, {})
	// set the defaults...
	if(data.current_page == null){
		data.current_page = 0
	}
	if(data.bookmarks == null){
		data.bookmarks = []
	}
	return data
}
function saveStorageState(title){
	if(title == null){
		title = getMagazineTitle()
	}
	var data = $.jStorage.get(title, {})
	$.extend(data, {
			current_page: getPageNumber(),
			bookmarks: buildBookmarkList()
	})
	$.jStorage.set(title, data)
	return data
}
function resetStorageState(title){
	if(title == null){
		title = getMagazineTitle()
	}
	$.jStorage.deleteKey(title)
}


// JSON state on local storage...
// NOTE: these will only load the data, bookmarks and position are 
// 		ignored...
function saveJSONStorage(title){
	title = title == null ? getMagazineTitle() : title
	//var data = $.jStorage.get(title, {})
	var data = localStorage[title]
	data = data == null ? {} : data
	$.extend(data, {
		// XXX do we need to stringify this??
		'magazine-data': buildJSON()
	})
	//$.jStorage.set(title, data)
	localStorage[title] = JSON.stringify(data)
	return data
}
// load JSON magazine data from storage...
function loadJSONStorage(title){
	if(title == null){
		title = getMagazineTitle()
	}
	//var data = $.jStorage.get(title, {})
	var data = localStorage[title]
	data = data == null ? {} : data
	// NOTE: we are caching the data here because the actual structure 
	// 		is persistent and may get overwritten by loadJSON(...)
	var bookmarks = data.bookmarks
	var current_page = data.current_page
	var json = JSON.parse(data['magazine-data'])
	if(json != null){
		loadJSON(json)
		loadMagazineUserData(current_page, bookmarks)
	}
}
// remove JSON magazine data from storage...
// NOTE: this will resave curent values but will remove the JSON data...
function clearJSONStorage(title){
	if(title == null){
		title = getMagazineTitle()
	}
	//var data = $.jStorage.get(title, {})
	var data = localStorage[title]
	data = data == null ? {} : data
	var json = data['magazine-data']
	if(json != null){
		delete data['magazine-data']
		//$.jStorage.set(title, data)
		localStorage[title] = data
	}
}



// generic state managers...
function loadState(){
	var n = loadURLState()
	var state = loadStorageState() 
	if(n == null){
		n = state.current_page
	}
	loadMagazineUserData(n, state.bookmarks)	
}
function saveState(){
	saveURLState()
	saveStorageState()
}

function resetState(){
	resetStorageState()
	loadState()
}



/********************************************** JSON serialization ****
* 
* JSON is used to load/store the magazine data and state.
*
* This format may also include local state, like current page number 
* and bookmarks.
*
* Format:
*  	{
*  		title: <magazine-title>,
*  		bookmarks: [
*  			<page-numer>,
*  			...
*  		],
*  		// this is optional...
*  		position: <page-number>
*		// XXX urls are not yet supported...
*  		url: <URL>,
*  		pages: [
*  			// root <page>...
*  			{
*  				type: 'page' | 'cover',
*  				// classes set on the page element...
*  				class: [...]
*  				// XXX urls are not yet supported...
*  				url: <URL>,
*  				content: <page-content>
*  			},
*
*  			// article...
*  			{
*  				type: 'article',
*  				// classes set on the article element...
*  				class: [...]
*  				// XXX urls are not yet supported...
*  				url: <URL>,
*  				pages: [
*  					<page>,
*
*  					// group...
*					// NOTE: this is just like and article but can be 
*					//		nested within and article.
*					// NOTE: only one level of nexting is supported/testd.
*  					{
*  						type: 'group',
*  						// classes set on the article element...
*  						class: [...]
*  						// XXX urls are not yet supported...
*  						url: <URL>,
*  						pages: [
*  							<page>,
*  							...
*  						]
*  					},
*  					...
*  				]
*  			},
*  			...
*  		]
*  	}
* 
* NOTE: essentially we have nodes of the folowing type:
* 		- magazine (root)
* 		- article
* 		- group
* 		- page
* NOTE: content classes are stored in the content...
* NOTE: at this point all page classes will be stored, but .current 
*  		will be ignored on restore...
*
*
**********************************************************************/

var JSON_FORMAT_VERSION = 0.3


// there are two type of metadata handlers:
// 	- 'as-is', this is a trivial read and write value
// 	- explicit reader/writer, this will convert the data from html to JSON
// 		data and back...
JSONMetadata = {
	id: 'as-is',
	name: 'as-is',
	title: 'as-is',
	// NOTE: do not use background:none as jQuery refuses to set it on 
	// 		detached elements.
	style: 'as-is',
	authors: {
		reader: function(data){
			// NOTE: this might look odd, but we are using JS .map instead 
			// 		of the jQuery .map, and they have different signatures...
			// 		...(index, elem) in jQuery vs. (elem, index) in JS.
			return data.split(',').map(function(e){return e.trim()})
		},
		writer: function(data){
			return data.join(', ')
		}
	}
}


function readMetadata(elem, res, metadata){
	elem = $(elem)
	if(res == null){
		res = {}
	}
	if(metadata == null){
		metadata = JSONMetadata
	}
	for(var a in metadata){
		if(elem.attr(a)){
			if(metadata[a] == 'as-is'){
				res[a] = elem.attr(a)
			} else {
				res[a] = metadata[a].reader(elem.attr(a))
			}
		}
	}
	return res
}
function writeMetadata(elem, res, metadata){
	elem = $(elem)
	if(metadata == null){
		metadata = JSONMetadata
	}
	for(var a in metadata){
		if(res[a] != null){
			if(metadata[a] == 'as-is'){
				elem.attr(a, res[a])
			} else {
				elem.attr(a, metadata[e].writer(res[a]))
			}
		}
	}
	return elem
}


function buildJSON(export_bookmarks, export_position){
	function _getContent(_, elem){
		elem = $(elem)
		// page...
		if(elem.hasClass('page')){
			var res = {
				type: elem.hasClass('cover') ? 'cover' : 'page',
				'class': elem.attr('class'),
				content: elem.children('.content')[0].outerHTML
			}

		// group...
		} else if(elem.hasClass('group')){
			var res = {
				type: 'group',
				'class': elem.attr('class'),
				pages: elem
						.children('.page')
						.map(_getContent)
						.toArray()
			}

		// article...
		} else if(elem.hasClass('article')){
			var res = {
				type: 'article',
				'class': elem.attr('class'),
				pages: elem
						.children('.page, .group')
						.map(_getContent)
						.toArray()
			}

		// other...
		// NOTE: with how the selector that maps this is constructed 
		// 		we'll never go into here, but for future compatibility
		// 		and idiot-proofness this code will stay... for now...
		} else {
			var res = {
				type: 'raw-html',
				'class': elem.attr('class'),
				content: elem.html()
			}
		}
		// metadata...
		readMetadata(elem, res)

		return res
	}
	// read the basic metadata set for the magazine...
	var res = readMetadata($('.magazine'))
	res.pages = $('.magazine > .page, .magazine > .article')
					.map(_getContent)
					.toArray(),
	res.bookmarks = export_bookmarks ? buildBookmarkList() : []

	res['format-version'] = JSON_FORMAT_VERSION

	if(export_position){
		res.position = getPageNumber()
	}
	return res
}

// NOTE: if jQuery get's fussy about some CSS value, the style value 
// 		will not get loaded correctly.
// 		one example is "background: none", use "background: transparent"
// 		instead.
// XXX this breaks:
// 		- captions (???)
// 		- editor (needs reset)
// 		- navigator (???)
function loadJSON(data, load_user_data){
	function _build(parent, data){
		// page...
		if(data.type == 'page'){
			var res = createPage(data.content)
				.addClass(data['class'])
				.appendTo(parent)

		// cover...
		} else if(data.type == 'cover'){
			var res = createCoverPage(data.content)
				.addClass(data['class'])
				.appendTo(parent)

		// group...
		} else if(data.type == 'group') {
			// buiold an article...
			var res = createEmptyPageSet()
				.addClass(data['class'])
				.appendTo(parent)
			// populate article with pages...
			$(data.pages).each(function(_, e){
				_build(res, e)
			})

		// article...
		} else if(data.type == 'article') {
			// buiold an article...
			var res = createEmptyArticle()
				.addClass(data['class'])
				.appendTo(parent)
			// populate article with pages...
			$(data.pages).each(function(_, e){
				_build(res, e)
			})

		// other...
		// NOTE: on a wll-formed JSON we'll never go in here, but just 
		// 		in case...
		} else if(data.type == 'raw-html') {
			var res = createPage(data.content)
				.addClass(data['class'])
				.appendTo(parent)
		}

		// metadata...
		writeMetadata(res, data)

		return res
	}

	// check version...
	var version = data['format-version']
	if(version != JSON_FORMAT_VERSION){
		// XXX this might be a good spot to add data conversion between
		// 		versions...
		console.warn('WARNING: JSON Format Version Mismatch.')
	}

	// create an empty magazine...
	var mag = createEmptyMagazine(data.title)
	writeMetadata(mag, data)
	// build the actual strcture...
	$(data.pages).each(function(_, e){
		_build(mag, e)
	})
	// remove service classes...
	mag.children('.current.page').removeClass('current')
	loadMagazineData(mag)

	if(load_user_data){
		loadMagazineUserData(data.position, data.bookmarks)
	}

	// XXX do this ONLY in editor mode...
	setupEditor()
	resetNavigator()
}


/********************************************** JSON serialization ****
* 
*/

// XXX this depends on node-webkit...
function dumpJSONFile(path, data){
	path = path == null ? './'+Date.timeStamp()+'-magazine.json' : path
	data = data == null ? buildJSON() : data

	var fs = require('fs')
	var fse = require('fs.extra')

	var dirs = path.split(/[\\\/]/)
	dirs.pop()
	dirs = dirs.join('/')
	// build path...
	if(!fs.existsSync(dirs)){
		console.log('making:', path)
		fse.mkdirRecursiveSync(path)
	}
	return fs.writeFileSync(path, JSON.stringify(data), encoding='utf8')
}


function loadJSONFile(path){
	return $.getJSON(path)
		.done(function(data){
			loadJSON(data)
		})
}



/***************************************************** constructor ***/
// These function will construct detached magazine building blocks...

// basic constructors...
function createEmptyMagazine(title){
	return $('<div/>')
		.addClass('magazine')
		.attr({
			title: title
		})
}
function createMagazine(title, magazine_cover, article_cover){
	if(magazine_cover == null){
		magazine_cover = title
	}
	if(article_cover == null){
		article_cover = 'Article'
	}
	return createEmptyMagazine(title)
		// a magazine by default has a cover...
		.append(createCoverPage(magazine_cover))
		.append(createArticle(article_cover))
}


// XXX do we need other group functions???
function createEmptyPageSet(){
	return $('<div/>')
		.addClass('group')
}

function createEmptyArticle(){
	return $('<div/>')
		.addClass('article')
}
function createArticle(template){
	return createEmptyArticle()
		.append(createCoverPage(template))
}


function createPage(data){
	var page = $('<div/>')
		.addClass('page')

	var jdata = $(data)
	if(jdata.hasClass('content')){
		return page.append(jdata)
	} else {
		return page.append($('<div/>')
				.addClass('content')
				.append(jdata))
	}
}
function createCoverPage(data){
	return createPage(data).addClass('cover')
}




/******************************************************* templates ***/

// NOTE: for these to be self-aplicable they must only replace the content
// 		of the matched elements and not touch the element itself.
var MagazineTemplates = {
	/*
	'.magazine[name]': function(elem){
		$('.magazine-title-text').text($(elem).attr('name'))
	},
	*/

	'.image-fit': function(elem){
		var w = $('.content').width()
		var h = $('.content').height()

		elem.each(function(_, e){
			e = $(e)
			e.width() == 0 ? e.width(w) : 0
			e.height() == 0 ? e.height(h) : 0
		})
	},

	// set dpi value...
	'.dpi': function(elem){
		elem.text(getDPI())
	},

	// setup titles...
	'.magazine-title-text': function(elem){
		elem.text(getMagazineTitle()
					|| 'PortableMag')
	},

	// setup page numbers...
	'.page-number-text': function(elem){
		elem.each(function(_, e){
			var e = $(e)
			e.text(getPageNumber(e.parents('.page')))
		})
	},

	// magazine index...
	// XXX ugly code, revise...
	'.article-index': function(elem){
		var list = $('<ul/>')
		var mag = $('.magazine')
		// get the articles...
		$('.magazine .article .cover h1').each(function(i, e){
			e = $(e)
			var lnk = $('<a/>')
							.attr('href', '#' + 
								getPageNumber(e.parents('.page').first()))
							// XXX is this the right way to go?
							.text(e.text() 
								|| 'No title')

			list.append(
				$('<li/>')
					.append(lnk))
		})
		var root = $('<ul/>')
			.append($('<li/>')
				.append($('<a/>')
					.attr('href', '#' + 
						getPageNumber($('.magazine > .cover').first()))
					// XXX is this the right way to go?
					.text(getMagazineTitle()
						|| 'Magazine')))
		root.append(list)
		elem
			// remove the original content...
			.html('')
			// cover...
			.append(root)
	} 
}


function runMagazineTemplates(){
	for(var tpl in MagazineTemplates){
		MagazineTemplates[tpl]($(tpl))
	}
}



/******************************************* basic magazine editor ***/
// NOTE: these are mostly needed for loading magazines...

// load the data...
function loadMagazineData(mag){
	removeMagazine()
	mag.appendTo($('.viewer'))
	$('.viewer').trigger('magazineDataLoaded')
	return mag
}

// NOTE: this needs to be called once per magazine load...
function loadMagazineChrome(){
	setupBookmarkTouchZones()
	runMagazineTemplates()
	updateView()
	$('.viewer').trigger('magazineChromeLoaded')
}

// load chrome elements like bookmarks and navigator....
function loadMagazineUserData(position, bookmarks){
	if(position){
		setCurrentPage(position)
	}
	if(bookmarks){
		loadBookmarks(bookmarks != null ? bookmarks : [])
	}
}


// XXX check that all code does not err if the .magazine element is not 
// 		present...
// XXX do we need to clear the event handlers here?
// 		...this mostly concerns bookmarking and how jQuery handles events 
// 		on removed elements -- unbind and remove or just forget about it?
function removeMagazine(){
	$('.magazine').remove()
	$('.viewer').trigger('magazineRemoved')
}



/*********************************************************************/
// vim:set ts=4 sw=4 :
