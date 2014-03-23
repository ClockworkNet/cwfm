// Chains a series of functions together, one after another.
// Each function should expect the same number of parameters. The last
// parameter will be a 'next' function that can be called to trigger the
// next method in the chain of commands. If the 'next' method is not called
// the chain of methods end.
module.exports = exports = function chain() {
    var stack = Array.prototype.slice.call(arguments, 0);
    var i = 0;
    return function next() {
		var ctx = this;
        var func = stack[i++];
        if ('function' != typeof func) {
            // End of the function stack
            return false;
        }

        var args = Array.prototype.slice.call(arguments, 0);
        if (i == 1) {
			args.push(function() {
				next.apply(ctx, args);
			});
        }

        // Call the current function in the stack
        func.apply(ctx, args);
    };
};
