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
// NOTE: if .no-resize is set on a page then this will not have effect
// 		on the that page...
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
// 		no-resize class set.
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
	'light',
	// this is the default (no class set)...
	'none',
	'dark'
])

// toggle box-shadows, this is here mostly for performance reasons...
var toggleShadows = createCSSClassToggler('.viewer', 'shadowless')



// this is here only for speed, helps with dragging...
// DO NOT USE DIRECTLY!
var _PAGE_VIEW

// toggle between the two main modes:
// 	- single page mode (.page-view-mode)
// 	- thumbnail/ribbon mode
var togglePageView = createCSSClassToggler(
	'.viewer', 
	'page-view-mode',
	null,
	// post-change callback...
	function(action){
		if(action == 'on'){
			fitNPages(1, !FIT_PAGE_TO_VIEW)
			_PAGE_VIEW = true
		} else {
			fitNPages(PAGES_IN_RIBBON)
			_PAGE_VIEW = false
		}
	})


// this will simply update the current view...
function updateView(){
	return togglePageView(togglePageView('?'))
}



/********************************************************* helpers ***/

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
	return (page.hasClass('no-resize') ? false 
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
	return getElementScale($('.scaler'))
}
function setPageScale(scale){
	return setElementTransform($('.scaler'), null, scale)
}


// NOTE: if page is not given get the current page number...
function getPageNumber(page){
	if(page == null){
		page = $('.current.page')
	} else {
		page = $(page)
	}
	return $('.page').index(page) 
}


// NOTE: negative values will yield results from the tail...
function getPageAt(n){
	var page = $('.page')
	if(n < 0){
		n = page.length + n
	}
	return $(page[n])
}

function shiftMagazineTo(offset){
	setElementTransform($('.magazine'), offset)
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


// swipe state handler
// this handles single and double finger swipes and dragging
// while draggign this triggers magazineDragging event on the viewer...
// NOTE: this will trigger 'magazineDragging' event on the viewer on 
// 		each call while dragging...
// XXX for some reason with finger count of 3 and greater, touchSwipe
// 		dies on	android...
function makeSwipeHandler(){
	var pages
	var cur
	var n
	var scale
	var mag
	var pos
	var viewer = $('.viewer')

	return function(evt, phase, direction, distance, duration, fingers){

		if(phase == 'start'){
			// NOTE: this is used with the "unanimated" trick, we will make
			//		dragging real-time...
			togglePageDragging('on')

			// setup the data for the drag...
			pages = $('.page')
			cur = $('.current.page')
			n = pages.index(cur)
			scale = getMagazineScale()
			mag = $('.magazine')
			pos = $('.navigator .bar .indicator')

		// XXX make this drag pages that are larger than view before dragging outside...
		} else if(phase=='move' 
				// see if wee need to drag the page and allways drag the ribbon...
				&& (DRAG_FULL_PAGE || !_PAGE_VIEW)
				&& (direction=='left' || direction=='right')){
			if(direction == 'left'){
				shiftMagazineTo(-cur.position().left/scale - distance/scale)
			} else if(direction == 'right') {
				shiftMagazineTo(-cur.position().left/scale + distance/scale)
			}
			viewer.trigger('magazineDragging')

		} else if(phase == 'cancel'){
			togglePageDragging('off')
			setCurrentPage()

		} else if(phase =='end' ){
			togglePageDragging('off')
			// see which page is closer to the middle of the screen and set it...
			// do this based on how much we dragged...
			var p = Math.ceil((distance/scale)/cur.width())

			// prev page...
			if(direction == 'right'){
				// 2 fingers moves to closest article...
				if(fingers == 2){
					prevArticle()
				// 3+ fingers moves to bookmark...
				} else if(fingers >= 3){
					prevBookmark()
				} else {
					setCurrentPage(Math.max(n-p, 0))
				}
			// next page...
			} else if(direction == 'left'){
				if(fingers == 2){
					nextArticle()
				} else if(fingers >= 3){
					nextBookmark()
				} else {
					setCurrentPage(Math.min(n+p, pages.length-1))
				}
			}
		}
	}
}



/********************************************************** layout ***/

// NOTE: if n is not given then it defaults to 1
// NOTE: if n > 1 and fit_to_content is not given it defaults to true
// NOTE: if n is 1 then fit_to_content bool argument controls wether:
// 			- the page will be stretched to viewer (false)
// 			- or to content (true)
function fitNPages(n, fit_to_content){
	if(n == null){
		n = 1
	}
	if(n > 1 && fit_to_content == null){
		fit_to_content = true
	}
	var view = $('.viewer')
	if(USE_REAL_PAGE_SIZES){
		var page = $('.page:not(.no-resize)')
	} else {
		var page = $('.page')
	}
	var content = $('.content')
	var cur = $('.current.page')

	var W = view.width()
	var H = view.height()
	var cW = content.width()
	var cH = content.height()

	// to compensate for transitions, no data sampling should be beyound
	// this point, as we will start changing things next...
	
	var scale = getPageTargetScale(n, fit_to_content)
	// cache some data...
	var target_width = scale.width
	var target_height = scale.height
	var rW = scale.result_width

	// NOTE: we need to calculate the offset as the actual widths during 
	// 		the animation are not correct... so just looking at .position()
	// 		will be counterproductive...
	if(!USE_REAL_PAGE_SIZES && fit_to_content){
		var offset = rW * getPageNumber()-1
	} else {
		// calculate the target offset...
		if(USE_REAL_PAGE_SIZES){
			var rpages = $('.page:not(.no-resize), .current.page')
		} else {
			var rpages = page 
		}
		var i = rpages.index(cur) 
		var offset = rW * i-1
		// now do the no-resize elements...
		if(USE_REAL_PAGE_SIZES){
			var nrpages = $('.page.no-resize, .current.page')
			i = nrpages.index(cur) 
			nrpages.splice(i)
			nrpages.each(function(_, e){
				offset += $(e).children('.content').width()
			})
		}
	}

	// align the magazine...
	if(USE_REAL_PAGE_SIZES){
		if(cur.hasClass('no-resize')){
			var align = getPageAlign(cur)

			// center align if explicitly required or if we are in a ribbon...
			if(n > 1 || align == 'center'){
				rW = cur.children('.content').width()

			// align left...
			} else if(align == 'left'){
				rW = $('.viewer').width()/scale

			// align right...
			} else if(align == 'right'){
				var v = $('.viewer')
				rW = (v.width()/scale/2 - (v.width()/scale-cur.width()))*2 
			}
		}
	}

	// now do the actual modification...

	// do the scaling... 
	setElementScale($('.scaler'), scale)

	// XXX for some reason setting size "auto" will first shrink the whole 
	// 		page to 0 and then instantly set it to the correct size...
	//page
	//	.width(target_width)
	//	.height(target_height)
	//if(USE_REAL_PAGE_SIZES){
	//	$('.page.no-resize').width('auto')
	//}

	// NOTE: we only need the .scaler animated, the rest just plays havoc with
	// 		the transition...
	// XXX this still jumps to offset on left/right aligned pages but 1) on 
	// 		fast transitions it is not noticable and 2) it is way better than
	// 		the effect that was before...
	unanimated($('.page, .content, .magazine'), function(){
		// NOTE: this is not done directly as to avoid artifacts asociated with
		// 		setting 'auto' to all the elements, which makes them first slowly
		// 		shrink down to 0 and then appear correctly sized in an instant.
		page.each(function(_, e){
			if(target_width == 'auto'){
				e.style.width = $(e).find('.content').width()
				e.style.height = $(e).find('.content').height()
			} else {
				e.style.width = target_width
				e.style.height = target_height
			}
		})
		if(USE_REAL_PAGE_SIZES){
			//$('.page.no-resize').width('auto')
			$('.page.no-resize').each(function(_, e){
				e.style.width = 'auto'
			})
		}
		// fix position...
		setCurrentPage(null, offset, rW)
	}, 200)()
}



/********************************************************* actions ***/

// NOTE: "width" is used ONLY to center the page.
// NOTE: if n is not given it will be set to current page number
// NOTE: if width is not given it will be set to current page width.
// NOTE: n can be:
// 		- page number
// 		- page element
// NOTE: this will fire a 'pageChanged(n)' event on the viewer each time 
// 		it is called...
// NOTE: this now supports negative indexes to count pages from the end...
function setCurrentPage(n, offset, width){
	var page = $('.page')
	// setup n and cur...
	// no n is given, do the defaultdance
	if(n == null){
		var cur = $('.current.page')
		// no current page...
		// try to land on the magazine cover...
		if(cur.length == 0){
			cur = $('.magazine > .cover')
		}
		// try the first cover...
		if(cur.length == 0){
			cur = $('.cover.page')
		}
		// try first page...
		if(cur.length == 0){
			cur = page.first()
		}
		// no pages to work with...
		if(cur.length == 0){
			return
		}
		n = page.index(cur) 

	// n is a number...
	} else if(typeof(n) == typeof(1)) {
		// normalize n...
		if(n >= page.length){
			n = page.length-1
		} else if(-n > page.length){
			n = 0
		}
		var cur = getPageAt(n)
	
	// n is an element, likely...
	} else {
		var cur = $(n)
		n = $('.page').index(cur) 
		//n = page.index(cur) 
	}

	// default width...
	if(width == null){
		width = cur.width()
		if(USE_REAL_PAGE_SIZES && togglePageView('?') == 'on'){
			var align = getPageAlign(cur)
			var scale = getMagazineScale()
			if(align == 'center'){
				width = cur.width()

			} else if(align == 'left'){
				width = $('.viewer').width()/scale

			} else if(align == 'right'){
				var v = $('.viewer')
				width = (v.width()/scale/2 - (v.width()/scale-cur.width()))*2 
			}
		}
	}

	$('.current.page').removeClass('current')
	cur.addClass('current')

	// NOTE: this will be wrong during a transition, that's why we 
	// 		can pass the pre-calculated offset as an argument...
	shiftMagazineTo(-(offset == null ? cur.position()['left']/getMagazineScale() : offset))

	// center the pages correctly...
	// NOTE: this is the main reason we need width, and we can get it 
	// 		pre-calculated because of ongoing transitions make it 
	// 		pointless to read it...
	$('.magazine').css({
		'margin-left': -width/2
	})

	$('.viewer').trigger('pageChanged', n)
	
	return cur
}


function goToMagazineCover(){
	return setCurrentPage(0)
}
function goToMagazineEnd(){
	return setCurrentPage(-1)
}
function goToArticleCover(){
	// try and get the actual first cover...
	var cover = $('.current.page').parents('.article').find('.cover.page').first()
	if(cover.length == 0){
		// no cover, get the first page...
		return setCurrentPage($('.current.page').parents('.article').find('.page').first())
	} else {
		return setCurrentPage(cover)
	}
}


function nextPage(){
	var pages = $('.page')
	var cur = $('.current.page')
	return setCurrentPage(Math.min(pages.index(cur)+1, pages.length-1))
}
function prevPage(){
	var pages = $('.page')
	var cur = $('.current.page')
	return setCurrentPage(Math.max(pages.index(cur)-1, 0))
}


function nextArticle(){
	var cur = $('.current.page').parents('.article')
	// we are at the magazine cover...
	if(cur.length == 0){
		return setCurrentPage(
			$('.magazine .article .page:first-child').first())
	}
	// just find the next one...
	var articles = $('.magazine .article')
	return setCurrentPage(
		$(articles[Math.min(articles.index(cur)+1, articles.length-1)])
			.find('.page')
			.first())
}
function prevArticle(){
	var cur = $('.current.page').parents('.article')
	// we are at the magazine cover...
	if(cur.length == 0){
		//return $('.current.page')
		return setCurrentPage()
	}
	// just find the prev one...
	var articles = $('.magazine .article')
	return setCurrentPage(
		$(articles[Math.max(articles.index(cur)-1, 0)])
			.find('.page')
			.first())
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
			.swipe({
				click: function(){
					toggleBookmark($(e))
				}
			})
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
function toggleBookmark(n){
	if(n == null){
		n = getPageNumber()
	} else if(typeof(n) != typeof(1)){
		n = getPageNumber(n)
	}
	var res
	var cur = getPageAt(n)

	if(cur.children('.bookmark').length == 0){
		var res = $('<div/>')
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

function nextBookmark(){
	var pages = $('.page')
	pages = $(pages.splice(getPageNumber()+1))
	page = pages.children('.bookmark').first().parents('.page')
	if(page.length != 0){
		return setCurrentPage(page)
	}
}
function prevBookmark(){
	var pages = $('.page')
	pages.splice(getPageNumber())
	page = pages.children('.bookmark').last().parents('.page')
	if(page.length != 0){
		return setCurrentPage(page)
	}
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

	// XXX add real external aliases...
	if(anchor == 'thumbnails') {
		togglePageView('off')
		return getPageNumber()

	} else if(anchor == 'home') {
		return 0

	} else if(anchor == 'end') {
		return $('.page').length-1

	// history...
	// NOTE: these are handled by hashChangeHandler()
	} else if(anchor == 'back') {
		return anchor
	} else if(anchor == 'forward') {
		return anchor

	// relative URLs...
	} else if(anchor == 'next') {
		nextPage()
		return getPageNumber()

	} else if(anchor == 'prev') {
		prevPage()
		return getPageNumber()

	} else if(anchor == 'nextArticle') {
		nextArticle()
		return getPageNumber()

	} else if(anchor == 'prevArticle') {
		prevArticle()
		return getPageNumber()

	} else if(anchor == 'nextBookmark') {
		nextBookmark()
		return getPageNumber()

	} else if(anchor == 'prevBookmark') {
		prevBookmark()
		return getPageNumber()

	} else if(anchor == 'bookmark'){
		toggleBookmark()
		return getPageNumber()

	// hide all visible layers on current page...
	} else if(anchor == 'hideLayers') {
		$('.current.page .shown')
			.addClass('hidden')
			.removeClass('shown')
		return getPageNumber()

	} else {
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
	if(title == null){
		title = getMagazineTitle()
	}
	var data = $.jStorage.get(title, {})
	$.extend(data, {
		// XXX do we need to stringify this??
		'magazine-data': buildJSON()
	})
	$.jStorage.set(title, data)
	return data
}
// load JSON magazine data from storage...
function loadJSONStorage(title){
	if(title == null){
		title = getMagazineTitle()
	}
	var data = $.jStorage.get(title, {})
	// NOTE: we are caching the data here because the actual structure 
	// 		is persistent and may get overwritten by loadJSON(...)
	var bookmarks = data.bookmarks
	var current_page = data.current_page
	var json = data['magazine-data']
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
	var data = $.jStorage.get(title, {})
	var json = data['magazine-data']
	if(json != null){
		delete data['magazine-data']
		$.jStorage.set(title, data)
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
				pages: elem.children('.page').map(_getContent).toArray()
			}

		// article...
		} else if(elem.hasClass('article')){
			var res = {
				type: 'article',
				'class': elem.attr('class'),
				pages: elem.children('.page, .group').map(_getContent).toArray()
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
	res.pages = $('.magazine > .page, .magazine > .article').map(_getContent).toArray(),
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
				.html(data))
	}
}
function createCoverPage(data){
	return createPage(data).addClass('cover')
}




/******************************************************* templates ***/

// NOTE: for these to be self-aplicable they must only replace the content
// 		of the matched elements and not touch the element itself.
var MagazineTemplates = {

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
							.attr('href', '#' + getPageNumber(e.parents('.page').first()))
							// XXX is this the right way to go?
							.text(e.text() || 'No title')

			list.append(
				$('<li/>')
					.append(lnk))
		})
		var root = $('<ul/>')
			.append($('<li/>')
				.append($('<a/>')
					.attr('href', '#' + getPageNumber($('.magazine > .cover').first()))
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
	mag.appendTo($('.aligner'))
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
