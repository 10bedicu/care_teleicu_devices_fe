import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
} from "lucide-react";
import { useState } from "react";

import labAnalyzerApi, { LabMessage } from "@/lib/lab-analyzer/labAnalyzerApi";
import { query } from "@/lib/request";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CardListSkeleton } from "@/components/common/skeleton-loading";

import { useTranslation } from "@/hooks/useTranslation";

const PAGE_SIZE = 10;

interface Props {
  deviceId: string;
}

function MessageStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "sent":
    case "processed":
      return <CircleCheck className="size-4 text-green-500" />;
    case "rejected":
      return <CircleAlert className="size-4 text-orange-500" />;
    case "error":
    case "failed":
      return <CircleAlert className="size-4 text-red-500" />;
    default:
      return <Clock className="size-4 text-yellow-500" />;
  }
}

function MessageTypeIcon({ type }: { type: string }) {
  if (type === "ORM" || type === "DSP") {
    return <ArrowUpRight className="size-4 text-blue-500" />;
  }
  if (type === "QRY") {
    return <ArrowDownLeft className="size-4 text-orange-500" />;
  }
  return <ArrowDownLeft className="size-4 text-purple-500" />;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function MessageRow({ message }: { message: LabMessage }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="border border-gray-200 rounded-md">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="size-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-gray-400" />
        )}
        <MessageTypeIcon type={message.message_type} />
        <span className="text-xs font-medium text-gray-700">
          {message.message_type}
        </span>
        <MessageStatusIcon status={message.status} />
        <span className="text-xs text-gray-500">{message.status}</span>
        <span className="ml-auto text-xs text-gray-400">
          {formatDate(message.created_date)}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 px-3 py-2 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">{t("message_control_id")}:</span>{" "}
              <span className="font-mono">{message.message_control_id}</span>
            </div>
            {message.patient_id && (
              <div>
                <span className="text-gray-500">{t("patient")}:</span>{" "}
                <span className="font-mono text-xs">{message.patient_id}</span>
              </div>
            )}
          </div>
          {message.error_details && (
            <div className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
              {t("error_details")} {message.error_details}
            </div>
          )}
          {message.raw_message && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                {t("raw_hl7_message")}
              </summary>
              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto max-h-48 whitespace-pre-wrap">
                {message.raw_message}
              </pre>
            </details>
          )}
          {message.parsed_data &&
            Object.keys(message.parsed_data).length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  {t("show_technical_details")}
                </summary>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto max-h-48">
                  {JSON.stringify(message.parsed_data, null, 2)}
                </pre>
              </details>
            )}
        </div>
      )}
    </div>
  );
}

export const MessagesCard = ({ deviceId }: Props) => {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["lab-analyzer-messages", deviceId, offset],
    queryFn: query(labAnalyzerApi.listMessages, {
      pathParams: { deviceExternalId: deviceId },
      queryParams: { limit: PAGE_SIZE, offset },
    }),
  });

  const messages = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("hl7_messages")}</CardTitle>
        <CardDescription>{t("hl7_messages_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <CardListSkeleton count={3} />
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {t("no_messages")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <MessageRow key={msg.id} message={msg} />
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCount)} of{" "}
                  {totalCount}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    disabled={offset === 0}
                    onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-xs text-gray-600 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    disabled={offset + PAGE_SIZE >= totalCount}
                    onClick={() => setOffset((o) => o + PAGE_SIZE)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
