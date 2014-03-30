module.exports = function(Room, User, Playlist, Song, io) {

	// Stores the timeout used to trigger the next song.
	// This is keyed on the room abbr.
	var songTimers = {};

	// The time in ms to start preloading the next song.
	var preloadTime = 2000;


	// Ensures that a song is playing if it should be.
	var ensureSong = function(room) {
		var remaining = room.song ? room.song.remaining(room.songStarted) : 0;
		if (remaining <= 0) {
			setImmediate(nextSong, room);
		}
	};

	var rotateTable = function(room, then) {
		var djId = room.dj._id ? room.dj._id : room.dj;

		if (!djId) {
			then();
			return;
		}

		var rotateDjs = function(e) {
			if (e) {
				console.trace("Error rotating table", room.dj, e);
			}
			if (room.rotateDjs()) {
				console.info("Rotated DJs.");
				room.save(then);
			}
			else {
				then();
			}
		};

		User.findById(djId)
		.populate('playlist')
		.exec(function(e, dj) {
			if (e) {
				console.trace("Error getting DJ playlist", e);
			}

			if (!dj) {
				rotateDjs();
			}
			else {
				dj.playlist.rotate().save(rotateDjs);
			}
		});

	};

	var stopSong = function(room) {
		if (songTimers[room.abbr]) {
			clearTimeout(songTimers[room.abbr]);
		}
		room.song = null;
		room.songDj = null;
		room.songStarted = null;
		room.save(function(e) {
			if (e) {
				console.trace("Error saving room after song stop", room, e);
			}
			console.info("Song has stopped", room);
			io.sockets.in(room.abbr).emit("song.stopped", room.toJSON());
		});
	}

	var nextSong = function(room) {
		if (!room) {
			console.error("No room");
		}

		if (songTimers[room.abbr]) {
			clearTimeout(songTimers[room.abbr]);
		}

		console.info("nextSong", room.djs);

		if (room.djs.length < 1) {
			console.info("No DJs in the room. Stopping music.", room.abbr);
			stopSong(room);
			return;
		}

		rotateTable(room, function() {
			// Pick the new DJ's next song from her current playlist
			// and set it on the room.
			var djId = room.dj._id ? room.dj._id : room.dj;

			User.findById(djId).populate('playlist').exec(function(e, dj) {
				if (e || !dj) {
					console.trace("Error finding DJ", e, dj);
					return;
				}
				var songId = dj.playlist.songs[0];
				Song.findById(songId, function(e, song) {
					if (e) {
						console.trace("Error finding song to play", e, songId, dj.playlist);
						return;
					}
					if (!song) {
						console.trace("Song not found for id. Removing from playlist.", songId);
						dj.playlist.songs.shift();
						dj.playlist.save();
						setImmediate(nextSong, room);
						return;
					}
					setImmediate(playSong, room, dj, song);
				});
			});
		});
	};


	// Plays a song and schedules the call for playing the next song
	var playSong = function(room, dj, song) {
		if (!song) {
			console.error("No song specified", room);
			return;
		}

		if (!song._id) {
			return Song.findById(song, function(e, song) {
				setImmediate(playSong, room, dj, song);
			});
		}

		var started = new Date();
		started.setMilliseconds(preloadTime);

		Room.findById(room._id)
		.populate('djs')
		.exec(function(e, room) {
			room.song = song;
			room.songDj = dj;
			room.songStarted = started;
			room.save(function(e) {
				if (e) {
					console.trace("Error populating room for socket emitting", e);
					return;
				}

				// Schedule the next song
				console.info("Scheduling next song", song.duration * 1000);
				var delay = (song.duration * 1000) - preloadTime;
				songTimers[room.abbr] = setTimeout(nextSong, song.duration * 1000, room);

				// Send a message to all clients in the room
				var roomData = room.toJSON();
				roomData.song = song.toJSON();
				roomData.songDj = dj.toJSON();
				console.info("Playing song", song.path, roomData);
				io.sockets.in(room.abbr).emit('song.changed', roomData);
			});
		});
	};


	this.list = function(req, res, next) {
		var rooms = Room.find({}, function(e, a) {
			if (e) console.trace(e);
			res.jsonp({rooms: a});
		});
	};

	this.detail = function(req, res, next) {
		Room.findOne({abbr: req.params.abbr})
		.populate('djs songDj listeners song')
		.exec(function(e, room) {
			if (e) console.trace(e);
			res.jsonp(room);
		});
	};

	this.create = function(req, res, next) {
		Room.findOne({abbr: req.params.abbr}, function(e, room) {
			if (e) return res.jsonp(500, e);
			if (!room) {
				room = new Room(req.body);
			}
			room.join('owners', req.user);
			room.save(function(e) {
				if (e) return res.jsonp(500, {error: e});
				Room.find({}, function(e, a) {
					if (e) console.trace(e);
					res.jsonp({rooms: a});
				});
			});
		});
	};

	this.delete = function(req, res, next) {
		Room.findOne({abbr: req.params.abbr}, function(e, room) {
			if (e) return res.jsonp(500, e);
			var user = req.user;
			if (!user.admin && room.indexOf('owners', user) < 0) {
				return res.jsonp(401, {error: "You must be an owner to delete a room"});
			}
			room.remove(function(e) {
				if (e) {
					console.trace("Error removing room", e, room);
					return res.jsonp(500, {error: "Could not delete room"});
				}
				Room.find({}, function(e, a) {
					return res.jsonp({rooms: a});
				});
			});
		});
	};

	// Called when a user joins a room
	this.join = function(req, res, next) {
		Room.findOne({abbr: req.params.abbr}, function(e, room) {
			if (e) return res.jsonp(500, e);
			if (!room) {
				return res.jsonp(404, {error: "Room doesn't exist"});
			}

			room.join('listeners', req.user);
			room.save(function(e) {
				if (e) {
					console.trace("Error saving new listener", e);
					return res.jsonp(room);
				}
				// After joining, load the full room information and return it
				Room.findById(room._id)
				.populate('djs songDj listeners song')
				.exec(function(e, room) {
					ensureSong(room);
					console.info("We have a new user in the room", room.name, req.user.username);
					io.sockets.in(room.abbr).emit('member.joined', req.user.toJSON());
					return res.jsonp(room);
				});
			});
		});
	};

	// Called when a user connects to a room to listen in on the socket
	this.listen = function(socket, data, callback, next) {
		if (!socket.user) {
			console.error("No user on socket", socket.id);
			callback(false);;
		}
		Room.findOne({abbr: data.abbr}, function(e, room) {
			if (e) throw e;
			socket.join(room.abbr);
			console.info(socket.id, "is listening to", room.abbr);
			callback(true);
		});
	};

	// Called when user leaves a room
	this.leave = function(socket, data, callback, next) {
		console.info(socket.id, "is leaving", data.abbr);
		socket.leave(data.abbr);

		var user = socket.user;
		var uid = user && user._id;
		if (!uid) {
			console.info("No session information found. Skipping room departure");
			return;
		}
		Room.findOne({abbr: data.abbr}, function(e, room) {
			if (e || !room) return;
			if (room.removeUser(uid)) {
				room.save(function(e) {
					console.info(socket.user.username, "left room", room.name);
					io.sockets.in(room.abbr).emit('member.departed', user.toJSON());
				});
			}
		});
	};

	// Called when a socket connection is dropped
	this.exit = function(socket, data, callback, next) {
		if (!socket.user) {
			console.error("No user to speak of during exit");
			return;
		}
		Room.find({}, function(e, a) {
			a.forEach(function(r) {
				if (r.removeUser(socket.user._id)) {
					console.info(socket.user.username, "exited room", r.name);
					r.save();
					io.sockets.in(r.abbr).emit('member.departed', socket.user.toJSON());
				}
			});
		});
	};

	this.dj = function(req, res, next) {
		User.findById(req.user._id)
		.populate('playlist')
		.exec(function(e, user) {
			if (e) {
				console.trace(e);
				return res.jsonp(401, {error: "Not authorized"});
			}
			if (!user || !user.playlist) {
				return res.jsonp(400, {error: "Please select a playlist"});
			}
			Room.findOne({abbr: req.params.abbr})
			.populate('djs')
			.exec(function(e, room) {
				if (e || !room) {
					console.trace(e);
					return res.jsonp(404, {error: "Room not found"});
				}
				room.join('djs', user);
				room.save();
				if (!room.song && user.playlist) {
					var song = user.playlist.songAt(0);
					console.info("starting songs", song);
					setImmediate(playSong, room, user, song);
				}
				io.sockets.in(room.abbr).emit('dj.joined', user.toJSON());
				res.jsonp({info: "Joined djs"});
			});
		});
	};

	this.undj = function(req, res, next) {
		Room.findOne({abbr: req.params.abbr}, function(e, room) {
			if (e) return res.jsonp(500, e);
			if (room.leave('djs', req.user)) {
				console.info("BEFORE SAVE", room.djs);
				room.save(function(e) {
					console.info("AFTER SAVE", room.djs);
					if (e) {
						console.trace("Error undjing", e);
						return;
					}
					io.sockets.in(room.abbr).emit('dj.departed', req.user.toJSON());
					res.jsonp({info: "Left djs"});
				});
			}
			else {
				return res.jsonp(404, {error: "DJ not found"});
			}
		});
	};

	this.upvote = function(req, res, next) {

	};

	this.downvote = function(req, res, next) {

	};

	this.skip = function(req, res, next) {
		Room.findOne({abbr: req.params.abbr}, function(e, room) {
			if (e) return;
			setImmediate(nextSong, room);
		});
	};
};
