import { CameraDevice } from "@/lib/camera/types";
import { useQuery } from "@tanstack/react-query";

export const useStreamUrl = (device: CameraDevice) => {
  // return useQuery({
  //   queryKey: ["camera-feed-stream-url", device.id],
  //   queryFn: query(cameraActionApi.getStreamToken, {
  //     pathParams: { cameraId: device.id },
  //   }),
  //   select: (data: { token: string }) => makeStreamUrl(device, data.token),
  // });

  return useQuery({
    queryKey: ["camera-feed-stream-url", device.id],
    queryFn: async () => {
      return makeStreamUrl(device);
    },
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
