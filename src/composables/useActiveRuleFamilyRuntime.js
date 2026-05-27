import { computed, watch } from "vue"
import { getRuleFamilyDefinition, RULE_FAMILY } from "../domain/pickit/ruleFamilies.js"

export function useActiveRuleFamilyRuntime(selectedRuleFamilyRef, runtimeByFamilyId) {
  const activeRuleFamily = computed(() => getRuleFamilyDefinition(selectedRuleFamilyRef.value))

  const activeFamilyRuntime = computed(() => {
    return runtimeByFamilyId[activeRuleFamily.value.id] || runtimeByFamilyId[RULE_FAMILY.ITEM]
  })

  const activeGeneratedLines = computed(() => {
    return activeFamilyRuntime.value.generatedLines.value
  })

  watch(selectedRuleFamilyRef, (ruleFamilyId) => {
    runtimeByFamilyId[ruleFamilyId]?.ensureLoaded?.()
  })

  return {
    activeRuleFamily,
    activeFamilyRuntime,
    activeGeneratedLines,
  }
}
