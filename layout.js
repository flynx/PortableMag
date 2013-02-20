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
