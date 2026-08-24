import { describe, it, expect } from "vitest";
import {
  postProcess,
  preNormalizeLayout,
  assembleUserMessage,
  buildMessages,
} from "../pipeline/pipeline";
import { defaultContext } from "../pipeline/types";
import { FEW_SHOT } from "../pipeline/prompts";

// Mirrors the #[cfg(test)] module in crates/whimpr-core/src/cleanup/mod.rs.

describe("post_process", () => {
  it("strips a code fence", () => {
    expect(postProcess("```\nHello world\n```")).toBe("Hello world");
    expect(postProcess("```text\nHi there\n```")).toBe("Hi there");
  });

  it("converts leftover layout cues", () => {
    expect(postProcess("line one new line line two")).toBe("line one\nline two");
    expect(postProcess("Para one. new paragraph Para two.")).toBe("Para one.\n\nPara two.");
  });

  it("leaves ordinary text alone", () => {
    const s = "I actually really liked the new design.";
    expect(postProcess(s)).toBe(s);
  });

  it("caps blank lines", () => {
    expect(postProcess("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("restores a model-emitted sentinel", () => {
    expect(postProcess("Send me the address [[NL]] and the gate code.")).toBe(
      "Send me the address\nand the gate code.",
    );
  });
});

describe("pre_normalize_layout -> post_process round trip", () => {
  it("new line -> single break", () => {
    const norm = preNormalizeLayout("call me back at four thirty new line my desk number");
    expect(norm).toContain("[[NL]]");
    expect(postProcess(norm)).toBe("call me back at four thirty\nmy desk number");
  });

  it("new paragraph -> blank line", () => {
    const np = preNormalizeLayout("hey there new paragraph confirming friday");
    expect(postProcess(np)).toBe("hey there\n\nconfirming friday");
  });
});

describe("assemble_user_message", () => {
  it("wraps transcript and vocab", () => {
    const ctx = { ...defaultContext(), vocab: [{ correct: "Manvi", mishears: ["Monvi"] }] };
    const msg = assembleUserMessage("send it to monvi", ctx);
    expect(msg).toContain("<CUSTOM_VOCABULARY>");
    expect(msg).toContain("Manvi");
    expect(msg).toContain("<USER_MESSAGE>\nsend it to monvi\n</USER_MESSAGE>");
  });

  it("drops placeholder context", () => {
    const ctx = { ...defaultContext(), windowContext: "Reply...", appBundleId: "com.example" };
    const msg = assembleUserMessage("hello", ctx);
    expect(msg).not.toContain("WINDOW_CONTEXT");
  });
});

describe("build_messages", () => {
  it("emits system + few-shot pairs + final user turn", () => {
    const msgs = buildMessages("hello world", defaultContext());
    expect(msgs.length).toBe(FEW_SHOT.length * 2 + 2);
    expect(msgs[0].role).toBe("system");
    expect(msgs[msgs.length - 1].role).toBe("user");
    expect(msgs[msgs.length - 1].content).toContain("hello world");
  });
});
