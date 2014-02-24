exports.list = function(req, res, next, Room) {
	var rooms = Room.find({}, function(e, arr) {
		res.jsonp({"rooms": arr});
	});
};

exports.detail = function(req, res, next, Room) {
	Room.findOne({abbr: req.params.abbr}, function(e, room) {
		res.jsonp(room);
	});
};

exports.create = function(req, res, next, Room) {
	Room.create(req.body, function(e, room) {
		res.jsonp(room);
	});
};

exports.join = function(req, res, next, Room, User) {

}

exports.dj = function(req, res, next, Room, User) {

};

exports.undj = function(req, res, next, Room, User) {

}
