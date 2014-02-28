exports.settings = {
	database: 'mongodb://localhost/cwfm',

	// Login settings
	maxLoginAttempts: 5,
	maxLoginThrottle: 60,

	// Super secret keys
	secret: "I've never changed my oil.",
	cookieSecret: "C is for cookie and that is good enough for me",
	sessionSecret: "S is for sesions and that is good enough for me",
	sessionKey: 'cwfm.sid',

	// The maximum number of chat records to keep for a room
	maxChat: 40,

	songDir: '/Users/barrett/Music',
};
