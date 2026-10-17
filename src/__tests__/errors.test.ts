import { errorText } from "../lib/errors";

it("uses the message of an Error", () => expect(errorText(new Error("hi"))).toBe("hi"));
it("stringifies non-errors", () => {
  expect(errorText("plain")).toBe("plain");
  expect(errorText(null)).toBe("null");
  expect(errorText(undefined)).toBe("undefined");
});
