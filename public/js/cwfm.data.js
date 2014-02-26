if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.data = {};

cwfm.data.service  =  function() {
	var data      = {};
	var listeners = [];
	return {
		change: function (callback) {
			listeners.push(callback);
		}
		, get: function () {
			return data;
		}
		, set: function (data) {
			data = typeof(data) == 'object' ? data : {};
			angular.forEach(listeners, function(listener) {
				listener(data);
			});
		}
	}
};
