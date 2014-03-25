if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.chatter  =  { };

cwfm.chatter.ctrl  =  function( $scope, $http, $socket, $room ) {
	$scope.room    = {};
	$scope.chat    = [];
	$scope.message = '';

	$room.change(function(room) {
		$scope.room = room;
		pullChat();
	});

	var pullChat = function() {
		if (!$scope.room || !$scope.room.abbr) {
			$scope.chat = [];
			return;
		}
		$http.get('/chat/list/' + $scope.room.abbr)
		.success(function(chat) {
			$scope.chat = chat;
		});
	};

	$socket.on('member.joined', function(data) {
		$scope.chat.push({
			author: data,
			content: 'joined the room.',
			room: $scope.room,
			posted: Date.now()
		});
	});

	$socket.on('member.departed', function(data) {
		$scope.chat.push({
			author: data,
			content: 'left the room.',
			room: $scope.room,
			posted: Date.now()
		});
	});

	$socket.on('song.changed', function(data) {
		var delay = Date.parse(data.songStarted) - Date.now();
		var add = function() {
			$scope.chat.push({
				author: data.songDj,
				content: 'started playing ' + data.song.name,
				room: $scope.room,
				posted: data.songStarted
			});
		};
		if (delay > 0) {
			setTimeout(add, delay);
		}
		else {
			add();
		}
	});

	$socket.on('chat', function(data) {
		$scope.chat.push(data);
	});

	var clearMessage = function() {
		$scope.message = '';
	}

	$scope.send  =  function() {
		$http.post('/chat/say/' + $scope.room.abbr, {content: $scope.message})
		.success(clearMessage);
	};

	pullChat();
};
