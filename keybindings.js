/*********************************************************************/

var KEYBOARD_CONFIG = {
	'Global bindings': {
		doc: 'NOTE: binding priority is the same as the order of sections '+
			'on this page.',
		pattern: '*',

		F4: {
			alt: doc('Close viewer', 
				function(){ 
					if(window.require != null){
						require('nw.gui')
							.Window.get().close()
						return false
					}
				}),
		},
		F5: doc('Full reload viewer', 
			function(){ 
				if(window.require != null){
					require('nw.gui')
						.Window.get().reload()
					return false
				}
			}),
		F12: doc('Show devTools', 
			function(){ 
				if(window.require != null){
					require('nw.gui')
						.Window.get().showDevTools()
					return false
				}
			}),
	},	

	'Overlay mode.': {
		pattern: '.overlay',
		doc: '',

		ignore: '*',

		Esc: function(){
				removeOverlay()
				return false
			},
	},

	'Editor mode.': {
		pattern: '.editor:not(.inline-editor-mode)',
		doc: '',

		'0': function(){
				var n = getPageNumber()
				if(togglePageView('?') == 'on'){
					setMagazineScale(getPageTargetScale(1))
				} else {
					setMagazineScale(getPageTargetScale(PAGES_IN_RIBBON))
				}
				setCurrentPage(n)
			},
		Esc: '0',

		'=': function(){
				var n = getPageNumber()
				setMagazineScale(Math.min(
						getMagazineScale() * 1.2, 
						getPageTargetScale(1)))
				setCurrentPage(n)
			},
		'-': function(){
				var n = getPageNumber()
				setMagazineScale(Math.max(
						getMagazineScale() * 0.8, 
						getPageTargetScale(PAGES_IN_RIBBON*2)))
				setCurrentPage(n)
			},

		'O': {
				// load...
				// XXX needs testing...
				'ctrl': function(){
					showInOverlay('<h1>Open Issue</h1>'
						+'<input type="file" id="upload" name="file" multiple onchange="handleFileSelect(event)"/>')
				},
			},
		'S': {
				// save...
				// XXX needs testing...
				'ctrl': function(){
					dumpJSONFile()
				},
				'ctrl+shift': function(){
					showInOverlay('<h1>Save Issue</h1>'+
						'<p>NOTE: this download will not include the actual '+
						'images. at this point, images should be added manually.</p>'+
						'<p><a id="data_download" href="#">Download</a></p>')

					// setup the data...
					$(generateMagazineDownload)
				},
			},

		// ?
		'/': function(){
				showInOverlay('<h1>Controls</h1>'+
					'<p>NOTE: this section is a stub.<p>'+
					'<table width="100%">'+
						'<tr><td align="right" width="45%"><b> C-O </b></td><td> Load issue from file. </td></tr>'+
						'<tr><td align="right"><b> C-S </b></td><td> Save issue to file. </td></tr>'+
						'<tr><td align="right"><b> - / + </b></td><td> Zoom out/in. </td></tr>'+
						'<tr><td align="right"><b> 0 </b></td><td> Set default zoom level. </td></tr>'+
					'</table>')
			},
	},

	// ignore all keys except Esc here...
	'Inline editor mode.': {
		pattern: '.inline-editor-mode',
		doc: '',

		//ignore: '*'
		Esc: function(){
				$(':focus').blur()
				return false
			},
	},

	'Global bindings.': {
		pattern: '.chrome:not(.inline-editor-mode)',
		doc: '',

		Esc: function(){
				if(toggleEditor('?') == 'on'){
					toggleEditor('off')
				} else {
					togglePageView('off')
				}
			},

		Home: firstPage,
		End: lastPage, 
		Left: {
				default: function(){ prevPage() },
				shift: prevBookmark,
				ctrl: prevArticle,
			},
		Right: {
				default: function(){ nextPage() },
				shift: nextBookmark,
				ctrl: nextArticle,
			},
		Space:	{
				default: 'Right',
				shift: 'Left'
			},
		//Tab: 'Space',
		Tab: function(){ return false },
		Enter: function(){ togglePageView('on') },
		// combined navigation with actions..
		Up: function(){ togglePageView() },
		Down: function(){ togglePageView() },

		F: function(){ togglePageFitMode() },
		B: {
				default: function(){ toggleBookmark() },
				ctrl: function(){ toggleThemes() },
			},

		// XXX this should not be in the production viewer...
		E: function(){ toggleEditor() },
	},
} 


/*********************************************************************/
// vim:set ts=4 sw=4 nowrap :
