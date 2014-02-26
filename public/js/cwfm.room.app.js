var cwfmApp = angular.module( 'cwfmApp', [ 'cwfmFilters' ] );

cwfmApp
	.factory( '$socket', cwfm.socket.factory )
	.service( '$roomservice', [ '$socket' ], cwfm.room.service )
	.service( '$user', cwfm.data.service )
	.controller( 'cwfmUserCtrl', [ '$scope', '$http', '$user', cwfm.user.ctrl ] )
	.controller( 'cwfmPlayerCtrl', [ '$scope', '$http', '$roomservice', cwfm.player.ctrl ] )
	.controller( 'cwfmPlaylistCtrl', [ '$scope', '$http', '$roomservice', cwfm.playlist.ctrl ] )
	.controller( 'cwfmChatterCtrl', [ '$scope', '$http', '$roomservice', cwfm.chatter.ctrl ] )
;
