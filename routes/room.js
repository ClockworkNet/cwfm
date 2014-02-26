// Stores the timeout used to trigger the next song.
// This is keyed on the room abbr.
var songTimers = {};

var nextSong = function(room, io) {
	// First, advance the first track of the current playlist
	var Playlist = room.model('Playlist');
	if (room.dj && room.dj.playlist) {
		room.dj.playlist.rotate().save();
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
	io.sockets.in(room.abbr).emit('song.changed', room);

	// Schedule the next song
	songTimers[room.abbr] = setTimeout(function() {nextSong(room, io);}, song.length * 1000);
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
	User.findOne({username: req.session.username}, function(e, user) {
		if (e) {
			console.error(e);
			return res.jsonp(500, {error: "Error getting user"});
		}
		if (!user) {
			console.error("User not found", req.session.username);
			return res.jsonp(401, {error: "Unauthorized"});
		}

		var room = new Room(req.body);
		room.owners.push(user._id);
		room.save(function(e, room) {
			if (e) return res.jsonp(500, {error: e});
			Room.find({}, function(e, a) {
				if (e) console.error(e);
				res.jsonp({rooms: a});
			});
		});
	});
};

// Called when a user joins a room
exports.join = function(req, res, next, Room, User, io) {
	User.findOne({username: req.session.username}, function(e, user) {
		if (e) {
			console.error(e);
			res.jsonp(500, {error: "Error joining room"});
		}
		Room.findOne({abbr: req.params.room})
		.populate('djs listeners song')
		.exec(function(e, room) {
			if (e) {
				console.error(e);
				res.jsonp(500, {error: "Error finding room"});
			}
			room.listeners.push(user);
			room.save();

			io.sockets.in(room.abbr).emit('member.joined', user);
			res.jsonp(room);
		});
	});
};

// Called when a user connects to a room to listen in on the socket
exports.listen = function(data, socket, Room, io) {
	Room.findOne({abbr: data.room}, function(e, room) {
		if (e) throw e;
		socket.join(room.abbr);
	});
};

// Called when user leaves a room
exports.leave = function(data, socket, Room, User, io) {
	socket.leave(data.room);
	Room.findOne({abbr: data.room}, function(e, room) {
		if (!room) return;
		room.removeUser(socket.handshake.session.username);
		room.save();
	});
};

// Called when a socket connection is dropped
exports.exit = function(socket, Room, User, io) {
	var username = socket.handshake.session.username;
	Room.find().exec(function(e, rooms) {
		rooms.forEach(function(room) {
			room.removeUser(username);
			room.save();
		});
		io.sockets.emit('member.departed', {username: username});
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
			room.djs.push(user);
			room.save();
			if (!room.song) {
				playSong(room, user.playlist.songAt(0), io);
			}
			io.sockets.in(room.abbr).emit('dj', {djs: room.djs});
		});
	});
};

exports.undj = function(req, res, next, Room, User, io) {
	// @todo
};

exports.say = function(req, res, next, Room, User, io) {
	// @todo
};

exports.skip = function(req, res, next, Room, User, Playlist, io) {
	// @todo
};
