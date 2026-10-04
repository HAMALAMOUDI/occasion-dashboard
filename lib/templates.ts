import { CardTemplate } from "./types";

// Seeded into a fresh store. Stand-ins for real card artwork assets.
export const DEFAULT_TEMPLATES: CardTemplate[] = [
  { id: "tpl-wedding-gold", name: "Gold foil wedding", occasionType: "wedding", previewColor: "#8a6a3f" },
  { id: "tpl-wedding-floral", name: "Floral wedding", occasionType: "wedding", previewColor: "#a1665f" },
  { id: "tpl-grad-navy", name: "Navy graduation", occasionType: "graduation", previewColor: "#1f3a5f" },
  { id: "tpl-corp-minimal", name: "Minimal corporate", occasionType: "corporate", previewColor: "#33403a" },
  { id: "tpl-birthday-pastel", name: "Pastel birthday", occasionType: "birthday", previewColor: "#c77b9a" },
];
