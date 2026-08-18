import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ActionsSection } from "@/components/app/sections/ActionsSection";
import { RadarSection } from "@/components/app/sections/RadarSection";
import { ValidationsSection } from "@/components/app/sections/ValidationsSection";
import { ImportsSection } from "@/components/app/sections/ImportsSection";

describe("Modular App Sections", () => {
  it("renders ActionsSection with empty state and creates button", () => {
    render(
      <ActionsSection
        data={[]}
        loading={false}
        error=""
        onReload={async () => {}}
      />
    );
    expect(screen.getByText("Actions correctives")).toBeTruthy();
    expect(screen.getByText("Nouvelle action")).toBeTruthy();
    expect(screen.getByText("Aucune action")).toBeTruthy();
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
    render(
      <RadarSection
        data={mockAlerts}
        loading={false}
        error=""
        onReload={async () => {}}
      />
    );
    expect(screen.getByText("Knowlia Radar")).toBeTruthy();
    expect(screen.getByText("Vente sans client")).toBeTruthy();
    expect(screen.getByText("Lancer l'audit Radar")).toBeTruthy();
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
    render(
      <ValidationsSection
        data={mockValidations}
        loading={false}
        error=""
        onReload={async () => {}}
      />
    );
    expect(screen.getByText("Validations")).toBeTruthy();
    expect(screen.getByText("client_name")).toBeTruthy();
    expect(screen.getByText("Accepter")).toBeTruthy();
    expect(screen.getByText("Rejeter")).toBeTruthy();
  });

  it("renders ImportsSection with register selector", () => {
    render(<ImportsSection />);
    expect(screen.getByText("Importer des données (Excel, CSV)")).toBeTruthy();
    expect(screen.getByText("Registre de destination")).toBeTruthy();
  });
});
