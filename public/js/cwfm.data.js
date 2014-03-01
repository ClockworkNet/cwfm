if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.data = {};

cwfm.data.service  =  function() {
	var data      = {};
	var listeners = {};
	return {
		change: function (callback) {
			this.on('change', callback);
		}
		, on: function(event, callback) {
			if (!listeners[event]) listeners[event] = [];
			listeners[event].push(callback);
		}
		, trigger: function(event) {
			if (!listeners[event]) return;
			angular.forEach(listeners[event], function(listener) {
				listener(data);
			});
		}
		, get: function () {
			return data;
		}
		, set: function (value) {
			data = typeof(value) == 'object' ? value : {};
			this.trigger('change');
		}
	}
};
