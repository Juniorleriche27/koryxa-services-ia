export type Metric = { label: string; value: string; detail: string; tone?: "positive" | "warning" | "neutral" };
export type RegisterItem = { id: string; title: string; subtitle: string; status: string; meta: string; value?: string };
export type RadarAlert = { id: string; title: string; explanation: string; priority: string; dimension: string; status: string };
export type CorrectiveAction = { id: string; title: string; status: string; priority: string; responsible_user_id?: string | null; due_date?: string | null };
