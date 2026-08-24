import { describe, it, expect } from "vitest";
import { evaluate } from "../pipeline/gates";

// Mirrors the #[cfg(test)] module in crates/whimpr-core/src/cleanup/gates.rs.

describe("gates", () => {
  it("light cleanup passes", () => {
    const raw = "um so i think we should uh meet at 3";
    const clean = "So I think we should meet at 3.";
    expect(evaluate(raw, clean, "light").pass).toBe(true);
  });

  it("dropping a number fails (LostEntity)", () => {
    const raw = "transfer 500 dollars to account 12345";
    const clean = "Transfer money to the account.";
    const v = evaluate(raw, clean, "light");
    expect(v.pass).toBe(false);
    if (!v.pass) expect(v.reason.kind).toBe("LostEntity");
  });

  it("answering a question is banned", () => {
    const raw = "what time is the standup";
    const clean = "Here is the standup schedule: 9am.";
    const v = evaluate(raw, clean, "light");
    expect(v.pass).toBe(false);
    if (!v.pass) expect(v.reason.kind).toBe("BannedPattern");
  });

  it("heavy rewrite exceeds light ceiling; mild rewrite passes", () => {
    const raw = "i went to the store and then i bought some milk and eggs and bread";
    const clean = "Purchased dairy and bakery goods.";
    expect(evaluate(raw, clean, "light").pass).toBe(false);
    const mild = "I went to the store and bought milk, eggs, and bread.";
    expect(evaluate(raw, mild, "light").pass).toBe(true);
  });

  it("over-deletion fails", () => {
    const raw = "the quarterly report is due on friday please review the budget section";
    const clean = "Report due Friday.";
    const v = evaluate(raw, clean, "medium");
    expect(v.pass).toBe(false);
    if (!v.pass) expect(v.reason.kind).toBe("OverDeletion");
  });

  it("none level always passes", () => {
    expect(evaluate("anything", "totally different", "none").pass).toBe(true);
  });
});
