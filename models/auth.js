exports.build = function(mongoose, encrypt, config) {
	var name = 'Auth';
	var schema = mongoose.Schema({
		credentials: {
			hash: String,
			salt: String,
		},
		lastLogin: Date,
		lastLogout: Date,
		lastFailure: Date,
		failures: Number
	});

	var salted = function() {
		return (Math.random() + 1).toString(36).substring(2);
	};

	// Static method used to generate a pseudo-random salt string
	schema.static.salt = salted;

	// Instance method for converting a password into a hash
	schema.methods.hash = function(password) {
		return encrypt(config.secret + password + this.salt);
	};

	// method for checking whether the account has
	// too many failures in the login window
	schema.methods.isLocked = function() {
		if (this.lastFailure && this.failures > config.maxLoginAttempts) {
			var diff = Date.now() - this.lastFailure;
			if (diff < config.maxLoginThrottle) {
				return true;
			}
		}
		return false;
	};

	// Resets a lock by setting the failure count to 0.
	schema.methods.resetLock = function() {
		this.failures = 0;
	};

	// Instance method to detect whether the specified password
	// matches the saved credentials.
	schema.methods.matches = function(password) {
		return this.hash(password) === this.credentials.hash;
	};

	// Instance setter for the password property
	// Calling this
	// user.password = '...';
	// will, under the hood, create the salt and password
	// for an instance
	schema.virtual('password').set(function(password) {
		this.credentials.salt = salted();
		this.credentials.hash = this.hash(password);
	});

	return mongoose.model(name, schema);
}
