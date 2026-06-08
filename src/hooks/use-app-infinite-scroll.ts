import { useEffect, useRef } from "react";

const SCROLL_ROOT_ID = "app-main-scroll";

export function getAppScrollRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(SCROLL_ROOT_ID);
}

type UseAppInfiniteScrollOptions = {
  hasMore: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
  enabled?: boolean;
};

export function useAppInfiniteScroll({
  hasMore,
  isFetching,
  onLoadMore,
  enabled = true,
}: UseAppInfiniteScrollOptions) {
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    if (!isFetching) {
      loadingMoreRef.current = false;
    }
  }, [isFetching]);

  useEffect(() => {
    if (!enabled) return;

    const target = observerTarget.current;
    const scrollRoot = getAppScrollRoot();
    if (!target || !hasMore) return;

    const loadNextPage = () => {
      if (loadingMoreRef.current || isFetching || !hasMore) return;
      loadingMoreRef.current = true;
      onLoadMore();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage();
        }
      },
      { root: scrollRoot, threshold: 0, rootMargin: "200px" }
    );

    observer.observe(target);

    const onScroll = () => {
      const root = scrollRoot;
      if (!root) return;
      const targetRect = target.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      if (targetRect.top <= rootRect.bottom + 200) {
        loadNextPage();
      }
    };

    scrollRoot?.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      scrollRoot?.removeEventListener("scroll", onScroll);
    };
  }, [enabled, hasMore, isFetching, onLoadMore]);

  return { observerTarget, loadingMoreRef };
}
