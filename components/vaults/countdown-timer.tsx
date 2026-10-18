"use client";

import { useEffect, useState } from "react";
import { getTimeLeft } from "@/lib/format";

export function CountdownTimer({ targetTs }: { targetTs: number }) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { days, hours, minutes, isUnlocked } = getTimeLeft(targetTs, now);

  if (isUnlocked) {
    return (
      <div className="rounded-[24px] bg-[var(--surface-container-low)] p-6">
        <p className="font-headline text-sm uppercase tracking-[0.18em] text-[var(--primary)]">
          Unlock Countdown
        </p>
        <p className="mt-4 font-headline text-3xl text-[var(--primary)]">
          Unlocked. Claim is active.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] bg-[var(--surface-container-low)] p-6">
      <p className="font-headline text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">
        Unlock Countdown
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-center">
          <span className="font-headline text-5xl">{days}</span>
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--outline)]">Days</p>
        </div>
        <span className="text-3xl text-[var(--surface-variant)]">:</span>
        <div className="text-center">
          <span className="font-headline text-5xl">{hours}</span>
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--outline)]">Hrs</p>
        </div>
        <span className="text-3xl text-[var(--surface-variant)]">:</span>
        <div className="text-center">
          <span className="font-headline text-5xl">{minutes}</span>
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--outline)]">Min</p>
        </div>
      </div>
    </div>
  );
}
