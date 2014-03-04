exports.Controller = function(Room, User, Chat, io) {
	this.list = function(res, req, next) {

	};

	this.say = function(res, req, next) {
		var message = req.body.message;
		var user = req.session.user;
	};
}
