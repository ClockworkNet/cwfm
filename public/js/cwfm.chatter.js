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
		console.info('pulling');
		$http.get('/room/chat/' + $scope.room.abbr)
		.success(function(chat) {
			$scope.chat = chat;
		});
	};

	$socket.on('chat', function(data) {
		if (!$scope.chat) $scope.chat = [];
		$scope.chat.push(data);
	});

	var clearMessage = function() {
		$scope.message = '';
	}

	$scope.send  =  function() {
		$http.post('/room/say/' + $scope.room.abbr, {message: $scope.message})
			.success(clearMessage);
	};

	pullChat();
};
