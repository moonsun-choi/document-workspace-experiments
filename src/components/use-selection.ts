"use client";

import { useSyncExternalStore } from "react";

/**
 * "선택 바구니": 비교·질문 화면에서 같이 쓰는 문서 선택 상태.
 * 브라우저 localStorage에만 저장되며, 저장이 막힌 환경에서도 메모리로 동작한다.
 */

const KEY = "dwx:selection";
const EMPTY: string[] = [];
let selected: string[] | null = null;
const listeners = new Set<() => void>();

function load(): string[] {
  if (selected !== null) return selected;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    selected = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    selected = [];
  }
  return selected;
}

function save(next: string[]) {
  selected = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장이 막혀 있으면 이 탭에서만 유지한다.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      selected = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSelection() {
  const current = useSyncExternalStore(subscribe, load, () => EMPTY);
  return {
    selected: current,
    has: (slug: string) => current.includes(slug),
    toggle: (slug: string) =>
      save(current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]),
    set: (slugs: string[]) => save([...new Set(slugs)]),
    clear: () => save([]),
  };
}
