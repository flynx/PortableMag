/**********************************************************************
* 
*
*
**********************************************************************/

//var DEBUG = DEBUG != null ? DEBUG : true

var STUB_TEXT = 'Lorem ipsum dolor sit amet, consectetuer adipiscing '+
	'elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore '+
	'magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis '+
	'nostrud exerci tation ullamcorper suscipit lobortis nisl ut '+
	'aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor '+
	'in hendrerit in vulputate velit esse molestie consequat, vel '+
	'illum dolore eu feugiat nulla facilisis at vero eros et accumsan '+
	'et iusto odio dignissim qui blandit praesent luptatum zzril '+
	'delenit augue duis dolore te feugait nulla facilisi. Nam liber '+
	'tempor cum soluta nobis eleifend option congue nihil imperdiet '+
	'doming id quod mazim placerat facer possim assum. Typi non habent '+
	'claritatem insitam; est usus legentis in iis qui facit eorum '+
	'claritatem. Investigationes demonstraverunt lectores legere me '+
	'lius quod ii legunt saepius.'

var STUB_VERTICAL_IMAGE_URL = 'img.jpg'
var STUB_HORIZONTAL_IMAGE_URL = 'landscape.jpg'


/*********************************************************************/

function Element(cls, content, classes, style, attrs){
	return $('<div/>')
		.addClass(cls + (classes != null ? (' ' + classes) : '') )
		.css(style != null ? style : {})
		.attr(attrs != null ? attrs : {})
		.append(content)
}


/*********************************************************************/
// XXX this intersects with magazine constructors in magazine.js...

function Group(content, classes, style){
	return Element('group', content, classes, style)
}

function Page(content, classes){
	return Element('page', content, classes)
}

function Content(content, classes, style, attrs){
	return Element('content', content, classes, style, attrs)
}



/*********************************************************************/

function RawPage(text){
	text = text != null ? text : 'Raw Page' 
	return Page(Content('Raw Page', null, null, {contenteditable: 'False'}))
}


function TextPage(title, text){
	title = title != null ? title : 'Text Page'
	text = text != null ? text : STUB_TEXT 
	return Page(Content($(
		'<div class="header" contenteditable="false"><h1>'+title+'</h1></div>'+
		'<div class="body two-column" contenteditable="false">'+text+'</div>'+
		'<div class="footer"><div class="page-number-text">[PAGE NUMBER]</div></div>')))
}


function CaptionPage(text){
	text = text != null ? text : '<h3>Caption Page</h3><p>'+STUB_TEXT+'</p>'
	return Page(Content(text, null, null, {contenteditable: 'false'}), 'caption-bottom-arrow')
}


// XXX this needs a togglePageView(..) after attaching to get visible...
function ImagePage(url, caption){
	url = url != null ? url : STUB_HORIZONTAL_IMAGE_URL
	caption = caption != null ? caption : '<h3>Image Caption</h3>' + STUB_TEXT 
	return Page(Content($(
				'<div class="caption hidden" contenteditable="false">'+caption+'</div>'+
				'<div class="page-number-text">[PAGE NUMBER]</div>'),
			null,
			{'background-image': 'url('+url+')'}), 
		'image-fit')
}


function ImageFitHeightPage(url, caption){
	url = url != null ? url : STUB_VERTICAL_IMAGE_URL
	caption = caption != null ? caption : '<h3>Image Caption</h3>' + STUB_TEXT 
	return Page(Content($(
			'<img src="'+url+'">'+
			'<div class="caption hidden" contenteditable="false">'+caption+'</div>'+
			'<div class="page-number-text">[PAGE NUMBER]</div>')),
		'image-fit-height')
}



/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
