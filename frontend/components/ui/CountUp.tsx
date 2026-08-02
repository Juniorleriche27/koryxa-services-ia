"use client";

import { useEffect, useState } from "react";

export default function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 700,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setValue(to), duration);
    return () => window.clearTimeout(timer);
  }, [duration, to]);

  return <span>{prefix}{value}{suffix}</span>;
}
