exports.list = function(req, res, next, Room) {
	var rooms = Room.find({}, function(arr, data) {
		res.json({"rooms": arr});
	});
};

exports.detail = function(req, res, next, Room) {
	var id = req.params.id;
	Room.findById(id, function(room) {
		res.json(room);
	});
};

exports.create = function(req, res, next, Room) {
	Room.create(req.body, function(e, room) {
		res.json(room);
	});
};

exports.dj = function(req, res, next, Room) {

};

exports.undj = function(req, res, next, Room) {

}
