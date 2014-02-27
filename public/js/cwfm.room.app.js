var cwfmApp = angular.module( 'cwfmApp', [ 'cwfmFilters' ] );

cwfmApp
	.factory( '$socket', cwfm.socket.factory )
	.service( '$room', cwfm.data.service )
	.service( '$user', cwfm.data.service )
	.controller( 'cwfmRoomCtrl', [ '$scope', '$http', '$socket', '$room', cwfm.room.ctrl ] )
	.controller( 'cwfmUserCtrl', [ '$scope', '$http', '$user', cwfm.user.ctrl ] )
	.controller( 'cwfmPlayerCtrl', [ '$scope', '$http', '$socket', '$room', '$user', cwfm.player.ctrl ] )
	.controller( 'cwfmChatterCtrl', [ '$scope', '$http', '$socket', '$room', cwfm.chatter.ctrl ] )
	.controller( 'cwfmPlaylistCtrl', [ '$scope', '$http', '$room', cwfm.playlist.ctrl ] )
;
