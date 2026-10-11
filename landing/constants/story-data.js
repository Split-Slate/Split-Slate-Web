(() => {
  "use strict";

  const story = (window.SplitSlateStory = window.SplitSlateStory || {});
  const LOCAL_MEMBER_ID = "maya";
  const MEMBERS = Object.freeze([
    Object.freeze({ id: "maya", name: "Maya", initial: "M", avatar: "🌸", color: "violet" }),
    Object.freeze({ id: "leo", name: "Leo", initial: "L", avatar: "🦊", color: "peach" }),
    Object.freeze({ id: "nina", name: "Nina", initial: "N", avatar: "🐰", color: "sage" }),
  ]);
  const EXPENSES = Object.freeze([
    Object.freeze({
      id: "dinner",
      name: "Dinner",
      cents: 12000,
      payer: "maya",
      category: "Food & Drinks",
      avatar: "🍽️",
    }),
    Object.freeze({
      id: "taxi",
      name: "Taxi",
      cents: 3000,
      payer: "leo",
      category: "Transport",
      avatar: "🚕",
    }),
  ]);

  // Independent, fictional marketing data. Never import the app store or open IndexedDB.
  // Allocate integer cents, including remainders, before deriving any suggested transfers.
  const balances = new Map(MEMBERS.map((member) => [member.id, 0]));
  const entryStates = [Object.freeze({ total: 0, count: 0, position: 0 })];
  EXPENSES.forEach((expense) => {
    const share = Math.floor(expense.cents / MEMBERS.length);
    const remainder = expense.cents % MEMBERS.length;
    MEMBERS.forEach((member, index) => {
      balances.set(member.id, balances.get(member.id) - share - Number(index < remainder));
    });
    balances.set(expense.payer, balances.get(expense.payer) + expense.cents);
    const previous = entryStates.at(-1);
    entryStates.push(Object.freeze({
      total: previous.total + expense.cents,
      count: previous.count + 1,
      position: balances.get(LOCAL_MEMBER_ID),
    }));
  });

  const creditors = MEMBERS.filter((member) => balances.get(member.id) > 0).map((member) => ({
    ...member,
    remaining: balances.get(member.id),
  }));
  const transfers = [];
  MEMBERS.filter((member) => balances.get(member.id) < 0).forEach((member) => {
    let remaining = -balances.get(member.id);
    creditors.forEach((creditor) => {
      const cents = Math.min(remaining, creditor.remaining);
      if (cents === 0) return;
      transfers.push(Object.freeze({ from: member, to: creditor, cents }));
      remaining -= cents;
      creditor.remaining -= cents;
    });
  });

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  story.data = Object.freeze({
    members: MEMBERS,
    expenses: EXPENSES,
    transfers: Object.freeze(transfers),
    entryStates: Object.freeze(entryStates),
    localMemberId: LOCAL_MEMBER_ID,
    total: EXPENSES.reduce((sum, expense) => sum + expense.cents, 0),
    formatMoney: (cents) => formatter.format(cents / 100),
    memberName: (id) => MEMBERS.find((member) => member.id === id).name,
    appUrl: "https://split-slate.netlify.app/",
  });
})();
