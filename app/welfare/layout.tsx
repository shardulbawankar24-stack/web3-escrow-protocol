import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welfare / NGO Vault | LUMINOUS",
  description: "Transparent, trustless crowdfunding for NGOs, charities, and community relief.",
};

export default function WelfareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
