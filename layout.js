/**********************************************************************
*
* XXX add copyright and licence info...
*
**********************************************************************/

/********************************************************** layout ***/

var togglePageFitMode = createCSSClassToggler(
	'.viewer', 
	'.page-fit-to-viewer', 
	function(action){
		if(action == 'on'){
			console.log('fitting pages to view...')
			var n = getPageNumber()
			$('.page:not(.no-resize)').width($('.viewer').width())
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

	var s = $('.viewer').scrollLeft()
	var W = $('.viewer').width()
	var cur = -1
	var res = $('.page').map(function(i, e){
		e = $(e)
		var l = e.position().left
		var w = e.width()
		return Math.abs((l+(w/2)) - (s+(W/2)))
	})
	cur = res.index(Math.min.apply(Math, res))
	return cur
}



/********************************************************* actions ***/

function setCurrentPage(n){
	if(n == null){
		n = getPageNumber()
	}
	var l = $('.page').length
	n = n < 0 ? l - n : n
	n = n < -l ? 0 : n
	n = n >= l ? l - 1 : n
	$('.current.page').removeClass('current')
	$($('.page')[n]).addClass('current')
	var cur = $('.current.page')
	var offset = $('.viewer').width()/2 - cur.width()/2
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
