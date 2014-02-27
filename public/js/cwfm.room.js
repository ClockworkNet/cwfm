if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.room  =  { ping: 1000 };

// Connects to the server via a socket and monitors all of the changes to the room
cwfm.room.ctrl  =  function( $scope, $http, $socket, $room ) {

	$scope.room = {};
	$scope.abbr = window.location.search.substr(1);

	$room.change(function(room) {
		$scope.room = room;
	});

	$socket.on('dj', function(djs) {
		$scope.room.djs = djs;
	});

	$socket.on('member.joined', function(user) {
		if (!$scope.room.listeners) {
			$scope.room.listeners = [];
		}
		var them = $scope.room.listeners;
		for (var i=0; i<them.length; i++) {
			if (them[i].username == user.username) {
				return;
			}
		}
		$scope.room.listeners.push(user);
	});

	$socket.on('member.departed', function(user) {
		var them = $scope.room.listeners;
		if (!them) return;
		for (var i=0; i<them.length; i++) {
			if (them[i].username == user.username) {
				$scope.room.listeners.splice(i, 1);
				return;
			}
		}
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
