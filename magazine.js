/**********************************************************************
*
* XXX add copyright and licence info...
*
**********************************************************************/

//var DEBUG = DEBUG != null ? DEBUG : true

// number of pages to display in ribbon...
var PAGES_IN_RIBBON = 6

// if true, expand a page to fit the whole view in single page mode...
var FIT_PAGE_TO_VIEW = true

// if true will make page resizes after window resize animated...
var ANIMATE_WINDOW_RESIZE = true

// if true will disable page dragging in single page mode...
var DRAG_FULL_PAGE = true

// XXX make this default and remove the option...
// XXX this produces a funny animation that gets more ampletude the farther 
// 		we get to the right from the no-resize element...
// 		...think the reason is .no-resize page centering...
// XXX still buggy on togglePageView to TN after funny sized pages...
//var _USE_REAL_SIZES = true
var _USE_REAL_SIZES = false


/*********************************************************************/
// toggles .dragging CSS class on the viewer while dragging is in 
// progress.
// NOTE: this is used mostly for styling and drag assisting...
togglePageDragging = createCSSClassToggler('.viewer', 'dragging')


// this is here only for speed, helps with dragging...
// DO NOT USE DIRECTLY!
var _PAGE_VIEW

// toggle between the two main modes:
// 	- single page mode (.page-view-mode)
// 	- thumbnail/ribbon mode
togglePageView = createCSSClassToggler(
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


// this will simply refresh the current view...
function updateView(){
	return togglePageView(togglePageView('?'))
}



/********************************************************* helpers ***/

function getPageScale(){
	return getElementScale($('.scaler'))
}


function getPageNumber(page){
	if(page == null){
		page = $('.current.page')
	}
	return $('.page').index(page) 
}

function getPageAt(n){
	return $($('.page')[n])
}


/************************************************** event handlers ***/

// hash url handler...
// NOTE: most of the handling actually happens in loadURLState...
function hashChangeHandler(e){
	e.preventDefault()
	var r = loadURLState()
	// if we are dealing with history actions the browser will 
	// do the work for us...
	if(r == 'back'){
		// we shift by 2 to combensate for the back/forward URL itself...
		window.history.go(-2)
	} else if(r == 'forward'){
		window.history.go(2)
	} else {
		setCurrentPage(r)
	}
}


// window resize event handler...
// XXX might be good to compensate for document zoom...
function viewResizeHandler(){
	/*
	if(document.width/$(document).width() != 1){
		// XXX scale the page...
		console.log('>>> Page Zoom:', document.width/$(document).width())
	}
	*/
	if(ANIMATE_WINDOW_RESIZE){
		updateView()
	} else {
		unanimated($('.scaler'), updateView, 30)()
	}
}


// swipe state handler
// this handles single and double finger swipes and dragging
// while draggign this triggers magazineDragging event on the viewer...
function swipeHandler(evt, phase, direction, distance, duration, fingers){
	var pages = $('.page')
	var cur = $('.current.page')
	var n = pages.index(cur)
	var scale = getPageScale()
	var mag = $('.magazine')
	var pos = $('.navigator .bar .indicator')

	if(phase=='move' 
			// see if wee need to drag the page and allways drag the ribbon...
			&& (DRAG_FULL_PAGE || !_PAGE_VIEW)
			&& (direction=='left' || direction=='right')){
		// using the "unanimated" trick we will make the drag real-time...
		if(direction == 'left'){
			if(_USE_REAL_SIZES){
				mag.css({left: -cur.position()['left']/scale-distance/scale})
			} else {
				mag.css({left: -n*cur.width()-distance/scale})
			}
		} else if(direction == 'right') {
			if(_USE_REAL_SIZES){
				mag.css({left: -cur.position()['left']/scale+distance/scale})
			} else {
				mag.css({left: -n*cur.width()+distance/scale})
			}
		}

		$('.viewer').trigger('magazineDragging')

	} else if(phase == 'start'){
		togglePageDragging('on')

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
			// two+ fingers moves to closest article...
			if(fingers == 2){
				prevArticle()
			} else if(fingers >= 3){
				prevBookmark()
			} else {
				setCurrentPage(Math.max(n-p, 0))
			}
		// next page...
		} else if(direction == 'left'){
			// two+ fingers moves to closest article...
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



/********************************************************** layout ***/

// NOTE: special cases:
// 	- if n is not given then it defaults to 1
// 	- if n > 1 and fit_to_content is not given it defaults to true
// 	- if n is 1 then fit_to_content bool argument controls wether:
// 		- the page will be stretched to viewer (false)
// 		- or to content (true)
function fitNPages(n, fit_to_content){
	if(n == null){
		n = 1
	}
	if(n > 1 && fit_to_content == null){
		fit_to_content = true
	}
	var view = $('.viewer')
	if(_USE_REAL_SIZES){
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

	var rW = cW
	var scale = getPageScale()

	// to compensate for transitions, no data sampling should be beyound
	// this point, as we will start changing things next...

	if(fit_to_content){
		if(_USE_REAL_SIZES){
			page.width('auto')
			page.height('auto')
		} else {
			page.width(cW)
			page.height(cH)
		}
		if(W/H > (cW*n)/cH){
			scale = H/cH
		} else {
			scale = W/(cW*n)
		}
		// resulting page width...
		var rW = cW

	} else {
		// need to calc width only...
		if(W/H > (cW*n)/cH){
			scale = H/cH
			page.width(W/scale)
			page.height(cH)

		// need to calc height only...
		} else if(W/H > (cW*n)/cH){
			scale = W/(cW*n)
			page.height(H/scale)
			page.width(cW)

		// set both width and height to defaults (content and page ratios match)...
		} else {
			scale = W/(cW*n)
			page.height(cH)
			page.width(cW)
		}
		// resulting page width...
		var rW = W/scale
	}

	// XXX revise...
	if(fit_to_content){
		var offset = rW * getPageNumber()-1
	} else {
		// calculate the target offset...
		if(_USE_REAL_SIZES){
			var rpages = $('.page:not(.no-resize), .current.page')
		} else {
			var rpages = page 
		}
		var i = rpages.index(cur) 
		var offset = rW * i-1
		// now do the unresized elements...
		if(_USE_REAL_SIZES){
			$('.page.no-resize').width('auto')
			var nrpages = $('.page.no-resize, .current.page')
			i = nrpages.index(cur) 
			nrpages.splice(i)
			nrpages.each(function(_, e){
				offset += $(e).width()
			})
		}
	}

	if(_USE_REAL_SIZES){
		if(cur.hasClass('no-resize')){
			rW = cur.width()
		}
	}

	// do the scaling... 
	setElementScale($('.scaler'), scale)
	// fix position...
	setCurrentPage(null, offset, rW)
}



/********************************************************* actions ***/

// NOTE: if n is not given it will be set to current page number
// NOTE: if width is not given it will be set to current page width.
// NOTE: n can be:
// 		- page number
// 		- page element
// NOTE: this will fire a 'pageChanged' event on the viewer each time 
// 		it is called...
// XXX make this work for pages of different width...
// 		use markers -- a marker is any element that will be used to 
// 		allign the magazine so that the marker is at the left edge of 
// 		the viewer...
// 		by default a page is a marker.
function setCurrentPage(n, offset, width){
	if(n == null){
		var cur = $('.current.page')
		n = $('.page').index(cur) 
	} else if(typeof(n) == typeof(1)) {
		var cur = getPageAt(n)
	} else {
		var cur = $(n)
		n = $('.page').index(cur) 
	}
	if(width == null){
		width = cur.width()
	}

	$('.current.page').removeClass('current')
	cur.addClass('current')

	var mag = $('.magazine')
	if(_USE_REAL_SIZES){
		var offset = offset == null ? cur.position()['left']/getPageScale() : offset
	} else {
		var offset = offset == null ? cur.width()*n : offset
	}
	mag.css({left: -offset})

	// center the pages correctly...
	$('.magazine').css({
		'margin-left': -width/2
	})

	// XXX should this be here???
	saveState()

	// trigger the page cange event...
	$('.viewer').trigger('pageChanged', n)
	
	return cur
}


function goToMagazineCover(){
	setCurrentPage(0)
}
function goToMagazineEnd(){
	setCurrentPage($('.page').length-1)
}
function goToArticleCover(){
	setCurrentPage($('.current.page').parents('.article').children('.page').first())
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
			.children('.page')
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
			.children('.page')
			.first())
}



/*********************************************************** state ***/

// XXX make these magazine-specific...
// XXX BUG: if the hash url part coresponds to a real anchor the browser 
// 		shifts the page, need to disable this...
// URL state managers...
function loadURLState(){
	if(window.location.hash == ''){
		return null
	}
	var anchor = window.location.hash.split('#')[1]
	var n = parseInt(anchor)
	if(typeof(n) == typeof(1) && n >= 0){
		return n

	// XXX add real external aliases...
	} else if(anchor == 'thumbnails') {
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
	window.location.hash = n
	return n
}


// local storage state managers...
function loadStorageState(){
	return {
		current_page: parseInt($.jStorage.get('current_page', 0)),
		bookmarks: $.jStorage.get('bookmarks', [])
	}
}
function saveStorageState(){
	$.jStorage.set('current_page', getPageNumber())
	$.jStorage.set('bookmarks', buildBookmarkList())
}


// JSON format state managers...
function loadJSONState(data){
	// XXX
}
function buildJSONState(){
	// XXX
}
function dumpJSONState(){
	// XXX
}


// generic state managers...
function loadState(){
	var n = loadURLState()
	var state = loadStorageState() 
	if(n != null){
		setCurrentPage(n)
	} else {
		setCurrentPage(state.current_page)
	}
	loadBookmarks(state.bookmarks)
}
function saveState(){
	saveURLState()
	saveStorageState()
}



/******************************************************* navigator ***/

function _makeArticleIndicator(i, article, width){
	var bar = $('.navigator .bar')
	var article = $(article)
	var n = getPageNumber(article.children('.cover').first())
	$('<div/>')
		.prependTo($('.navigator .bar'))
		.addClass('article')
		.css({
			width: width,
			left: width*n
		})
		.click(function(){
			setCurrentPage(n)
		})
	return article
}


function setupArticleIndicators(W){
	var articles = $('.magazine .article')
	// cleanup...
	$('.navigator .bar .article').remove()
	// set article indicator positions...
	articles.each(function(i, e){
		return _makeArticleIndicator(i, e, W)
	})
}
	

function setupNavigator(){
	var bar = $('.navigator .bar')
	var elems = $('.navigator .indicator, .navigator .article')
	var pos = $('.navigator .indicator')
	var pages = $('.page').length
	var mag = $('.magazine')

	var W = bar.width()/pages

	setupArticleIndicators(W)

	// set navigator element sizes...
	elems.css({
		width: W
	})

	updateNavigator()
	
	// setup event handlers...
	$('.viewer')
		.on('pageChanged', function(e, n){updateNavigator(n)})
		.on('magazineDragging', function(){updateNavigator()})
}


function updateNavigator(n){
	var mag = $('.magazine')
	var page = $('.page')
	var bar = $('.navigator .bar')
	var pos = $('.navigator .indicator')

	var pn = page.length

	var bW = bar.width()
	var mW = mag.width()
	var PW = page.width()
	var pW = bar.width()/pn

	if(n == null){
		// XXX this behaves erratically if the page is zoomed...
		var res = (-parseFloat(mag.css('left'))/(mW-PW)) * (bW-pW)
	} else {
		res = pW*n
	}

	// normalize the position...
	res = res > 0 ? res: 0
	res = res < (bW-pW) ? res: (bW-pW)

	// set indicator position...
	pos.css({
		left: res 
	})
}



function makeBookmarkIndicator(n){
	if(n == null){
		n = getPageNumber()
	} else if(typeof(n) != typeof(1)){
		n = getPageNumber(n)
	}
	var bar = $('.navigator .bar')
	var pages = $('.page').length
	var width = bar.width()/pages
	var res = $('<div/>')
		.prependTo($('.navigator .bar'))
		.addClass('bookmark')
		.css({
			left: width*n + width*0.75
		})
		.attr({
			page: n
		})
		.click(function(){
			setCurrentPage(n)
		})

	return res
}

function clearBookmarkIndicators(){
	$('.navigator .bar .bookmark').remove()
}
function removeBookmarkIndicator(n){
	$('.navigator .bar .bookmark[page="'+n+'"]').remove()
}



/******************************************************* bookmarks ***/

// load bookmarks from list...
function loadBookmarks(lst){
	clearBookmarks()
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

function clearBookmarks(){
	$('.magazine .page .bookmark').remove()
	clearBookmarkIndicators()
}


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
			.addClass('bookmark')
			.click(function(){
				toggleBookmark(n)
			})

		makeBookmarkIndicator(n)
	} else {
		cur.children('.bookmark').remove()
		removeBookmarkIndicator(n)
	}

	// XXX should this be here???
	saveState()

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



/********************************************************** editor ***/

// XXX create magazine...
// 		- magazine
// 		- cover
function createMagazine(){
}


// XXX create article (magazine, title, position)...
// 		- article
// 		- cover
function createArticle(magazine, title){
}


// XXX create page (article, template, position)...
// 		- page
// 		- content
function createPage(article, template){
}



/*********************************************************************/
// vim:set ts=4 sw=4 :
