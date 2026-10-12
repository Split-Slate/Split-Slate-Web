import { v4 as uuid } from "uuid";

import { writeActivity } from "@/features/activity/utils/activity-events";
import { db } from "@/shared/configs/db";

import type { Tag } from "@/shared/types/domain.types";

import type { SliceCreator, TagsSlice } from "./types";

const normalizeTagName = (name: string) => name.trim();
const normalizeTagColor = (color: string) => color.trim().toLowerCase();
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/;

export const createTagsSlice: SliceCreator<TagsSlice> = (set) => ({
  tags: [],

  addTag: async (groupId, name, color) => {
    const normalizedName = normalizeTagName(name);
    const normalizedColor = normalizeTagColor(color);
    if (!normalizedName) {
      throw new Error("Tag name is required");
    }
    if (!HEX_COLOR_PATTERN.test(normalizedColor)) {
      throw new Error("Tag color must be a valid hex color");
    }
    const tag: Tag = {
      id: uuid(),
      groupId,
      name: normalizedName,
      color: normalizedColor,
    };
    const event = await db.transaction("rw", [db.groups, db.tags, db.activityEvents], async () => {
      const group = await db.groups.get(groupId);
      if (!group) throw new Error("Group not found");
      if (
        (await db.tags.where("groupId").equals(groupId).toArray()).some(
          (item) => item.name.trim().toLowerCase() === normalizedName.toLowerCase(),
        )
      )
        throw new Error("Tag already exists");
      await db.tags.add(tag);
      return writeActivity({
        group,
        kind: "tag",
        action: "created",
        label: tag.name,
        subjectId: tag.id,
      });
    });
    set((state) => ({
      tags: [...state.tags, tag],
      activityEvents: [...state.activityEvents, event],
    }));
    return tag;
  },

  updateTag: async (tagId, patch) => {
    const normalizedName = patch.name === undefined ? undefined : normalizeTagName(patch.name);
    const normalizedColor = patch.color === undefined ? undefined : normalizeTagColor(patch.color);
    if (normalizedName !== undefined && !normalizedName) {
      throw new Error("Tag name is required");
    }
    if (normalizedColor !== undefined && !HEX_COLOR_PATTERN.test(normalizedColor)) {
      throw new Error("Tag color must be a valid hex color");
    }

    const normalizedPatch = {
      ...patch,
      ...(normalizedName !== undefined ? { name: normalizedName } : {}),
      ...(normalizedColor !== undefined ? { color: normalizedColor } : {}),
    };
    const result = await db.transaction("rw", [db.groups, db.tags, db.activityEvents], async () => {
      const existing = await db.tags.get(tagId);
      if (!existing) throw new Error("Tag not found");
      const group = await db.groups.get(existing.groupId);
      if (!group) throw new Error("Group not found");
      if (
        normalizedName !== undefined &&
        (await db.tags.where("groupId").equals(existing.groupId).toArray()).some(
          (item) =>
            item.id !== tagId && item.name.trim().toLowerCase() === normalizedName.toLowerCase(),
        )
      )
        throw new Error("Tag already exists");
      const updated: Tag = { ...existing, ...normalizedPatch };
      if (!(await db.tags.update(tagId, normalizedPatch))) throw new Error("Tag not found");
      const event = await writeActivity({
        group,
        kind: "tag",
        action: "updated",
        label: updated.name,
        subjectId: tagId,
      });
      return { updated, event };
    });
    set((state) => ({
      tags: state.tags.some((tag) => tag.id === tagId)
        ? state.tags.map((tag) => (tag.id === tagId ? result.updated : tag))
        : [...state.tags, result.updated],
      activityEvents: [...state.activityEvents, result.event],
    }));
    return result.updated;
  },

  removeTag: async (tagId) => {
    const result = await db.transaction(
      "rw",
      [db.groups, db.tags, db.expenses, db.settlements, db.activityEvents],
      async () => {
        const tag = await db.tags.get(tagId);
        if (!tag) {
          throw new Error("Tag not found");
        }
        const expenses = await db.expenses.where("groupId").equals(tag.groupId).toArray();
        const settlements = await db.settlements.where("groupId").equals(tag.groupId).toArray();
        await db.tags.delete(tagId);
        for (const expense of expenses) {
          if (!expense.tagIds.includes(tagId)) continue;
          const tagIds = expense.tagIds.filter((id) => id !== tagId);
          // Update only references on existing records; never upsert a hydrated snapshot.
          await db.expenses.update(expense.expenseId, { tagIds });
          expense.tagIds = tagIds;
        }
        for (const settlement of settlements) {
          if (!settlement.tagIds.includes(tagId)) continue;
          const tagIds = settlement.tagIds.filter((id) => id !== tagId);
          await db.settlements.update(settlement.id, { tagIds });
          settlement.tagIds = tagIds;
        }
        const event = await writeActivity({
          group: await db.groups.get(tag.groupId),
          kind: "tag",
          action: "deleted",
          label: tag.name,
          subjectId: tagId,
        });
        return { groupId: tag.groupId, expenses, settlements, event };
      },
    );

    // Refresh this group's snapshot so stale deleted rows also disappear from the UI.
    set((state) => ({
      tags: state.tags.filter((item) => item.id !== tagId),
      activityEvents: [...state.activityEvents, result.event],
      expenses: [
        ...state.expenses.filter((expense) => expense.groupId !== result.groupId),
        ...result.expenses,
      ],
      settlements: [
        ...state.settlements.filter((settlement) => settlement.groupId !== result.groupId),
        ...result.settlements,
      ],
    }));
  },
});
