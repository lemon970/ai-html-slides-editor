import { nanoid } from "nanoid";
import { idbGet, idbPut, idbDelete } from "./idb";
import type { Patch } from "@/core/patches/patches";

export type SourceDraft = {
  id: string;
  title: string;
  sourceHtml: string;
  patches: Patch[];
  savedAt: string;
};

export type SourceDraftMeta = {
  id: string;
  title: string;
  savedAt: string;
  patchCount: number;
};

const INDEX_KEY = "srd_index";

async function getIndex(): Promise<SourceDraftMeta[]> {
  return ((await idbGet(INDEX_KEY)) as SourceDraftMeta[] | undefined) ?? [];
}

export function newDraftId(): string {
  return nanoid(8);
}

export async function saveSourceDraft(draft: SourceDraft): Promise<void> {
  const meta: SourceDraftMeta = {
    id: draft.id,
    title: draft.title,
    savedAt: draft.savedAt,
    patchCount: draft.patches.length,
  };
  const index = await getIndex();
  await idbPut(INDEX_KEY, [meta, ...index.filter((m) => m.id !== draft.id)]);
  await idbPut(`srd_${draft.id}`, draft);
}

export async function listSourceDrafts(): Promise<SourceDraftMeta[]> {
  return getIndex();
}

export async function loadSourceDraft(id: string): Promise<SourceDraft | null> {
  return ((await idbGet(`srd_${id}`)) as SourceDraft | undefined) ?? null;
}

export async function deleteSourceDraft(id: string): Promise<void> {
  const index = await getIndex();
  await idbPut(INDEX_KEY, index.filter((m) => m.id !== id));
  await idbDelete(`srd_${id}`);
}
