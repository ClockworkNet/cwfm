// Parses a handshake cookie and attaches it to a socket
module.exports = function(io, cookies) {
	var cookieWrapper = function(items) {
		this.items = items;
		this.get = function(key) {
			return this.items[key];
		}
		this.set = function(key, value) {
			console.error("Setting cookie values in a socket doesn't work!");
		}
	};

	this.attach = function(socket, next) {
		next = next || function() {};
		var handshake = socket.handshake;
		if (!handshake) {
			return next(null, socket);
		}
		console.info(handshake);
		var items = handshake.secureCookies || handshake.signedCookies || handshake.cookies || {};
		console.info(items);
		socket.cookies = new cookieWrapper(items);
		next(null, socket);
	};
}
