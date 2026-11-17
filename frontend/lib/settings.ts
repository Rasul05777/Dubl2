import data from "../data/settings.json";
import { settingsSchema } from "./models";
const settings = settingsSchema.parse(data);
export function getSettings() {
  return settings;
}
