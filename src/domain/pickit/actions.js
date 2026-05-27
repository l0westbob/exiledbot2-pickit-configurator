export const ACTION_OPTIONS = [
  { label: "Stash Item", flag: "StashItem" },
  { label: "Stash Unidentified ( Not supported yet )", flag: "StashUnid" },
  { label: "Salvage", flag: "Salvage" },
  { label: "Ignore Ritual", flag: "IgnoreRitual" },
]

export const DEFAULT_ACTION_FLAG = ACTION_OPTIONS[0].flag

const ALLOWED_ACTION_FLAGS = new Set(ACTION_OPTIONS.map((action) => action.flag))

export function resolvePickitActionFlag(raw) {
  const actionFlag = typeof raw === "string" ? raw.trim() : ""
  if (!actionFlag) return DEFAULT_ACTION_FLAG
  return ALLOWED_ACTION_FLAGS.has(actionFlag) ? actionFlag : DEFAULT_ACTION_FLAG
}
