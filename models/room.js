exports.build = function(mongoose, config, toJSON) {
	var name = 'Room';
	var schema = mongoose.Schema({
		name: {
			type: String,
			required: true
		},
		abbr: { 
			type: String, 
			required: true, 
			unique: true
		},
		description: String,
		dateCreated: Date,

		owners: [{ 
			type: mongoose.Schema.Types.ObjectId, 
			ref: 'User',
			unique: true
		}],
		djs: [{
			type: mongoose.Schema.Types.ObjectId, 
			ref: 'User',
			unique: true
		}],
		listeners: [{
			type: mongoose.Schema.Types.ObjectId, 
			ref: 'User',
			unique: true
		}],

		song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
		songDj: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: false },
		songStarted: Number
	});

	schema.methods.toJSON = function() {
		var obj = this.toObject();
		obj.currentTime = Date.now();

		obj.owners    = toJSON(obj.owners);
		obj.djs       = toJSON(obj.djs);
		obj.listeners = toJSON(obj.listeners);
		obj.song      = toJSON(obj.song);
		obj.songDj    = toJSON(obj.songDj);

		return obj;
	};

	schema.methods.rotateDjs = function() {

		var currentIndex = this.indexOf('djs', this.songDj);

		var index = currentIndex + 1;
		if (index >= this.djs.length) index = 0;

		this.songDj = this.djs[index];

		return currentIndex != index;
	};

	schema.methods.indexOf = function(collection, model) {
		if (!this[collection]) return -1;

		var findId = model && model._id ? model._id : model;

		if (!findId) return -1;
		findId = findId.toString();

		for (var ix=0; ix<this[collection].length; ix++) {
			var item = this[collection][ix];
			if (!item) continue;
			var itemId = item._id ? item._id.toString() : item.toString();
			if (findId == itemId) {
				return ix;
			}
		}
		return -1;
	};

	schema.methods.join = function(collection, user) {
		var ix = this.indexOf(collection, user);
		var uid = user._id ? user._id : user;
		if (ix < 0) {
			if (!this[collection]) this[collection] = [];
			this[collection].push(uid);
		}
		return this;
	};

	schema.methods.leave = function(collection, user) {
		var ix = this.indexOf(collection, user);
		if (ix >= 0) {
			this[collection].splice(ix, 1);
			return 1;
		}
		return 0;
	};

	schema.methods.removeUser = function(user) {
		var cols = ['djs', 'listeners'];
		var room = this;
		var left = 0;
		cols.forEach(function(col) {
			left += room.leave(col, user);
		});
		return left;
	};

	schema.methods.isCurrentDj = function(user) {

		if (!this.songDj) {
			return false;
		}

		if (this.isDj(user) && (this.songDj.username == user.username)) {
			return true;
		}
		return false;
	}

	schema.methods.isDj = function(user) {

		if (this.indexOf('djs', user) >= 0) {
			return true;
		}
		return false;
	}

	return mongoose.model(name, schema);
}
