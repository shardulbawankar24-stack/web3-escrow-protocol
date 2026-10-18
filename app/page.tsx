import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Coins,
  Globe,
  HandCoins,
  HeartHandshake,
  Lock,
  PiggyBank,
  Shield,
  ShieldCheck,
  Timer,
  Zap,
} from "lucide-react";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { EnvironmentSwitcher } from "@/components/protocol/environment-switcher";

const vaultSections = [
  {
    title: "Saver's Vault",
    subtitle: "Personal Finance",
    description:
      "Time-locked savings with enforced discipline. Early exit triggers a 5% penalty redistributed to committed savers.",
    forWho: ["Students", "Salaried Employees", "Crypto Holders", "Families"],
    icon: PiggyBank,
    href: "/savers",
    accent: "emerald",
    accentBg: "bg-emerald-400/10",
    accentBorder: "border-emerald-400/30",
    accentText: "text-emerald-300",
    accentGlow: "shadow-[0_0_40px_-10px_rgba(110,229,145,0.3)]",
    features: [
      "Blockchain-enforced lock period",
      "5% penalty rewards disciplined savers",
      "Optional Aave USDC yield",
      "Fully on-chain transparency",
    ],
  },
  {
    title: "Welfare / NGO Vault",
    subtitle: "Transparent Charity",
    description:
      "Corruption-proof crowdfunding. Every donor, beneficiary, and fund movement is publicly verifiable on-chain.",
    forWho: ["NGOs", "Charities", "Relief Funds", "Communities"],
    icon: HeartHandshake,
    href: "/welfare",
    accent: "rose",
    accentBg: "bg-rose-400/10",
    accentBorder: "border-rose-400/30",
    accentText: "text-rose-300",
    accentGlow: "shadow-[0_0_40px_-10px_rgba(251,113,133,0.3)]",
    features: [
      "Public donor & beneficiary lists",
      "No admin can steal or change allocations",
      "Direct beneficiary claims",
      "On-chain audit trail",
    ],
  },
  {
    title: "Dispensation Vault",
    subtitle: "Government & Enterprise",
    description:
      "Automated payment infrastructure. Lock funds, let verified recipients claim transparently after the scheduled period.",
    forWho: ["Governments", "Corporations", "Payroll", "Contractors"],
    icon: Building2,
    href: "/dispensation",
    accent: "sky",
    accentBg: "bg-sky-400/10",
    accentBorder: "border-sky-400/30",
    accentText: "text-sky-300",
    accentGlow: "shadow-[0_0_40px_-10px_rgba(56,189,248,0.3)]",
    features: [
      "Authority deposits, workers claim",
      "No emergency withdraw possible",
      "Guaranteed fund availability",
      "Transparent payroll & welfare",
    ],
  },
];

const trustFeatures = [
  {
    icon: Shield,
    title: "Zero Trust Required",
    body: "Smart contracts enforce rules automatically. No banks, no middlemen, no human intervention.",
  },
  {
    icon: Globe,
    title: "Publicly Verifiable",
    body: "Every transaction, donor, and beneficiary is visible on the Solana blockchain explorer.",
  },
  {
    icon: Lock,
    title: "Immutable Rules",
    body: "Once a vault is created, no one — not even admin — can alter allocation percentages or unlock early.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    body: "Solana's sub-second finality means deposits and claims settle instantly with near-zero fees.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <nav className="fixed top-0 z-50 hidden h-20 w-full items-center justify-between border-b border-[rgb(62_74_63/18%)] bg-[var(--surface-container-lowest)]/70 px-8 shadow-2xl shadow-black/20 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-12">
          <Link href="/" className="font-headline text-3xl font-bold tracking-tight text-emerald-400">
            LUMINOUS
          </Link>
          <div className="flex gap-8">
            <Link className="font-headline text-[var(--on-surface-variant)] transition hover:text-[var(--primary)]" href="/sign-in">
              Sign In
            </Link>
            <Link className="font-headline text-[var(--on-surface-variant)] transition hover:text-[var(--primary)]" href="/dashboard">
              Dashboard
            </Link>
            <Link className="font-headline text-[var(--on-surface-variant)] transition hover:text-emerald-300" href="/savers">
              Savers
            </Link>
            <Link className="font-headline text-[var(--on-surface-variant)] transition hover:text-rose-300" href="/welfare">
              Welfare
            </Link>
            <Link className="font-headline text-[var(--on-surface-variant)] transition hover:text-sky-300" href="/dispensation">
              Dispensation
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <EnvironmentSwitcher />
          <ConnectWalletButton />
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-[1400px] px-6 pb-16 pt-28 md:px-12 md:pt-36 lg:px-24">
        {/* Hero Section */}
        <section className="relative mb-32 min-h-[70vh]">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2">
              <ShieldCheck size={14} className="text-emerald-300" />
              <span className="font-headline text-xs font-semibold uppercase tracking-[0.1em] text-emerald-200">
                Powered by Solana Blockchain
              </span>
            </div>
            <h1 className="font-headline text-6xl font-bold leading-tight tracking-tight md:text-8xl">
              Trust Through
              <br />
              <span className="gradient-text">Transparency.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-xl text-[var(--on-surface-variant)] md:text-2xl">
              Decentralized USDC vaults for{" "}
              <span className="font-semibold text-emerald-300">personal savings</span>,{" "}
              <span className="font-semibold text-rose-300">transparent charity</span>, and{" "}
              <span className="font-semibold text-sky-300">automated payments</span>{" "}
              — all verifiable on-chain.
            </p>
            <div className="mt-10 flex flex-wrap gap-5">
              <Link href="/dashboard" className="gradient-bg rounded-full px-8 py-4 text-lg font-bold text-[var(--on-primary)] neon-shadow">
                Launch App
              </Link>
              <Link
                href="/create-vault"
                className="rounded-full border border-[rgb(62_74_63/20%)] bg-[rgb(45_52_73/20%)] px-8 py-4 text-lg font-medium backdrop-blur-md"
              >
                Create Vault
              </Link>
            </div>
          </div>
          <div className="absolute right-0 top-1/2 hidden h-[560px] w-[360px] -translate-y-1/2 lg:block">
            <div className="glass-panel absolute inset-0 rotate-6" />
            <div className="glass-panel absolute inset-0 -rotate-3 translate-x-8 translate-y-8 border border-emerald-200/20">
              <div className="flex h-full items-center justify-center">
                <Coins className="h-24 w-24 text-emerald-300/40" />
              </div>
            </div>
          </div>
        </section>

        {/* 3 Vault Sections */}
        <section className="mb-32" id="vaults">
          <div className="mb-14 text-center">
            <p className="font-headline text-sm uppercase tracking-[0.3em] text-[var(--primary)]">
              Ecosystem Solutions
            </p>
            <h2 className="mt-3 font-headline text-5xl font-bold">
              Three Vaults. Three Missions.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--on-surface-variant)]">
              Each vault is purpose-built for a different user group — with blockchain-enforced rules and full on-chain transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {vaultSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className={`glass-panel group relative overflow-hidden p-8 transition-all duration-300 hover:scale-[1.02] ${section.accentGlow}`}
                >
                  <div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${
                    section.accent === "emerald"
                      ? "from-emerald-400 to-emerald-600"
                      : section.accent === "rose"
                        ? "from-rose-400 to-rose-600"
                        : "from-sky-400 to-sky-600"
                  }`} />

                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${section.accentBg} ${section.accentBorder} border`}>
                    <Icon className={`h-7 w-7 ${section.accentText}`} />
                  </div>

                  <p className={`font-headline text-[10px] uppercase tracking-[0.2em] ${section.accentText}`}>
                    {section.subtitle}
                  </p>
                  <h3 className="mt-1 font-headline text-3xl font-bold tracking-tight">
                    {section.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--on-surface-variant)]">
                    {section.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {section.forWho.map((who) => (
                      <span
                        key={who}
                        className="rounded-full bg-[var(--surface-container-high)] px-3 py-1 text-[10px] text-[var(--on-surface-variant)]"
                      >
                        {who}
                      </span>
                    ))}
                  </div>

                  <ul className="mt-6 space-y-2">
                    {section.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[11px]">
                        <CheckCircle2 size={13} className={`mt-0.5 shrink-0 ${section.accentText}`} />
                        <span className="text-[var(--on-surface-variant)]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${section.accentText} transition group-hover:gap-3`}>
                    Explore {section.title.split(" ")[0]} <ArrowRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Trust Through Transparency */}
        <section className="mb-32">
          <div className="mb-14 text-center">
            <p className="font-headline text-sm uppercase tracking-[0.3em] text-[var(--primary)]">
              Core Philosophy
            </p>
            <h2 className="mt-3 font-headline text-5xl font-bold">
              Trust Through Transparency
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--on-surface-variant)]">
              Traditional finance depends on humans and organizations. LUMINOUS replaces trust with mathematics, blockchain consensus, and smart contracts.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="glass-panel p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-container-high)]">
                    <Icon className="h-6 w-6 text-[var(--primary)]" />
                  </div>
                  <h3 className="font-headline text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-[var(--on-surface-variant)]">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Protocol Flow */}
        <section className="mb-32">
          <div className="mb-14 text-center">
            <p className="font-headline text-sm uppercase tracking-[0.3em] text-[var(--primary)]">
              How It Works
            </p>
            <h2 className="mt-3 font-headline text-5xl font-bold">Trustless Execution</h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                title: "Step 1: Deposit",
                body: "Fund your vault with USDC. Instant settlement via Solana. All data visible on blockchain.",
                icon: HandCoins,
              },
              {
                title: "Step 2: Lock",
                body: "Smart contract locks funds cryptographically. No one can alter rules after creation.",
                icon: Timer,
              },
              {
                title: "Step 3: Claim",
                body: "Lock period ends. Beneficiaries claim their share directly — no intermediary needed.",
                icon: ShieldCheck,
              },
            ].map((step) => (
              <article key={step.title} className="glass-panel p-8 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--surface-container-high)]">
                  <step.icon className="h-10 w-10 text-[var(--primary)]" />
                </div>
                <h3 className="font-headline text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm text-[var(--on-surface-variant)]">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="glass-panel mb-20 p-10 text-center lg:p-16">
          <h2 className="font-headline text-5xl font-bold leading-tight">
            Ready to Build Trust?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--on-surface-variant)]">
            Whether you&#39;re saving for the future, running a charity, or distributing payments — LUMINOUS makes it transparent and trustless.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-5">
            <Link href="/create-vault" className="gradient-bg rounded-full px-8 py-4 text-lg font-bold text-[var(--on-primary)] neon-shadow">
              Create Your Vault
            </Link>
            <Link href="/dashboard" className="rounded-full border border-[rgb(62_74_63/20%)] bg-[rgb(45_52_73/20%)] px-8 py-4 text-lg font-medium backdrop-blur-md">
              View Dashboard
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[rgb(62_74_63/20%)] bg-[var(--surface-container-lowest)] px-6 py-12 md:px-12 lg:px-24">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <p className="font-headline text-2xl font-bold text-[var(--primary)]">LUMINOUS</p>
            <p className="mt-1 text-xs text-[var(--outline)]">Trust Through Transparency</p>
          </div>
          <div className="flex gap-8 text-sm text-[var(--on-surface-variant)]">
            <Link href="#">Docs</Link>
            <Link href="#">GitHub</Link>
            <Link href="#">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
