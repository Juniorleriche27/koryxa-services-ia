import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ActionsSection } from "@/components/app/sections/ActionsSection";
import { RadarSection } from "@/components/app/sections/RadarSection";
import { ValidationsSection } from "@/components/app/sections/ValidationsSection";
import { ImportsSection } from "@/components/app/sections/ImportsSection";
import { I18nProvider } from "@/lib/i18n";

const renderWithI18n = (component: React.ReactNode) =>
  render(<I18nProvider>{component}</I18nProvider>);

describe("Modular App Sections", () => {
  it("renders ActionsSection with empty state and creates button", () => {
    renderWithI18n(
      <ActionsSection
        data={[]}
        loading={false}
        error=""
        onReload={async () => {}}
      />
    );
    expect(screen.getByText("Actions et décisions")).toBeTruthy();
    expect(screen.getByText("Nouvelle Tâche")).toBeTruthy();
    expect(screen.getByText("Aucune action")).toBeTruthy();
  });

  it("keeps all four Action statuses in a single full-width Kanban", () => {
    const items = [
      { id: "a1", title: "Relancer le fournisseur", status: "todo", priority: "normal" },
      { id: "a2", title: "Contrôler le paiement", status: "in_progress", priority: "high" },
    ];
    const { container } = renderWithI18n(
      <ActionsSection data={items} loading={false} error="" onReload={async () => {}} />,
    );
    expect(screen.getByText("Relancer le fournisseur")).toBeTruthy();
    expect(screen.getByText("Contrôler le paiement")).toBeTruthy();
    expect(container.querySelector('.cauri-actions-four-columns')?.children.length).toBe(4);
    expect(container.querySelectorAll('.cauri-actions-four-columns [data-empty="true"]').length).toBe(2);
    expect(container.querySelectorAll('.cauri-actions-four-columns .app-task').length).toBe(2);
    expect(screen.getByRole("button", { name: /Nouvelle Tâche/i })).toBeTruthy();
  });

  it("renders RadarSection with alert list", () => {
    const mockAlerts = [
      {
        id: "alert-1",
        title: "Vente sans client",
        explanation: "Une vente nécessite un client identifié.",
        priority: "high",
        dimension: "completeness",
        status: "open",
        confidence: 0.95,
      },
    ];
    renderWithI18n(
      <RadarSection
        data={mockAlerts}
        loading={false}
        error=""
        onReload={async () => {}}
      />
    );
    expect(screen.getByText("Surveillance et alertes")).toBeTruthy();
    expect(screen.getByText("Vente sans client")).toBeTruthy();
    expect(screen.getByText("Lancer un Scan Complet")).toBeTruthy();
  });

  it("renders ValidationsSection with pending items", () => {
    const mockValidations = [
      {
        id: "val-1",
        field_name: "client_name",
        old_value: "Inconnu",
        proposed_value: "Société Alpha",
        source_type: "voice_note",
        confidence: 0.88,
        status: "pending",
      },
    ];
    renderWithI18n(
      <ValidationsSection
        data={mockValidations}
        loading={false}
        error=""
        onReload={async () => {}}
      />
    );
    expect(screen.getByText("Décisions et validations")).toBeTruthy();
    expect(screen.getByText("client_name")).toBeTruthy();
    expect(screen.getByText("Accepter")).toBeTruthy();
    expect(screen.getByText("Rejeter")).toBeTruthy();
  });

  it("renders ImportsSection with register selector", () => {
    renderWithI18n(<ImportsSection />);
    expect(screen.getByText("Importer des données")).toBeTruthy();
    expect(screen.getByText("Registre de destination")).toBeTruthy();
  });
});
