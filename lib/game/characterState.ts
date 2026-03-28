/**
 * Character State Management
 * Handles creation, customization, and persistence of child character avatar.
 */

export type CharacterGender = "boy" | "girl";

export type AppearanceCategory = "hat" | "shirt" | "pants" | "shoes";

export interface AppearanceOption {
  id: string;
  label: string;
  emoji: string;
}

export interface CharacterState {
  name: string;
  gender: CharacterGender;
  appearance: Record<AppearanceCategory, string>; // stores option ID
}

// Predefined appearance options per category
export const APPEARANCE_OPTIONS: Record<AppearanceCategory, AppearanceOption[]> = {
  hat: [
    { id: "wizard-hat", label: "Wizard Hat", emoji: "🧙" },
    { id: "crown", label: "Golden Crown", emoji: "👑" },
    { id: "cowboy", label: "Cowboy Hat", emoji: "🤠" },
    { id: "beanie", label: "Cozy Beanie", emoji: "🧢" },
    { id: "tophat", label: "Top Hat", emoji: "🎩" }
  ],
  shirt: [
    { id: "star-shirt", label: "Star Shirt", emoji: "⭐" },
    { id: "heart-shirt", label: "Heart Shirt", emoji: "❤️" },
    { id: "sparkle-shirt", label: "Sparkle Shirt", emoji: "✨" },
    { id: "rainbow-shirt", label: "Rainbow Shirt", emoji: "🌈" },
    { id: "dragon-shirt", label: "Dragon Shirt", emoji: "🐉" }
  ],
  pants: [
    { id: "blue-pants", label: "Blue Jeans", emoji: "👖" },
    { id: "purple-pants", label: "Purple Pants", emoji: "💜" },
    { id: "rainbow-pants", label: "Rainbow Leggings", emoji: "🌈" },
    { id: "sparkle-pants", label: "Sparkle Pants", emoji: "✨" },
    { id: "striped-pants", label: "Striped Pants", emoji: "🔴" }
  ],
  shoes: [
    { id: "sneakers", label: "Cool Sneakers", emoji: "👟" },
    { id: "boots", label: "Adventure Boots", emoji: "🥾" },
    { id: "fancy-shoes", label: "Fancy Shoes", emoji: "👠" },
    { id: "magic-slippers", label: "Magic Slippers", emoji: "✨" },
    { id: "rocket-boots", label: "Rocket Boots", emoji: "🚀" }
  ]
};

// Default appearance
const getDefaultAppearance = (): Record<AppearanceCategory, string> => ({
  hat: APPEARANCE_OPTIONS.hat[0].id,
  shirt: APPEARANCE_OPTIONS.shirt[0].id,
  pants: APPEARANCE_OPTIONS.pants[0].id,
  shoes: APPEARANCE_OPTIONS.shoes[0].id
});

export const createCharacter = (name: string, gender: CharacterGender): CharacterState => ({
  name: name.trim() || "Hero",
  gender,
  appearance: getDefaultAppearance()
});

export const updateCharacterAppearance = (
  character: CharacterState,
  category: AppearanceCategory,
  optionId: string
): CharacterState => ({
  ...character,
  appearance: {
    ...character.appearance,
    [category]: optionId
  }
});

// Persistence helpers
const CHARACTER_STORAGE_KEY = "marmalade-character";

export const saveCharacter = (character: CharacterState) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(character));
  } catch (e) {
    console.error("Failed to save character:", e);
  }
};

export const loadCharacter = (): CharacterState | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CHARACTER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Failed to load character:", e);
    return null;
  }
};

export const clearCharacter = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CHARACTER_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear character:", e);
  }
};

// Helper to get emoji for an appearance choice
export const getAppearanceEmoji = (category: AppearanceCategory, optionId: string): string => {
  const option = APPEARANCE_OPTIONS[category].find((opt) => opt.id === optionId);
  return option?.emoji || "🎭";
};

// Helper to get label for an appearance choice
export const getAppearanceLabel = (category: AppearanceCategory, optionId: string): string => {
  const option = APPEARANCE_OPTIONS[category].find((opt) => opt.id === optionId);
  return option?.label || "Unknown";
};
