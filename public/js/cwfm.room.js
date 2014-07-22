/*!
 * cwfm.room.js
 *
 * Connects to the server via a socket and monitors all of the changes to the
 * room.
 */

if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.room  =  { ping: 1000 };

cwfm.room.ctrl  =  function( $scope, $http, $socket, $room, $user ) {

	$scope.room = $room.get();
	$scope.me   = $user.get();
	$scope.abbr = window.location.search.substr(1);

  /**
   * Attempt to join the room.
   */
  $http.post('/room/join/' + $scope.abbr, {})
    // If successful, let the world know we're listening in.
    .success(function(room) {
      $room.set(room);
      $socket.emit('listen', room);
      console.info("listening to room socket", room);
    })
    // Log errors to the console if we are unable to join the room.
    .error(function(e) {
      console.error(e);
    });

  /**
   * When someone closes their browser window remove them from the room.
   */
  window.onbeforeunload = function() {
    $socket.emit('leave', $scope.room);
    console.info('leaving room socket', $scope.room);
  };

  /**
   * Add a user to the specified collection of users for this room.
   *
   * Valid collections are 'listeners', and 'djs'. Collections are used to keep
   * track of a rooms participants and what they are currently doing in the
   * room.
   *
   * @param (string) collection
   *   The collection to add the user too. Valid options are 'djs', and
   *   'listeners'.
   * @param (mongoose/Auth) user
   *   The Auth object representing the user to add to the specified collection.
   */
	var addUser = function(collection, user) {
		var them = $scope.room[collection];
		if (!them) {
			$scope.room[collection] = [];
		}

    // Check to see if the user is already in the specified collection for this
    // room. If they are there is no reason to add them again.
		var okay = them.every(function(other) {
			return other.username != user.username;
		});
		if (!okay) {
			return;
		}

    // Add the user to the collection.
		$scope.room[collection].push(user);

		console.info(user.username, "joined the", collection, $scope.room);
	};

  /**
   * Remove a user from the specified collection of users for this room.
   *
   * @param (string) collection
   *   The name of the collection to remove the user from. Valid options are
   *   'djs', and 'listeners'.
   * @param (mongoose/Auth) user
   *   The Auth object representing the user to remove from the specified
   *   collection.
   */
	var removeUser = function(collection, user) {
		var them = $scope.room[collection];
		if (!them) return;
		for (var i=0; i<them.length; i++) {
			if (them[i].username == user.username) {
				$scope.room[collection].splice(i, 1);
				console.info(user.username, "left the", collection, $scope.room);
			}
		}
	};

  /**
   * If the user object changes, update the $scope.me variable to use the new
   * user object.
   */
	$user.change(function(user) {
		$scope.me = user;
	});

  /**
   * If the room object changes, update the $scope.room variable to use the new
   * room object.
   */
	$room.change(function(room) {
		$scope.room = room;
	});

  /**
   * When a user logs in reload the room so they can view it as an authenticated
   * user.
   */
	$user.on('login', function(user) {
		window.location.reload();
	});

  /**
   * When a user logs out send them back to the front page.
   */
	$user.on('logout', function(user) {
		window.location = '/';
	});

  /**
   * When a DJ enters the room add them to the list of DJs.
   */
	$socket.on('dj.joined', function(dj) {
		addUser('djs', dj);
	});

  /**
   * When a DJ leaves the room remove them from the list of DJs.
   */
	$socket.on('dj.departed', function(dj) {
		removeUser('djs', dj);
	});

  /**
   * When a listener joins the room add them to the list of listener.
   */
	$socket.on('member.joined', function(user) {
		addUser('listeners', user);
	});

  /**
   * When a listener leaves the room remove them from the list of listeners, and
   * the list of DJs in the case they where DJing when they departed.
   */
	$socket.on('member.departed', function(user) {
		removeUser('listeners', user);
		removeUser('djs', user);
	});

  /**
   * Check if the given user is currently DJing in this room.
   *
   * @param (mongoose/Auth) user
   *   The user to check for in the list of room DJs.
   * @returns {boolean}
   */
	$scope.djing = function(user) {
    // We need a room, and a list of djs to add the user to.
		if (!$scope.room || !$scope.room.djs) return false;

    // If no user is specified assume the current user.
		if (!user) user = $scope.me;

		var un = user && user.username ? user.username : user;
		return $scope.room.djs.some(function(dj) {
			return dj.username == un;
		});
	};


  /**
   * Add user to the list of DJs for the room.
   */
	$scope.dj = function() {
		$http.post('/room/dj/' + $scope.room.abbr, {})
      // On success, add the user to the list of current DJs.
		  .success(addUser('djs, $scope.me'));
	};

  /**
   * Remove user from list of DJs for the room.
   */
	$scope.undj = function() {
		$http.post('/room/undj/' + $scope.room.abbr, {})
      // On success, remove the user from the list of current DJs.
		  .success(removeUser('djs', $scope.me));
	};
};
