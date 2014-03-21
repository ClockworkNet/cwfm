/*
	UI scripts. For animation/interactions.
 */

$( document ).ready(function() {
	var $playlists		= $('#playlists');
	var $queue			= $('#queue');
	var $playlist_btn	= $('#playlists-button');
	var $queue_btn		= $('#queue-button');

	$queue_btn.on('click', function() {
		$playlists.hide();
		$queue.show();
		$queue_btn.addClass('active');
		$playlist_btn.removeClass('active');
	});
	$playlist_btn.on('click', function() {
		$queue.hide();
		$playlists.show();
		$playlist_btn.addClass('active');
		$queue_btn.removeClass('active');
	});
});