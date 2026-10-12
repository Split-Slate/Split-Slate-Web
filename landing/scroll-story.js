(() => {
  "use strict";

  const story = window.SplitSlateStory;
  const section = document.querySelector("#expense-story");
  if (!section || !story?.createScrollStory || !story?.createTimeline) return;

  const fallback = section.querySelector("[data-story-fallback]");
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactQuery = window.matchMedia("(max-width: 56rem)");
  let scene;
  let timeline;
  let resizeObserver;
  let active = false;
  let broken = false;
  let visible = true;
  let compact = compactQuery.matches;
  let frame = 0;
  let measureNeeded = true;
  let start = 0;
  let distance = 1;
  let shownProgress = null;
  let previousTime = 0;

  const motionOff = () => reducedMotion.matches || root.dataset.motion === "off";

  const readLayout = () => {
    compact = compactQuery.matches;
    const viewportHeight = window.innerHeight;
    const headerHeight = Math.ceil(header.getBoundingClientRect().height);
    const stickyHeight = Math.max(1, viewportHeight - headerHeight);
    const tooShort = stickyHeight < (compact ? 510 : 440);
    if (tooShort) return false;

    // Fixed-pixel metrics are refreshed on resize, not continuously recomputed while scrubbing.
    const travel = viewportHeight * (compact ? 2.45 : 3.65);
    section.style.setProperty("--ss-header-height", `${headerHeight}px`);
    section.style.setProperty("--ss-sticky-height", `${stickyHeight}px`);
    section.style.setProperty("--ss-story-height", `${stickyHeight + travel}px`);

    const visual = scene.querySelector(".ss-visual");
    const stage = scene.querySelector(".ss-stage");
    const width = visual.clientWidth;
    const height = visual.clientHeight;
    const scale = compact
      ? Math.min(width / 590, height / 645, 0.93)
      : Math.min(width / 930, height / 680, 1.15);
    stage.style.transform = `translate3d(${(width - 1000 * scale) / 2 - (compact ? 76 : 12) * scale}px,
      ${(height - 680 * scale) / 2}px, 0) scale(${scale})`;
    timeline.measure(scale);
    start = section.getBoundingClientRect().top + window.scrollY - headerHeight;
    distance = travel;
    measureNeeded = false;
    return true;
  };

  const restoreFallback = () => {
    active = false;
    window.cancelAnimationFrame(frame);
    frame = 0;
    section.classList.remove("ss-enhanced");
    if (scene) scene.hidden = true;
    fallback.hidden = false;
    shownProgress = null;
  };

  const handleFailure = (error) => {
    broken = true;
    restoreFallback();
    // The static story, app link, and the remainder of the landing page remain usable.
    console.warn("Split Slate scroll story: using the static presentation.", error);
  };

  const paint = (now) => {
    frame = 0;
    if (!active || document.hidden || (!visible && !measureNeeded)) return;
    try {
      if (measureNeeded && !readLayout()) {
        restoreFallback();
        return;
      }
      const target = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
      // Only a short, time-based scrub lag. No free-running sequence or intersection playback.
      // Fast wheel, keyboard, touch, reverse, and restored scroll all use the same scroll position.
      const elapsed = Math.min(Math.max(now - previousTime, 1), 64);
      const blend = 1 - Math.exp(-elapsed / 65);
      shownProgress =
        shownProgress === null ? target : shownProgress + (target - shownProgress) * blend;
      if (Math.abs(target - shownProgress) < 0.00008) shownProgress = target;
      previousTime = now;
      timeline.render(shownProgress, compact);
      if (shownProgress !== target) schedulePaint();
    } catch (error) {
      handleFailure(error);
    }
  };

  const schedulePaint = () => {
    if (!frame && active && !document.hidden) frame = window.requestAnimationFrame(paint);
  };

  const applyPresentation = () => {
    if (broken || motionOff()) {
      restoreFallback();
      return;
    }
    try {
      if (!scene) {
        scene = story.createScrollStory();
        section.append(scene);
        timeline = story.createTimeline(scene);
      }
      scene.hidden = false;
      fallback.hidden = true;
      section.classList.add("ss-enhanced");
      active = true;
      measureNeeded = true;
      shownProgress = null;
      schedulePaint();
    } catch (error) {
      handleFailure(error);
    }
  };

  const handleResize = () => {
    measureNeeded = true;
    if (!active) applyPresentation();
    else schedulePaint();
  };

  const handleVisibility = () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    } else {
      shownProgress = null;
      schedulePaint();
    }
  };

  window.addEventListener("scroll", schedulePaint, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("split-slate:motion-change", applyPresentation);
  window.addEventListener("pageshow", handleResize);
  reducedMotion.addEventListener("change", applyPresentation);
  compactQuery.addEventListener("change", handleResize);
  document.addEventListener("visibilitychange", handleVisibility);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) {
          shownProgress = null;
          schedulePaint();
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(section);
  }
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(header);
  }
  document.fonts?.ready.then(handleResize).catch(handleFailure);
  applyPresentation();
})();
