if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.player = {};

cwfm.player.ctrl = function($scope, $http, $socket, $room, $user, $song, $timeout) {
	$scope.room       = {};
	$scope.timeOffset = 0;
	$scope.me         = {};

	$scope.muted     = true;
	$scope.played    = 0;
	$scope.remaining = 0;
	$scope.percent   = 0;

	$scope.player    = jQuery('#player');
	$song.init('#player', $scope.player.data());

	var setRoom = function(room) {
		$scope.room = room;
		$scope.timeOffset = Date.now() - room.currentTime;
	};

	$room.change(function(room) {
		setRoom(room);
		$scope.playSong();
	});

	$user.change(function(user) {
		$scope.me = user;
	});

	var oops = function(e) {
		console.error(e);
	};

	$socket.on('song.stopped', function() {
		setRoom(room);
		$scope.stopSong();
	});

	$socket.on('song.changed', function(room) {
		setRoom(room);
		console.info("Playing song", room.song);
		$scope.playSong();
	});

	$scope.stopSong = function( ) {
		$song.clear();
	};

	$scope.playSong = function(song) {
		song = song || $scope.room.song;

		if (!song) return;

		var url = '/song/' + song._id;
		var start = $scope.songStartTime();
		var skip  = Date.now() - start;

		// @todo: implement a cross-fade effect
		console.info("Requesting: ", url, " Song started: ", start, " Skipping to:", skip);

		$song.play(url, skip);
	};

	$scope.songPlayed  =  function() {
		var song  =  $scope.room.song;
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
	$scope.songStartTime = function() {
		if (!$scope.room.songStarted) return 0;
		var serverTime = Date.parse($scope.room.songStarted);
		return serverTime - $scope.timeOffset;
	};

	$scope.calcSong  =  function() {
		var song  =  $scope.room.song;
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
