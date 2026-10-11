(() => {
  "use strict";

  const root = document.documentElement;
  const dialog = document.querySelector("#screenshot-gallery");
  const section = document.querySelector(".product-preview-section");
  const links = [...document.querySelectorAll("[data-gallery-item]")];
  // Native modal semantics keep the background inert and provide Escape handling. If unavailable,
  // leave every original-image link functional rather than approximating a modal with missing a11y.
  if (!dialog || !section || typeof dialog.showModal !== "function" || !links.length) return;

  const find = (selector) => dialog.querySelector(selector);
  const image = find("[data-gallery-image]");
  const error = find("[data-gallery-error]");
  const caption = find("[data-gallery-caption]");
  const thumbnails = find("[data-gallery-thumbnails]");
  const closeButton = find("[data-gallery-close]");
  const groups = [...dialog.querySelectorAll("[data-gallery-select-group]")];
  const devices = [...dialog.querySelectorAll("[data-gallery-select-device]")];
  const compact = window.matchMedia("(max-width: 56rem)");
  const items = links.map((link) => ({
    source: link.href,
    group: link.dataset.galleryGroup,
    device: link.dataset.galleryDevice,
    title: link.dataset.galleryTitle,
    alt: link.dataset.galleryAlt,
  }));
  const FILTER_LABELS = { all: "All", desktop: "Desktop", mobile: "Mobile" };
  let deviceFilter = "all";
  const matchingIndices = () => [...items.keys()].filter(
    (index) => deviceFilter === "all" || items[index].device === deviceFilter,
  );
  let filteredIndices = matchingIndices();
  let selected = 0;
  let opener = null;
  let scrollPosition = null;
  let savedBodyStyles = null;
  let startedOnBackdrop = false;
  let thumbnailsLoaded = false;

  const thumbnailButtons = items.map((item, index) => {
    const button = document.createElement("button");
    const thumbnail = document.createElement("img");
    button.type = "button";
    button.setAttribute("aria-label", `Screenshot ${index + 1}: ${item.title}`);
    button.title = item.title;
    thumbnail.alt = "";
    thumbnail.decoding = "async";
    button.append(thumbnail);
    button.addEventListener("click", () => render(index));
    thumbnails.append(button);
    return button;
  });

  const revealThumbnail = (button) => {
    // Scroll only the thumbnail rail; scrollIntoView could also move the modal/page.
    const left = button.offsetLeft;
    const right = left + button.offsetWidth;
    if (left < thumbnails.scrollLeft) thumbnails.scrollLeft = left;
    else if (right > thumbnails.scrollLeft + thumbnails.clientWidth) {
      thumbnails.scrollLeft = right - thumbnails.clientWidth;
    }
  };

  const render = (index) => {
    selected = filteredIndices.includes(index) ? index : filteredIndices[0];
    const item = items[selected];
    image.hidden = false;
    error.hidden = true;
    image.alt = item.alt;
    image.src = item.source;
    const position = filteredIndices.indexOf(selected) + 1;
    caption.textContent = `${position} / ${filteredIndices.length} · ${item.title}`;
    groups.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.gallerySelectGroup === item.group));
    });
    devices.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.gallerySelectDevice === deviceFilter));
    });
    thumbnails.setAttribute(
      "aria-label",
      `${FILTER_LABELS[deviceFilter]} screenshots (${filteredIndices.length})`,
    );
    thumbnailButtons.forEach((button, thumbnailIndex) => {
      const filteredPosition = filteredIndices.indexOf(thumbnailIndex);
      button.hidden = filteredPosition === -1;
      if (!button.hidden) {
        button.setAttribute(
          "aria-label",
          `Screenshot ${filteredPosition + 1} of ${filteredIndices.length}: ${items[thumbnailIndex].title}`,
        );
      }
      if (thumbnailIndex === selected) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    if (dialog.open) revealThumbnail(thumbnailButtons[selected]);
  };

  const lockPage = () => {
    scrollPosition = { x: window.scrollX, y: window.scrollY };
    const properties = ["position", "top", "left", "right", "width"];
    savedBodyStyles = properties.map((property) => ({
      property,
      value: document.body.style.getPropertyValue(property),
      priority: document.body.style.getPropertyPriority(property),
    }));
    // Fix the body as well as hiding overflow so touch browsers cannot scroll behind the dialog.
    document.body.style.position = "fixed";
    document.body.style.top = `${-scrollPosition.y}px`;
    document.body.style.left = `${-scrollPosition.x}px`;
    document.body.style.right = "0";
    document.body.style.width = "100%";
    root.classList.add("gallery-is-open");
  };

  const restorePage = () => {
    if (!scrollPosition) return;
    savedBodyStyles.forEach(({ property, value, priority }) => {
      if (value) document.body.style.setProperty(property, value, priority);
      else document.body.style.removeProperty(property);
    });
    root.classList.remove("gallery-is-open");
    window.scrollTo({ left: scrollPosition.x, top: scrollPosition.y, behavior: "instant" });
    scrollPosition = null;
    savedBodyStyles = null;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
    startedOnBackdrop = false;
  };

  const handleOpen = (event) => {
    // Preserve modified clicks/new-tab requests, and never intercept unless showModal succeeds.
    if (
      event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
      event.shiftKey || event.altKey || dialog.open
    ) {
      return;
    }
    const link = event.currentTarget;
    deviceFilter = "all";
    filteredIndices = matchingIndices();
    let index = links.indexOf(link);
    if (link.dataset.galleryOpen && compact.matches) {
      const mobileIndex = items.findIndex(
        (item) => item.group === link.dataset.galleryOpen && item.device === "mobile",
      );
      if (mobileIndex !== -1) index = mobileIndex;
    }
    render(index);
    try {
      dialog.showModal();
    } catch {
      section.classList.remove("gallery-enhanced");
      return;
    }
    event.preventDefault();
    opener = link;
    lockPage();
    if (!thumbnailsLoaded) {
      thumbnailButtons.forEach((button, thumbnailIndex) => {
        button.firstElementChild.src = items[thumbnailIndex].source;
      });
      thumbnailsLoaded = true;
    }
    closeButton.focus({ preventScroll: true });
    revealThumbnail(thumbnailButtons[selected]);
  };

  const selectVariant = (group, device) => {
    if (items[selected].group === group && items[selected].device === device) return;
    const index = items.findIndex((item) => item.group === group && item.device === device);
    if (index !== -1) render(index);
  };
  const handleGroup = (event) => {
    selectVariant(event.currentTarget.dataset.gallerySelectGroup, items[selected].device);
  };
  const handleDevice = (event) => {
    const nextFilter = event.currentTarget.dataset.gallerySelectDevice;
    if (deviceFilter === nextFilter) return;
    deviceFilter = nextFilter;
    filteredIndices = matchingIndices();
    const sameGroup = filteredIndices.find((index) => items[index].group === items[selected].group);
    render(filteredIndices.includes(selected) ? selected : sameGroup ?? filteredIndices[0]);
  };
  const navigate = (direction) => {
    const position = filteredIndices.indexOf(selected);
    const next = (position + direction + filteredIndices.length) % filteredIndices.length;
    render(filteredIndices[next]);
  };
  const handleClose = () => dialog.close();
  const handlePrevious = () => navigate(-1);
  const handleNext = () => navigate(1);
  const handleKeyDown = (event) => {
    if (!dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      navigate(event.key === "ArrowRight" ? 1 : -1);
    } else if (event.key === "Tab") {
      const focusable = [...dialog.querySelectorAll("button, a[href]")].filter(
        (node) => !node.disabled && node.getClientRects().length > 0,
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const isBackdrop = (event) => {
    const bounds = dialog.getBoundingClientRect();
    return (
      event.target === dialog && (
        event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom
      )
    );
  };
  const handlePointerDown = (event) => {
    startedOnBackdrop = isBackdrop(event);
  };
  const handleBackdropClick = (event) => {
    if (startedOnBackdrop && isBackdrop(event)) dialog.close();
    startedOnBackdrop = false;
  };
  const handleImageError = () => {
    image.hidden = true;
    error.hidden = false;
  };

  links.forEach((link) => {
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-controls", dialog.id);
    link.addEventListener("click", handleOpen);
  });
  groups.forEach((button) => button.addEventListener("click", handleGroup));
  devices.forEach((button) => button.addEventListener("click", handleDevice));
  closeButton.addEventListener("click", handleClose);
  find("[data-gallery-previous]").addEventListener("click", handlePrevious);
  find("[data-gallery-next]").addEventListener("click", handleNext);
  dialog.addEventListener("keydown", handleKeyDown);
  dialog.addEventListener("pointerdown", handlePointerDown);
  dialog.addEventListener("click", handleBackdropClick);
  dialog.addEventListener("close", restorePage);
  image.addEventListener("error", handleImageError);
  section.classList.add("gallery-enhanced");
})();
