if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.playlist       =  {};
cwfm.playlist.ctrl  =  function( $scope, $http, $roomservice ) {

    var nothing  =  function( rsp ) { };

    // @todo
    var on_generaterandomplaylist  =  nothing;
    var on_deleteplaylist  =  nothing;
    var on_changeplaylist  =  nothing;

    var on_saveplaylist  =  function( rsp ) {
        console.info('playlist saved', rsp);
        if ( ! rsp ) {
            return;
        }
        if ( ! $scope.selected || $scope.selected.plid != rsp.plid ) {
            $scope.select( rsp );
        }
    };

    var on_search  =  function( rsp ) {
        console.info('search results', rsp);
        $scope.results  =  rsp;
    };

    var on_showplaylists  =  function( rsp ) {
        console.info('showplaylists returned', rsp);
        $scope.playlists  =  rsp;
    };

    var on_loadplaylist  =  function( rsp ) {
        console.info('loadplaylist returned', rsp);
        angular.forEach( rsp, function( song, index ) {
            song.track  =  index;
        } );
        $scope.songs  =  rsp;
		$('#playlists_list').slideUp();
    };

    var on_songchange  =  function( old_song, new_song ) {
        if ( ! $scope.selected ) return;
        get( 'loadplaylist', $scope.selected.plid, on_loadplaylist );
    };

    var init  =  function( ) {
        $scope.roomname  =  $roomservice.get_name( );

        $roomservice.on( 'songchange', on_songchange, $scope );
        $scope.$watch( 'query', $scope.search );

        get( 'showplaylists', [], on_showplaylists );
    };

    var post  =  function( action, data, callback ) {
        action      = typeof action != 'string' ? action.join( '/' ) : action;
        var apiurl  =  '/api/' + action;
        console.info('POST', apiurl, data);
        return $http({
            method : 'POST'
            , url  : apiurl
            , data : $.param( data )
            , headers : {'Content-Type': 'application/x-www-form-urlencoded'}
        }).success( callback );
    };


    var get  =  function( action, args, callback ) {
        var apiurl  =  '/api/' + action + '/';
        if ( typeof args != Object ) { 
            apiurl  +=  args;
        }
        else if ( args ) {
            apiurl  +=  args.join( '/' );
        }
        console.info('GET', apiurl);
        return $http.get( apiurl ).success( callback );
    };

	$scope.browselists  =  function( ) {
		$('#playlists_list').slideToggle();
	};

	$scope.closesongsearch  =  function( ) {
		$scope.query = "";
		$scope.results = [];
	};

    $scope.select  =  function( pl ) {
        $scope.selected = pl;
        post( [ 'selectplaylist', $roomservice.get_name( ) ], { plid : pl.plid }, on_loadplaylist );
    };

    $scope.search  =  function( ) {
        var terms  =  $scope.query;
        if ( ! terms || terms.length < 2 ) {
            $scope.results  =  [];
            return;
        }
        get( 'search', [ terms ], on_search );
    };

    $scope.togglesong  =  function( song, inlist ) {
        if ( ! $scope.selected ) {
            console.warn( 'No playlist selected' );
            return;
        }

        var action  =  inlist ? 'addplaylistsong' : 'removeplaylistsong';
        var data    =  { plid : $scope.selected.plid, song : JSON.stringify( song ) };

        post( action, data, on_loadplaylist );
    };

    $scope.addsong  =  function( song ) {
        $scope.togglesong( song, true );
    };

    $scope.removesong  =  function( song ) {
        $scope.togglesong( song, false );
    };

    $scope.save  =  function( ) {
        var data  =  { 
            'public' : $scope.selected.public, 
            'title'  : $scope.selected.title, 
            'plid'   : $scope.selected.plid
        };
        post( 'saveplaylist', data, on_saveplaylist );
    };

    init( );
}
