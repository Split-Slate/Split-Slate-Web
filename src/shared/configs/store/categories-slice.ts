import { v4 as uuid } from "uuid";

import { writeActivity } from "@/features/activity/utils/activity-events";
import { db } from "@/shared/configs/db";
import { normalizeRequiredString } from "@/shared/utils/string-validation";

import type { Category } from "@/shared/types/domain.types";

import type { CategoriesSlice, SliceCreator } from "./types";

export const createCategoriesSlice: SliceCreator<CategoriesSlice> = (set) => ({
  categories: [],
  masterCategories: [],
  defaultGroupCategories: [],

  addCategory: async (groupId, name, icon) => {
    const normalizedName = normalizeRequiredString(name, "Category name is required");
    const normalizedIcon = normalizeRequiredString(icon, "Category icon is required");
    const category: Category = {
      id: uuid(),
      groupId,
      name: normalizedName,
      icon: normalizedIcon,
      isActive: true,
    };
    const event = await db.transaction(
      "rw",
      [db.groups, db.categories, db.activityEvents],
      async () => {
        const group = await db.groups.get(groupId);
        if (!group) throw new Error("Group not found");
        if (
          (await db.categories.where("groupId").equals(groupId).toArray()).some(
            (item) => item.name.trim().toLowerCase() === normalizedName.toLowerCase(),
          )
        )
          throw new Error("Category already exists");
        await db.categories.add(category);
        return writeActivity({
          group,
          kind: "category",
          action: "created",
          label: category.name,
          icon: category.icon,
          subjectId: category.id,
        });
      },
    );
    set((s) => ({
      categories: [...s.categories, category],
      activityEvents: [...s.activityEvents, event],
    }));
    return category;
  },

  updateCategory: async (categoryId, patch) => {
    const normalizedPatch = {
      ...patch,
      ...(patch.name !== undefined
        ? { name: normalizeRequiredString(patch.name, "Category name is required") }
        : {}),
      ...(patch.icon !== undefined
        ? { icon: normalizeRequiredString(patch.icon, "Category icon is required") }
        : {}),
    };
    const result = await db.transaction(
      "rw",
      [db.groups, db.categories, db.activityEvents],
      async () => {
        const existing = await db.categories.get(categoryId);
        if (!existing) throw new Error("Category not found");
        const group = await db.groups.get(existing.groupId);
        if (!group) throw new Error("Group not found");
        if (
          normalizedPatch.name !== undefined &&
          (await db.categories.where("groupId").equals(existing.groupId).toArray()).some(
            (item) =>
              item.id !== categoryId &&
              item.name.trim().toLowerCase() === normalizedPatch.name?.toLowerCase(),
          )
        )
          throw new Error("Category already exists");
        const updated: Category = { ...existing, ...normalizedPatch };
        if (!(await db.categories.update(categoryId, normalizedPatch)))
          throw new Error("Category not found");
        const event = await writeActivity({
          group,
          kind: "category",
          action: "updated",
          label: updated.name,
          icon: updated.icon,
          subjectId: categoryId,
        });
        return { updated, event };
      },
    );
    set((s) => ({
      categories: s.categories.some((category) => category.id === categoryId)
        ? s.categories.map((category) => (category.id === categoryId ? result.updated : category))
        : [...s.categories, result.updated],
      activityEvents: [...s.activityEvents, result.event],
    }));
    return result.updated;
  },

  removeCategory: async (categoryId) => {
    const event = await db.transaction(
      "rw",
      [db.groups, db.categories, db.expenses, db.activityEvents],
      async () => {
        const category = await db.categories.get(categoryId);
        if (!category) throw new Error("Category not found");
        if ((await db.categories.where("groupId").equals(category.groupId).count()) <= 1)
          throw new Error("A group needs at least one category");
        if ((await db.expenses.toArray()).some((expense) => expense.categoryId === categoryId))
          throw new Error(
            "Cannot delete a category used by expenses; reassign those expenses first",
          );
        await db.categories.delete(categoryId);
        return writeActivity({
          group: await db.groups.get(category.groupId),
          kind: "category",
          action: "deleted",
          label: category.name,
          icon: category.icon,
          subjectId: categoryId,
        });
      },
    );
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== categoryId),
      activityEvents: [...s.activityEvents, event],
    }));
  },
});
