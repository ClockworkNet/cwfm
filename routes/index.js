exports.home = function(req, res, next, User) {
	var data = {
		title: "Clockwork.FM",
		username: req.session.username
	};
	res.render('home', data, function(e, html) {
		if (e) console.error(e);
		res.send(html);
	});
};

exports.room = function(req, res, next, Room, User) {
	for (var abbr in req.query) {
		Room.find({abbr: abbr})
		.populate('djs listeners song')
		.exec(function(e, room) {
			if (e || ! room) {
				console.error(e);
				return res.redirect('/');
			}
			res.render('room', room, function(e, html) {
				if (e) {
					console.error(e);
					res.send('');
				}
				else {
					res.send(html);
				}
			});
		});
		break;
	}
};
