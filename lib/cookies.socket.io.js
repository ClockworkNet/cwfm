module.exports = function(Cookies, keys) {
	this.attach = function(socket, next) {
		if (!socket.request || !socket.request.headers) {
			console.error("Socket does not have headers.", socket.request);
		}
		socket.cookies = new Cookies(socket.request, {}, keys);
		next();
	};
};