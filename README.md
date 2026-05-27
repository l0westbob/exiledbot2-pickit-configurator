# exiledbot2-pickit-configurator

Usable configurator: https://l0westbob.github.io/exiledbot2-pickit-configurator/

This is a frontend-only Vue app for creating ExiledBot2 pickit configuration lines through a guided UI instead of writing every rule by hand.

The app is intentionally focused on preventing the mistakes that are easiest to make manually: selecting impossible affixes for an item family, picking unavailable tiers, mixing invalid prefix/suffix counts, or writing long lists of exact pickup rules by hand.

## Current Support

Implemented rule families:

- `Item`: select an imported item family, optional base, rarity, normal prefixes/suffixes, minimum tiers, and action flag.
- `Currency`: generate exact `[Type]` pickup rules by tier, all currency/economy items, one item, or one currency group.
- `Unique`: generate exact unique pickup rules by all uniques, one unique, one class, or one class item; single selected uniques can also add mapped stat minimum filters.

Not implemented yet:

- weighted rare-item scoring with `[WeightedSum(...)]`
- gem-level builders
- waystone-tier builders
- item-tier/base pickup builders outside the current item-affix flow
- quality, socket, computed armour/evasion/energy-shield, and DPS builders
- custom grouped OR/AND rule composition

Some imported affixes and unique stats are not mapped yet, so unmapped modifiers may not appear in selectors or generated rules.

## Data Provenance

This repo is the web app only. The affix catalog does not originate here.

The generated files in `public/data/affixes/*.json` and `public/data/catalog.json` come from the external `poe-affix-builder` project: https://github.com/l0westbob/poe2-affix-builder

That upstream tool:

1. fetches and snapshots modifier data from `poe2db.tw`
2. matches those affixes against `repoe-fork/poe2` `mods.json` stat ids
3. exports per-item affix JSON files that this frontend imports

Each imported per-item payload currently contains:

- `modifier_sections.normal` for the regular affix pool
- additional modifier sections such as corrupted, essence, desecrated, bonded, or socketable when available
- `bases` for concrete item bases when the imported item family has them

The app currently exposes only normal prefixes and suffixes in the Item editor. The other imported sections are kept in the data for future rule families.

Additional runtime data:

- `public/data/economy/currency.json`: currency/economy categories and items used by the Currency family
- `public/data/tiers/tiers-early.json`: tier groupings used by Currency tier mode
- `public/data/uniques/index.json`: index of unique class files
- `public/data/uniques/*.json`: unique items, bases, and mapped stat roll data used by the Unique family

## Generated Vs App-Owned Files

Imported/generated artifacts:

- `public/data/affixes/*.json`
- `public/data/catalog.json`
- `public/data/economy/currency.json`
- `public/data/tiers/tiers-early.json`
- `public/data/uniques/*.json`

App-owned metadata and logic:

- `config/catalog-augmentation.json`
- `scripts/import-catalog.mjs`
- `src/domain/pickit/*`
- `src/services/*`
- `src/composables/*`
- `src/components/configurator/*`

## Architecture Overview

The app is organized around four layers:

- Data import/check: `scripts/import-catalog.mjs` imports affix exports and validates all runtime data contracts.
- Data runtime: `src/services/*` loads checked-in JSON data through shared fetch/cache helpers.
- Pickit domain: `src/domain/pickit/*` contains pure rule logic, action flags, rule-family metadata, and shared pickit formatting.
- Vue UI: `src/components/configurator/*` and `src/composables/*` hold editor state and render the rule-family forms.

Good starting points:

- UI behavior: `src/components/configurator/ItemRuleRow.vue` and the matching family editor component
- Row state: `src/composables/useItemRuleRow.js`, `src/composables/useCurrencyRuleRow.js`, or `src/composables/useUniqueRuleRow.js`
- Rule output: `src/domain/pickit/rules.js`, `src/domain/pickit/currency.js`, or `src/domain/pickit/uniques.js`
- Shared rule syntax: `src/domain/pickit/formatter.js`
- Runtime loading: `src/services/dataRuntime.js`
- Data import/parity: `scripts/import-catalog.mjs`

## Data Workflow

Import a folder of exported affix files into this frontend repo:

```bash
npm run import-catalog -- --source /path/to/exported/affixes
```

Validate that the app-facing catalog and all runtime data contracts still match the checked-in data:

```bash
npm run check-catalog
```

Run the full local verification gate:

```bash
npm run check
```

`npm run check` runs lint, formatting validation, tests, production build, and data contract validation.

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Run tests:

```bash
npm run test
```

Run lint and formatting checks:

```bash
npm run lint
npm run format:check
```

Format the app code and docs:

```bash
npm run format
```

Build for production:

```bash
npm run build
```

## ExiledBot2 Rule Notes

A pickit line generally has a pre-identification section, an optional `#`, and a post-identification/action section:

```text
[Category] == "Ring" && [Rarity] == "Rare" # [StashItem] == "true"
```

Examples:

```text
[Type] == "Exalted Orb" # [StashItem] == "true"
[Type] == "Heavy Belt" && [Rarity] == "Unique" # [UniqueName] == "Headhunter" && [StashItem] == "true"
[Category] == "Ring" && [Type] == "Golden Hoop" && [Rarity] == "Magic" # base_maximum_life >= "20" && base_maximum_life <= "29" && [StashItem] == "true"
```

Supported action flags in the current UI:

- `StashItem`
- `StashUnid`
- `Salvage`
- `IgnoreRitual`

## Direction

The next architecture priority is not another large feature. The healthier path is to keep hardening the existing Item, Currency, and Unique flows, then add future families only when they have a real data contract, pure domain logic, UI, and tests.
