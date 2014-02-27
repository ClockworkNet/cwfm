exports.build = function(mongoose) {
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

		dj: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
		songStarted: Date,

		chat: [{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			message: String,
			posted: Date
		}]
	});

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
		if (ix < 0) {
			if (!this[collection]) this[collection] = [];
			this[collection].push(user);
		}
		return this;
	};

	schema.methods.leave = function(collection, user) {
		var ix = this.indexOf(collection, user);
		if (ix >= 0) {
			this[collection].splice(ix, 1);
		}
		return this;
	};

	schema.methods.removeUser = function(user) {
		var cols = ['djs', 'listeners'];
		var room = this;
		cols.forEach(function(col) {
			room.leave(col, user);
		});
		return room;
	};

	return mongoose.model('Room', schema);
}
