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

var routes = {
	home: require('./routes'),
	room: require('./routes/room'),
	song: require('./routes/song'),
	user: require('./routes/user'),
	playlist: require('./routes/playlist')
};

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

app.configure('delevelopment', function() {
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

	// Used to inject dependencies into the function used to handle a route
	var route = function(handler) {
		var args = Array.prototype.slice.call(arguments, 0);
		var dependencies = args.length > 1 ? args.slice(1) : [];
		return function() {
			var args = Array.prototype.slice.call(arguments, 0);
			for (var i=0; i<dependencies.length; i++) {
				args.push(dependencies[i]);
			}
			try {
				handler.apply(express, args);
			}
			catch (e) {
				console.error(e);
			}
		}
	}

	var encrypt = require('sha1');
	var Auth = require('./models/auth').build(mongoose, encrypt, config);
	var User = require('./models/user').build(mongoose);
	var secure = route(routes.user.verify, User);

	app.get('/user', secure, route(routes.user.list, User));
	app.get('/user/list', secure, route(routes.user.list, User));
	app.get('/user/detail/:username', secure, route(routes.user.detail, User));
	app.get('/user/me', route(routes.user.me, User));
	app.post('/user/create', route(routes.user.create, User, Auth));
	app.post('/user/login', route(routes.user.login, User, Auth, config));
	app.post('/user/logout', route(routes.user.logout, User));
	app.post('/user/update', secure, route(routes.user.update, User));

	var Song = require('./models/song').build(mongoose);
	app.get('/song/search', route(routes.song.search, Song));
	app.get('/song/detail/:id', route(routes.song.detail, Song));
	app.get('/song/:id', route(routes.song.stream, Song));
	app.post('/song/scan', secure, route(routes.song.scan, Song, fs, mm));

	var Playlist = require('./models/playlist').build(mongoose);
	app.get('/playlist/list', secure, route(routes.playlist.list, Playlist));
	app.get('/playlist/detail/:id', secure, route(routes.playlist.detail, Playlist));
	app.post('/playlist/create', secure, route(routes.playlist.create, Playlist));
	app.delete('/playlist/delete/:id', secure, route(routes.playlist.delete, Playlist));
	app.post('/playlist/select/:id', secure, route(routes.playlist.select, Playlist));
	app.post('/playlist/update/:pid/song/:action/:sid', secure, route(routes.playlist.update, Playlist));

	var Room = require('./models/room').build(mongoose, config);
	app.get('/room/list', route(routes.room.list, Room));
	app.get('/room/detail/:abbr', route(routes.room.detail, Room));
	app.get('/room/chat/:abbr', secure, route(routes.room.chat, Room, User));
	app.post('/room/create', secure, route(routes.room.create, Room, User));
	app.post('/room/delete/:abbr', secure, route(routes.room.delete, Room, User));
	app.post('/room/join/:abbr', secure, route(routes.room.join, Room, User, io));
	app.post('/room/dj/:abbr', secure, route(routes.room.dj, Room, User, Playlist, io));
	app.post('/room/undj/:abbr', secure, route(routes.room.undj, Room, User, io));
	app.post('/room/say/:abbr', secure, route(routes.room.say, Room, User, io));
	app.post('/room/skip/:abbr', secure, route(routes.room.skip, Room, User, Playlist, io));

	// Wire up authentication to the socket connections
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
		socket.on('listen', route(routes.room.listen, socket, Room, User, io));
		socket.on('leave', route(routes.room.leave, socket, Room, User, io));
		socket.on('disconnect', route(routes.room.exit, Room, User, io));
	});

	// UI
	app.get('/', route(routes.home.home, User));
	app.get('/room', route(routes.home.room, Room, User));
});
