var config   = require('./config').settings;
var express  = require('express');
var http     = require('http');
var path     = require('path');
var cookie   = require('cookie');
var connect  = require('connect');
var io       = require('socket.io');
var fs       = require('fs');
var mm       = require('musicmetadata');

var sessionStore = new express.session.MemoryStore();

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser(config.cookieSecret));
app.use(express.session({
	secret: config.sessionSecret,
	key: config.sessionKey,
	store: sessionStore
}));
app.use(app.router);
//app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.configure('development', function() {
	app.locals.pretty = true;
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


// Fire up the server and the socket listener
var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
var io = io.listen(server);


// Set up the database connection. Once the connection is established,
// we can generate the routes for all of the API calls.
var mongoose = require('mongoose');
mongoose.connect(config.database);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.on('open', function() {

	// Returns a new method that binds the controller context to the
	// method and appends any specified arguments to the parameter list
	var apply = function(controller, method, args) {

		if (!controller) {
			throw new Error("Invalid controller");
		}

		if (typeof(controller[method]) != 'function') {
			throw new Error("Invalid method on controller: " + method);
		}

		return function() {
			var params = Array.prototype.slice.call(arguments, 0);
			if (args) params = params.concat(args);
			try {
				controller[method].apply(controller, params);
			}
			catch (e) {
				console.trace(e);
			}
		};
	};

	var encrypt  = require('sha1');

	var Auth     = require('./models/auth').build(mongoose, encrypt, config);
	var User     = require('./models/user').build(mongoose);
	var Song     = require('./models/song').build(mongoose);
	var Playlist = require('./models/playlist').build(mongoose);
	var Room     = require('./models/room').build(mongoose, config);
	var Chat     = require('./models/chat').build(mongoose, config);

	var routes = {
		home: require('./routes/home'),
		room: require('./routes/room'),
		song: require('./routes/song'),
		user: require('./routes/user'),
		avatar: require('./routes/avatar'),
		chat: require('./routes/chat'),
		playlist: require('./routes/playlist')
	};

	var controllers = {
		home: new routes.home(Room, User),
		room: new routes.room(Room, User, Playlist, Song, io),
		song: new routes.song(config.songDir, Song, User, fs, path, mm),
		user: new routes.user(User, Auth),
		avatar: new routes.avatar(config.avatar, fs, path),
		chat: new routes.chat(Room, User, Chat, io),
		playlist: new routes.playlist(Playlist, Song, User)
	};

	var secure = apply(controllers.user, 'verify');

	app.get('/user', secure, apply(controllers.user, 'list'));
	app.get('/user/list', secure, apply(controllers.user, 'list'));
	app.get('/user/detail/:username', secure, apply(controllers.user, 'detail'));
	app.get('/user/me', apply(controllers.user, 'me'));
	app.post('/user/create', apply(controllers.user, 'create'));
	app.post('/user/login', apply(controllers.user, 'login'));
	app.post('/user/logout', apply(controllers.user, 'logout'));
	app.post('/user/update', secure, apply(controllers.user, 'update'));

	app.get('/avatar/list', apply(controllers.avatar, 'list'));
	app.get('/avatar/:name', apply(controllers.avatar, 'show'));
	app.get('/avatar/', apply(controllers.avatar, 'show'));

	app.get('/song/search', secure, apply(controllers.song, 'search'));
	app.get('/song/detail/:id', secure, apply(controllers.song, 'detail'));
	app.get('/song/:id', secure, apply(controllers.song, 'stream'));
	app.post('/song/scan', secure, apply(controllers.song, 'scan'));

	app.get('/playlist/list', secure, apply(controllers.playlist, 'list'));
	app.get('/playlist/detail/:id', secure, apply(controllers.playlist, 'detail'));
	app.post('/playlist/create', secure, apply(controllers.playlist, 'create'));
	app.delete('/playlist/delete/:id', secure, apply(controllers.playlist, 'delete'));
	app.post('/playlist/select/:id', secure, apply(controllers.playlist, 'select'));
	app.post('/playlist/update/:id', secure, apply(controllers.playlist, 'update'));

	app.get('/room/list', apply(controllers.room, 'list'));
	app.get('/room/detail/:abbr', apply(controllers.room, 'detail'));
	app.post('/room/create', secure, apply(controllers.room, 'create'));
	app.post('/room/delete/:abbr', secure, apply(controllers.room, 'delete'));
	app.post('/room/join/:abbr', secure, apply(controllers.room, 'join'));
	app.post('/room/dj/:abbr', secure, apply(controllers.room, 'dj'));
	app.post('/room/undj/:abbr', secure, apply(controllers.room, 'undj'));
	app.post('/room/skip/:abbr', secure, apply(controllers.room, 'skip'));
	app.post('/room/upvote/:abbr', secure, apply(controllers.room, 'upvote'));
	app.post('/room/downvote/:abbr', secure, apply(controllers.room, 'downvote'));

	app.get('/chat/list/:abbr', secure, apply(controllers.chat, 'list'));
	app.post('/chat/say/:abbr', secure, apply(controllers.chat, 'say'));

	// Wire up authentication to the socket connections
	io.set('log level', 1);
	io.set('authorization', function(data, accept) {
		if (!data.headers.cookie) {
			return accept('Unauthorized', false);
		}
		data.cookie = cookie.parse(data.headers.cookie);
		data.sessionId = connect.utils.parseSignedCookie(data.cookie[config.sessionKey], config.sessionSecret);
		sessionStore.get(data.sessionId, function(e, session) {
			if (e || !session) {
				console.error(e, data);
				return accept("No session found", false);
			}
			data.session = session;
			accept(null, true);
		});
	});

	io.sockets.on('connection', function(socket) {
		//@todo: get user on disconnect
		socket.on('listen', apply(controllers.room, 'listen', socket));
		socket.on('leave', apply(controllers.room, 'leave', socket));
		socket.on('disconnect', apply(controllers.room, 'exit'));
	});

	// UI
	app.get('/', apply(controllers.home, 'home'));
	app.get('/room', apply(controllers.home, 'room'));
});
