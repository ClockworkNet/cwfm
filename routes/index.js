exports.index = function(req, res, next) {
	res.sendfile('./public/main.html');
};

exports.room = function(req, res, next) {
	res.sendfile('./public/room.html');
};
