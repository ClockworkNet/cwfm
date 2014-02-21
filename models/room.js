exports.build = function(mongoose) {
	var name = 'Room';
	var schema = mongoose.Schema({
		name: String,
		description: String,
		song: mongoose.Schema.Types.ObjectId,
		members: [{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			dj: Boolean,
			djSequence: Number
		}],
		chat: [{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			message: String,
			posted: Date
		}]
	});

	return mongoose.model('Room', schema);
}
