exports.Controller = function(Playlist, Song, User) {
	this.list = function(req, res, next) {
		Playlist.find({owners: req.session.user._id}, function(e, a) {
			if (e) {
				console.error(e);
				return res.jsonp(500, {error: "Error getting playlists"});
			}
			return res.jsonp(a);
		});
	};

	this.detail = function(req, res, next) {
		Playlist.findById(req.params.id)
		.populate('owners songs')
		.exec(function(e, playlist) {
			if (e) {
				console.error(e);
				return res.jsonp(500, {error: "Error getting playlist"});
			}
			return res.jsonp(playlist);
		});
	};

	this.create = function(req, res, next) {
		var playlist = new Playlist(req.body);
		playlist.owners = [req.session.user._id];
		playlist.save(function(e) {
			if (e) {
				console.error(e, req.body);
				return res.jsonp(500, {error: "Error saving playlist"});
			}
			return res.jsonp(playlist);
		});
	};

	this.delete = function(req, res, next) {
		Playlist.findById(req.params.id, function(e, playlist) {
			if (e || !playlist) {
				return res.jsonp(500, {error: "Error getting playlist"});
			}
			if (!playlist.isOwner(req.session.user)) {
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
	};

	this.select = function(req, res, next) {
		Playlist.findById(req.params.id)
		.populate('owners songs')
		.exec(function(e, playlist) {
			if (e || !playlist) {
				return res.jsonp(500, {error: "Error getting playlist"});
			}
			if (!playlist.isOwner(req.session.user)) {
				return res.jsonp(401, {error: "That's not your playlist, silly!"});
			}
			if (req.session.user.playlist == playlist._id) {
				return res.jsonp(playlist);
			}
			User.update({_id: req.session.user._id}, {playlist: playlist._id}, function(e, n) {
				if (e) {
					console.error(e);
					return res.jsonp(500, {error: "Can't select your playlist"});
				}
				if (!n) {
					return res.jsonp(404, {error: "Couldn't update user"});
				}
				return res.jsonp(playlist);
			});
		});
	};

	this.update = function(req, res, next) {
		Playlist.findById(req.params.id, function(e, playlist) {
			if (e || !playlist) {
				return res.jsonp(500, {error: "Error getting playlist"});
			}
			if (!playlist.isOwner(req.session.user)) {
				return res.jsonp(401, {error: "That's not your playlist, silly!"});
			}

			if (req.body.name) playlist.name = req.body.name;
			if (req.body.description) playlist.description = req.body.description;

			if (req.body.songs) {
				playlist.songs = []
				req.body.songs.forEach(function(song) {
					var sid = song._id ? song._id : song;
					playlist.songs.push(sid);
				});
			}

			playlist.save(function(e) {
				if (e) {
					console.error("Error updating playlist", e, playlist);
					return res.jsonp(500, {error: "Error saving playlist"});
				}
				return res.jsonp(playlist);
			});
		});
	};
};
