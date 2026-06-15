import { deckSchema, type Deck } from "./deck";

export function validateDeck(input: unknown): Deck {
  return deckSchema.parse(input);
}

export function safeValidateDeck(input: unknown) {
  return deckSchema.safeParse(input);
}
