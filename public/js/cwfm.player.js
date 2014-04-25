if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.player = {};

cwfm.player.ctrl = function($scope, $http, $socket, $room, $user, $song, $timeout) {
	$scope.room       = {};
	$scope.song       = {};
	$scope.timeOffset = 0;
	$scope.me         = {};

	$scope.muted     = false;
	$scope.played    = 0;
	$scope.remaining = 0;
	$scope.percent   = 0;

	$scope.player    = jQuery('#player');
	$song.init('#player', $scope.player.data());

	var setRoom = function(room, then) {
		$scope.timeOffset = Date.now() - room.currentTime;

		var now = +new Date();
		var startTime = $scope.songStartTime(room.songStarted);

		var songSetDelay = 0;
		if (startTime > now) {
			// Queue the data change into the future
			songSetDelay = startTime - now;
		}

		var setSong = function() {
			console.info("Async new song set", room.song);
			$scope.song = room.song;
		};
		setTimeout(setSong, songSetDelay);

		$scope.room = room;
		then.call(this, room.song);
	};

	$room.change(function(room) {
		setRoom(room, $scope.playSong);
	});

	$user.change(function(user) {
		$scope.me = user;
	});

	var oops = function(e) {
		console.error(e);
	};

	$socket.on('song.stopped', function(room) {
		console.info("Song has stopped", room);
		setRoom(room, $scope.stopSong);
	});

	$socket.on('song.changed', function(room) {
		setRoom(room, $scope.playSong);
	});

	$scope.stopSong = function( ) {
		$song.clear();
	};

	$scope.playSong = function(song) {
		if (!song) {
			console.error("No song specified");
			return;
		}

		var url = '/song/' + song._id;
		var start = $scope.songStartTime();

		var skip = Date.now() - start;

		if ((song.duration * 1000) < skip) { // milliseconds
			console.info("Song is done", song);
			return;
		}

		console.info("Requesting: ", url, " Song started: ", start, " Skipping to:", skip);

		$song.play(url, skip);
	};

	$scope.songPlayed  =  function() {
		var song  =  $scope.song;
		if ( ! song || ! song.duration ) {
			return 0;
		}
		var now   =  Date.now();
		var start = $scope.songStartTime();
		if (start == 0) {
			return 0;
		}
		return now - start;
	};

	// Gets the time that the song started relative to the client's time
	$scope.songStartTime = function(songStarted) {
		songStarted = songStarted || $scope.room.songStarted;
		if (!songStarted) return 0;
		var serverTime = Date.parse(songStarted);
		return serverTime - $scope.timeOffset;
	};

	$scope.calcSong  =  function() {
		var song  =  $scope.song;
		if ( ! song || ! song.duration ) {
			$scope.remaining = 0;
			$scope.played = 0;
			$scope.percent = 0;
			return;
		}
		var start  = $scope.songStartTime() / 1000.0;
		var end    = start + song.duration;
		var now    = Date.now() / 1000.0;
		var passed = now - start;
		passed     = (passed < 0) ? 0 : passed;
		var remain = song.duration - passed;
		remain     = (remain < 0) ? 0 : remain;

		$scope.remaining = remain;
		$scope.played    = passed;
		$scope.percent   = ( passed / song.duration ) * 100;
	};

	$scope.tick = function() {
		$scope.calcSong();
		$timeout($scope.tick, 500);
	};

	$scope.toggleMuting  =  function( ) {
		$scope.muted = ! $scope.muted;
		if ($scope.muted) {
			$song.mute();
		}
		else {
			$song.unmute();
		}
	};

	$scope.hide = function() {

	};

	$scope.show = function() {

	};

	$scope.not  =  function( func ) {
		return function( item ) {
			return ! func( item );
		};
	};

	$scope.skipSong = function() {
		$http.post('/room/skip/' + $scope.room.abbr, {});
	};

	$scope.tick();
};
