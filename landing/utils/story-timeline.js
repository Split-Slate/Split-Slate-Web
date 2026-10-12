(() => {
  "use strict";

  const story = window.SplitSlateStory;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const between = (progress, start, end) => clamp((progress - start) / (end - start));
  const smooth = (value) => value * value * (3 - 2 * value);
  const mix = (from, to, progress) => from + (to - from) * progress;
  const windowOpacity = (progress, start, inEnd, outStart, end) =>
    smooth(between(progress, start, inEnd)) * (1 - smooth(between(progress, outStart, end)));
  const transform = (element, x, y, rotation = 0, scale = 1) => {
    element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
  };

  const createTimeline = (element) => {
    const find = (selector) => element.querySelector(selector);
    const all = (selector) => [...element.querySelectorAll(selector)];
    const stage = find(".ss-stage");
    const notebook = find(".ss-notebook");
    const desk = find(".ss-desk-light");
    const deskEdge = find(".ss-desk-edge");
    const calculator = find(".ss-calculator");
    const hand = find(".ss-hand");
    const phone = find(".ss-phone");
    const halo = find(".ss-phone-halo");
    const math = find(".ss-manual-math");
    const erased = find("[data-erased]");
    const slash = find(".ss-slash");
    const totals = all("[data-story-total]");
    const counts = all("[data-story-count]");
    const position = find("[data-story-position]");
    const positionNote = find("[data-story-position-note]");
    const phoneDocument = find(".ss-phone-document");
    const phoneViewport = find(".ss-app-viewport");
    const autoMath = find(".ss-auto-math");
    const calculationTrack = find(".ss-calculation-track path");
    const opening = find(".ss-copy-opening");
    const frustration = find(".ss-copy-frustration");
    const discovery = find(".ss-copy-discovery");
    const resolution = find(".ss-copy-resolution");
    const finalCopy = find(".ss-copy-final");
    const finalLink = find(".ss-final-link");
    const storyProgress = find(".ss-story-progress-fill");
    const stageLabels = all(".ss-chapter-label");
    const members = all(".ss-member-chip");
    const cards = all(".ss-expense-card");
    const settlements = all(".ss-settlement-card");
    const settlementHeading = find(".ss-phone-settlements .ss-ui-heading");
    const transferAction = find(".ss-transfer-action");
    const wires = all(".ss-transfer-line path");
    const travellers = all(".ss-traveller").map((node) => ({
      node,
      paperHost: node.parentElement,
      source: find(`[data-source="${node.dataset.traveller}"]`),
      target: find(`[data-target="${node.dataset.traveller}"]`),
      written: node.querySelector(".ss-written-token"),
      digital: node.querySelector(".ss-digital-token"),
      taxi: node.dataset.traveller.startsWith("taxi"),
      amount: node.classList.contains("ss-traveller-amount"),
      width: Number.parseFloat(node.style.width),
      destination: null,
      origin: null,
      docked: false,
    }));
    const receipts = all("[data-receipt]").map((node) => ({
      node,
      dinner: node.dataset.receipt === "dinner",
      target: find(`[data-expense-card="${node.dataset.receipt}"]`),
      destination: null,
    }));
    const strokes = all("[data-ink-start]")
      .map((path) => ({
        path,
        start: Number(path.dataset.inkStart),
        end: Number(path.dataset.inkEnd),
        points: [],
        lastOffset: -1,
      }))
      .sort((a, b) => a.start - b.start);
    let previousChapter = -1;
    let linkVisible = false;
    let previousEntryCount = -1;
    let documentOrigin = { x: 0, y: 0 };
    let entryPan = 0;
    let resultsPan = 0;
    let measured = false;

    const canvasRect = (node, bounds, scale) => {
      const rect = node.getBoundingClientRect();
      return {
        x: (rect.left + rect.width / 2 - bounds.left) / scale,
        y: (rect.top + rect.height / 2 - bounds.top) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      };
    };

    const placeTraveller = (traveller, x, y, rotation, scale) => {
      transform(traveller.node, x - traveller.width / 2, y - 20, rotation, scale);
    };

    // All geometry is captured at resize/font-load time, never in the scrolling render loop.
    const measure = (scale) => {
      transform(notebook, 0, 0, -7);
      transform(phone, 0, 0);
      transform(phoneDocument, 0, 0);
      cards.forEach((card) => transform(card, 0, 0));
      const bounds = stage.getBoundingClientRect();
      const documentBounds = phoneDocument.getBoundingClientRect();
      documentOrigin = {
        x: (documentBounds.left - bounds.left) / scale,
        y: (documentBounds.top - bounds.top) / scale,
      };
      const expensesBounds = canvasRect(find(".ss-phone-expenses"), bounds, scale);
      const transfersBounds = canvasRect(find(".ss-phone-settlements"), bounds, scale);
      entryPan = Math.max(0, expensesBounds.y - expensesBounds.height / 2 - documentOrigin.y - 36);
      resultsPan = Math.max(
        0,
        transfersBounds.y +
          transfersBounds.height / 2 -
          documentOrigin.y -
          phoneViewport.clientHeight +
          4,
      );
      travellers.forEach((traveller) => {
        // Resize/reverse always starts from the original paper geometry, including ink samples.
        traveller.paperHost.append(traveller.node);
        traveller.docked = false;
        traveller.origin = canvasRect(traveller.source, bounds, scale);
        traveller.destination = canvasRect(traveller.target, bounds, scale);
        traveller.destination.scale =
          Number.parseFloat(getComputedStyle(traveller.target).fontSize) /
          (traveller.amount ? 27 : 24);
        traveller.digital.textContent = traveller.target.textContent;
        placeTraveller(traveller, traveller.origin.x, traveller.origin.y, -7, 1);
      });
      receipts.forEach((receipt) => {
        receipt.destination = canvasRect(receipt.target, bounds, scale);
      });
      strokes.forEach((stroke) => {
        const matrix = stroke.path.getScreenCTM();
        const length = stroke.path.getTotalLength();
        stroke.points = Array.from({ length: 17 }, (_, index) => {
          const point = stroke.path.getPointAtLength((length * index) / 16);
          return {
            x: (matrix.a * point.x + matrix.c * point.y + matrix.e - bounds.left) / scale,
            y: (matrix.b * point.x + matrix.d * point.y + matrix.f - bounds.top) / scale,
          };
        });
      });
      measured = true;
    };

    const followPen = (progress, pressure) => {
      let active = strokes.find((stroke) => progress >= stroke.start && progress <= stroke.end);
      let next = null;
      let penProgress;
      if (active) {
        penProgress = between(progress, active.start, active.end);
      } else {
        const nextIndex = strokes.findIndex((stroke) => stroke.start > progress);
        active =
          nextIndex > 0 ? strokes[nextIndex - 1] : nextIndex === 0 ? strokes[0] : strokes.at(-1);
        next = nextIndex >= 0 ? strokes[nextIndex] : null;
        penProgress = nextIndex === 0 ? 0 : 1;
      }
      if (!active?.points.length) return;
      let x;
      let y;
      let lift = 0;
      if (next && progress > active.end) {
        const travel = smooth(between(progress, active.end, next.start));
        const from = active.points.at(-1);
        const to = next.points[0];
        x = mix(from.x, to.x, travel);
        y = mix(from.y, to.y, travel);
        lift = Math.sin(travel * Math.PI) * 8;
      } else {
        const index = penProgress * 16;
        const from = active.points[Math.floor(index)];
        const to = active.points[Math.min(Math.floor(index) + 1, 16)];
        x = mix(from.x, to.x, index % 1);
        y = mix(from.y, to.y, index % 1);
      }
      transform(hand, x, y + pressure - lift, 0, 1 + lift * 0.0015);
    };

    const render = (progress, compact = false) => {
      if (!measured) return;
      const p = clamp(progress);
      const pressure = Math.sin(between(p, 0.429, 0.456) * Math.PI) * 3.5;
      const transformation = smooth(between(p, 0.485, 0.65));
      const final = smooth(between(p, 0.84, 0.95));
      const phoneShift = (compact ? -100 : -35) * final;
      const paperFade = 1 - smooth(between(p, 0.54, 0.645));
      const enteringExpenses = smooth(between(p, 0.555, 0.605));
      const showingBalances = smooth(between(p, 0.7, 0.756));
      const phonePan =
        entryPan * enteringExpenses * (1 - showingBalances) + resultsPan * showingBalances;
      transform(phoneDocument, 0, -phonePan);

      transform(
        notebook,
        -24 * transformation,
        pressure - 40 * transformation,
        -7 - 3 * transformation,
        1 - 0.025 * transformation,
      );
      notebook.style.opacity = String(paperFade);
      math.style.opacity = String(1 - smooth(between(p, 0.475, 0.54)));
      slash.style.opacity = String(1 - smooth(between(p, 0.48, 0.55)));
      erased.style.opacity = String(1 - 0.87 * smooth(between(p, 0.312, 0.327)));
      desk.style.opacity = String(1 - smooth(between(p, 0.68, 0.89)));
      deskEdge.style.opacity = String(1 - smooth(between(p, 0.53, 0.71)));
      calculator.style.opacity = String(1 - smooth(between(p, 0.495, 0.6)));
      transform(calculator, 70 * transformation, 35 * transformation, 13 + 10 * transformation);

      const phoneEntry = smooth(between(p, 0.495, 0.59));
      phone.style.opacity = String(phoneEntry);
      transform(
        phone,
        phoneShift,
        65 * (1 - phoneEntry),
        4 * (1 - phoneEntry),
        0.94 + 0.06 * phoneEntry,
      );
      halo.style.opacity = String(smooth(between(p, 0.52, 0.7)));
      transform(halo, phoneShift, 0, 0, 0.82 + 0.18 * final);

      strokes.forEach((stroke) => {
        const offset = 1 - between(p, stroke.start, stroke.end);
        if (offset !== stroke.lastOffset) {
          stroke.path.style.strokeDashoffset = String(offset);
          stroke.lastOffset = offset;
        }
      });
      hand.style.opacity = String(1 - smooth(between(p, 0.463, 0.49)));
      if (p < 0.495) followPen(p, pressure);

      travellers.forEach((traveller) => {
        const delay = traveller.taxi ? 0.023 : 0;
        const flight = smooth(between(p, 0.49 + delay, 0.625 + delay));
        const { origin, destination } = traveller;
        // Dock the actual travelling node, not a duplicate. The phone viewport then clips it
        // naturally while its document pans; a reverse scroll returns the same node to paper.
        const docked = p >= 0.655;
        if (docked !== traveller.docked) {
          (docked ? phoneDocument : traveller.paperHost).append(traveller.node);
          traveller.docked = docked;
        }
        if (docked) {
          placeTraveller(
            traveller,
            destination.x - documentOrigin.x,
            destination.y - documentOrigin.y,
            0,
            destination.scale,
          );
        } else {
          const arc = Math.sin(flight * Math.PI) * (compact ? 40 : 78);
          const x = mix(origin.x, destination.x, flight) + phoneShift * flight;
          const y = mix(origin.y + pressure, destination.y - phonePan, flight) - arc;
          placeTraveller(traveller, x, y, mix(-7, 0, flight), mix(1, destination.scale, flight));
        }
        const clean = smooth(between(p, 0.556 + delay, 0.616 + delay));
        traveller.written.style.opacity = String(1 - clean);
        traveller.digital.style.opacity = String(clean);
      });

      receipts.forEach((receipt) => {
        const delay = receipt.dinner ? 0 : 0.024;
        const flight = smooth(between(p, 0.51 + delay, 0.63 + delay));
        const { destination } = receipt;
        const width = receipt.dinner ? 175 : 165;
        const height = receipt.dinner ? 242 : 195;
        const startX = receipt.dinner ? 127 : 774;
        const startY = receipt.dinner ? 143 : 160;
        const scaleX = mix(1, destination.width / width, flight);
        const scaleY = mix(1, destination.height / height, flight);
        const x = mix(startX, destination.x - width / 2, flight);
        const y =
          mix(startY, destination.y - phonePan - height / 2, flight) -
          Math.sin(flight * Math.PI) * 35;
        const rotation = mix(receipt.dinner ? -19 : 17, 0, flight);
        receipt.node.style.transform = `translate3d(${x}px, ${y}px, 0)
          rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
        receipt.node.style.opacity = String(1 - smooth(between(p, 0.585 + delay, 0.635 + delay)));
      });

      cards.forEach((card, index) => {
        const entered = smooth(between(p, 0.57 + index * 0.035, 0.622 + index * 0.035));
        card.style.opacity = String(entered);
        transform(
          card,
          0,
          14 * (1 - entered) - Math.sin(entered * Math.PI) * 2,
          0,
          0.975 + 0.025 * entered,
        );
      });
      members.forEach((member, index) => {
        const entered = smooth(between(p, 0.514 + index * 0.008, 0.56 + index * 0.008));
        member.style.opacity = String(entered);
        transform(member, (index - 1) * 15 * (1 - entered), 12 * (1 - entered));
      });

      // Only display totals of entered expenses, not fictitious amounts during a counter tween.
      const entryCount = p >= 0.674 ? 2 : p >= 0.633 ? 1 : 0;
      if (entryCount !== previousEntryCount) {
        const state = story.data.entryStates[entryCount];
        totals.forEach((total) => {
          total.textContent = story.data.formatMoney(state.total);
        });
        counts.forEach((count) => {
          count.textContent = String(state.count);
        });
        const sign = state.position > 0 ? "+" : state.position < 0 ? "−" : "";
        position.textContent = `${sign}${story.data.formatMoney(Math.abs(state.position))}`;
        positionNote.textContent =
          state.position > 0
            ? "↓ you are owed in this group"
            : state.position < 0
              ? "↑ you owe in this group"
              : "All square in this group";
        previousEntryCount = entryCount;
      }
      autoMath.style.opacity = String(smooth(between(p, 0.686, 0.725)));
      calculationTrack.style.strokeDashoffset = String(1 - between(p, 0.69, 0.755));
      settlementHeading.style.opacity = String(smooth(between(p, 0.53, 0.59)));
      settlements.forEach((card, index) => {
        const entered = smooth(between(p, 0.76 + index * 0.025, 0.805 + index * 0.025));
        card.style.opacity = String(entered);
        transform(card, 0, 13 * (1 - entered), 0, 0.98 + 0.02 * entered);
        wires[index].style.strokeDashoffset = String(
          1 - between(p, 0.785 + index * 0.025, 0.828 + index * 0.025),
        );
      });
      transferAction.style.opacity = String(smooth(between(p, 0.817, 0.846)));

      opening.style.opacity = String(1 - smooth(between(p, 0.32, 0.382)));
      transform(opening, 0, -12 * smooth(between(p, 0.32, 0.382)));
      frustration.style.opacity = String(windowOpacity(p, 0.399, 0.426, 0.477, 0.51));
      discovery.style.opacity = String(windowOpacity(p, 0.51, 0.556, 0.68, 0.72));
      resolution.style.opacity = String(windowOpacity(p, 0.725, 0.759, 0.825, 0.868));
      finalCopy.style.opacity = String(final);
      transform(finalCopy, 0, 20 * (1 - final));
      storyProgress.style.transform = `scaleX(${p})`;

      const chapter = p < 0.399 ? 0 : p < 0.51 ? 1 : p < 0.725 ? 2 : p < 0.86 ? 3 : 4;
      if (chapter !== previousChapter) {
        stageLabels.forEach((label, index) =>
          label.classList.toggle("is-current", index === chapter),
        );
        element.dataset.storyStage = String(chapter + 1);
        previousChapter = chapter;
      }
      const visible = p >= 0.905;
      if (visible !== linkVisible) {
        finalCopy.inert = !visible;
        finalCopy.setAttribute("aria-hidden", String(!visible));
        finalLink.tabIndex = visible ? 0 : -1;
        finalCopy.style.pointerEvents = visible ? "auto" : "none";
        linkVisible = visible;
      }
    };

    // This face is first used by dynamically mounted content. Its load can start after the
    // page's original fonts.ready promise resolves, so refresh the existing cached-layout
    // controller once it finishes (or once the generic fallback is confirmed).
    if (document.fonts) {
      const refreshFontGeometry = () => window.dispatchEvent(new Event("resize"));
      document.fonts
        .load('700 11px "Split Slate App"')
        .then(refreshFontGeometry)
        .catch(refreshFontGeometry);
    }

    return { measure, render };
  };

  story.createTimeline = createTimeline;
})();
