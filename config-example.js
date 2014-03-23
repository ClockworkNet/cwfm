exports.settings = {
	database: 'mongodb://localhost/cwfm',

	// Login settings
	maxLoginAttempts: 5,
	maxLoginThrottle: 60,

	// Super secret keys
	secret: "I've never changed my oil.",
	cookieKeys: ["SEKRIT2", "SEKRIT1"],
	userIdKey: 'uid',
	userAuthTokenKey: 'ut',

	// The directory where music will be added
	songDir: __dirname + '/data/music',

	// The pattern used to search for local avatar paths
	avatar: {
		pattern: /^.+\.png$/,
		dir: __dirname + '/public/img/avatars',
		default: 'default.png'
	}
};
