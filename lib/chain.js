var toArgs = function(args) {
	return Array.prototype.slice.call(args);
};

var inject = function() {
	var injected = toArgs(arguments);
	var index = injected.splice(0, 1);
	var chain = this;
	return function() {
		var args = toArgs(arguments);
		args.splice(index, 0, injected);
		chain.apply(this, args);
	};
};

// Takes a list of objects and prepends them to
// the argument list for the chain of methods being called
var prepend = function() {
	var objs = toArgs(arguments);
	objs.splice(0, 0, 0);
	return inject.call(this, objs);
};

// Takes a list of objects and appends them to
// the end of the argument list for the chain of methods
var append = function() {
	var objs = toArgs(arguments);
	objs.splice(0, 0, objs.length);
	return inject.call(this, objs);
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

    next.prepend = prepend;
    next.append  = append;

    return next;
};
