import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { serviceIaFetch } = vi.hoisted(() => ({ serviceIaFetch: vi.fn() }));
vi.mock("@/lib/service-ia/api", () => ({ serviceIaFetch }));

import { RegisterCreateDialog } from "@/components/app/RegisterCreateDialog";

describe("RegisterCreateDialog", () => {
  beforeEach(() => serviceIaFetch.mockReset().mockResolvedValue({ id: "sale-1" }));

  it("envoie une vente saisie manuellement au registre", async () => {
    const onCreated = vi.fn();
    render(<RegisterCreateDialog kind="sales" open onClose={vi.fn()} onCreated={onCreated}/>);
    fireEvent.change(screen.getByLabelText("Référence *"), { target: { value: "V-2026-001" } });
    fireEvent.change(screen.getByLabelText("Offre ou service *"), { target: { value: "Audit IA" } });
    fireEvent.change(screen.getByLabelText("Client"), { target: { value: "Entreprise pilote" } });
    fireEvent.change(screen.getByLabelText("Prix unitaire"), { target: { value: "250000" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(serviceIaFetch).toHaveBeenCalledTimes(1));
    const [path, init] = serviceIaFetch.mock.calls[0];
    expect(path).toBe("/registers/sales");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({
      reference: "V-2026-001",
      client_name: "Entreprise pilote",
      item_label: "Audit IA",
      unit_price: "250000",
    });
    expect(onCreated).toHaveBeenCalled();
  });
});
