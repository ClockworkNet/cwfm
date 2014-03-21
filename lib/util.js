var toJSON = exports.toJSON = function(a) {

	if (!a) {
		return a;
	}

	if (a.toJSON) {
		return a.toJSON();
	}

	if (a.forEach) {
		a.forEach(function(o, i) {
			a[i] = toJSON(o);
		});
		return a;
	}

	if ('object' == typeof(a)) {
		for (var key in a) {
			key[a] = toJSON(key[a]);
		}
		return a;
	}

	return a;
};

// Returns a new method that binds the controller context to the
// method and appends any specified arguments to the parameter list
exports.inject = function(method) {
	if (typeof(method) != 'function') {
		throw new Error("Invalid method");
	}

	var args = Array.prototype.slice.call(arguments, 1);

	return function() {
		var params = Array.prototype.slice.call(arguments, 0);
		if (args) params = params.concat(args);
		try {
			method.apply(this, params);
		}
		catch (e) {
			console.trace(e);
		}
	};
};

// Wraps the res.jsonp method to call toJSON() on the output when it can be called
exports.jsonp = function(req, res, next) {
	var jsonp = res.jsonp;
	var encoded = function(data) {
		jsonp.call(this, toJSON(data));
	};
	res.jsonp = encoded;
	next();
};
