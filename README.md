# exiledbot2-pickit-configurator

Usable configurator here: https://l0westbob.github.io/exiledbot2-pickit-configurator/

This is a small tool for creating valid pickit configuration
rules via a configurable graphical user interface instead of
writing each line manually.

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

Currently, the plan is to cover all categories first.

```
"BodyArmour", "Gloves", "Boots", "Belt", "Helmet", "Ring", "Amulet", "Claw", "Dagger", "Wand", "OneHandSword", "OneHandAxe", "OneHandMace", "Sceptre", "Spear", "Flail", "Bow", "Staff", "TwoHandSword", "TwoHandAxe", "TwoHandMace", "Quarterstaff", "Crossbow", "Trap", "FishingRod", "Quiver", "Shield", "Focus", "Flask", "Waystone", "Gem", "Tablet"
```

The way I've planned to do this is by fetching each
category from https://poe2db.tw ->Modifiers to get all possible
affixes (I just focussed on prefix and suffix
because desecrated, essence, corrupted affixes
usually don't drop. I will add them all when I see
the need or get it as feature request).

Then I am using the mods.json from https://github.com/repoe-fork/poe2
to map the correct mod identifier to each affix for
each category and generate data json files that are
used by the vue app to fill out forms and generate
config lines.

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

- `identifiers for Time-Lost* jewels are missing in mods.json`
- `identifiers for waystones are not mapped yet fully`
- `identifiers for some tablets are also missing`

- `the app does not generate any correct config-line yet because it is still work in progress`