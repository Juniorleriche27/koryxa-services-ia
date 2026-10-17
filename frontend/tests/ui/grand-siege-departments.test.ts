import { describe, expect, it } from 'vitest';
import { DEPARTMENTS, resolveDepartment } from '@/components/grand-siege/departments';
import { authorizedDepartments, OFFICIAL_IDS, type DepartmentCatalogue } from '@/components/grand-siege/department-contract';

const catalogue: DepartmentCatalogue = {
  schema_version: '1.0', organization_id: 'tenant-1', departments: OFFICIAL_IDS.map(id => ({ id, label: id, path: id === 'direction' ? '/espace' : `/espace/${id}`, allowed: true, available: true, access_status: 'autorise' })),
};

describe('CAURI — départements et contrat backend', () => {
  it('n’expose que les six identifiants backend, sans département IA artificiel', () => {
    expect(DEPARTMENTS.map(d => d.id)).toEqual(OFFICIAL_IDS);
    const routes = DEPARTMENTS.flatMap(d => d.sections.map(section => section.href));
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes.every(path => path.startsWith('/espace/'))).toBe(true);
  });
  it('préserve les anciennes routes métier et la nouvelle route Équipe', () => {
    expect(resolveDepartment('/espace')).toBeNull();
    expect(resolveDepartment('/espace/ventes')?.department.id).toBe('commerce');
    expect(resolveDepartment('/espace/finance')?.department.id).toBe('finances');
    expect(resolveDepartment('/espace/procedures')?.department.id).toBe('operations');
    expect(resolveDepartment('/espace/radar')?.department.id).toBe('radar');
    expect(resolveDepartment('/espace/actions')?.department.id).toBe('direction');
    expect(resolveDepartment('/espace/organisation')?.department.id).toBe('organisation');
    expect(resolveDepartment('/espace/equipe')?.department.id).toBe('organisation');
  });
  it('choisit la sous-route la plus précise', () => {
    expect(resolveDepartment('/espace/parametres/facturation')?.section.label).toBe('Abonnement');
    expect(resolveDepartment('/espace/presence/borne')?.section.label).toBe('Borne de présence');
    expect(resolveDepartment('/espace/presence/borne/details')?.department.id).toBe('organisation');
    expect(resolveDepartment('/espace/inconnu')).toBeNull();
  });
  it('refuse le catalogue sans identité d’organisation correcte', () => {
    expect(authorizedDepartments(catalogue, null).size).toBe(0);
    expect(authorizedDepartments(catalogue, 'tenant-2').size).toBe(0);
    expect(authorizedDepartments({ ...catalogue, schema_version: '2.0' }, 'tenant-1').size).toBe(0);
  });
  it('interdit l’accès si un des signaux de permission ou disponibilité manque', () => {
    const restricted = { ...catalogue, departments: catalogue.departments.map(d => ({ ...d })) };
    restricted.departments[0].allowed = false;
    restricted.departments[1].available = false;
    restricted.departments[2].access_status = 'interdit';
    const result = authorizedDepartments(restricted, 'tenant-1');
    expect(result.has('direction')).toBe(false);
    expect(result.has('commerce')).toBe(false);
    expect(result.has('finances')).toBe(false);
    expect(result.has('radar')).toBe(true);
  });
});
