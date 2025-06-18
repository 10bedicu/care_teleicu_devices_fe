import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";

import { GetStatusResponse } from "@/lib/camera/cameraActionApi";
import { useStreamUrl } from "@/lib/camera/player/useStreamUrl";
import { CameraDevice } from "@/lib/camera/types";
import useCameraStatus from "@/lib/camera/useCameraStatus";

type PlayerStatus =
  | "loading"
  | "playing"
  | "stopped"
  | "waiting"
  | "unauthorized";

type ICameraFeedContext = {
  device: CameraDevice;

  playerRef: React.RefObject<HTMLVideoElement | null>;
  playedOn: Date | undefined;
  setPlayedOn: (playedOn: Date) => void;

  playerStatus: PlayerStatus;
  setPlayerStatus: (playerStatus: PlayerStatus) => void;

  streamUrl: string | undefined | null;
  isAuthenticating: boolean;

  cameraStatus: GetStatusResponse | undefined;
  cameraStatusLoading: boolean;
  isCameraStatusError: boolean;
  ptzPrecision: number;
  setPtzPrecision: Dispatch<SetStateAction<number>>;
  reset: () => void;
};

const CameraFeedContext = createContext<ICameraFeedContext | null>(null);

export function CameraFeedProvider({
  children,
  device,
}: {
  children: React.ReactNode;
  device: CameraDevice;
}) {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>("loading");
  const [playedOn, setPlayedOn] = useState<Date>();
  const [ptzPrecision, setPtzPrecision] = useState(1);

  const {
    data: streamUrl,
    isPending: isAuthenticating,
    refetch: resetStreamUrl,
  } = useStreamUrl(device);

  const {
    data: cameraStatus,
    isFetching: cameraStatusLoading,
    isError: isCameraStatusError,
  } = useCameraStatus(device);

  return (
    <CameraFeedContext.Provider
      value={{
        device,
        playerRef,
        playedOn,
        setPlayedOn,
        playerStatus,
        setPlayerStatus,
        streamUrl,
        isAuthenticating,
        cameraStatus,
        cameraStatusLoading,
        isCameraStatusError,
        ptzPrecision,
        setPtzPrecision,
        reset: resetStreamUrl,
      }}
    >
      {children}
    </CameraFeedContext.Provider>
  );
}

export function useCameraFeed() {
  const context = useContext(CameraFeedContext);
  if (!context) {
    throw new Error("useCameraFeed must be used within a CameraFeedProvider");
  }
  return context;
}
