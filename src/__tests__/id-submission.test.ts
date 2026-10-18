import { submitId } from "../lib/idVerification";
const mockRpc = jest.fn();
const mockUpload = jest.fn();
const mockInvoke = jest.fn();
jest.mock("../lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    storage: {
      from: () => ({ upload: (...args: unknown[]) => mockUpload(...args) }),
    },
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}));
beforeEach(() => {
  jest.resetAllMocks();
  mockRpc
    .mockResolvedValueOnce({ data: "fixture-request", error: null })
    .mockResolvedValueOnce({ error: null });
  mockUpload.mockResolvedValue({ error: null });
  jest
    .spyOn(global, "fetch")
    .mockResolvedValue({
      blob: async () => new Blob(["synthetic fixture, not an ID"]),
    } as Response);
});
afterEach(() => jest.restoreAllMocks());
const input = {
  userId: "fixture-user",
  role: "student" as const,
  schoolId: "fixture-school",
  schoolEmail: "a@example.test",
  image: { uri: "fixture://id", mimeType: "image/png" },
};
it.each([false, true])(
  "retains a queued upload when the auxiliary check fails, thrown=%s",
  async (throws) => {
    if (throws) mockInvoke.mockRejectedValue(new Error("network unavailable"));
    else
      mockInvoke.mockResolvedValue({
        error: new Error("function unavailable"),
      });
    await expect(submitId(input)).resolves.toEqual({
      requestId: "fixture-request",
      checkInvocationFailed: true,
    });
    expect(mockRpc.mock.calls.map((call) => call[0])).toEqual([
      "start_school_verification",
      "record_id_upload",
    ]);
    expect(mockUpload).toHaveBeenCalledTimes(1);
  },
);
it("does not claim the upload is saved when storage fails", async () => {
  mockUpload.mockResolvedValue({ error: new Error("Upload denied") });
  await expect(submitId(input)).rejects.toThrow("Upload denied");
  expect(mockInvoke).not.toHaveBeenCalled();
  expect(mockRpc).toHaveBeenCalledTimes(1);
});
