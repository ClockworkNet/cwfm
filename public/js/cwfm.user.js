if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.user = {};

cwfm.user.ctrl  =  function( $scope, $http, $user ) {

	$scope.me         = $user.get();
	$scope.avatarUrls = [];

	$scope.adminMessage = '';

	$user.change(function(user) {
		$scope.me = user;
	});

	var init  =  function( ) {
		$scope.loadMe();
	};

	var setUser = function(rsp) {
		$user.set(rsp);
	};

	var handleError = function(e) {
		console.error("Error occurred", e);
		$scope.error = e;
	};

	var oops  =  function(e) {
		console.info(e);
		$scope.error = e.error;
	};

	$scope.loadMe  =  function() {
		$http.get('/user/me')
			.success(setUser)
			.error(oops);
	};

	$scope.createUser  =  function( ) {
		$http.post('/user/create', $scope.newUser)
			.success(setUser)
			.error(oops);
	}

	$scope.login  =  function( ) {
		$http.post('/user/login', $scope.me)
		.success(function(user) {
			setUser(user);
			$user.trigger('login');
		})
		.error(oops);
	};

	$scope.logout  =  function( ) {
		$http.post('/user/logout', {})
		.success(function(user) {
			setUser(user);
			$user.trigger('logout');
		})
		.error(oops);
	}

	$scope.loadAvatars = function() {
		if ($scope.avatarUrls.length > 0) return;

		$http.get('/avatar/list')
		.success(function(urls) {
			$scope.avatarUrls = urls;
		});
	};

	$scope.selectAvatar = function(url) {
		$scope.me.avatar = url;
	};

	$scope.save = function() {
		$http.post('/user/update', $scope.me)
		.success(setUser)
		.error(handleError);
	};

	// Admin functions
	$scope.adminify = function() {

	};

	$scope.boot = function() {

	};

	$scope.scan = function() {
		$http.post('/song/scan')
		.success(function(r) {
			console.info("Starting scan", arguments);
			$scope.adminMessage = {
				type: 'info',
				content: "Scan started"
			};
		})
		.error(function(e) {
			console.error("Error tarting scan", arguments);
			$scope.adminMessage = {
				type: 'error',
				content: "Error starting scan"
			};
		});
	};

	init( );
};
