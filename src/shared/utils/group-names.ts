import { normalizeRequiredString } from "@/shared/utils/string-validation";

import type { Group } from "@/shared/types/domain.types";

export class GroupNameConflictError extends Error {
  constructor() {
    super("A group with this name already exists.");
    this.name = "GroupNameConflictError";
  }
}

const groupNameKey = (name: string): string => name.trim().toLowerCase();

export const isGroupNameTaken = (
  name: string,
  groups: readonly Pick<Group, "id" | "name">[],
  excludeGroupId?: string,
): boolean =>
  groups.some(
    (group) => group.id !== excludeGroupId && groupNameKey(group.name) === groupNameKey(name),
  );

export const nextAvailableGroupName = (
  requestedName: string,
  existingNames: Iterable<string>,
): string => {
  const name = normalizeRequiredString(requestedName, "Group name is required");
  const taken = new Set(Array.from(existingNames, groupNameKey));
  if (!taken.has(groupNameKey(name))) return name;
  let suffix = 2;
  while (taken.has(groupNameKey(`${name} (${suffix})`))) suffix += 1;
  return `${name} (${suffix})`;
};
