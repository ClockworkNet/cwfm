var cwfmApp = angular.module( 'cwfmApp', [ 'cwfmFilters' ] );

cwfmApp
	.factory( '$socket', cwfm.socket.factory )
	.factory( '$song', cwfm.song.factory )
	.service( '$room', cwfm.data.service )
	.service( '$user', cwfm.data.service )
	.service( '$util', cwfm.util )
	.controller( 'cwfmUserCtrl', [ '$scope', '$http', '$user', cwfm.user.ctrl ] )
	.controller( 'cwfmRoomCtrl', [ '$scope', '$http', '$socket', '$room', '$user', cwfm.room.ctrl ] )
	.controller( 'cwfmPlayerCtrl', [ '$scope', '$http', '$socket', '$room', '$user', '$song', '$timeout', cwfm.player.ctrl ] )
	.controller( 'cwfmChatterCtrl', [ '$scope', '$http', '$socket', '$room', cwfm.chatter.ctrl ] )
	.controller( 'cwfmPlaylistCtrl', [ '$scope', '$http', '$socket', '$util', '$room', '$user', cwfm.playlist.ctrl ] )
;
