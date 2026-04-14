import { useEffect, useRef } from "react";

import useAuthUser from "@/state/use-Auth";

const CONTAINER_CLASS = "absolute inset-0 pointer-events-none select-none";
const WATERMARK_CLASS = "absolute z-10 font-semibold text-white/20 md:text-2xl";
const WATERMARK1_POSITION =
  "left-1/3 top-1/3 -translate-x-1/2 -translate-y-1/2";
const WATERMARK2_POSITION =
  "bottom-1/3 right-1/3 translate-x-1/2 translate-y-1/2";

export const CameraFeedWatermark = () => {
  const authUser = useAuthUser();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authUser) return;
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const restore = () => {
      const container = containerRef.current;
      if (container) {
        if (!parent.contains(container)) {
          parent.appendChild(container);
        }

        // Restore container class
        if (container.className !== CONTAINER_CLASS) {
          container.className = CONTAINER_CLASS;
        }

        const spans = container.getElementsByTagName("span");
        // If spans are missing or wrong number, recreate them
        if (spans.length !== 2) {
          container.innerHTML = `
            <span class="${WATERMARK_CLASS} ${WATERMARK1_POSITION}">${authUser.username}</span>
            <span class="${WATERMARK_CLASS} ${WATERMARK2_POSITION}">${authUser.username}</span>
          `;
        } else {
          // Restore span classes and content
          const [span1, span2] = spans;
          if (
            !span1.className.includes(WATERMARK_CLASS) ||
            !span1.className.includes(WATERMARK1_POSITION)
          ) {
            span1.className = `${WATERMARK_CLASS} ${WATERMARK1_POSITION}`;
          }
          if (
            !span2.className.includes(WATERMARK_CLASS) ||
            !span2.className.includes(WATERMARK2_POSITION)
          ) {
            span2.className = `${WATERMARK_CLASS} ${WATERMARK2_POSITION}`;
          }
          if (span1.textContent !== authUser.username) {
            span1.textContent = authUser.username;
          }
          if (span2.textContent !== authUser.username) {
            span2.textContent = authUser.username;
          }
        }
      }
      requestAnimationFrame(restore);
    };

    const frameId = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frameId);
  }, [authUser]);

  if (!authUser) return null;

  return (
    <div ref={containerRef} className={CONTAINER_CLASS}>
      <span className={`${WATERMARK_CLASS} ${WATERMARK1_POSITION}`}>
        {authUser.username}
      </span>
      <span className={`${WATERMARK_CLASS} ${WATERMARK2_POSITION}`}>
        {authUser.username}
      </span>
    </div>
  );
};

export default CameraFeedWatermark;
