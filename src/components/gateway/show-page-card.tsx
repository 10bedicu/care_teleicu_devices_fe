import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import {
  NetworkMetrics,
  PingMetrics,
} from "@/components/common/network-metrics";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import PluginComponent from "@/components/common/plugin-component";

interface HealthStatus {
  server: boolean;
  database: boolean;
}

interface Props {
  device: {
    care_type: string;
    care_metadata: {
      endpoint_address: string;
    };
  };
}

interface PingDataPoint {
  timestamp: number;
  ping: number;
}

const MAX_PING_SAMPLES = 10;
const MAX_CHART_POINTS = 50;

type ConnectionStatus = "idle" | "checking" | "connected" | "partial" | "error";

// Add these constants for ping quality thresholds
const PING_THRESHOLDS = {
  EXCELLENT: 100,
  GOOD: 200,
  FAIR: 500,
};

export const GatewayShowPageCard = ({ device }: Props) => {
  // Connection state
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Monitoring state
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PingMetrics>({
    current: 0,
    min: Number.MAX_VALUE,
    max: 0,
    avg: 0,
    jitter: 0,
    samples: 0,
  });
  const [pingHistory, setPingHistory] = useState<PingDataPoint[]>([]);

  // Refs for ping monitoring
  const pingHistoryRef = useRef<number[]>([]);
  const pingTimeout = useRef<number | null>(null);
  const isPerformingPing = useRef(false);

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
    // Update ping history for jitter calculation
    pingHistoryRef.current.push(delay);
    if (pingHistoryRef.current.length > MAX_PING_SAMPLES) {
      pingHistoryRef.current.shift();
    }

    // Update chart data
    setPingHistory((prev) => {
      const newHistory = [...prev, { timestamp: Date.now(), ping: delay }];
      if (newHistory.length > MAX_CHART_POINTS) {
        return newHistory.slice(-MAX_CHART_POINTS);
      }
      return newHistory;
    });

    const jitter = calculateJitter(pingHistoryRef.current);

    setMetrics((prev) => ({
      current: delay,
      min: Math.min(prev.min, delay),
      max: Math.max(prev.max, delay),
      avg: Math.round((prev.avg * prev.samples + delay) / (prev.samples + 1)),
      jitter,
      samples: prev.samples + 1,
    }));
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
    pingHistoryRef.current = [];
    setPingHistory([]);
  };

  // Check gateway health
  const checkHealth = async () => {
    if (!device.care_metadata.endpoint_address) return;

    setConnectionStatus("checking");
    setErrorMessage("");

    try {
      const url = `https://${device.care_metadata.endpoint_address}/health/status`;
      const startTime = performance.now();

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

      const data: HealthStatus = await response.json();
      setHealthData(data);

      if (data.server && data.database) {
        setConnectionStatus("connected");
        setIsMonitoring(true);
        resetMetrics();
      } else {
        setConnectionStatus("partial");
      }
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  // Perform a single ping
  const performPing = async () => {
    if (!device.care_metadata.endpoint_address || !isMonitoring) return;

    isPerformingPing.current = true;

    try {
      const url = `https://${device.care_metadata.endpoint_address}/health/status`;
      const startTime = performance.now();

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const endTime = performance.now();
      const delay = Math.round(endTime - startTime);
      updateMetrics(delay);

      if (response.ok) {
        const data: HealthStatus = await response.json();
        setHealthData(data);

        if (data.server && data.database) {
          setConnectionStatus("connected");
        } else {
          setConnectionStatus("partial");
        }
      } else {
        setConnectionStatus("error");
        setErrorMessage(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      isPerformingPing.current = false;
      if (isMonitoring) {
        pingTimeout.current = window.setTimeout(performPing, 500);
      }
    }
  };

  // Handle continuous ping
  useEffect(() => {
    if (isMonitoring && device.care_metadata.endpoint_address) {
      // Clear any existing timeout
      if (pingTimeout.current) {
        window.clearTimeout(pingTimeout.current);
      }

      // Start pinging if not already in progress
      if (!isPerformingPing.current) {
        performPing();
      }
    } else {
      // Clear timeout when monitoring is turned off
      if (pingTimeout.current) {
        window.clearTimeout(pingTimeout.current);
        pingTimeout.current = null;
      }
    }

    // Cleanup function to stop monitoring when component unmounts
    return () => {
      if (pingTimeout.current) {
        window.clearTimeout(pingTimeout.current);
        pingTimeout.current = null;
      }
      isPerformingPing.current = false;
    };
  }, [isMonitoring, device.care_metadata.endpoint_address]);

  // Start monitoring
  const startMonitoring = async () => {
    setIsMonitoring(true);
    resetMetrics();
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (pingTimeout.current) {
      window.clearTimeout(pingTimeout.current);
      pingTimeout.current = null;
    }
  };

  // Refresh connection and metrics
  const refresh = async () => {
    stopMonitoring();
    resetMetrics();
    await checkHealth();
  };

  // Initial health check
  useEffect(() => {
    checkHealth();

    // Cleanup function to stop monitoring when component unmounts or endpoint changes
    return () => {
      if (pingTimeout.current) {
        window.clearTimeout(pingTimeout.current);
        pingTimeout.current = null;
      }
      isPerformingPing.current = false;
      setIsMonitoring(false);
    };
  }, [device.care_metadata.endpoint_address]);

  const getStatusMessage = () => {
    if (!healthData) return "Service status unknown";

    const operationalCount = [healthData.server, healthData.database].filter(
      Boolean
    ).length;
    const totalServices = 2;

    if (operationalCount === 0) return "All services are down";
    if (operationalCount === totalServices)
      return "All services are operational";
    return `${operationalCount} of ${totalServices} services are operational`;
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "checking":
        return <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />;
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "partial":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const ping = payload[0].value;
    let qualityLabel = "Poor";
    let qualityColor = "text-red-500";

    if (ping < PING_THRESHOLDS.EXCELLENT) {
      qualityLabel = "Excellent";
      qualityColor = "text-green-600";
    } else if (ping < PING_THRESHOLDS.GOOD) {
      qualityLabel = "Good";
      qualityColor = "text-green-500";
    } else if (ping < PING_THRESHOLDS.FAIR) {
      qualityLabel = "Fair";
      qualityColor = "text-yellow-500";
    }

    return (
      <div className="bg-white p-2 border border-gray-200 rounded-md shadow-md text-xs">
        <p className="font-medium">{formatTimestamp(label)}</p>
        <p className="flex items-center gap-1 mt-1">
          <span>Ping:</span>
          <span className={`font-mono font-medium ${qualityColor}`}>
            {ping} ms
          </span>
          <span className={`text-xs ${qualityColor}`}>({qualityLabel})</span>
        </p>
      </div>
    );
  };

  return (
    <PluginComponent>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Header with Endpoint and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Endpoint Address */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-500">
                  Endpoint Address
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium">
                    {device.care_metadata.endpoint_address}
                  </p>
                  {getStatusIcon()}
                </div>
              </div>

              {/* Monitoring Controls */}
              {connectionStatus !== "idle" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isMonitoring ? stopMonitoring : startMonitoring}
                    disabled={connectionStatus !== "connected"}
                  >
                    {isMonitoring ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">
                          Pause Monitoring
                        </span>
                        <span className="sm:hidden">Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">
                          Start Monitoring
                        </span>
                        <span className="sm:hidden">Start</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={connectionStatus === "checking"}
                  >
                    <RefreshCw className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Health Status */}
            {connectionStatus !== "idle" && (
              <div className="text-sm">
                <p className="font-medium text-gray-700">
                  {getStatusMessage()}:
                </p>
                <ul className="mt-1 pl-2 font-medium">
                  <li
                    className={
                      healthData?.server ? "text-green-600" : "text-red-600"
                    }
                  >
                    Server: {healthData?.server ? "Online" : "Offline"}
                  </li>
                  <li
                    className={
                      healthData?.database ? "text-green-600" : "text-red-600"
                    }
                  >
                    Database: {healthData?.database ? "Online" : "Offline"}
                  </li>
                </ul>
                {connectionStatus === "error" && (
                  <p className="mt-1 text-red-600 font-medium">
                    {errorMessage}
                  </p>
                )}
              </div>
            )}

            {/* Network Metrics and Chart */}
            {connectionStatus !== "idle" && metrics.samples > 0 && (
              <div className="space-y-4">
                <NetworkMetrics metrics={metrics} />

                {/* Ping History Chart */}
                <div className="h-[200px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={pingHistory}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      {/* Reference areas for ping quality zones */}
                      <ReferenceArea
                        y1={0}
                        y2={PING_THRESHOLDS.EXCELLENT}
                        fill="#dcfce7"
                        fillOpacity={0.3}
                      />
                      <ReferenceArea
                        y1={PING_THRESHOLDS.EXCELLENT}
                        y2={PING_THRESHOLDS.GOOD}
                        fill="#d1fae5"
                        fillOpacity={0.3}
                      />
                      <ReferenceArea
                        y1={PING_THRESHOLDS.GOOD}
                        y2={PING_THRESHOLDS.FAIR}
                        fill="#fef9c3"
                        fillOpacity={0.3}
                      />
                      <ReferenceArea
                        y1={PING_THRESHOLDS.FAIR}
                        y2={1000}
                        fill="#fee2e2"
                        fillOpacity={0.3}
                      />

                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatTimestamp}
                        interval="preserveStartEnd"
                        minTickGap={50}
                        tick={{
                          fontSize: 11,
                          fontFamily: "Figtree, sans-serif",
                        }}
                        stroke="#9ca3af"
                      />
                      <YAxis
                        domain={["dataMin - 10", "dataMax + 10"]}
                        label={{
                          value: "Ping (ms)",
                          angle: -90,
                          position: "insideLeft",
                          style: {
                            textAnchor: "middle",
                            fontSize: 12,
                            fontFamily: "Figtree, sans-serif",
                            fill: "#6b7280",
                          },
                        }}
                        tick={{
                          fontSize: 11,
                          fontFamily: "Figtree, sans-serif",
                        }}
                        stroke="#9ca3af"
                      />

                      {/* Reference lines for quality thresholds */}
                      <ReferenceLine
                        y={PING_THRESHOLDS.EXCELLENT}
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                      <ReferenceLine
                        y={PING_THRESHOLDS.GOOD}
                        stroke="#22c55e"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                      <ReferenceLine
                        y={PING_THRESHOLDS.FAIR}
                        stroke="#eab308"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />

                      <Tooltip content={<CustomTooltip />} />

                      <Line
                        type="monotone"
                        dataKey="ping"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 4,
                          stroke: "#2563eb",
                          strokeWidth: 1,
                          fill: "#ffffff",
                        }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PluginComponent>
  );
};
