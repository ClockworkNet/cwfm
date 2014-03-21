/*
	UI scripts. For animation/interactions.
 */

$( document ).ready(function() {
	var $playlists		= $('#playlists');
	var $queue			= $('#queue');
	var $playlists_btn	= $('#playlists-button');
	var $queue_btn		= $('#queue-button');

	$queue_btn.on('click', show_queue);
	function show_queue() {
		$playlists.hide();
		$queue.show();
		$queue_btn.addClass('active');
		$playlists_btn.removeClass('active');
	}

	$playlists_btn.on('click', show_playlists);
	function show_playlists() {
		$queue.hide();
		$playlists.show();
		$playlists_btn.addClass('active');
		$queue_btn.removeClass('active');
	}
});