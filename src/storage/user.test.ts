import { expect, test } from "bun:test";
import { securityAction } from "@/storage/auth-state";

test("an inactive security state deactivates the logged-in UI", () => {
  expect(securityAction("authenticated", { isActive: false, activeAddress: null }, false)).toEqual({
    kind: "deactivate",
  });
});

test("an active security state activates with its address", () => {
  expect(securityAction("inactive", { isActive: true, activeAddress: "0xabc" }, false)).toEqual({
    kind: "activate",
    address: "0xabc",
  });
});

test("the copying flow is left alone", () => {
  expect(securityAction("copying", { isActive: false, activeAddress: null }, false)).toEqual({
    kind: "none",
  });
  expect(securityAction("copying", { isActive: true, activeAddress: "0xabc" }, false)).toEqual({
    kind: "none",
  });
});

test("login activation is left to the explicit login path", () => {
  expect(securityAction("inactive", { isActive: false, activeAddress: null }, true)).toEqual({
    kind: "none",
  });
  expect(securityAction("inactive", { isActive: true, activeAddress: "0xabc" }, true)).toEqual({
    kind: "none",
  });
});
