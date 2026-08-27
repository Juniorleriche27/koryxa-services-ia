import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { serviceIaFetch } = vi.hoisted(() => ({ serviceIaFetch: vi.fn() }));
vi.mock("@/lib/service-ia/api", () => ({ serviceIaFetch }));

import { RegisterCreateDialog } from "@/components/app/RegisterCreateDialog";
import { I18nProvider } from "@/lib/i18n";

describe("RegisterCreateDialog", () => {
  beforeEach(() => serviceIaFetch.mockReset().mockImplementation((path?: string) =>
    Promise.resolve(path?.includes("generate-reference") ? { reference: "FAC-2026-001" } : { id: "sale-1" })
  ));

  it("envoie une vente saisie manuellement au registre", async () => {
    const onCreated = vi.fn();
    render(<I18nProvider><RegisterCreateDialog kind="sales" open onClose={vi.fn()} onCreated={onCreated}/></I18nProvider>);
    fireEvent.change(screen.getByLabelText("Référence auto-générée *"), { target: { value: "V-2026-001" } });
    fireEvent.change(screen.getByLabelText("Offre / Prestation / Article *"), { target: { value: "Audit IA" } });
    fireEvent.change(screen.getByLabelText("Client / Destinataire"), { target: { value: "Entreprise pilote" } });
    fireEvent.change(screen.getByLabelText("Prix unitaire (XOF/Devise)"), { target: { value: "250000" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(serviceIaFetch).toHaveBeenCalledWith(
      "/registers/sales",
      expect.objectContaining({ method: "POST" }),
    ));
    const [path, init] = serviceIaFetch.mock.calls.find(([calledPath]) => calledPath === "/registers/sales")!;
    expect(path).toBe("/registers/sales");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({
      reference: "V-2026-001",
      client_name: "Entreprise pilote",
      item_label: "Audit IA",
      unit_price: 250000,
    });
    expect(onCreated).toHaveBeenCalled();
  });
});
