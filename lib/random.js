exports.float = function(low, high) {
	return Math.random() * (high - low) + low;
};

exports.number = function(low, high) {
	return Math.floor(Math.random() * (high - low + 1)) + low;
};

exports.array = function(len, func, args) {
	var a = [];
	args = args || [];
	for (var i=0; i<len; i++) {
		a.push(func.apply(this, args));
	}
	return a;
}

exports.id = function(len) {
	var most = 36;
	var list = exports.array(len, exports.number, [0, most - 1]);
	var chars = list.map(function(i) {
		return i.toString(most);
	});
	return chars.join('');
};
