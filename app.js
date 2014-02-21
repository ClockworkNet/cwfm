var config = require('./config').settings;
var express = require('express');

var routes = {
	home: require('./routes'),
	room: require('./routes/room'),
	song: require('./routes/song'),
	user: require('./routes/user'),
	playlist: require('./routes/playlist')
};

var http = require('http');
var path = require('path');

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
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
//app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var route = function(handler) {
	var args = Array.prototype.slice.call(arguments, 0);
	var dependencies = args.length > 1 ? args.slice(1) : [];
	return function() {
		var args = Array.prototype.slice.call(arguments, 0);
		for (var i=0; i<dependencies.length; i++) {
			args.push(dependencies[i]);
		}
		handler.apply(express, args);
	}
}

app.get('/', route(routes.home.index));

// Set up the database connection
var mongoose = require('mongoose');
mongoose.connect(config.database);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.on('open', function() {
	var User = require('./models/user').build(mongoose);
	app.get('/users', route(routes.user.list, User));
	app.get('/users/list', route(routes.user.list, User));
	app.get('/users/detail/:id', route(routes.user.detail, User));
	app.post('/users/create', route(routes.user.create, User));
	app.post('/users/update/:id', route(routes.user.update, User));

	var Room = require('./models/room').build(mongoose);
	app.get('/room', route(routes.room.list, Room));
	app.get('/room/list', route(routes.room.list, Room));
	app.get('/room/detail/:id', route(routes.room.detail, Room));
	app.post('/room/create', route(routes.room.create, Room));
	app.post('/room/dj', route(routes.room.dj, Room));
	app.post('/room/undj', route(routes.room.undj, Room));

	var Song = require('./models/song').build(mongoose);
	app.get('/song/search', route(routes.song.search, Song));
	app.get('/song/detail/:id', route(routes.song.detail, Song));
	app.get('/song/:id', route(routes.song.stream, Song));

	var Playlist = require('./models/playlist').build(mongoose);
	app.get('/playlist/list', route(routes.playlist.list, Playlist));
	app.get('/playlist/detail/:id', route(routes.playlist.detail, Playlist));
	app.post('/playlist/create', route(routes.playlist.create, Playlist));
	app.delete('/playlist/:id', route(routes.playlist.delete, Playlist));
	app.post('/playlist/select/:id', route(routes.playlist.select, Playlist));
	app.post('/playlist/song/add/:id', route(routes.playlist.add, Playlist));
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
