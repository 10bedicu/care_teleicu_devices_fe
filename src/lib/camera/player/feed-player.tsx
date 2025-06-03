import { AlertTriangleIcon, Loader2 } from "lucide-react";
import React, { useEffect } from "react";

import { useCameraFeed } from "@/lib/camera/camera-feed-context";
import { VideoStreamPlayer } from "@/lib/camera/components/video-stream-player";

import CameraFeedWatermark from "@/components/camera/feed-watermark";

export default function CameraFeedPlayer() {
  const {
    playerRef,
    streamUrl,
    isAuthenticating,
    playerStatus,
    setPlayerStatus,
    setPlayedOn,
  } = useCameraFeed();

  useEffect(() => {
    if (playerStatus === "waiting") {
      const timeout = setTimeout(() => {
        setPlayerStatus("unauthorized");
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [playerStatus]);

  if (isAuthenticating) {
    return <StreamLoading />;
  }

  if (!streamUrl) {
    return <FallbackOverlay />;
  }

  return (
    <>
      <FallbackOverlay />
      <CameraFeedWatermark />
      <VideoStreamPlayer
        playerRef={playerRef as React.RefObject<HTMLVideoElement>}
        streamUrl={streamUrl}
        className="w-full object-contain"
        onConnected={() => {
          setPlayerStatus("waiting");
          setPlayedOn(new Date());
        }}
        onPlay={() => {
          setPlayerStatus("playing");
        }}
        onError={() => setPlayerStatus("stopped")}
      />
    </>
  );
}

const FallbackOverlay = () => {
  const { isAuthenticating, playerStatus, isCameraStatusError } =
    useCameraFeed();

  if (isCameraStatusError && playerStatus !== "playing") {
    return <UnableToCommunicateWithCamera />;
  }

  if (
    playerStatus === "loading" ||
    playerStatus === "waiting" ||
    isAuthenticating
  ) {
    return <StreamLoading />;
  }

  if (playerStatus === "unauthorized") {
    return <StreamUnauthorized />;
  }
};

const StreamLoading = () => {
  return (
    <div className="absolute inset-0 size-full bg-gray-950 flex items-center justify-center">
      <Loader2 className="size-6 animate-spin text-white" />
    </div>
  );
};

const UnableToCommunicateWithCamera = () => {
  return (
    <div className="absolute inset-0 size-full bg-gray-950 flex flex-col gap-2 items-center justify-center">
      <AlertTriangleIcon className="size-6 text-orange-400" />
      <div className="text-orange-400 text-sm">
        Unable to communicate with camera
      </div>
    </div>
  );
};

const StreamUnauthorized = () => {
  return (
    <div className="absolute inset-0 size-full bg-gray-950 flex flex-col gap-2 items-center justify-center">
      <AlertTriangleIcon className="size-6 text-orange-400" />
      <div className="text-orange-400 text-sm">
        Stream authentication failed
      </div>
    </div>
  );
};
