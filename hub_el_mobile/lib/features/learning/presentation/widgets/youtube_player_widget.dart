import 'dart:async';
import 'package:flutter/material.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';

class YoutubePlayerWidget extends StatefulWidget {
  final String videoId;
  final int initialStartTimeSeconds;
  final Function(bool isPlaying)? onPlayStateChanged;
  final Function(int currentTimeSeconds, int totalDurationSeconds)? onProgressUpdated;
  final Function(YoutubePlayerController controller)? onControllerCreated;

  const YoutubePlayerWidget({
    super.key,
    required this.videoId,
    this.initialStartTimeSeconds = 0,
    this.onPlayStateChanged,
    this.onProgressUpdated,
    this.onControllerCreated,
  });

  @override
  State<YoutubePlayerWidget> createState() => _YoutubePlayerWidgetState();
}

class _YoutubePlayerWidgetState extends State<YoutubePlayerWidget> {
  late final YoutubePlayerController _controller;
  StreamSubscription? _playerSub;
  StreamSubscription? _videoStateSub;
  int _cachedDuration = 0;

  @override
  void initState() {
    super.initState();
    _controller = YoutubePlayerController.fromVideoId(
      videoId: widget.videoId,
      autoPlay: true,
      startSeconds: widget.initialStartTimeSeconds > 0
          ? widget.initialStartTimeSeconds.toDouble()
          : null,
      params: const YoutubePlayerParams(
        mute: false,
        showControls: true,
        showFullscreenButton: true,
        strictRelatedVideos: true,
      ),
    );

    widget.onControllerCreated?.call(_controller);

    // Lắng nghe trạng thái phát (Play / Pause / Ended)
    _playerSub = _controller.listen((event) {
      if (_cachedDuration <= 0 && event.metaData.duration.inSeconds > 0) {
        _cachedDuration = event.metaData.duration.inSeconds;
      }
      if (event.playerState == PlayerState.playing) {
        widget.onPlayStateChanged?.call(true);
      } else if (event.playerState == PlayerState.paused ||
          event.playerState == PlayerState.ended) {
        widget.onPlayStateChanged?.call(false);
      }
    });

    // Lắng nghe tiến độ phát video từng giây
    _videoStateSub = _controller.videoStateStream.listen((state) async {
      if (_cachedDuration <= 0) {
        final dur = await _controller.duration;
        _cachedDuration = dur.toInt();
      }
      widget.onProgressUpdated?.call(
        state.position.inSeconds,
        _cachedDuration,
      );
    });
  }

  @override
  void didUpdateWidget(covariant YoutubePlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoId != widget.videoId) {
      _cachedDuration = 0;
      _controller.loadVideoById(
        videoId: widget.videoId,
        startSeconds: widget.initialStartTimeSeconds.toDouble(),
      );
    }
  }

  @override
  void dispose() {
    _playerSub?.cancel();
    _videoStateSub?.cancel();
    _controller.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(16),
        ),
        clipBehavior: Clip.antiAlias,
        child: YoutubePlayer(
          controller: _controller,
          aspectRatio: 16 / 9,
        ),
      ),
    );
  }
}
