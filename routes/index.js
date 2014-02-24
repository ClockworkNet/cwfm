exports.index = function(req, res, next, User) {
	var data = {
		title: "Clockwork.FM",
		username: req.session.username
	};
	res.render('index', data, function(e, html) {
		res.send(html);
	});
};

exports.room = function(req, res, next, Room) {
	for (var abbr in req.query) {
		Room.find({abbr: abbr}, function(e, room) {
			if (e || ! room) {
				res.redirect('/');
			}
			res.render('room', room, function(e, html) {
				res.send(html);
			});
		});
	}
};
