(() => {
  "use strict";

  const story = window.SplitSlateStory;
  const { data } = story;
  const ICONS = {
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    overview:
      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    expenses:
      '<path d="M6 3l2 1 2-1 2 1 2-1 2 1 2-1v18l-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M9 8h6m-6 4h6m-6 4h4"/>',
    members:
      '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 6"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  };
  const icon = (name) => `<svg class="ss-ui-icon" viewBox="0 0 24 24" aria-hidden="true">
    ${ICONS[name]}</svg>`;
  const action = (label) => `<div class="ss-app-card-action"><span>${label}</span>
    ${icon("arrow")}</div>`;

  const createPhone = () => {
    const element = document.createElement("div");
    element.className = "ss-phone";
    element.innerHTML = `
      <div class="ss-phone-shell">
        <div class="ss-phone-screen">
          <div class="ss-phone-status"><span>9:41</span><span>▂▄▆ ▰</span></div>
          <div class="ss-phone-camera"></div>
          <div class="ss-app-header">
            <div class="ss-app-back">${icon("back")}<span>Back to dashboard</span></div>
            <div class="ss-phone-group"><span class="ss-group-picture">🌙</span>
              <div class="ss-group-copy"><strong>Friday with friends</strong>
                <div class="ss-group-summary">3 members · <span data-story-count>0</span> expenses ·
                  <span data-story-total>$0.00</span> total · USD</div></div></div>
            <div class="ss-auto-math">
              <svg class="ss-calculation-track" viewBox="0 0 235 2">
                <path d="M0 1H235" pathLength="1"/></svg>
            </div>
          </div>
          <div class="ss-app-viewport">
            <div class="ss-phone-document">
              <div class="ss-position-card">
                <span class="ss-position-label">YOUR POSITION IN THIS GROUP</span>
                <strong data-story-position>$0.00</strong>
                <span class="ss-position-description" data-story-position-note>All square in this group</span>
              </div>
              <div class="ss-at-a-glance"><strong>At a glance</strong>
                <div class="ss-add-expense">${icon("plus")}<span>Add expense</span></div></div>
              <div class="ss-phone-content">
                <div class="ss-phone-members">
                  <div class="ss-ui-heading">Members</div>
                  <div class="ss-member-chips">${data.members
                    .map(
                      (member) => `
                    <div class="ss-member-chip" data-member="${member.id}">
                      <span class="ss-avatar ss-avatar-${member.color}">${member.avatar}</span>
                      <span>${member.name}</span></div>`,
                    )
                    .join("")}</div>
                  ${action(`Manage Members (${data.members.length})`)}
                </div>
                <div class="ss-phone-settlements">
                  <div class="ss-ui-heading">Suggested transfers</div>
                  <div class="ss-transfer-rows">${data.transfers
                    .map(
                      (transfer, index) => `
                    <div class="ss-settlement-card" data-settlement="${index}">
                      <div class="ss-transfer-person"><span>${transfer.from.name}</span>
                        <svg class="ss-transfer-line" viewBox="0 0 16 16">
                          <path d="M2 8h12m-5-5 5 5-5 5" pathLength="1"/></svg>
                        <span>${transfer.to.name}</span></div>
                      <strong>${data.formatMoney(transfer.cents)}</strong>
                    </div>`,
                    )
                    .join("")}</div>
                  <div class="ss-transfer-action">${action(`View all balances (${data.transfers.length})`)}</div>
                </div>
                <div class="ss-phone-expenses">
                  <div class="ss-recent-heading"><div class="ss-ui-heading">Recent transactions</div>
                    <div class="ss-view-transactions">View all (<span data-story-count>0</span>) ${icon("arrow")}</div></div>
                  ${data.expenses
                    .map(
                      (expense) => `
                    <div class="ss-expense-card" data-expense-card="${expense.id}">
                      <span class="ss-expense-icon">${expense.avatar}</span>
                      <div class="ss-expense-copy">
                        <span class="ss-target-title" data-target="${expense.id}-title">${expense.name}</span>
                        <span class="ss-expense-meta">${expense.category} · equal</span>
                        <span class="ss-target-amount" data-target="${expense.id}-amount">${data.formatMoney(expense.cents)}</span>
                        <span class="ss-expense-payer">${data.memberName(expense.payer)} paid · 3 participants</span>
                      </div>
                    </div>`,
                    )
                    .join("")}
                </div>
              </div>
            </div>
          </div>
          <div class="ss-phone-nav">
            <div class="ss-phone-nav-item ss-phone-nav-active">${icon("overview")}<span>Overview</span></div>
            <div class="ss-phone-nav-item">${icon("expenses")}<span>Expenses</span></div>
            <div class="ss-phone-nav-item ss-phone-nav-add"><span class="ss-nav-add-icon">${icon("plus")}</span><span>Add</span></div>
            <div class="ss-phone-nav-item">${icon("members")}<span>Members</span></div>
            <div class="ss-phone-nav-item">${icon("more")}<span>More</span></div>
          </div>
          <div class="ss-phone-home"></div>
        </div>
      </div>
      <span class="ss-phone-side-key"></span>`;
    return element;
  };

  story.createPhone = createPhone;
})();
