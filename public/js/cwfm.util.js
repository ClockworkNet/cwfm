if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.querystring = {
	encode: function(data) {
		var pairs = [];
		for (var key in data) {
			if (!data.hasOwnProperty(key)) continue;
			var value = data[key];
			if (Array.isArray(value)) {
				key += '[]';
			}
			value = encodeURIComponent(value);
			pairs.push(key + '=' + value);
		}
		return pairs.join('&');
	},
	decode: function(str) {
		str = str ? str : window.location.search;
		if (!str || str.length == 0) return {};
		if (str[0] == '?') str = str.substr(1);
		var pairs = str.split('&');
		var data = {};
		pairs.forEach(function(pair) {
			pair = pair.split('=');
			var key = pair[0];
			var value = pair[1];
			if (!key) return;
			value = decodeURIComponent(value);
			if (key.indexOf('[]') >= 0) {
				key = key.substr(0, key.indexOf['[]']);
				if (!data[key]) data[key] = [];
				data[key].push(value);
			}
			else {
				data[key] = value;
			}
		});
		return data;
	}
};

cwfm.util = function() {
	return {
		querystring: cwfm.querystring
	};
};
