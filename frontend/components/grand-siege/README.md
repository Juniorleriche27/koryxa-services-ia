# CAURI — Grand Siège : design system (chantier 2)

Identité de **CAURI**, la plateforme, indépendante de l'identité de chaque entreprise cliente (dont KORYXA).

## Direction visuelle validée

- **70 % institution** : architecture claire, ample, ordonnée, monumentale sans surcharge, espaces calmes, titres éditoriaux.
- **30 % commandement** : surfaces de pilotage profondes, signaux d'activité discrets, alertes lisibles, indicateurs utiles.
- Palette : pierre minérale `#f2f5f1`, encre `#142a2b`, jade `#146f61`, bronze `#a96b2a`. La couleur n'est jamais l'unique signal d'état.
- Surfaces : verre mat sobre et fonds architecturaux, sans gradients bleu/violet génériques.
- Réactivité : une colonne sous 640 px, deux colonnes dès 640 px, trois colonnes à partir de 1100 px si demandé.
- Accessibilité : composants sémantiques, liens et boutons réellement actionnables, focus visible, états nommés, animations neutralisées si `prefers-reduced-motion`.
- Thèmes `light` et `dark` isolés dans le composant racine, sans modifier les styles globaux du produit.

## Bibliothèque

Importer depuis `@/components/grand-siege` :

- `GrandSiegeThemeProvider` : périmètre visuel et thème.
- `GrandSiegeStage` : enveloppe architecturale.
- `ArchitecturalSurface` : panneau calme ou panneau de commandement.
- `InstitutionalHeading` : hiérarchie et identité CAURI.
- `DepartmentGrid` et `DepartmentTile` : représentation responsive des six départements.
- `DepartmentStatus` : statut textuel et indicateur coloré.
- `CAURI_DEPARTMENTS` : libellés de présentation frontend ; **pas** une définition de permissions ni un modèle backend.

## Exemple d'intégration future (chantier 3)

```tsx
<GrandSiegeThemeProvider theme="light">
  <GrandSiegeStage>
    <InstitutionalHeading title="Votre siège" description="Pilotez votre organisation." />
    <DepartmentGrid>
      <DepartmentTile department="finances" href="/espace/finance" />
      <DepartmentTile department="commerce" href="/espace/ventes" />
    </DepartmentGrid>
  </GrandSiegeStage>
</GrandSiegeThemeProvider>
```

L'exemple est documentaire : aucun Grand Hall ni lien réel n'est monté pendant le chantier 2. Les liens vers les autres départements et leurs droits devront être validés avec les routes et permissions existantes.

## Hors périmètre de ce chantier

Pas de modification de `AppShell`, pas de retrait de sidebar, pas de changement d'API, pas de nouvelle route, pas de branchement de données, pas de migration backend. Le Grand Hall utilisable est le chantier 3.
