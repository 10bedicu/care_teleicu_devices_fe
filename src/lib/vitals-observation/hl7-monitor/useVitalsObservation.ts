import { useCallback, useRef, useState } from "react";

import {
  DeviceClient,
  MonitorData,
  VitalsWaveformData,
} from "@/lib/vitals-observation/hl7-monitor/device-client";
import VitalsRenderer from "@/lib/vitals-observation/hl7-monitor/renderer";
import {
  ChannelOptions,
  IVitalsComponentProps,
  VitalsDataBase,
  VitalsValueBase as VitalsValue,
} from "@/lib/vitals-observation/types";
import {
  getChannel,
  getVitalsCanvasSizeAndDuration,
} from "@/lib/vitals-observation/utils";

import { useCanvas } from "@/hooks/useCanvas";

interface VitalsBPValue extends VitalsDataBase {
  systolic: VitalsValue;
  diastolic: VitalsValue;
  map: VitalsValue;
}

export default function useVitalsObservation(
  config?: IVitalsComponentProps["config"],
) {
  const waveformForegroundCanvas = useCanvas();
  const waveformBackgroundCanvas = useCanvas();
  const rendererConfig = config ?? getVitalsCanvasSizeAndDuration();

  // Non waveform data states.
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [pulseRate, setPulseRate] = useState<VitalsValue>();
  const [heartRate, setHeartRate] = useState<VitalsValue>();
  const [bp, setBp] = useState<VitalsBPValue>();
  const [spo2, setSpo2] = useState<VitalsValue>();
  const [respiratoryRate, setRespiratoryRate] = useState<VitalsValue>();
  const [temperature1, setTemperature1] = useState<VitalsValue>();
  const [temperature2, setTemperature2] = useState<VitalsValue>();

  // Waveform data states.
  const device = useRef<DeviceClient>();
  const renderer = useRef<VitalsRenderer | null>(null);

  const ecgOptionsRef = useRef<ChannelOptions>();
  const plethOptionsRef = useRef<ChannelOptions>();
  const spo2OptionsRef = useRef<ChannelOptions>();

  const connect = useCallback(
    (socketUrl: string) => {
      setIsOnline(false);
      device.current?.disconnect();

      device.current = new DeviceClient(socketUrl);
      device.current.connect();

      function obtainRenderer() {
        if (
          !ecgOptionsRef.current ||
          !plethOptionsRef.current ||
          !spo2OptionsRef.current ||
          !waveformForegroundCanvas.contextRef.current ||
          !waveformBackgroundCanvas.contextRef.current
        )
          return;

        setIsOnline(true);

        renderer.current = new VitalsRenderer({
          foregroundRenderContext: waveformForegroundCanvas.contextRef.current,
          backgroundRenderContext: waveformBackgroundCanvas.contextRef.current,
          animationInterval: 50,
          ecg: ecgOptionsRef.current,
          pleth: plethOptionsRef.current,
          spo2: spo2OptionsRef.current,
          ...rendererConfig,
        });

        const _renderer = renderer.current;
        device.current?.on("ecg-waveform", ingestTo(_renderer, "ecg"));
        device.current?.on("pleth-waveform", ingestTo(_renderer, "pleth"));
        device.current?.on("spo2-waveform", ingestTo(_renderer, "spo2"));

        const hook = (set: (data: any) => void) => (d: MonitorData) => set(d);
        device.current?.on("pulse-rate", hook(setPulseRate));
        device.current?.on("heart-rate", hook(setHeartRate));
        device.current?.on("SpO2", hook(setSpo2));
        device.current?.on("respiratory-rate", hook(setRespiratoryRate));
        device.current?.on("body-temperature1", hook(setTemperature1));
        device.current?.on("body-temperature2", hook(setTemperature2));
        device.current?.on("blood-pressure", hook(setBp));
      }

      device.current.once("ecg-waveform", (observation) => {
        ecgOptionsRef.current = getChannel(observation as VitalsWaveformData);
        obtainRenderer();
      });

      device.current.once("pleth-waveform", (observation) => {
        plethOptionsRef.current = getChannel(observation as VitalsWaveformData);
        obtainRenderer();
      });

      device.current.once("spo2-waveform", (observation) => {
        spo2OptionsRef.current = getChannel(observation as VitalsWaveformData);
        obtainRenderer();
      });
    },
    [waveformForegroundCanvas.contextRef, waveformBackgroundCanvas],
  );

  return {
    connect,
    waveformCanvas: {
      foreground: waveformForegroundCanvas,
      background: waveformBackgroundCanvas,
      size: rendererConfig.size,
    },
    data: {
      pulseRate,
      heartRate,
      bp,
      spo2,
      respiratoryRate,
      temperature1,
      temperature2,
    },
    device,
    isOnline,
  };
}

const ingestTo = (
  vitalsRenderer: VitalsRenderer,
  channel: "ecg" | "pleth" | "spo2",
) => {
  return (observation: MonitorData) => {
    vitalsRenderer.append(
      channel,
      (observation as VitalsWaveformData).data
        .split(" ")
        .map((x) => parseInt(x)) || [],
    );
  };
};
