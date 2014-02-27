// Stores the timeout used to trigger the next song.
// This is keyed on the room abbr.
var songTimers = {};

var nextSong = function(room, io) {
	// First, advance the first track of the current playlist
	var Playlist = room.model('Playlist');
	if (room.dj && room.dj.playlist) {
		room.dj.playlist.rotate().save();
	}

	if (songTimers[room.abbr]) {
		clearTimeout(songTimers[room.abbr]);
	}

	// If the DJ table is empty, abandon all hope
	if (!room.djs || !room.djs.length) {
		room.dj = null;
		room.song = null;
		room.songStarted = null;
		room.save();
		return;
	}

	// Advance to the next DJ, if applicable
	if (room.djs.length > 1) {
		var djIndex = room.indexOf('djs', room.dj);
		djIndex++;
		if (djIndex >= room.djs.length) {
			djIndex = 0;
		}
		room.dj = room.djs[djIndex];
	}

	// Pick the new DJ's next song from her current playlist
	// and set it on the room.
	var User = room.model('User');
	var Song = room.model('Song');
	var djId = typeof(room.dj) == 'object' ? room.dj._id : room.dj;

	User.findById(djId).populate('playlist').exec(function(e, dj) {
		if (e) {
			console.error(e);
			return;
		}
		var songId = dj.playlist.songAt(0);
		Song.findById(songId, function(e, song) {
			if (e) {
				console.error(e);
				return;
			}
			playSong(room, song, io);
		});
	});
};


// Plays a song and schedules the call for playing the next song
var playSong = function(room, song, io) {
	room.song = song;
	room.songStarted = Date.now();
	room.save();

	// Send a message to all clients in the room
	song.started = room.songStarted;
	io.sockets.in(room.abbr).emit('song.changed', song);

	// Schedule the next song
	songTimers[room.abbr] = setTimeout(function() {nextSong(room, io);}, song.length * 1000);
};


// Utility for looking up a room and user.
var getRoomAndUser = function(abbr, Room, username, User, then) {
	User.findOne({username: username}, function(e, user) {
		if (e || !user) {
			console.error(e);
			return then({error: "Error joining room"}, null, user);
		}
		Room.findOne({abbr: abbr})
		.populate('djs listeners song')
		.exec(function(e, room) {
			if (e) {
				console.error(e);
				return then({error: "Error finding room"}, room, user);
			}
			return then(null, room, user);
		});
	});
};


exports.list = function(req, res, next, Room) {
	var rooms = Room.find({}, function(e, a) {
		if (e) console.error(e);
		res.jsonp({rooms: a});
	});
};

exports.detail = function(req, res, next, Room) {
	Room.findOne({abbr: req.params.abbr}, function(e, room) {
		if (e) console.error(e);
		res.jsonp(room);
	});
};

exports.chat = function(req, res, next, Room) {
	Room.findOne({abbr: req.params.abbr})
	.populate('chat')
	.exec(function(e, room) {
		if (e) console.error(e);
		res.jsonp(room ? room.chat : []);
	});
};

exports.create = function(req, res, next, Room, User) {
	getRoomAndUser(req.body.abbr, Room, req.session.username, User, function(e, room, user) {
		if (e) return res.jsonp(500, e);
		room.join('owners', user);
		room.save(function(e, room) {
			if (e) return res.jsonp(500, {error: e});
			Room.find({}, function(e, a) {
				if (e) console.error(e);
				res.jsonp({rooms: a});
			});
		});
	});
};

exports.delete = function(req, res, next, Room, User) {
	getRoomAndUser(req.params.abbr, Room, req.session.username, User, function(e, room, user) {
		if (e) return res.jsonp(500, e);
		if (!user.admin && room.indexOf('owners', user) < 0) {
			return res.jsonp(401, {error: "You must be an owner to delete a room"});
		}
		room.remove(function(e, room) {
			if (e || !room) {
				console.error("Error removing room", e, room);
				return res.jsonp(500, {error: "Could not delete room"});
			}
			Room.find({}, function(e, a) {
				return res.jsonp({rooms: a});
			});
		});
	});
};

// Called when a user joins a room
exports.join = function(req, res, next, Room, User, io) {
	getRoomAndUser(req.params.abbr, Room, req.session.username, User, function(e, room, user) {
		if (e) return res.jsonp(500, e);

		room.join('listeners', user);
		room.save();

		res.jsonp(room);
		io.sockets.in(room.abbr).emit('member.joined', user);
	});
};

// Called when a user connects to a room to listen in on the socket
exports.listen = function(data, callback, socket, Room, io) {
	Room.findOne({abbr: data.abbr}, function(e, room) {
		if (e) throw e;
		socket.join(room.abbr);
		console.info(socket.id, "is listening to", room.abbr);
	});
};

// Called when user leaves a room
exports.leave = function(data, callback, socket, Room, User, io) {
	socket.leave(data.abbr);
	console.info(socket.id, "is leaving", data.abbr);
	var username = socket.handshake && socket.handshake.session ? socket.handshake.session.username : null;
	if (!username) {
		console.info("No session information found. Skipping room departure");
		return;
	}
	getRoomAndUser(data.abbr, Room, username, User, function(e, room, user) {
		if (e) return;
		room.removeUser(user);
		room.save();
		io.sockets.in(room.abbr).emit('member.departed', user);
	});
};

// Called when a socket connection is dropped
exports.exit = function(username, Room, User, io) {
	User.findOne({username: username}, function(e, user) {
		if (!user) return;
		Room.find({}, function(e, a) {
			a.forEach(function(r) {r.removeUser(user);});
		});
	});
};

exports.dj = function(req, res, next, Room, User, Playlist, io) {
	User.findOne({username: req.session.username})
	.populate('playlist')
	.exec(function(e, user) {
		if (e) {
			console.error(e);
			return res.jsonp(401, {error: "Not authorized"});
		}
		Room.findOne({abbr: req.params.abbr})
		.populate('djs')
		.exec(function(e, room) {
			if (e || !room) {
				console.error(e);
				return res.jsonp(404, {error: "Room not found"});
			}
			room.join('djs', user);
			room.save();
			if (!room.song && user.playlist) {
				playSong(room, user.playlist.songAt(0), io);
			}
			io.sockets.in(room.abbr).emit('dj.joined', user);
		});
	});
};

exports.undj = function(req, res, next, Room, User, io) {
	getRoomAndUser(req.params.abbr, Room, req.session.username, User, function(e, room, user) {
		if (e) return res.jsonp(500, e);
		room.leave('djs', user);
		room.save();
		io.sockets.in(room.abbr).emit('dj.departed', user);
	});
};

exports.say = function(req, res, next, Room, User, io) {
	// @todo
};

exports.skip = function(req, res, next, Room, User, Playlist, io) {
	// @todo
};
