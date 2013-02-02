/**********************************************************************
* 
* Navigator 
*
*
**********************************************************************/
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



/*********************************************************************/
// vim:set ts=4 sw=4 :
