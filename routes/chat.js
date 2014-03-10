module.exports = function(Room, User, Chat, io) {
	var defaultLimit = 10;

	this.list = function(req, res, next) {
		var count = req.body.limit ? req.body.limit : defaultLimit;
		var skip  = req.body.skip ? req.body.skip : 0;

		Room.findOne({abbr: req.params.abbr})
		.exec(function(e, room) {
			if (e || !room) {
				console.trace("Error getting room's chat list", e, room);
				return res.jsonp([]);
			}
			Chat.find({room: room._id})
			.limit(count).skip(skip).sort('-posted')
			.populate('author')
			.exec(function(e, a) {
				if (e) {
					console.trace("Error getting chat list", e);
				}
				a.reverse();
				return res.jsonp(a);
			});
		});
	};

	this.say = function(req, res, next) {
		if (!req.body.content.length) {
			return res.jsonp({});
		}
		Room.findOne({abbr: req.params.abbr}, function(e, room) {
			if (e || !room) {
				console.trace("Error saying something", e, room);
				return res.jsonp(500, {error: "Error sending message"});
			}
			var user = new User(req.session.user);
			var chat = new Chat({
				author: user,
				content: req.body.content,
				room: room,
				posted: Date.now()
			});
			chat.save(function(e) {
				if (e) {
					console.trace("Error saving chat", e);
					return res.jsonp(500, {e: "Error saving chat"});
				}
				chat.populate('author room', function(e, chat) {
					io.sockets.in(req.params.abbr).emit('chat', chat);
					return res.jsonp(chat);
				});
			});
		});
	};
}
