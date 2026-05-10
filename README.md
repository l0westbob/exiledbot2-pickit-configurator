# exiledbot2-pickit-configurator

Usable configurator here: https://l0westbob.github.io/exiledbot2-pickit-configurator/

This is a small tool for creating valid pickit configuration
rules via a configurable graphical user interface instead of
writing each line manually.

## Current focus

This repository is the frontend application only.

Right now the implemented flow is the item-rule configurator:

- select a supported item type from the imported affix catalog
- optionally narrow to a known base when that item family has bases
- choose the action flag
- choose modifiers and minimum tiers
- generate preview lines and final pickit output

Planned rule families such as currency, gems, and custom rules are intentionally hidden in the UI until they have real generators and test coverage.

## Data provenance

The affix catalog does not originate in this repository.

The generated files in `public/data/affixes/*.json` and `public/data/catalog.json` come from the external `poe-affix-builder` project (https://github.com/l0westbob/poe2-affix-builder). 

That upstream tool:

1. fetches and snapshots modifier data from `poe2db.tw`
2. matches those affixes against `repoe-fork/poe2` `mods.json` stat ids
3. exports per-item affix JSON files that this frontend imports

Each imported per-item JSON payload now contains:

- `modifier_sections.normal` for the regular affix pool
- additional modifier sections such as corrupted, essence, desecrated, bonded, or socketable when available
- `bases` for the concrete item bases in that family when available

### Refreshing imported catalog data

Import a folder of exported affix files into this frontend repo:

```bash
npm run import-catalog -- --source /path/to/exported/affixes
```

Validate that the generated app-facing catalog still matches the checked-in affix payloads:

```bash
npm run check-catalog
```

Run the frontend test suite after import:

```bash
npm run test
```

### What is generated vs app-owned

Imported generated data:

- `public/data/affixes/*.json`
- `public/data/catalog.json`

App-owned metadata and logic:

- `config/catalog-augmentation.json`
- `src/domain/pickit/*`
- `src/components/configurator/*`

The current introduction of how to use the pickit config
file looks like this:

```
//
// Exiled Bot 2 Pickit - Configuration Guide for Path of Exile 2
//
// This file defines which items your bot should pick up, identify, keep, or salvage.
//
// Important File:
// - ModsList.html in the main bot folder contains all available mods
//   (Use expressions from the right column, like local_minimum_added_physical_damage)
//
// Special Computed Values:
// ----------------------
// [TotalResistances] - Sums all resistance values on an item
//   Example: [Category] == "Helmet" # [TotalResistances] > "50" && [StashItem] == "true"  // Keeps helmets with >50 total resistance
//
// Defensive Calculations:
// ---------------------
// [ComputedArmour] - Final armour value after all modifiers
// [ComputedEvasion] - Final evasion value after all modifiers
// [ComputedEnergyShield] - Final ES value after all modifiers
//
// Damage Calculations:
// ------------------
// [DPS] - Total weapon DPS (physical + elemental)
// [ElementalDPS] - Only elemental portion of weapon DPS
// [PhysicalDPS] - Only physical portion of weapon DPS
//
// Spell Damage Totals:
// ------------------
// [TotalSpellElementalDamage] - Combined spell + elemental damage (%)
// [TotalFireSpellDamage] - Fire spell damage including general spell damage (%)
// [TotalColdSpellDamage] - Cold spell damage including general spell damage (%)
// [TotalLightningSpellDamage] - Lightning spell damage including general spell damage (%)
//
// Gems:
// -------------
// [GemLevel] - Current level of the gem
//
// Example:
// [Type] == "Uncut Support Gem" && [GemLevel] == "3" # [StashItem] == "true"
// This means: Pick up level 3 support gems
// This means: Pick up spirit gem with level higher than 17
//
// UniqueName:
// -----------
// Matches specific unique items by their exact name
// Example: [Type] == "Heavy Belt" && [Rarity] == "Unique" # [UniqueName] == "Headhunter" && [StashItem] == "true"
// This means: Pick up and stash items named "Headhunter"
//
// ItemTier:
// --------
// Represents the tier of the item base type (higher is better)
// Example: [Category] == "Ring" && [ItemTier] >= "2" # [StashItem] == "true"
// This means: Pick up and stash rings of tier 2 or higher
//
// Quality:
// -------
// The quality percentage of an item (0-20 for most items)
// Example: [Quality] >= "15" # [StashItem] == "true"
// This means: Pick up and stash items with 15% or more quality
//
// WaystoneTier:
// -------
// The tier of a waystone (1-16 at the moment)
// Example: [Category] == "Waystone" && [WaystoneTier] >= "10" # [StashItem] == "true"
// This means: Pick up and stash waystones tier 10 or more
//
// Basic Syntax:
// -----------
// Each line follows this pattern: [What to Check] Operator "Value"
//
// Available Operators:
// == (equals)              Example: [Rarity] == "Unique"
// != (not equals)          Example: [Category] != "Flask"
// >  (greater than)        Example: [ItemLevel] > "75"
// >= (greater or equal)    Example: [Quality] >= "20"
// <  (less than)          Example: [Quality] < "6"
// <= (less or equal)       Example: [Quality] <= "10"
//
// You can combine checks using:
// && (AND)  - Both conditions must be true
// || (OR)   - At least one condition must be true
// ()        - Group conditions together
//
// Available Categories:
// ------------------
// Equipment: "BodyArmour", "Gloves", "Boots", "Belt", "Helmet", "Ring", "Amulet"
// Weapons: "Weapon", "1Handed", "2Handed", "OffHand"
// Others: "Flask", "Waystone", "Gem", "Tablet"
//
// Weapon Categories:
// ---------------
// One-handed: "Claw", "Dagger", "Wand", "OneHandSword", "OneHandAxe", "OneHandMace", 
//            "Sceptre", "Spear", "Flail"
// Two-handed: "Bow", "Staff", "TwoHandSword", "TwoHandAxe", "TwoHandMace", 
//            "Quarterstaff", "Crossbow", "Trap", "FishingRod"
// Off-hand:   "Quiver", "Shield", "Focus"
//
// Example:
// [WeaponCategory] == "OneHandSword" # [PhysicalDPS] > "300" && [StashItem] == "true"
// This means: Pick up one-handed swords, but only keep ones with >300 physical DPS
//
// Rarity Values:
// ------------
// [Rarity] can only use == or != with these values:
// "Normal", "Magic", "Rare", "Unique"
//
// Special Flags:
// ------------
// [StashItem] == "true"   - Put item in stash
// [StashUnid] == "true"   - Stash without identifying
// [Salvage] == "true"     - Mark for salvaging
// [IgnoreRitual] == "true" - Ignore item from ritual rewards (example: [Type] == "Exalted Orb" # [StashItem] == "true" && [IgnoreRitual] == "true")
//
// Using # to Split Checks:
// ----------------------
// Rules can have two parts, split by #
// Before #: Checked BEFORE identifying the item
// After #: Checked AFTER identifying the item
//
// Example:
// [Rarity] == "Rare" # [TotalResistances] > "50" && [StashItem] == "true"
// This means: Pick up rare items, but only keep ones with >50% total resistance
//
// IMPORTANT - Understanding Local vs Global Modifiers:
// -----------------------------------------------
// local_* mods (like local_attack_speed_+%) ONLY affect the item itself
// regular mods (like attack_speed_+%) affect your entire character
//
// Example:
// local_attack_speed_+% on a weapon: Only speeds up that weapon
// attack_speed_+% on a ring: Speeds up ALL your attacks
//
//
//
// Weighted Sums 
// ----------------------
// A weighted sum is just like a regular sum (5+3+6=14), but each number is multiplied by its weight before being added together example : (sum1weight = 2, sum2weight = 3, sum3weight = 4) then (5x2)+(3x3)+(6x4) = (10)+(9)+(24)=43.
// This is a new way for the pickit system to better read rare mods on an item. It allows us to simplying millions of lines of code in a few simple lines.
// When looking at an items sum values, you want to figure out the weights based off of each base and the current meta/value of things.
// This can be somewhat simple at times, though mostly requires alot of experience and knowledge of the game. An example would be as follows; if you decide that mana = 1 sum point, then you could assume that 1 intelligence holds a value of 2 sum points, because 1 point of intelligence gives you 2 mana.
// To figure out relative sum values for targeting preffix/suffix tiers can be easy; you just have to look at the top rolls of each and compare to one and other. example: max life roll being 100 and max mana roll being 200, we can assume life = 2 and mana = 1. those are the relative sum numbers.
// Once you have your sum values figured out, the rest becomes about figuring out the total sum that you want, the high end or low end of given set of stats on an item. the higher the number, the more strict the pickit becomes.
// if this is all too complicated for you, do not touch any of the sum numbers, but feel free to tinker with the total sum numers and adjust to your needs. example : [WeightedSum(...)] >= "thisNumberHere" && [StashItem] == "true".
```

I will try to keep it updated from version to version,
but this tool should make big parts of this irrelevant
for most users.

---

## What does this tool cover right now?

Currently, the app exposes the imported item-rule flow only.

```
"BodyArmour", "Gloves", "Boots", "Belt", "Helmet", "Ring", "Amulet", "Claw", "Dagger", "Wand", "OneHandSword", "OneHandAxe", "OneHandMace", "Sceptre", "Spear", "Flail", "Bow", "Staff", "TwoHandSword", "TwoHandAxe", "TwoHandMace", "Quarterstaff", "Crossbow", "Trap", "FishingRod", "Quiver", "Shield", "Focus", "Flask", "Waystone", "Gem", "Tablet"
```

The current rule editor is centered around imported
item modifiers and tier thresholds. With the newer
catalog format, it can now surface normal modifiers
plus the extra imported modifier sections when they
exist, and it can narrow a rule to a concrete base
when the payload provides base data.

---

## What's the plan?

I want to be able to tell this app, what item
category i want to configure, then the app
prefilters only available affixes for that category,
so i dont select non-existing affixes, and then i
select the minimum affix tier i am searching for.
In case i select multiple affixes the app
automatically detects rarity (magic <= 2 affixes,
rare >= 3 affixes) and creates rules for all
combinations of these affixes, so there is at least
one specific rule for each affix combination for
very precise filtering/selecting.

## Current issues

- no complex rules possible (no OR) (no grouped stats checking)
- data quality could still be improved
- still only the item-rule flow is implemented in the UI
- no custom rules yet
- no uniques yet
- no rule edit possible
- no copy button yet
