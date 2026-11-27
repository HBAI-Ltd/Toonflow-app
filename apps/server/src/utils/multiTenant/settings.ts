const userFields = ["ui", "general", "privacy", "stores", "helloCompleted", "mediaCostReminders"];
const hostFields = [...userFields, "agentSystemPrompt", "agentNodeTools"];

export function userSettings(settings: Record<string, unknown>, host = false) {
  return Object.fromEntries((host ? hostFields : userFields).filter(key => Object.hasOwn(settings, key)).map(key => [key, settings[key]]));
}
