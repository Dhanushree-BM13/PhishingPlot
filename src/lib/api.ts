import * as sample from "./sample-data";
import { getAccessToken } from "./auth";
import { isSupabaseConfigured } from "./supabase";
import type { ApprovalItem, AuditEntry, Incident } from "./types";

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] as string | undefined;
export const isBackendConnected = Boolean(API_BASE_URL && isSupabaseConfigured);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error("Backend URL is not configured.");
  const token = await getAccessToken();
  if (!token) throw new Error("Sign in to access incident data.");

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let detail = `Request failed (${response.status}).`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

export const api = {
  listIncidents: () =>
    API_BASE_URL ? request<Incident[]>("/incidents") : Promise.resolve(sample.incidents),
  listAgents: () =>
    API_BASE_URL ? request<import("./types").Agent[]>("/agents") : Promise.resolve(sample.agents),
  listApprovals: () =>
    API_BASE_URL ? request<ApprovalItem[]>("/approvals") : Promise.resolve(sample.approvals),
  listAuditLogs: () =>
    API_BASE_URL ? request<AuditEntry[]>("/audit-logs") : Promise.resolve(sample.auditLogs),
  submitIncident: (
    input: Pick<Incident, "subject" | "sender" | "reporter"> & { rawEmail: string },
  ) => request<Incident>("/incidents", { method: "POST", body: JSON.stringify(input) }),
  decideApproval: (id: string, decision: "approved" | "rejected") =>
    request<{ status: string; executed: string }>(`/approvals/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    }),
};

export const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
