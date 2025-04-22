import { useCameraFeed } from "@/lib/camera/camera-feed-context";
import { VideoStreamPlayer } from "@/lib/camera/components/video-stream-player";

export default function CameraFeedPlayer() {
  const { playerRef, streamUrl, setPlayerStatus, setPlayedOn } =
    useCameraFeed();

  if (!streamUrl) {
    return null;
  }

  return (
    <VideoStreamPlayer
      playerRef={playerRef as React.RefObject<HTMLVideoElement>}
      streamUrl={streamUrl}
      className="w-full object-contain"
      onSuccess={() => {
        setPlayerStatus("playing");
        setPlayedOn(new Date());
      }}
      onError={() => {
        setPlayerStatus("stopped");
      }}
    />
  );
}
