import { useQuery } from "@tanstack/react-query";

import cameraActionApi from "@/lib/camera/cameraActionApi";
import { CameraDevice } from "@/lib/camera/types";
import { query } from "@/lib/request";

export const useStreamUrl = (device: CameraDevice) => {
  return useQuery({
    queryKey: ["camera-feed-stream-url", device.id],
    queryFn: query(cameraActionApi.getStreamToken, {
      pathParams: { cameraId: device.id },
      silent: true,
    }),
    select: (data: { token: string }) => makeStreamUrl(device, data.token),
  });
};

const makeStreamUrl = (device: CameraDevice, token?: string) => {
  const host = device.care_metadata.gateway?.care_metadata.endpoint_address;
  const streamId = device.care_metadata.stream_id;

  if (!host) {
    return null;
  }

  const url = new URL(`wss://${host}/stream/${streamId}/channel/0/mse`);

  url.searchParams.set("uuid", streamId);
  url.searchParams.set("channel", "0");

  if (token) {
    url.searchParams.set("token", token);
  }

  return url.toString();
};
