var cwfmApp = angular.module( 'cwfmApp', [ 'cwfmFilters' ] );

cwfmApp
	.service( '$user', cwfm.user.service )
	.controller( 'cwfmUserCtrl', [ '$scope', '$http', '$user', cwfm.user.ctrl ] )
	.controller( 'cwfmRoomlistCtrl', [ '$scope', '$http', '$user', cwfm.roomlist.ctrl ] )
;
