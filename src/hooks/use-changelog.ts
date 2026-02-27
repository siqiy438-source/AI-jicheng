import { useMemo, useCallback } from "react";
import { changelog } from "@/data/changelog";

const STORAGE_KEY = "changelog_last_read_id";

function getLastReadId(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function useChangelog() {
  const lastReadId = getLastReadId();

  const unreadCount = useMemo(
    () => changelog.filter((e) => e.id > lastReadId).length,
    [lastReadId]
  );

  const markAllRead = useCallback(() => {
    if (changelog.length > 0) {
      localStorage.setItem(STORAGE_KEY, String(changelog[0].id));
    }
  }, []);

  return { entries: changelog, unreadCount, lastReadId, markAllRead };
}
