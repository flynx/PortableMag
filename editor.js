/**********************************************************************
*
* Magazine editor actions
*
*
**********************************************************************/

/************************************************ editor: magazine ***/

// NOTE: we do not need to create any event handlers here specifically 
// 		as all events are ahndled by the viewer...
function loadMagazine(mag, position, bookmarks){
	mag = loadMagazineData(mag)
	loadMagazineChrome(position, bookmarks)
	return mag
}


// NOTE: this will, in addition to the magazine itself, will populate with
// 		the basic content (cover, article, article cover)
function createBaseMagazine(title, cover, article){
	removeMagazine()
	var mag = loadMagazine(createMagazine(title, cover, article))
	return mag
}


/************************************************* editor: article ***/

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


// XXX TEST!
function shiftArticleLeft(article){
	var articles = $('.article')
	var i = articles.index(article)
	if(i <= 0){
		return article
	}
	var target = $(articles[i-1])
	article
		.detach()
		.insertBefore(target)
	setCurrentPage()
	$('.viewer').trigger('articleMoved', res)
	return res
}
// XXX TEST!
function shiftArticleRight(article){
	var articles = $('.article')
	var i = articles.index(article)
	if(i >= articles.length){
		return article
	}
	var target = $(articles[i+1])
	article
		.detach()
		.insertAfter(target)
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
