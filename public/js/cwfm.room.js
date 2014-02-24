if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.room  =  { ping: 1000 };

cwfm.room.service  =  function( ) {
    var handlers  =  {};
    return {
        on: function ( key, func, ctx ) {
            if ( ! handlers[ key ] ) handlers[ key ]  =  [];
            var handler  =  ( ctx ) ? function( ) { func.call( ctx, arguments ); } : func;
            handlers[ key ].push( func ); 
        }
        , trigger: function ( key, args ) {
            console.info('room event triggered', key, args);
            if ( ! handlers[ key ] ) return;
            angular.forEach( handlers[ key ], function( func ) {
                func.apply( args );
            } );
        }
        , get_name: function( ) {
            return location.search.substr( 0 );
        }
    }
};

cwfm.room.ctrl  =  function( $scope, $http, $roomservice ) {

    var init  =  function( ) {

        $scope.room      =  {};
        $scope.roomname  =  $roomservice.get_name( );

        var on_songchange  =  function( old_song, new_song ) {
            // Load 'em up!
            if ( ! this.muted ) {
                play_song( );
            }
            // If we're muted, don't bother loading the next song yet.
            else {
                this.player( 'clearMedia' );
            }
        };

        // Uses "this" as $scope, called when the jPlayer is ready to go.
        var on_ready  =  function( ) {
            // this.heartbeat  =  setInterval( function( ) { api( 'roominfo' ) }, cwfm.room.ping );
            api( '/room/detail' );
        };

        // Uses "this" as $scope, called when the file can start playing
        var on_canplay  =  function( e ) {
            if ( ! this.room || ! this.room.song || this.muted ) return;
            var song  =  this.room.song;
            var time  =  ( Date.now() / 1000 ) - song.started;
            this.player( 'play', time );
        };

        // Wrapper for calling jPlayer functions
        $scope.player  =  function( ) {
            $.fn.jPlayer.apply( $( '#jplayer' ), arguments );
        }

        $scope.player({
            ready: $.proxy( on_ready, $scope )
            , canplay: $.proxy( on_canplay, $scope )
        });

        $roomservice.on( 'songchange', on_songchange, $scope );
    };

    var get_filetype  =  function( path ) {
        var ext  =  path.substr( path.lastIndexOf( '.' ) + 1 );
        switch ( ext ) {
            case 'mp3':
                return 'mp3';
            case 'mp4':
            case 'aac':
                return 'mp4';
            case 'ogg':
                return 'oga';
            case 'fla':
            case 'flv':
                return 'fla';
            case 'wav':
                return 'wav';
            default:
                return 0
        }
    };


    var stop_song  =  function( ) {
        $scope.player( 'stop' );
    };


    var play_song  =  function( ) {
        var path  =  $scope.room && $scope.room.song ? $scope.room.song.path : null;
        if ( ! path ) return;
        var type  =  get_filetype( path );
        var data  =  {};
        data[ type ]  =  path;
        $scope.player( 'setMedia', data );
    };

    var databind  =  function( rsp ) {
        if ( rsp.members ) {
            rsp.members.sort( function( ma, mb ) {
                if ( ma.dj && mb.dj ) return ma.dj - mb.dj;
                if ( ma.dj ) return -1;
                if ( mb.dj ) return 1;
                return ma.joined - mb.joined;
            } );
            angular.forEach( rsp.members, function( m ) {
                if ( m.active ) {
                    $scope.me  =  m;
                    return;
                }
            });
        }
        var old_song =  $scope.room && $scope.room.song ? $scope.room.song : { path: null };
        var new_song =  rsp && rsp.song ? rsp.song : { path: null };

        $scope.room  =  rsp;

        if ( old_song.path != new_song.path ) {
            $roomservice.trigger( 'songchange', [ old_song, new_song ] );
        }
    };

    $scope.song_title  =  function( ) {
        var song  =  $scope.room.song;
        if ( ! song ) return '...';
        if ( song.title != '' ) return song.title;
        var path  =  song.relpath;
        return path;
    };

    $scope.song_played  =  function( ) {
        var song  =  $scope.room.song;
        if ( ! song || ! song.length ) return 0;
        var now  =  Date.now() / 1000.0;
        return now - song.started;
    };

    $scope.song_remaining  =  function( ) {
        var song  =  $scope.room.song;
        if ( ! song || ! song.length ) return 0;
        var now  =  Date.now() / 1000.0;
        var end  =  song.started + song.length;
        return end - now;
    };

    $scope.toggle_muting  =  function( ) {
        if ( $scope.muted ) {
            stop_song( );
        }
        else {
            play_song( );
        }
    };

    $scope.not  =  function( func ) {
        return function( item ) {
            return ! func( item );
        };
    };

    $scope.is_current_dj  =  function( member ) {
        return member && member.uid == $scope.room.dj;
    };

    $scope.is_dj  =  function( member ) {
        return member.dj != null;
    };

	$scope.api  =  function(url) {
		$http.get(url).success(databind);
	};

    init( );
};
