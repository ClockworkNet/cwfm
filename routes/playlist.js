exports.Controller = function(Playlist, Song, User) {
	this.list = function(req, res, next) {
		User.findOne({username: req.session.username}, function(e, user) {
			if (e) {
				console.error(e);
				return res.jsonp(500, {error: "Error geting user"});
			}
			if (!user) return res.jsonp([]);
			Playlist.find({owners: user._id}, function(e, a) {
				if (e) {
					console.error(e);
					return res.jsonp(500, {error: "Error getting playlists"});
				}
				return res.jsonp(a);
			});
		});
	};

	this.detail = function(req, res, next) {
		User.findOne({username: req.session.username}, function(e, user) {
			if (e || !user) {
				console.error(e, user);
				return res.jsonp(500, {error: "Error geting user"});
			}
			Playlist.findById(req.params.id)
			.populate('owners songs')
			.exec(function(e, playlist) {
				if (e) {
					console.error(e);
					return res.jsonp(500, {error: "Error getting playlist"});
				}
				return res.jsonp(playlist);
			});
		});
	};

	this.create = function(req, res, next) {
		User.findOne({username: req.session.username}, function(e, user) {
			if (e || !user) {
				console.error(e, user);
				return res.jsonp(500, {error: "Error geting user"});
			}
			var playlist = new Playlist(req.body);
			playlist.owners = [user._id];
			playlist.save(function(e) {
				if (e) {
					console.error(e, req.body);
					return res.jsonp(500, {error: "Error saving playlist"});
				}
				return res.jsonp(playlist);
			});
		});
	};

	this.delete = function(req, res, next) {
		User.findOne({username: req.session.username}, function(e, user) {
			if (e || !user) {
				console.error(e, user);
				return res.jsonp(500, {error: "Error geting user"});
			}
			Playlist.findById(req.params.id, function(e, playlist) {
				if (e || !playlist) {
					return res.jsonp(500, {error: "Error getting playlist"});
				}
				if (!playlist.isOwner(user)) {
					return res.jsonp(401, {error: "That's not your playlist, silly!"});
				}
				Playlist.remove({_id: playlist._id}, function(e) {
					if (e) {
						console.error(e);
						return res.jsonp(500, {error: "Error deleting your list"});
					}
					return res.jsonp(playlist);
				});
			});
		});
	};

	this.select = function(req, res, next) {
		User.findOne({username: req.session.username}, function(e, user) {
			if (e || !user) {
				console.error(e, user);
				return res.jsonp(500, {error: "Error geting user"});
			}
			Playlist.findById(req.params.id)
			.populate('owners songs')
			.exec(function(e, playlist) {
				if (e || !playlist) {
					return res.jsonp(500, {error: "Error getting playlist"});
				}
				if (!playlist.isOwner(user)) {
					return res.jsonp(401, {error: "That's not your playlist, silly!"});
				}
				if (user.playlist == playlist._id) {
					return res.jsonp(playlist);
				}
				user.playlist = playlist._id;
				user.save(function(e) {
					if (e) {
						console.error(e);
						return res.jsonp(500, {error: "Can't select your playlist"});
					}
					return res.jsonp(playlist);
				});
			});
		});
	};

	this.update = function(req, res, next) {
		User.findOne({username: req.session.username}, function(e, user) {
			if (e || !user) {
				console.error(e, user);
				return res.jsonp(500, {error: "Error geting user"});
			}

			Playlist.findById(req.params.id, function(e, playlist) {
				if (e || !playlist) {
					return res.jsonp(500, {error: "Error getting playlist"});
				}
				if (!playlist.isOwner(user)) {
					return res.jsonp(401, {error: "That's not your playlist, silly!"});
				}

				if (req.body.name) playlist.name = req.body.name;
				if (req.body.description) playlist.description = req.body.description;

				if (req.body.songs) {
					playlist.songs = req.body.songs;
				}

				playlist.save(function(e) {
					if (e) {
						console.error(e);
						return res.jsonp(500, {error: "Error saving playlist"});
					}
					return res.jsonp(playlist);
				});
			});
		});
	};
};
