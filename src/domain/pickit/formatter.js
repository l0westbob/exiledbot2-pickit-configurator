export function escapePickitString(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}

export function formatPickitValue(value) {
  return `"${escapePickitString(value)}"`
}

export function formatPickitNumber(value) {
  if (!Number.isFinite(value)) return ""
  return Number.isInteger(value) ? String(value) : String(value)
}

export function formatPickitField(fieldName, options = {}) {
  const normalizedFieldName = String(fieldName || "").trim()
  return options.bracketField === false ? normalizedFieldName : `[${normalizedFieldName}]`
}

export function formatPickitCondition(fieldName, operator, value, options = {}) {
  return `${formatPickitField(fieldName, options)} ${operator} ${formatPickitValue(value)}`
}

export function formatPickitFlagCondition(actionFlag) {
  return formatPickitCondition(actionFlag, "==", "true")
}

export function formatPickitRule(beforeIdentifyConditions, afterIdentifyConditions) {
  const beforeIdentify = (Array.isArray(beforeIdentifyConditions) ? beforeIdentifyConditions : [])
    .filter(Boolean)
    .join(" && ")
  const afterIdentify = (Array.isArray(afterIdentifyConditions) ? afterIdentifyConditions : [])
    .filter(Boolean)
    .join(" && ")

  if (!beforeIdentify) return afterIdentify
  if (!afterIdentify) return beforeIdentify
  return `${beforeIdentify} # ${afterIdentify}`
}

export function formatPickitComment(text) {
  return `// ${text}`
}
