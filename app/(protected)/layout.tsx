import PushWrapper from "../../components/PushWrapper";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PushWrapper>{children}</PushWrapper>;
}
