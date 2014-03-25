var toArgs = function(args) {
	return Array.prototype.slice.call(args);
};

var injectFirst = function() {
	var injected = toArgs(arguments);
	var chain = this;
	return withMethods(function() {
		var args = toArgs(arguments);
		chain.apply(this, injected.concat(args));
	});
};

var injectLast = function() {
	var injected = toArgs(arguments);
	var chain = this;
	return withMethods(function() {
		var args = toArgs(arguments);
		chain.apply(this, args.concat(injected));
	});
};

var withMethods = function(func) {
	func.injectFirst = injectFirst;
	func.injectLast = injectLast;
	return func;
};

// Chains a series of functions together, one after another.
// Each function should expect the same number of parameters. The last
// parameter will be a 'next' function that can be called to trigger the
// next method in the chain of commands. If the 'next' method is not called
// the chain of methods end.
module.exports = exports = function chain() {
    var stack = toArgs(arguments);
    var i = 0;
    var next = function() {
		var ctx = this;
        var func = stack[i++];
        if ('function' != typeof func) {
            // End of the function stack
            return false;
        }

        var args = toArgs(arguments);
        if (i == 1) {
			args.push(function() {
				next.apply(ctx, args);
			});
        }

        // Call the current function in the stack
        func.apply(ctx, args);
    };

    return withMethods(next);
};
