/**********************************************************************
**********************************************************************/

//var DEBUG = DEBUG != null ? DEBUG : true

// number of pages to display in ribbon...
var PAGES_IN_RIBBON = 6

// if true, expand a page to fit the whole view in single page mode...
var FIT_PAGE_TO_VIEW = true

// if true will make page resizes after window resize animated...
var ANIMATE_WINDOW_RESIZE = true

// if true will disable page dragging in single page mode...
var DRAG_FULL_PAGE = false



/*********************************************************************/
// toggles .dragging CSS class on the viewer while dragging is in 
// progress.
// NOTE: this is used mostly for styling and drag assisting...
togglePageDragging = createCSSClassToggler('.viewer', 'dragging')


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
		} else {
			fitNPages(PAGES_IN_RIBBON)
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



/************************************************** event handlers ***/

// swipe state handler
// this handles single and double finger swipes and dragging
function swipeHandler(evt, phase, direction, distance, duration, fingers){
	var pages = $('.page')
	var cur = $('.current.page')
	var n = pages.index(cur)
	var scale = getPageScale()
	var mag = $('.magazine')

	if(phase=='move' 
			// see if wee need to drag the page and allways drag the ribbon...
			&& (DRAG_FULL_PAGE || togglePageView('?') == 'off')
			&& (direction=='left' || direction=='right')){
		// using the "unanimated" trick we will make the drag real-time...
		mag.addClass('unanimated')
		if(direction == 'left'){
			$('.magazine').css({left: -n*cur.width()-distance/scale})
		} else if(direction == 'right') {
			$('.magazine').css({left: -n*cur.width()+distance/scale})
		}
		setTimeout(function(){mag.removeClass('unanimated')}, 5)

	} else if(phase == 'start') {
		togglePageDragging('on')

	} else if(phase == 'cancel') {
		togglePageDragging('off')
		setCurrentPage()

	} else if(phase =='end' ) {
		togglePageDragging('off')
		// see which page is closer to the middle of the screen and set it...
		// do this based on how much we dragged...
		var p = Math.ceil((distance/scale)/cur.width())

		// prev page...
		if(direction == 'right') {
			// two+ fingers moves to closest article...
			if(fingers >= 2){
				prevArticle()
			} else {
				setCurrentPage(Math.max(n-p, 0))
			}
		// next page...
		} else if(direction == 'left'){
			// two+ fingers moves to closest article...
			if(fingers >= 2){
				nextArticle()
			} else {
				setCurrentPage(Math.min(n+p, pages.length-1))
			}
		}
	}
}



/********************************************************** layout ***/

// XXX for some magical reason this is not called...
function fitNPages(n, fit_to_content){
	if(n == null){
		n = 1
	}
	if(n > 1 && fit_to_content == null){
		fit_to_content = true
	}
	var view = $('.viewer')
	var page = $('.page')
	var content = $('.content')

	var W = view.width()
	var H = view.height()
	var cW = content.width()
	var cH = content.height()

	var rW = cW
	var scale = getPageScale()

	if(fit_to_content){
		page.width(cW)
		page.height(cH)
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

	// position the pages correctly...
	$('.magazine').css({
		'margin-left': -rW/2
	})

	// do the scaling... 
	setElementScale($('.scaler'), scale)
	// fix position...
	setCurrentPage(null, rW)
}



/********************************************************* actions ***/

function setCurrentPage(n, W){
	if(n == null){
		var cur = $('.current.page')
		n = $('.page').index(cur) 
	} else if(typeof(n) == typeof(1)) {
		var cur = $($('.page')[n])
	} else {
		var cur = $(n)
		n = $('.page').index(cur) 
	}

	$('.current.page').removeClass('current')
	cur.addClass('current')

	var mag = $('.magazine')
	var W = W == null ? cur.width() : W
	mag.css({left: -n*W})

	// XXX should this be here???
	saveState()

	return cur
}



function goToMagazineCover(){
	setCurrentPage(0)
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
			$('.article .page:first-child').first())
	}
	// just find the next one...
	var articles = $('.article')
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
	var articles = $('.article')
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
	return parseInt($.jStorage.get('current_page', 0))
}
function saveStorageState(){
	$.jStorage.set('current_page', getPageNumber())
}



// generic state managers...
function loadState(){
	var n = loadURLState()
	if(n != null){
		setCurrentPage(n)
	} else {
		setCurrentPage(loadStorageState())
	}
}
function saveState(){
	saveURLState()
	saveStorageState()
}



/********************************************************** editor ***/

// XXX create magazine...
function createMagazine(){
}



// XXX create article (magazine, title, position)...
function createArticle(magazine, title){
}



// XXX create page (article, template, position)...
function createPage(article, template){
}



/*********************************************************************/
// vim:set ts=4 sw=4 :
