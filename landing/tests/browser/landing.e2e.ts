import { expect, test } from "@playwright/test";

test("filters all eight captures, wraps navigation, and restores focus and scroll", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".product-preview-section")).toHaveClass(/gallery-enhanced/u);
  const opener = page.locator('[data-gallery-open="group"]');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  const dialog = page.locator("#screenshot-gallery");
  await expect(dialog).toBeVisible();
  const scrollY = await page.evaluate(() => -Number.parseFloat(document.body.style.top));
  const image = dialog.locator("[data-gallery-image]");
  const caption = dialog.locator("[data-gallery-caption]");
  await expect(dialog.locator('[data-gallery-select-device="all"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(dialog.locator("[data-gallery-thumbnails] button:not([hidden])")).toHaveCount(8);
  for (const [device, count] of [
    ["desktop", 3],
    ["mobile", 5],
  ] as const) {
    await dialog.locator(`[data-gallery-select-device="${device}"]`).click();
    await expect(dialog.locator("[data-gallery-thumbnails] button:not([hidden])")).toHaveCount(
      count,
    );
    await expect(caption).toContainText(` / ${count} ·`);
    const first = await image.getAttribute("src");
    for (let index = 0; index < count; index += 1) await page.keyboard.press("ArrowRight");
    await expect(image).toHaveAttribute("src", first!);
    await expect(dialog.locator(`[data-gallery-select-device="${device}"]`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect
    .poll(() => page.evaluate((expected) => Math.abs(window.scrollY - expected), scrollY))
    .toBeLessThan(1);
  await opener.click();
  await expect(dialog.locator("[data-gallery-thumbnails] button:not([hidden])")).toHaveCount(8);
  await dialog.locator("[data-gallery-close]").click();
  await expect(dialog).not.toBeVisible();
});

test("conserves the demo total for all five methods with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-story-fallback]")).toBeVisible();
  await expect(page.locator(".motion-toggle")).toBeDisabled();
  for (const [method, amounts] of [
    ["equal", [400, 400, 400]],
    ["unequal", [600, 400, 200]],
    ["shares", [600, 300, 300]],
    ["percentage", [600, 360, 240]],
    ["adjust", [500, 400, 300]],
  ] as const) {
    await page.locator(`[data-split="${method}"]`).click();
    await expect(page.locator("[data-amount]")).toHaveText(amounts.map((amount) => `₹${amount}`));
    await expect(page.locator("#demo-status")).toContainText("Total ₹1,200");
  }
});

test("keeps static content and direct screenshot links usable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await expect(page.locator("[data-story-fallback]")).toBeVisible();
    await expect(page.locator("[data-split]")).toHaveCount(5);
    await expect(page.locator('[data-split="equal"]')).toBeDisabled();
    const opener = page.locator('[data-gallery-open="group"]');
    await opener.scrollIntoViewIfNeeded();
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const popupPromise = page.waitForEvent("popup");
    await opener.locator("img").click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/images\/group-desktop\.png$/u);
    await expect
      .poll(() => popup.locator("img").evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});

test("caches the complete landing snapshot and opens every screenshot offline", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames.some((name) => name.startsWith("split-slate-landing:"))).toBe(true);
  await context.setOffline(true);
  await page.goto("/index.html?source=offline#screenshots");
  await expect(page).toHaveURL(/index\.html\?source=offline#screenshots$/u);
  await expect(page.locator(".product-preview-section")).toHaveClass(/gallery-enhanced/u);
  await page.locator('[data-gallery-open="group"]').click();
  const image = page.locator("[data-gallery-image]");
  const sources = new Set<string>();
  for (let index = 0; index < 8; index += 1) {
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true);
    sources.add((await image.getAttribute("src"))!);
    await page.locator("[data-gallery-next]").click();
  }
  expect(sources.size).toBe(8);
});

test("has no runtime errors or horizontal overflow across representative layouts", async ({
  page,
}) => {
  // Five full-page captures need a larger budget than a single interactive journey.
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const viewport of [
    { width: 280, height: 480 },
    { width: 390, height: 844 },
    { width: 820, height: 900 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      width: document.documentElement.scrollWidth,
      overflowing: [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
        .filter((element) => {
          for (
            let parent = element.parentElement;
            parent && parent !== document.body;
            parent = parent.parentElement
          ) {
            if (["hidden", "clip", "auto", "scroll"].includes(getComputedStyle(parent).overflowX))
              return false;
          }
          return true;
        })
        .slice(0, 20)
        .map((element) => ({
          className: element.className,
          width: element.getBoundingClientRect().width,
        })),
    }));
    expect(layout, `Layout at ${viewport.width}px`).toMatchObject({ width: expect.any(Number) });
    expect(layout.width, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport + 1);
    await expect(page.locator('[data-gallery-open="group"]')).toBeVisible();
    const screenshot = test.info().outputPath(`landing-${viewport.width}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    await test.info().attach(`landing-${viewport.width}`, {
      path: screenshot,
      contentType: "image/png",
    });
  }
  expect(errors).toEqual([]);
});

test("scrolls the illustration forward and backward without losing its exact state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const story = page.locator("#expense-story");
  await expect(story).toHaveClass(/ss-enhanced/u);
  await page.evaluate(() => document.fonts.ready);
  // Enhancement mounts before its first animation-frame layout measurement.
  await page.waitForFunction(() => {
    const section = document.querySelector<HTMLElement>("#expense-story")!;
    return (
      Number.parseFloat(section.style.getPropertyValue("--ss-story-height")) > window.innerHeight
    );
  });
  await page.evaluate(() => {
    const section = document.querySelector<HTMLElement>("#expense-story")!;
    const height = Number.parseFloat(section.style.getPropertyValue("--ss-story-height"));
    window.scrollTo({ top: section.offsetTop + height - window.innerHeight, behavior: "instant" });
  });
  await expect(story.locator("[data-story-total]").first()).toHaveText("$150.00");
  await expect(story.locator("[data-story-position]")).toHaveText("+$70.00");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(story.locator("[data-story-total]").first()).toHaveText("$0.00");
  await page.getByRole("button", { name: "Pause animations", exact: true }).click();
  await expect(page.locator("[data-story-fallback]")).toBeVisible();
});
