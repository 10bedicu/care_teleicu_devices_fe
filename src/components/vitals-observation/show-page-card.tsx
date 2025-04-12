import { VitalsObservationMonitor } from "@/lib/vitals-observation/hl7-monitor/vitals-observation-monitor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import PluginComponent from "@/components/common/plugin-component";

interface Props {
  device: {
    care_type: "vitals-observation";
    care_metadata: {
      type: "HL7-Monitor" | "Ventilator";
      endpoint_address: string;
      gateway: {
        registered_name: string;
        care_type: "gateway";
        care_metadata: {
          endpoint_address: string;
        };
      };
    };
  };
}

const getWebSocketUrl = (gateway: string, device: string) => {
  const protocol = location.protocol === "https:" ? "wss:" : "wss:";
  return `${protocol}//${gateway}/observations/${device}`;
};

export const VitalsObservationShowPageCard = ({ device }: Props) => {
  const socketUrl = getWebSocketUrl(
    device.care_metadata.gateway.care_metadata.endpoint_address,
    device.care_metadata.endpoint_address
  );

  return (
    <PluginComponent>
      <div className="flex flex-col items-center gap-4">
        {/* Device Information Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Vitals Observation Device Configuration</CardTitle>
            <CardDescription>
              Details about the connected vitals observation device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    Device Type:
                  </span>
                  <span className="ml-2 font-semibold">
                    {device.care_metadata.type}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    Endpoint Address:
                  </span>
                  <span className="ml-2 font-semibold">
                    {device.care_metadata.endpoint_address}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    Gateway:
                  </span>
                  <span className="ml-2 font-semibold">
                    {device.care_metadata.gateway.registered_name}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    Gateway Endpoint:
                  </span>
                  <span className="ml-2 font-semibold">
                    {
                      device.care_metadata.gateway.care_metadata
                        .endpoint_address
                    }
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-400">
                  WebSocket URL:
                </span>
                <span className="ml-2 font-mono text-sm">{socketUrl}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vitals Observation Monitor */}
        <VitalsObservationMonitor socketUrl={socketUrl} />
      </div>
    </PluginComponent>
  );
};
