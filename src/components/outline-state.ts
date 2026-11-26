import { shallowReactive } from "vue";

interface OutlineState {
  openTabId: number | null;
  activeLine: number | null;
  filter: string;
}

export const outlineState = shallowReactive<OutlineState>({
  openTabId: null,
  activeLine: null,
  filter: "",
});

export function toggleOutline(tabId: number) {
  if (outlineState.openTabId === tabId) {
    closeOutline(tabId);
    return;
  }

  outlineState.openTabId = tabId;
  outlineState.activeLine = null;
  outlineState.filter = "";
}

export function closeOutline(tabId: number) {
  if (outlineState.openTabId !== tabId) return;

  outlineState.openTabId = null;
  outlineState.activeLine = null;
  outlineState.filter = "";
}
