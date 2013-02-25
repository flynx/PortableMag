/**********************************************************************
* 
*
*
**********************************************************************/

//var DEBUG = DEBUG != null ? DEBUG : true



/********************************************************** logger ***/

function Logger(){
	_log = null
	return {
		setup: function(){
			if(_log == null){
				_log = $('<div id="log"></div>')
					.css({
						position: 'fixed',
						background: 'silver',
						opacity: 0.5,
						width: 200,
						height: '80%',
						top: 10,
						left: 10,
						'z-index': 90000,
						overflow: 'hidden',
						padding: 10,
					})
					.text('log')
					.appendTo($('body'))
			} else {
				_log.appendTo($('body'))
			}
			return this
		},
		remove: function(){
			_log.detach()
			return this
		},
		log: function(text){
			_log.html(_log.html() + '<br>' + text + '')
			_log.scrollTop(_log.prop('scrollHeight'))
			return this
		},
		clear: function(){
			_log.html('')
			return this
		},
		get: function(){
			return _log
		},
		set: function(elem){
			_log = elem
		}
	}.setup()
}



/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
