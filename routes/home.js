module.exports = function(Room, User) {
	this.home = function(req, res, next) {
		var data = {
			title: "Clockwork.FM",
			user: req.user
		};
		res.render('home', data, function(e, html) {
			if (e) console.trace(e);
			res.send(html);
		});
	};

	this.room = function(req, res, next) {
		for (var abbr in req.query) {
			Room.findOne({abbr: abbr})
			.populate('djs listeners song')
			.exec(function(e, room) {
				if (e || ! room) {
					console.trace(e);
					return res.redirect('/');
				}
				console.info(room);
				res.render('room', room, function(e, html) {
					if (e) {
						console.trace(e);
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
}
