/*********************************************************************/
// NOTE: use String.fromCharCode(code)...
// list of keys to be ignored by handler but still handled by the browser...

var keybindings = {
	/*
	// global bindings...
	'*': {
		title: 'Global',
		doc: '',

		ignore: [
			116,												//	F5
			122,												//	F11
			123,												//	F12
			8													//	BkSp
		],

		// ignore the modifiers (shift, alt, ctrl, caps)...
		16:		function(){},
		17:		16,
		18:		16,
		20:		16,												//	Caps Lock
	},


	// overlay...
	'.overlay-mode': {
		title: 'Overlay mode',
		doc: 'Overlay mode key bindings.',

		ignore: [
			33,													//	PgUp
			34,													//	PgDown
			37,													//	Left
			39,													//	Right
			36,													//	Home
			32,													//	Space
			35,													//	End
			38,													//	Up
			40,													//	Down
		],
	},
	*/

	// ignore all keys here...
	'.inline-editor-mode': {
		ignore: '*'
	},

	// everything except overlays...
	'.viewer:not(.inline-editor-mode)': {
		title: 'Ribbon and Viewer',
		doc: '',

		// navigation...
		36:		goToMagazineCover,								//	Home
		219:	36,												//	[
		35:		goToMagazineEnd,								//	End
		221:	35,												//	]
		37:	{
			'default': prevPage,								//	Right
			'ctrl': prevArticle,								//	ctrl-Right
			'shift': prevBookmark								//	shift-Right
		},
		188:	37,												//	<
		39:	{
			'default': nextPage,								//	Left
			'ctrl': nextArticle,								//	ctrl-Left
			'shift': nextBookmark								//	shift-Left
		},
		32:	{
			'default': nextPage,								//	Space
			'shift': prevPage									//	shift-Space
		},
		190:	39,												//	>

		66: {
			'default': toggleBookmark,							//	B
			'ctrl': function(){toggleThemes()},					//	ctrl-B
		},

		// combined navigation with actions..
		38: function(){togglePageView()},						//	Up
		40: function(){togglePageView()},						//	Down

		13:	function(){togglePageView('on')},					//	Enter
		27:	function(){togglePageView('off')},					//	Esc
	}
}



/*********************************************************************/
// vim:set ts=4 sw=4 nowrap :
