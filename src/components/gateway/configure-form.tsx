import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConfigureFormProps } from "@/lib/types/common";
import {
  NetworkMetrics,
  PingMetrics,
} from "@/components/common/network-metrics";
import PluginComponent from "@/components/common/plugin-component";

interface HealthStatus {
  server: boolean;
  database: boolean;
}

// Maximum number of ping samples to keep for jitter calculation
const MAX_PING_SAMPLES = 10;

export const GatewayDeviceConfigureForm = ({
  metadata,
  onChange,
}: ConfigureFormProps) => {
  const [testStatus, setTestStatus] = useState<
    "idle" | "loading" | "success" | "partial" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Live ping monitoring states
  const [continuousPing, setContinuousPing] = useState<boolean>(false);
  const [pingMetrics, setPingMetrics] = useState<PingMetrics>({
    current: 0,
    min: Number.MAX_VALUE,
    max: 0,
    avg: 0,
    jitter: 0,
    samples: 0,
  });

  // Store recent ping times for jitter calculation
  const pingHistoryRef = useRef<number[]>([]);
  const pingTimeoutRef = useRef<number | null>(null);
  const isPerformingPingRef = useRef<boolean>(false);

  // Auto-open popover when test completes
  useEffect(() => {
    if (testStatus !== "idle" && testStatus !== "loading") {
      setPopoverOpen(true);
    }
  }, [testStatus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pingTimeoutRef.current) {
        window.clearTimeout(pingTimeoutRef.current);
      }
    };
  }, []);

  // Calculate standard deviation (jitter) from an array of ping times
  const calculateJitter = (pingTimes: number[]): number => {
    if (pingTimes.length <= 1) return 0;

    // Calculate mean
    const mean =
      pingTimes.reduce((sum, time) => sum + time, 0) / pingTimes.length;

    // Calculate sum of squared differences
    const squaredDifferences = pingTimes.map((time) =>
      Math.pow(time - mean, 2)
    );
    const sumSquaredDiff = squaredDifferences.reduce(
      (sum, diff) => sum + diff,
      0
    );

    // Calculate standard deviation (square root of variance)
    const stdDev = Math.sqrt(sumSquaredDiff / pingTimes.length);

    return Math.round(stdDev);
  };

  const updatePingMetrics = (delay: number): void => {
    // Add current ping to history
    pingHistoryRef.current.push(delay);

    // Keep only the most recent samples
    if (pingHistoryRef.current.length > MAX_PING_SAMPLES) {
      pingHistoryRef.current.shift();
    }

    // Calculate jitter from ping history
    const jitter = calculateJitter(pingHistoryRef.current);

    setPingMetrics((prev) => {
      // Calculate new average
      const totalSamples = prev.samples + 1;
      const newAvg = (prev.avg * prev.samples + delay) / totalSamples;

      return {
        current: delay,
        min: Math.min(prev.min, delay),
        max: Math.max(prev.max, delay),
        avg: Math.round(newAvg),
        jitter: jitter,
        samples: totalSamples,
      };
    });
  };

  const resetPingMetrics = (): void => {
    setPingMetrics({
      current: 0,
      min: Number.MAX_VALUE,
      max: 0,
      avg: 0,
      jitter: 0,
      samples: 0,
    });
    pingHistoryRef.current = [];
  };

  // Forward declaration for scheduleNextPing
  const scheduleNextPing = (): void => {
    if (continuousPing && metadata.endpoint_address) {
      // Schedule next ping with a 500ms delay to prevent excessive network traffic
      pingTimeoutRef.current = window.setTimeout(() => {
        performPing();
      }, 500);
    }
  };

  const performPing = async (): Promise<void> => {
    if (!metadata.endpoint_address || !continuousPing) return;

    isPerformingPingRef.current = true;

    try {
      const url = `https://${metadata.endpoint_address}/health/status`;

      // Measure ping delay
      const startTime = performance.now();

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const endTime = performance.now();
      const delay = Math.round(endTime - startTime);
      updatePingMetrics(delay);

      if (response.ok) {
        const data: HealthStatus = await response.json();
        setHealthData(data);

        if (data.server && data.database) {
          setTestStatus("success");
          setStatusMessage("Connection successful. All services are running.");
        } else {
          const issues = [];
          if (!data.server) issues.push("Server");
          if (!data.database) issues.push("Database");
          setTestStatus("partial");
          setStatusMessage(
            `Connection issues detected: ${issues.join(", ")} not available.`
          );
        }
      } else {
        setTestStatus("error");
        setStatusMessage(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestStatus("error");
      setStatusMessage(
        `Connection failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      isPerformingPingRef.current = false;
      scheduleNextPing();
    }
  };

  // Handle continuous ping
  useEffect(() => {
    if (continuousPing && metadata.endpoint_address) {
      // Clear any existing timeout
      if (pingTimeoutRef.current) {
        window.clearTimeout(pingTimeoutRef.current);
      }

      // Start pinging if not already in progress
      if (!isPerformingPingRef.current) {
        performPing();
      }
    } else {
      // Clear timeout when continuous ping is turned off
      if (pingTimeoutRef.current) {
        window.clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
    }

    return () => {
      if (pingTimeoutRef.current) {
        window.clearTimeout(pingTimeoutRef.current);
      }
    };
  }, [continuousPing, metadata.endpoint_address]);

  const testConnection = async () => {
    if (!metadata.endpoint_address) {
      setTestStatus("error");
      setStatusMessage("Please enter the endpoint address first");
      return;
    }

    setTestStatus("loading");
    setPopoverOpen(false);

    // Reset ping metrics
    resetPingMetrics();

    // Stop any existing continuous ping
    setContinuousPing(false);

    try {
      // Construct the URL with http/https based on the environment
      const url = `https://${metadata.endpoint_address}/health/status`;

      // Measure ping delay
      const startTime = performance.now();

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const endTime = performance.now();
      const delay = Math.round(endTime - startTime);
      updatePingMetrics(delay);

      if (response.ok) {
        const data: HealthStatus = await response.json();
        setHealthData(data);

        if (data.server && data.database) {
          setTestStatus("success");
          setStatusMessage("Connection successful. All services are running.");

          // Auto-start continuous ping on success
          setContinuousPing(true);
        } else {
          setTestStatus("partial");
          const issues = [];
          if (!data.server) issues.push("Server");
          if (!data.database) issues.push("Database");
          setStatusMessage(
            `Connection issues detected: ${issues.join(", ")} not available.`
          );
        }
      } else {
        setTestStatus("error");
        setStatusMessage(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestStatus("error");
      setStatusMessage(
        `Connection failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const getServiceStatusMessage = () => {
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

  const renderStatusDetails = () => {
    if (testStatus === "success") {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Connection Successful</span>
          </div>
          <div className="text-sm text-gray-600">
            <p>{getServiceStatusMessage()}:</p>
            <ul className="mt-1 pl-2">
              <li className="text-green-600">
                Server: {healthData?.server ? "Online" : "Offline"}
              </li>
              <li className="text-green-600">
                Database: {healthData?.database ? "Online" : "Offline"}
              </li>
            </ul>
          </div>
          {testStatus === "success" && <NetworkMetrics metrics={pingMetrics} />}
        </div>
      );
    }

    if (testStatus === "partial") {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Partial Connection</span>
          </div>
          <div className="text-sm text-gray-600">
            <p>{getServiceStatusMessage()}:</p>
            <ul className="mt-1 list-disc pl-5">
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
          </div>
        </div>
      );
    }

    if (testStatus === "error") {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="font-medium">Connection Failed</span>
          </div>
          <div className="text-sm text-gray-600">
            <p>Error details:</p>
            <p className="mt-1 text-red-600">{statusMessage}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderStatusIcon = () => {
    if (testStatus === "idle") return null;

    if (testStatus === "loading") {
      return <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />;
    }

    const iconMap = {
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
      partial: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      error: <XCircle className="h-5 w-5 text-red-500" />,
    };

    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="focus:outline-none relative"
            aria-label="View connection status details"
          >
            {iconMap[testStatus]}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          {renderStatusDetails()}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <PluginComponent>
      <div className="space-y-4">
        <div>
          <Label className="mb-2">
            Gateway's Endpoint Address
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              autoComplete=""
              placeholder="Gateway's Endpoint Address without http:// or https://"
              value={metadata.endpoint_address}
              onChange={(e) => {
                onChange({
                  ...metadata,
                  endpoint_address: e.target.value,
                });

                // Stop continuous ping when host changes
                if (continuousPing) {
                  setContinuousPing(false);
                }
              }}
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              {renderStatusIcon()}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={testConnection}
                disabled={
                  testStatus === "loading" || !metadata.endpoint_address
                }
              >
                Test Connection
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PluginComponent>
  );
};
