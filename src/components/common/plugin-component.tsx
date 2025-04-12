export default function PluginComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="teleicu-devices-container">{children}</div>;
}
