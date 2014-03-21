/*
	UI scripts. For animation/interactions.
 */

$( document ).ready(function() {
	var $playlists		= $('#playlists');
	var $queue			= $('#queue');

	$('#queue-button').on('click', function() {
		$playlists.hide();
		$queue.show();
	});
	$('#playlists-button').on('click', function() {
		$queue.hide();
		$playlists.show();
	});
});