# Economy Tiers

These tier artifacts are derived from PoE2Scout market-history data for the Path of Exile 2 `Fate of the Vaal` non-hardcore league.

The tiering data is not produced by `poe-affix-build`. It is generated separately through the research scripts in `scout/`, using the committed/user-tuned rules in `scout/build_tiers.py`.

Current rule summary:

- Values are normalized to Exalted Orbs.
- Unpriced items for a snapshot are placed in `S`.
- The dynamic tier max excludes the top 3 most expensive `week-4` outliers.
- The dynamic tier max is capped by the configured Divine Orb cap in `scout/build_tiers.py`.
- Tier thresholds are the configured percentages in `scout/build_tiers.py`.
- Items are grouped by PoE2Scout economy category inside each tier.

PoE2Scout is used here because it provides more complete economy coverage and usable historical market data than the current PoE2DB economy pages.
