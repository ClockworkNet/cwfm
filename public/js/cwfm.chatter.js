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

	$socket.on('chat', function(data) {
		if (!$scope.chat) $scope.chat = [];
		console.info(data);
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
