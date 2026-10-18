import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saver's Vault | LUMINOUS",
  description: "Personal time-locked savings with enforced financial discipline.",
};

export default function SaversLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
