import { CardTemplate } from "./types";

// Card designs per occasion, seeded into (and kept in sync with) the store.
// Stand-ins for real card artwork assets.
export const DEFAULT_TEMPLATES: CardTemplate[] = [
  { id: "tpl-wedding-gold", name: "Gold foil", nameAr: "ذهبي", occasionType: "wedding", previewColor: "#8a6a3f" },
  { id: "tpl-wedding-floral", name: "Floral", nameAr: "ورود", occasionType: "wedding", previewColor: "#a1665f" },
  { id: "tpl-engagement-blush", name: "Blush", nameAr: "وردي ناعم", occasionType: "engagement", previewColor: "#b07a86" },
  { id: "tpl-engagement-pearl", name: "Pearl", nameAr: "لؤلؤي", occasionType: "engagement", previewColor: "#8c8173" },
  { id: "tpl-grad-navy", name: "Navy", nameAr: "كحلي", occasionType: "graduation", previewColor: "#1f3a5f" },
  { id: "tpl-grad-burgundy", name: "Burgundy", nameAr: "عنابي", occasionType: "graduation", previewColor: "#6e2a3a" },
  { id: "tpl-eid-emerald", name: "Emerald", nameAr: "زمردي", occasionType: "eid", previewColor: "#1d5c4d" },
  { id: "tpl-eid-gold", name: "Golden crescent", nameAr: "هلال ذهبي", occasionType: "eid", previewColor: "#9a7633" },
  { id: "tpl-ramadan-night", name: "Ramadan night", nameAr: "ليالي رمضان", occasionType: "ramadan", previewColor: "#26305a" },
  { id: "tpl-ramadan-lantern", name: "Lantern", nameAr: "فانوس", occasionType: "ramadan", previewColor: "#7a4a24" },
  { id: "tpl-newborn-sky", name: "Sky blue", nameAr: "سماوي", occasionType: "newborn", previewColor: "#6a8fb3" },
  { id: "tpl-newborn-rose", name: "Soft rose", nameAr: "وردي", occasionType: "newborn", previewColor: "#c08597" },
  { id: "tpl-birthday-pastel", name: "Pastel", nameAr: "باستيل", occasionType: "birthday", previewColor: "#c77b9a" },
  { id: "tpl-corp-minimal", name: "Minimal", nameAr: "بسيط", occasionType: "corporate", previewColor: "#33403a" },
  { id: "tpl-corp-slate", name: "Slate", nameAr: "رمادي", occasionType: "corporate", previewColor: "#3b4a5c" },
  { id: "tpl-condolence-charcoal", name: "Charcoal", nameAr: "فحمي", occasionType: "condolence", previewColor: "#3d4245" },
  { id: "tpl-condolence-sand", name: "Sand", nameAr: "رملي", occasionType: "condolence", previewColor: "#7d7468" },
  { id: "tpl-other-pine", name: "Classic", nameAr: "كلاسيكي", occasionType: "other", previewColor: "#1f5a45" },
];
