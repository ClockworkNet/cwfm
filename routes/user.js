exports.Controller = function(User, Auth) {
	this.list = function(req, res, next){
		User.find({}, function(e, arr) {
			res.jsonp({users: arr});
		});
	};

	this.detail = function(req, res, next) {
		User.findOne({username: req.params.username}, function(e, user) {
			if (e) {
				console.error(e);
				return res.jsonp(500, {error: "Error getting detail"});
			}
			res.jsonp(user);
		});
	};

	this.me = function(req, res, next) {
		return res.jsonp(req.session.user);
	};

	this.create = function(req, res, next) {
		var data = req.body;

		if (data.password1 !== data.password2) {
			res.jsonp({error: "Passwords don't match"});
		}

		var auth = new Auth();
		auth.password = data.password1;
		auth.save();

		var user = new User(data);
		user.auth = auth._id;

		user.save(function(e, user) {
			if (e) {
				console.error(e);
				return res.jsonp(500, {error: "Error saving new account"});
			}
			req.session.user = user;
			res.jsonp(user);
		});
	};

	this.update = function(req, res, next) {
		// @todo: implement this
	};

	this.verify = function(req, res, next) {
		if (!req.session.user) {
			return res.jsonp(401, {error: "Please log in"});
		}
		next.call(arguments);
	}

	this.login = function(req, res, next) {
		var password = req.body.password;
		User.findOne({username: req.body.username})
		.populate('auth playlist')
		.exec(function(e, user) {

			if (!user) {
				console.info("Invalid username", req.body.username);
				return res.jsonp(401, {error: "Bad credentials"});
			}

			var auth = user.auth;

			if (!auth) {
				console.error("Missing authentication mechanisim for user", user);
				return res.jsonp(401, {error: "Bad credentials"});
			}

			if (auth.isLocked()) {
				res.jsonp(401, {error: "Maximum login attempts exceeded"});
			}
			else {
				auth.resetLock();
			}

			if (auth.matches(password)) {
				// Succsessful login. Reset failures, last login, password hash, and the salt.
				auth.password = password;
				auth.lastLogin = Date.now();
				auth.failures  = 0;
				auth.save();

				req.session.user = user;
				user.auth = auth._id;
				res.jsonp(user);
			}
			else {
				auth.failures++;
				auth.lastFailure = Date.now();
				auth.save();
				res.jsonp(401, {error: "Bad credentials"});
			}
		});
	};

	this.logout = function(req, res, next) {
		if (!req.session.user) return res.jsonp({});
		var user = req.session.user;
		user.lastLogout = Date.now();
		user.save();
		return res.jsonp({});
	};
};
