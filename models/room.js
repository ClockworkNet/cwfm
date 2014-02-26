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

		owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		djs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		listeners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

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
		var findId = typeof(model) == 'object' ? model._id : model;
		this[collection].forEach(function(item, index) {
			var itemId = typeof(item) == 'object' ? item._id : item;
			if (itemId == findId) {
				return index;
			}
		});
		return -1;
	};

	schema.methods.removeUser = function(user) {
		var cols = ['djs', 'listeners'];
		cols.forEach(function(col) {
			var ix = this.indexOf(col, user);
			if (ix >= 0) {
				this[col] = this[col].splice(ix, 1);
			}
		});
		return this;
	};

	return mongoose.model('Room', schema);
}
