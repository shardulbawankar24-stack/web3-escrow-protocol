import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dispensation Vault | LUMINOUS",
  description: "Automated payment infrastructure for governments and enterprises.",
};

export default function DispensationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
