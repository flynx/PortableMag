/**********************************************************************
*
* XXX add copyright and licence info...
*
**********************************************************************/

var NAVIGATE_RELATIVE_TO_VISIBLE = false

var USE_PAGE_ALIGN = true



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
			setCurrentPage(n)
		} else {
			console.log('restoring page sizes...')
			var n = getPageNumber()
			$('.page:not(.no-resize)').width('')
			setCurrentPage(n)
		}
	})



/********************************************************* helpers ***/

function getPageNumber(page){
	if(page != null){
		return $('.page').index($(page))
	}
	if(!NAVIGATE_RELATIVE_TO_VISIBLE){
		return $('.page').index($('.current.page'))
	} else {
		var s = $('.viewer').scrollLeft()
		var W = $('.viewer').width()
		var scale = getMagazineScale()
		var cur = -1
		var res = $('.page').map(function(i, e){
			e = $(e)
			var l = e.position().left
			var w = e.width()*scale
			return Math.abs((l+(w/2)) - (s+(W/2)))
		})
		cur = res.index(Math.min.apply(Math, res))
		return cur
	}
}

function getMagazineScale(){
	return getElementScale($('.magazine'))
}
function setMagazineScale(scale){
	var mag = $('.magazine')
	// NOTE: we are updating margins to make the scroll area adapt to new scale...
	var w = mag.width()
	var m = -(w - (w*scale))/2 + $('.viewer').width()/2
	mag.css({
		'margin-left': m,
		'margin-right': m
	})
	setElementScale(mag, scale)
	setCurrentPage()
}





/********************************************************* actions ***/

function setCurrentPage(n){
	if(n == null){
		n = getPageNumber()
	}
	var scale = getMagazineScale()
	var l = $('.page').length
	n = n < 0 ? l - n : n
	n = n < -l ? 0 : n
	n = n >= l ? l - 1 : n
	$('.current.page').removeClass('current')
	$($('.page')[n]).addClass('current')
	var cur = $('.current.page')
	if(USE_PAGE_ALIGN
			&& $('.page').width()*2*scale > $('.viewer').width()){
		var align = getPageAlign()
	} else {
		var align = 'center'
	}
	if(align == 'left'){
		var offset = 0
	} else if(align == 'right'){
		var offset = $('.viewer').width() - cur.width()*scale
	} else {
		var offset = $('.viewer').width()/2 - (cur.width()/2)*scale
	}
	cur.ScrollTo({
		offsetLeft: offset
	})
}


function nextPage(){
	setCurrentPage(getPageNumber()+1)
}
function prevPage(){
	var n = getPageNumber()-1
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
