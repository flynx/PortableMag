/**********************************************************************
*
* Magazine editor actions
*
* XXX do a generic shift left/right add/remove set of function and build
* 		selectors around them...
*
**********************************************************************/

/********************************************************* generic ***/

// move element to target and atach it at position 
// position can be 'before', 'after' (default), 'prepend' or 'append'
function moveElementTo(elem, target, position){
	elem
		.detach()
		[position == 'before'? 'insertBefore'
		: position == 'append'? 'appendTo'
		: position == 'prepend'? 'prependTo'
		// the default...
		: 'insertAfter'](target)
	return elem
}



/************************************************ editor: magazine ***/

// NOTE: we do not need to create any event handlers here specifically 
// 		as all events are ahndled by the viewer...
function loadMagazine(mag, position, bookmarks){
	mag = loadMagazineData(mag)
	loadMagazineUserData(position, bookmarks)
	return mag
}


// NOTE: this will, in addition to the magazine itself, will populate with
// 		the basic content (cover, article, article cover)
function createBaseMagazine(title, cover, article){
	removeMagazine()
	var mag = loadMagazine(createMagazine(title, cover, article), 0, [])
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
	setCurrentPage(page)
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

// XXX this needs revision...
// XXX need better separation between full screen and ribbon modes...
// XXX need to split this into more generic parts...

function setupEditorToolbars(){
	var indicator = $('<div class="current-page-indicator"/>')
			.appendTo($('.magazine'))
			.click(function(){
				// NOTE: this does the same thing as handleClick...
				togglePageView('on')
				// XXX for some reason this does not work...
				setCurrentPage()
				setTransitionEasing($('.magazien'), 'cubic-bezier(0.33,0.66,0.66,1)')
			})

	// the toolbars...
	var left_bar = $('<div class="left-toolbar"/>')
			.appendTo(indicator)
	var right_bar = $('<div class="right-toolbar"/>')
			.appendTo(indicator)

	$('<button class="button remove">&times;</button>')
		.attr('title', 'Remove')
		.appendTo(indicator)
		.click(function(){
			setTransitionDuration($('.magazine'), 0)
			removePage()
			runMagazineTemplates()

			return false
		})

	$('<button class="button shift">&gt;</button>')
		.attr('title', 'Move (w. Shift - Clone)')
		.appendTo(right_bar)
		.click(function(){
			// if shift is pressed duplicate current page...
			if(event.shiftKey){
				var n = getPageNumber()
				setTransitionDuration($('.magazine'), 0)
				$('.current.page')
					.clone(true, true)
					.removeClass('current')
					.insertAfter($('.current.page'))
				setCurrentPage(n)
			// simply move...
			} else {
				shiftPageRight()
				runMagazineTemplates()
			}
			return false
		})
	$('<button class="button add">+</button>')
		.attr('title', 'New page')
		.appendTo(right_bar)
		.click(function(){

			return false
		})

	$('<button class="button shift">&lt;</button>')
		.attr('title', 'Move (w. Shift - Clone)')
		.appendTo(left_bar)
		.click(function(){
			// if shift is pressed duplicate current page...
			if(event.shiftKey){
				var n = getPageNumber()
				setTransitionDuration($('.magazine'), 0)
				$('.current.page')
					.clone(true, true)
					.removeClass('current')
					.insertBefore($('.current.page'))
				setCurrentPage(n+1)
			// simply move...
			} else {
				shiftPageLeft()
				runMagazineTemplates()
			}
			return false
		})
	$('<button class="button add">+</button>')
		.attr('title', 'New page')
		.appendTo(left_bar)
		.click(function(){

			return false
		})

	$('<div class="editor-status">Editor Mode</div>')
		.appendTo($('.chrome'))
		.click(function(){
			toggleEditor('off')
		})
}
function clearEditorToolbars(){
	var indicator = $('.current-page-indicator').remove()
}


// general editor mode...
var toggleEditor = createCSSClassToggler(
	'.chrome', 
	'editor', 
	function(){
		setTransitionDuration($('.magazine'), 0)
	},
	function(action){
		if(action == 'on'){
			// make editable fields editable...
			if(togglePageView('?') == 'on'){
				toggleInlineEditor('on')
			}
		} else {
			toggleInlineEditor('off')
		}
		setCurrentPage($('.current.page'))
	})
// inline editor switcher...
var toggleInlineEditor = createCSSClassToggler(
	'.chrome',
	'inline-edior',
	function(action){
		// prevent switching on while not in editor mode...
		if(toggleEditor('?') == 'off' && action == 'on'){
			return false
		}
	},
	function(action){
		if(action == 'on'){
			MagazineScroller.stop()
			$('[contenteditable]').attr({contenteditable: 'true'})
			// ckeditor...
			if(window.CKEDITOR){
				CKEDITOR.inlineAll()
			}
		} else {
			$('[contenteditable]')
				.blur()
				.attr({contenteditable: 'false'})
			MagazineScroller.start()
			// ckeditor...
			if(window.CKEDITOR){
				for( var i in CKEDITOR.instances){
					CKEDITOR.instances[i].destroy()
				}
			}
		}
	})
	


// this will set up the main editor event handlers and data...
function setupEditor(){
	// editable focus...
	$('[contenteditable]')
		.on('focus', function(){
			if(toggleInlineEditor('?') == 'off'){
				$(':focus').blur()
			} else {
				toggleInlineEditorMode('on')
			}
		})
		.on('blur', function(){
			toggleInlineEditorMode('off')
		})

	$('.viewer')
		// move the page indicator...
		// NOTE: this is to be used for page-specific toolbars etc.
		.on('pageChanged', function(){
			var cur = $('.current.page')
			var indicator = $('.current-page-indicator')
			var shift = getElementShift($('.magazine'))
			// XXX this is a stub...
			// reverse the align...
			indicator
				.width(cur.width())
				.height(cur.height())
				.css({
					left: getPageInMagazineOffset(cur),
					top: 0,
				})
		})
		// switch between editor modes...
		.on('fullScreenMode', function(){
			$(':focus').blur()
			if(toggleEditor('?') == 'on'){
				toggleInlineEditor('on')
			}
		})
		.on('ribbonMode', function(){
			$(':focus').blur()
			if(toggleEditor('?') == 'on'){
				toggleInlineEditor('off')
			}
		})
	setupEditorToolbars()
}




/**********************************************************************
* vim:set ts=4 sw=4 :												 */
