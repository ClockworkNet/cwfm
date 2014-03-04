exports.Controller = function(Room, User, Chat, io) {
	this.list = function(res, req, next) {
		Chat.find({room: req.params.id})
		.populate('author')
		.exec(function(e, a) {
			if (e) {
				console.error("Error getting chat list", e);
			}
			return res.jsonp(a);
		});
	};

	this.say = function(res, req, next) {
		Chat.create({
			author: req.session.user._id,
			content: req.body.message,
			room: req.params.id
		}, function(e, chat) {
			if (e) {
				console.error("Error saving chat", e);
				return res.jsonp(500, {e: "Error saving chat"});
			}
			// Add extra author information.
			chat[author] = req.session.user;
			io.sockets.in(req.params.id).emit('chat', chat);
			return res.jsonp(chat);
		});
	};
}
