if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.room  =  { ping: 1000 };

// Connects to the server via a socket and monitors all of the changes to the room
cwfm.room.ctrl  =  function( $scope, $http, $socket, $room, $user ) {

	$scope.room = {};
	$scope.abbr = window.location.search.substr(1);

	var addUser = function(collection, user) {
		var them = $scope.room[collection];
		if (!them) {
			$scope.room[collection] = [];
		}
		for (var i=0; i<them.length; i++) {
			if (them[i].username == user.username) {
				return;
			}
		}
		$scope.room[collection].push(user);
		console.info(user.username, "joined the", collection, $scope.room);
	};

	var removeUser = function(collection, user) {
		var them = $scope.room[collection];
		if (!them) return;
		for (var i=0; i<them.length; i++) {
			if (them[i].username == user.username) {
				$scope.room[collection].splice(i, 1);
				console.info(user.username, "left the", collection, $scope.room);
				return;
			}
		}
	};

	$room.change(function(room) {
		$scope.room = room;
	});

	$user.on('login', function(user) {
		window.location.reload();
	});

	$user.on('logout', function(user) {
		window.location = '/';
	});

	$socket.on('dj.joined', function(dj) {
		addUser('djs', dj);
	});

	$socket.on('dj.departed', function(dj) {
		removeUser('djs', dj);
	});

	$socket.on('member.joined', function(user) {
		addUser('listeners', user);
	});

	$socket.on('member.departed', function(user) {
		removeUser('listeners', user);
		removeUser('djs', user);
	});

	$http.post('/room/join/' + $scope.abbr, {})
		.success(function(room) {
			$room.set(room);
			$socket.emit('listen', room);
			console.info('joined', room);
		})
		.error(function(e) {
			console.error(e);
		});

	window.onbeforeunload = function() {
		$socket.emit('leave', $scope.room);
		console.info('leaving room', $scope.room);
	};
};
