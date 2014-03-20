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
