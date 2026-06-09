import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface HealthStatus {
  server: boolean;
  database: boolean;
}

interface PingDataPoint {
  timestamp: number;
  ping: number;
}

interface PingMetrics {
  current: number;
  min: number;
  max: number;
  avg: number;
  jitter: number;
  samples: number;
}

const MAX_PING_SAMPLES = 10;
const MAX_CHART_POINTS = 50;

export interface GatewayHealthCheckResult {
  healthData: HealthStatus | null;
  isLoading: boolean;
  error: Error | null;
  pingHistory: PingDataPoint[];
  metrics: PingMetrics;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetMetrics: () => void;
}

export const useGatewayHealthCheck = (
  endpointAddress: string,
  insecure = false,
): GatewayHealthCheckResult => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [pingHistory, setPingHistory] = useState<PingDataPoint[]>([]);
  const [metrics, setMetrics] = useState<PingMetrics>({
    current: 0,
    min: Number.MAX_VALUE,
    max: 0,
    avg: 0,
    jitter: 0,
    samples: 0,
  });

  // Calculate jitter from ping history
  const calculateJitter = (times: number[]): number => {
    if (times.length <= 1) return 0;
    const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
      times.length;
    return Math.round(Math.sqrt(variance));
  };

  // Update metrics with new ping time
  const updateMetrics = (delay: number) => {
    setPingHistory((prev) => {
      const newHistory = [...prev, { timestamp: Date.now(), ping: delay }];
      if (newHistory.length > MAX_CHART_POINTS) {
        return newHistory.slice(-MAX_CHART_POINTS);
      }
      return newHistory;
    });

    setMetrics((prev) => {
      const newSamples = prev.samples + 1;
      const newAvg = Math.round((prev.avg * prev.samples + delay) / newSamples);
      const newMin = Math.min(prev.min, delay);
      const newMax = Math.max(prev.max, delay);

      // Calculate jitter from recent ping history
      const recentPings = pingHistory
        .slice(-MAX_PING_SAMPLES)
        .map((p) => p.ping);
      const jitter = calculateJitter(recentPings);

      return {
        current: delay,
        min: newMin,
        max: newMax,
        avg: newAvg,
        jitter,
        samples: newSamples,
      };
    });
  };

  // Reset metrics
  const resetMetrics = () => {
    setMetrics({
      current: 0,
      min: Number.MAX_VALUE,
      max: 0,
      avg: 0,
      jitter: 0,
      samples: 0,
    });
    setPingHistory([]);
  };

  const {
    data: healthData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["gateway-health", endpointAddress, insecure],
    queryFn: async () => {
      const startTime = performance.now();
      const protocol = insecure ? "http" : "https";
      const url = `${protocol}://${endpointAddress}/health/status`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const endTime = performance.now();
      const delay = Math.round(endTime - startTime);
      updateMetrics(delay);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json() as Promise<HealthStatus>;
    },
    refetchInterval: isMonitoring ? 500 : false,
    enabled: !!endpointAddress && isMonitoring,
  });

  const startMonitoring = () => {
    setIsMonitoring(true);
    resetMetrics();
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  return {
    healthData: healthData || null,
    isLoading,
    error: error as Error | null,
    pingHistory,
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
  };
};
