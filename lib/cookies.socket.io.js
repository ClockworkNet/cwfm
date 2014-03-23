module.exports = function(Cookies, keys) {
	this.attach = function(socket, data, callback, next) {
		var req = socket.client && socket.client.request || socket.request;
		if (!req) {
			console.error("Socket does not have a valid request object.", arguments);
			return false;
		}
		socket.cookies = new Cookies(req, {}, keys);
		next && next();
		return true;
	};
};