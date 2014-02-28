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
		User.findOne({username: req.session.username})
		.populate('playlist')
		.exec(function(e, user) {
			if (e) {
				console.error(e);
				return res.jsonp(500, {error: "Error getting detail"});
			}
			res.jsonp(user);
		});
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
			req.session.username = user.username;
			res.jsonp(user);
		});
	};

	this.update = function(req, res, next) {
		// @todo: implement this
	};

	this.verify = function(req, res, next) {

		console.info("Skipping authentication for now!");
		// next.call(arguments);

		if (!req.session.username) {
			return res.jsonp(401, {error: "Please log in"});
		}

		User.findOne({username: req.session.username}).lean().exec(function(e, user) {
			if (!user) {
				return res.jsonp(401, {error: "Invalid username"});
			}
			next.call(arguments);
		});
	}

	this.login = function(req, res, next) {
		var password = req.body.password;
		User.findOne({username: req.body.username}).populate('auth').exec(function(e, user) {

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

				req.session.username = user.username;
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
		User.findOne({username: req.session.username}, function(e, user) {
			if (user) {
				user.lastLogout = Date.now();
				user.save();
			}
			req.session.username = null;
			res.jsonp({});
		});
	};
};
