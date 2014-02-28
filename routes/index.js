exports.Controller = function(Room, User) {
	this.home = function(req, res, next) {
		var data = {
			title: "Clockwork.FM",
			username: req.session.username
		};
		res.render('home', data, function(e, html) {
			if (e) console.error(e);
			res.send(html);
		});
	};

	this.room = function(req, res, next) {
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
}
