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
//var USE_REAL_PAGE_SIZES = true
var USE_REAL_PAGE_SIZES = false



/*********************************************************** modes ***/

// toggles .dragging CSS class on the viewer while dragging is in 
// progress.
// NOTE: this is used mostly for styling and drag assisting...
var togglePageDragging = createCSSClassToggler('.viewer', 'dragging')


// toggles the editor mode, used for inline magazine editor...
var toggleEditorMode = createCSSClassToggler('.viewer', 'editor-mode noSwipe')


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

function getPageScale(){
	return getElementScale($('.scaler'))
}


function getPageNumber(page){
	if(page == null){
		page = $('.current.page')
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
// NOTE: this will trigger 'magazineDragging' event on the viewer on 
// 		each call while dragging...
// XXX for some reason with finger count of 3 and greater, touchSwipe
// 		dies on	android...
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
			mag.css({left: -cur.position()['left']/scale - distance/scale})
			//mag.css({left: -n*cur.width()-distance/scale})
		} else if(direction == 'right') {
			mag.css({left: -cur.position()['left']/scale + distance/scale})
			//mag.css({left: -n*cur.width()+distance/scale})
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

// NOTE: if n is not given then it defaults to 1
// NOTE: if n > 1 and fit_to_content is not given it defaults to true
// NOTE: if n is 1 then fit_to_content bool argument controls wether:
// 			- the page will be stretched to viewer (false)
// 			- or to content (true)
// XXX on USE_REAL_PAGE_SIZES offset is a bit off...
// 		this is most noticable when going into full page mode...
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

	var rW = cW
	var scale = getPageScale()

	// to compensate for transitions, no data sampling should be beyound
	// this point, as we will start changing things next...

	if(fit_to_content){
		if(USE_REAL_PAGE_SIZES){
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
	if(USE_REAL_PAGE_SIZES){
		$('.page.no-resize').width('auto')
	}

	// NOTE: we need to calculate the offset as the actual widths during 
	// 		the anumation are not correct...
	// XXX in general this is correct, but still there is some error (rounding?)...
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
		// XXX this still generates slightly incorrect values...
		if(USE_REAL_PAGE_SIZES){
			var nrpages = $('.page.no-resize, .current.page')
			i = nrpages.index(cur) 
			nrpages.splice(i)
			nrpages.each(function(_, e){
				offset += $(e).children('.content').width()
			})
		}
	}

	if(USE_REAL_PAGE_SIZES){
		if(cur.hasClass('no-resize')){
			rW = cur.children('.content').width()
		}
	}

	// do the scaling... 
	setElementScale($('.scaler'), scale)
	// fix position...
	setCurrentPage(null, offset, rW)
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
	} else if(typeof(n) == typeof(1)) {
		// invalid n...
		if(n >= page.length){
			n = page.length-1
		} else if(-n > page.length){
			n = 0
		}
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
	var offset = offset == null ? cur.position()['left']/getPageScale() : offset
	mag.css({left: -offset})

	// center the pages correctly...
	$('.magazine').css({
		'margin-left': -width/2
	})

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
	// setup set bookmarks...
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


// NOTE: this will trigger events on the viewer:
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



/******************************************************* navigator ***/
// NOTE: the navigator is not live and will need to get regenerated on
// 		each magazine edit...

// NOTE: article indicators will be regenirated on magazine structure 
// 		change, so there is no use of linking to actual pages.
// 		...no need in making this live.
function makeArticleIndicator(i, article, width){
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
		.swipe({
			click: function(){
				setCurrentPage(n)
			}
		})
	return article
}


function setupArticleIndicators(W){
	var articles = $('.magazine .article')
	// cleanup...
	clearArticleIndicators()
	// set article indicator positions...
	articles.each(function(i, e){
		return makeArticleIndicator(i, e, W)
	})
}

function clearArticleIndicators(){
	$('.navigator .bar .article').remove()
}
	

function setupNavigator(){
	var bar = $('.navigator .bar')
	var elems = $('.navigator .indicator, .navigator .article')
	var pos = $('.navigator .indicator').fadeIn()
	var pages = $('.page').length
	var mag = $('.magazine')

	var W = bar.width()/pages

	setupArticleIndicators(W)

	// set navigator element sizes...
	elems.css({
		width: W
	})

	updateNavigator()

	// need to reconstruct indicators...
	$('.magazine .page .bookmark').each(function(_, e){
		makeBookmarkIndicator($(e).parents('.page'))
	})
	
	// setup event handlers...
	$('.viewer')
		.on('pageChanged', function(e, n){updateNavigator(n)})
		.on('magazineDragging', function(){updateNavigator()})
}

// XXX this needs to unbind events...
function clearNavigator(){
	$('.navigator .indicator').hide()
	clearBookmarkIndicators()
	clearArticleIndicators()
}

function resetNavigator(){
	clearNavigator()
	setupNavigator()
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
		.swipe({
			click: function(){
				setCurrentPage(n)
			}
		})

	return res
}

function clearBookmarkIndicators(){
	$('.navigator .bar .bookmark').remove()
}
function removeBookmarkIndicator(n){
	$('.navigator .bar .bookmark[page="'+n+'"]').remove()
}


// NOTE: this is 1 based page number, the rest of the system is 0 based.
function updatePageNumberIndicator(){
	$('.page-number').text((getPageNumber()+1)+'/'+$('.page').length)
}



/*********************************************************** state ***/

// XXX make URLs magazine-specific...
// 		...for extrnal linking we'll need the magazine ID, or make each 
// 		magazine a seporate path...
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
	var title = $('.magazine').attr('title')
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
function saveStorageState(){
	var title = $('.magazine').attr('title')
	$.jStorage.set(title, {
			current_page: getPageNumber(),
			bookmarks: buildBookmarkList()
	})
}
function resetStorageState(){
	var title = $('.magazine').attr('title')
	$.jStorage.deleteKey(title)
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

function resetState(){
	resetStorageState()
	loadState()
}



/********************************************** JSON serialization ***/
// JSON format state managers...
// format:
// 		{
// 			title: <magazine-title>,
// 			bookmarks: [
// 				<page-numer>,
// 				...
// 			],
// 			// this is optional...
// 			position: <page-number>
// 			pages: [
// 				// root <page>...
// 				{
// 					type: 'page' | 'cover',
// 					// classes set on the page element...
// 					class: [...]
// 					content: <page-content>
// 				},
//
// 				// article...
// 				{
// 					type: 'article',
// 					// classes set on the article element...
// 					class: [...]
// 					pages: [
// 						<page>,
// 						...
// 					]
// 				]
// 				...
// 			]
// 		}
//
// NOTE: content classes are stored in the content...
// NOTE: at this point all page classes will be stored, but .current 
// 		will be ignored on restore...
function buildJSON(export_bookmarks, export_position){
	function _getContent(_, elem){
		elem = $(elem)
		if(elem.hasClass('page')){
			return {
				type: elem.hasClass('cover') ? 'cover' : 'page',
				'class': elem.attr('class'),
				content: elem.children('.content')[0].outerHTML
			}
		} else if(elem.hasClass('article')){
			return {
				type: 'article',
				'class': elem.attr('class'),
				pages: elem.children('.page').map(_getContent).toArray()
			}
		}
	}
	var res = {
		title: $('.magazine').attr('title'),
		// this can contain pages or arrays...
		pages: $('.magazine > .page, .magazine > .article').map(_getContent).toArray(),
		bookmarks: export_bookmarks ? buildBookmarkList() : [],
	}
	if(export_position){
		res.position = getPageNumber()
	}
	return res
}

function loadJSON(data, ignore_chrome){
	function _build(block, elem){
		if(elem.type == 'page'){
			createPage(elem.content)
				.addClass(elem['class'])
				.appendTo(block)

		} else if(elem.type == 'cover'){
			createCoverPage(elem.content)
				.addClass(elem['class'])
				.appendTo(block)

		} else if(elem.type == 'article') {
			// buiold an article...
			var article = createEmptyArticle()
				.addClass(elem['class'])
				.appendTo(block)
			// populate article with pages...
			$(elem.pages).each(function(_, e){
				_build(article, e)
			})
		}
	}
	var mag = createEmptyMagazine(data.title)
	$(data.pages).each(function(_, e){
		_build(mag, e)
	})
	// remove service classes...
	// XXX should we do this here, on build or in both places...
	mag.children('.current.page').removeClass('current')
	loadMagazineData(mag)

	if(!ignore_chrome){
		loadMagazineChrome(data.position, data.bookmarks)
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
// XXX do we need a title here???
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




/************************************************ editor: magazine ***/


// NOTE: this will just load the data...
function loadMagazineData(mag){
	removeMagazine()
	mag.appendTo($('.aligner'))
	return mag
}
function loadMagazineChrome(position, bookmarks){
	setupBookmarkTouchZones()
	setupNavigator()
	setCurrentPage(position)
	loadBookmarks(bookmarks != null ? bookmarks : [])
}


// NOTE: we do not need to create any event handlers here specifically 
// 		as all events are ahndled by the viewer...
function loadMagazine(mag, position, bookmarks){
	mag = loadMagazineData(mag)
	loadMagazineChrome(position, bookmarks)
	return mag
}


function createBaseMagazine(title, cover, article){
	removeMagazine()
	var mag = loadMagazine(createMagazine(title, cover, article))
	return mag
}


// XXX some things get really surprized when this is called, make things 
// 		work with the mag cleared...
// XXX do we need to clear the event handlers here?
// 		...this mostly concerns bookmarking and how jQuery handles events 
// 		on removed elements -- unbind and remove or just forget about it?
function removeMagazine(){
	$('.magazine').remove()
	clearNavigator()
}



/************************************************* editor: article ***/

// XXX create article...
function createArticleBefore(article, title){
	if(article == null){
		article = $('.current.page').parents('.article')
	}
	// XXX fill the data...
	var res = createArticle().insertBefore(article)
	setCurrentPage()
	$('.viewer').trigger('articleCreated', res)
	return res
}
function createArticleAfter(article, title){
	if(article == null){
		article = $('.current.page').parents('.article')
	}
	// XXX fill the data...
	var res = createArticle().insertAfter(article)
	setCurrentPage()
	$('.viewer').trigger('articleCreated', res)
	return res
}


function shiftArticleLeft(article){
	// XXX
	setCurrentPage()
	$('.viewer').trigger('articleMoved', res)
	return res
}
function shiftArticleRight(article){
	// XXX
	setCurrentPage()
	$('.viewer').trigger('articleMoved', res)
	return res
}


function removeArticle(article){
	if(article == null){
		article = $('.current.page').parents('.article')
	}
	article.remove()
	setCurrentPage()
	$('.viewer').trigger('articleRemoved', res)
	return res
}



/*************************************************** editor: pages ***/

function createPageIn(article, template){
	if(article == null){
		article = $('.current.page').parents('.article')
	}
	// no article
	if(article.length == 0){
		return
	}
	var res = createPage(template).appendTo(article)
	$('.viewer').trigger('pageCreated', res)
	return res
}


// XXX the next two are almost identical...
// XXX prevent this from working outside of an article....
function createPageAfter(page, template){
	if(page == null){
		page = $('.current.page')
	}
	var res = createPage(template).insertAfter(page)
	$('.viewer').trigger('pageCreated', res)
	return res
}
// XXX prevent this from working outside of an article....
function createPageBefore(page, template){
	if(page == null){
		page = $('.current.page')
	}
	var res = createPage(template).insertBefore(page)
	$('.viewer').trigger('pageCreated', res)
	return res
}


// NOTE: on negative position this will position the element after the 
// 		target, e.g. position -1 is the last element, etc.
// XXX at this point there is no way to move something to either an 
// 		article or a magazine that do not contain any pages directly...
// 		...add special cases:
// 			- if we are moving the page in the direction of an empty article
// 			  push the page into the article...
// 			- if we are moving page 0 left and the magazine has no cover 
// 			  push it to the magazine...
function movePageTo(page, position){
	if(page == null){
		page = $('.current.page')
	}
	if(position >= $('.page').length){
		position = -1
	}
	var target = getPageAt(position)
	page.detach()
	if(position >= 0){
			page.insertBefore(target)
	} else {
			page.insertAfter(target)
	}
	setCurrentPage()
	$('.viewer').trigger('pageMoved', page)
	return page
}


function shiftPageLeft(page){
	if(page == null){
		page = $('.current.page')
	}
	movePageTo(page, getPageNumber(page)-1)
	return page
}
function shiftPageRight(page){
	if(page == null){
		page = $('.current.page')
	}
	movePageTo(page, getPageNumber(page)+2)
	return page
}


function removePage(page){
	if(page == null){
		page = $('.current.page')
	}

	var cur = getPageNumber()
	page.remove()
	setCurrentPage(cur)
	$('.viewer').trigger('pageRemoved', page)
	return page
}



/*********************************************************************/
// vim:set ts=4 sw=4 :
