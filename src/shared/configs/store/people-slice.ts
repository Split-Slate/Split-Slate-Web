import { v4 as uuid } from "uuid";

import { writeActivity } from "@/features/activity/utils/activity-events";
import { db } from "@/shared/configs/db";
import { normalizeRequiredString } from "@/shared/utils/string-validation";

import type { LocalUser, Person } from "@/shared/types/domain.types";

import type { PeopleSlice, SliceCreator } from "./types";

export const createPeopleSlice: SliceCreator<PeopleSlice> = (set, get) => ({
  localUser: null,
  people: [],

  setLocalUser: async (name, icon) => {
    const existing = get().localUser;
    const normalizedName = normalizeRequiredString(name, "Name is required");
    const normalizedIcon = normalizeRequiredString(icon, "Icon is required");
    const user: LocalUser = {
      id: existing?.id ?? uuid(),
      name: normalizedName,
      icon: normalizedIcon,
    };
    const selfPerson: Person = { id: user.id, name: normalizedName, icon: normalizedIcon };
    const event = await db.transaction(
      "rw",
      db.localUser,
      db.people,
      db.activityEvents,
      async () => {
        await db.localUser.put(user);
        await db.people.put(selfPerson);
        return writeActivity({
          kind: "person",
          action: existing ? "updated" : "created",
          label: user.name,
          icon: user.icon,
          subjectId: user.id,
        });
      },
    );
    set((s) => ({
      activityEvents: [...s.activityEvents, event],
      localUser: user,
      people: s.people.some((p) => p.id === user.id)
        ? s.people.map((p) => (p.id === user.id ? selfPerson : p))
        : [...s.people, selfPerson],
    }));
    return user;
  },

  addPerson: async (name, icon) => {
    const person: Person = {
      id: uuid(),
      name: normalizeRequiredString(name, "Name is required"),
      icon: normalizeRequiredString(icon, "Icon is required"),
    };
    const event = await db.transaction("rw", db.people, db.activityEvents, async () => {
      await db.people.add(person);
      return writeActivity({
        kind: "person",
        action: "created",
        label: person.name,
        icon: person.icon,
        subjectId: person.id,
      });
    });
    set((s) => ({ people: [...s.people, person], activityEvents: [...s.activityEvents, event] }));
    return person;
  },

  updatePerson: async (personId, patch) => {
    const normalizedPatch: Partial<Omit<Person, "id">> = {
      ...patch,
      ...(patch.name !== undefined
        ? { name: normalizeRequiredString(patch.name, "Name is required") }
        : {}),
      ...(patch.icon !== undefined
        ? { icon: normalizeRequiredString(patch.icon, "Icon is required") }
        : {}),
    };
    const existing = get().people.find((p) => p.id === personId);
    if (!existing) {
      throw new Error("person not found");
    }
    const updated: Person = { ...existing, ...normalizedPatch };
    const event = await db.transaction("rw", db.people, db.activityEvents, async () => {
      if (!(await db.people.update(personId, normalizedPatch))) throw new Error("Person not found");
      return writeActivity({
        kind: "person",
        action: "updated",
        label: updated.name,
        icon: updated.icon,
        subjectId: personId,
      });
    });
    set((s) => ({
      people: s.people.map((p) => (p.id === personId ? updated : p)),
      activityEvents: [...s.activityEvents, event],
    }));
    return updated;
  },

  removePerson: async (personId) => {
    const result = await db.transaction(
      "rw",
      [
        db.localUser,
        db.people,
        db.members,
        db.groups,
        db.expenses,
        db.settlements,
        db.activityEvents,
      ],
      async () => {
        const localUser = await db.localUser.toCollection().first();
        if (personId === localUser?.id) {
          throw new Error("You cannot delete yourself from the people directory");
        }
        const person = await db.people.get(personId);
        if (!person) throw new Error("Person not found");
        const persistedMembers = await db.members.where("personId").equals(personId).toArray();
        const memberIds = persistedMembers.map((item) => item.id);
        const referencedIds = new Set(memberIds);
        if (
          (await db.expenses.toArray()).some(
            (expense) =>
              referencedIds.has(expense.createdBy) ||
              expense.transactions.paid.some((row) => referencedIds.has(row.memberId)) ||
              expense.transactions.owes.some((row) => referencedIds.has(row.memberId)),
          )
        ) {
          throw new Error("Cannot delete a person involved in expenses or payments");
        }
        if (
          (await db.settlements.toArray()).some(
            (item) =>
              referencedIds.has(item.fromMemberId) ||
              referencedIds.has(item.toMemberId) ||
              referencedIds.has(item.recordedBy),
          )
        ) {
          throw new Error("Cannot delete a person involved in payments");
        }
        await db.people.delete(personId);
        await db.members.bulkDelete(memberIds);
        const groups = await db.groups.toArray();
        for (const group of groups) {
          if (!group.frequentPayerIds.some((id) => referencedIds.has(id))) continue;
          const frequentPayerIds = group.frequentPayerIds.filter((id) => !referencedIds.has(id));
          await db.groups.update(group.id, { frequentPayerIds });
          group.frequentPayerIds = frequentPayerIds;
        }
        const event = await writeActivity({
          kind: "person",
          action: "deleted",
          label: person.name,
          icon: person.icon,
          subjectId: personId,
        });
        return { event, groups, memberIds };
      },
    );

    set((s) => ({
      activityEvents: [...s.activityEvents, result.event],
      people: s.people.filter((p) => p.id !== personId),
      members: s.members.filter((m) => m.personId !== personId && !result.memberIds.includes(m.id)),
      groups: result.groups,
    }));
  },
});
