import { describe, expect, it } from "vitest";

import {
  GroupNameConflictError,
  isGroupNameTaken,
  nextAvailableGroupName,
} from "@/shared/utils/group-names";

describe("isGroupNameTaken", () => {
  const groups = [
    { id: "trip", name: "Trip" },
    { id: "home", name: " Home " },
  ];

  it.each(["Trip", "trip", "TRIP", "  tRiP\t", "\u00a0Trip\u3000"])(
    "matches the existing name %j",
    (name) => {
      expect(isGroupNameTaken(name, groups)).toBe(true);
    },
  );

  it("trims existing names as well as requested names", () => {
    expect(isGroupNameTaken("home", groups)).toBe(true);
  });

  it("excludes only the group being edited", () => {
    expect(isGroupNameTaken("trip", groups, "trip")).toBe(false);
    expect(isGroupNameTaken("home", groups, "trip")).toBe(true);
  });

  it("allows distinct names and preserves meaningful internal spacing", () => {
    expect(isGroupNameTaken("Road Trip", groups)).toBe(false);
    expect(isGroupNameTaken("Road  Trip", [{ id: "road", name: "Road Trip" }])).toBe(false);
    expect(isGroupNameTaken("Trip", [])).toBe(false);
  });
});

describe("nextAvailableGroupName", () => {
  it("trims a new name without changing its case or internal spacing", () => {
    expect(nextAvailableGroupName("  Goa   Trip  ", [])).toBe("Goa   Trip");
  });

  it("numbers case-insensitive and whitespace-padded collisions", () => {
    expect(nextAvailableGroupName(" Trip ", ["trip", " TRIP (2) ", "Trip (3)"])).toBe("Trip (4)");
  });

  it("uses the first available suffix and leaves existing names unchanged", () => {
    const names = ["Trip", "Trip (3)"];
    expect(nextAvailableGroupName("Trip", names)).toBe("Trip (2)");
    expect(names).toEqual(["Trip", "Trip (3)"]);
  });

  it("supports a Set of existing names", () => {
    expect(nextAvailableGroupName("Trip", new Set(["TRIP"]))).toBe("Trip (2)");
  });

  it("rejects blank names", () => {
    expect(() => nextAvailableGroupName(" \t\u00a0", [])).toThrow("Group name is required");
  });
});

it("provides a field-friendly duplicate-name error", () => {
  const error = new GroupNameConflictError();
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe("A group with this name already exists.");
});
