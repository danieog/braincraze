import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

const mockUseSession = jest.fn();
jest.mock("../lib/session", () => ({ useSession: () => mockUseSession() }));
jest.mock("../lib/location");
jest.mock("../lib/entitlements", () => ({ canUse: jest.fn(() => true) }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

import * as lib from "../lib/location";
import { canUse } from "../lib/entitlements";
import LocationScreen from "../app/location";

const m = lib as jest.Mocked<typeof lib>;
const ready = { status: "ready", userId: "u1" };
const profile = (over = {}) => ({ id: "u1", display_name: "Bob", share_location: false, ...over });

beforeEach(() => {
  jest.resetAllMocks();
  (canUse as jest.Mock).mockReturnValue(true);
  mockUseSession.mockReturnValue(ready);
  m.getOrCreateProfile.mockResolvedValue(profile());
  m.fetchNearby.mockResolvedValue([]);
});

const press = (label: string) => fireEvent.press(screen.getByLabelText(label));

it("shows loading state", async () => {
  mockUseSession.mockReturnValue({ status: "loading" });
  await render(<LocationScreen />);
  expect(screen.getByLabelText("Loading")).toBeTruthy();
});

it("shows session error", async () => {
  mockUseSession.mockReturnValue({ status: "error", message: "no supabase" });
  await render(<LocationScreen />);
  expect(screen.getByText("Something went wrong")).toBeTruthy();
  expect(screen.getByText("no supabase")).toBeTruthy();
});

it("shows locked state when the feature gate denies", async () => {
  (canUse as jest.Mock).mockReturnValue(false);
  await render(<LocationScreen />);
  expect(screen.getByText(/feature is locked/)).toBeTruthy();
});

it("loads profile and shows name; sharing off by default", async () => {
  await render(<LocationScreen />);
  await waitFor(() => expect(screen.getByDisplayValue("Bob")).toBeTruthy());
  expect(screen.getByLabelText("Turn on nearby")).toBeTruthy();
  expect(screen.queryByText("Nearby right now")).toBeNull();
  expect(m.startSharing).not.toHaveBeenCalled();
});

it("shows profile load error", async () => {
  m.getOrCreateProfile.mockRejectedValue(new Error("db down"));
  await render(<LocationScreen />);
  expect(await screen.findByText("db down")).toBeTruthy();
});

it("turning on shows nearby people", async () => {
  m.startSharing.mockResolvedValue({ ok: true });
  m.fetchNearby.mockResolvedValue([{ display_name: "Ann", distance_bucket: "~3 mi" }]);
  await render(<LocationScreen />);
  await screen.findByDisplayValue("Bob");
  await act(async () => press("Turn on nearby"));
  expect(await screen.findByText("Ann")).toBeTruthy();
  expect(screen.getByText("~3 mi")).toBeTruthy();
  expect(screen.getByLabelText("Turn off")).toBeTruthy();
});

it("shows empty-nearby message", async () => {
  m.startSharing.mockResolvedValue({ ok: true });
  await render(<LocationScreen />);
  await screen.findByDisplayValue("Bob");
  await act(async () => press("Turn on nearby"));
  expect(await screen.findByText(/No one nearby yet/)).toBeTruthy();
});

it("auto-refreshes when profile already shares", async () => {
  m.getOrCreateProfile.mockResolvedValue(profile({ share_location: true }));
  m.startSharing.mockResolvedValue({ ok: true });
  m.fetchNearby.mockResolvedValue([{ display_name: "Zed", distance_bucket: "~1 mi" }]);
  await render(<LocationScreen />);
  expect(await screen.findByText("Zed")).toBeTruthy();
  expect(m.startSharing).toHaveBeenCalledTimes(1);
});

it("blocked permission shows message and Open settings", async () => {
  m.startSharing.mockResolvedValue({ ok: false, reason: "blocked", message: "Blocked!" });
  await render(<LocationScreen />);
  await screen.findByDisplayValue("Bob");
  await act(async () => press("Turn on nearby"));
  expect(await screen.findByText("Blocked!")).toBeTruthy();
  await act(async () => press("Open settings"));
  expect(m.openAppSettings).toHaveBeenCalled();
  expect(screen.getByLabelText("Turn on nearby")).toBeTruthy();
});

it("denied permission shows message without Open settings", async () => {
  m.startSharing.mockResolvedValue({ ok: false, reason: "denied", message: "Nope" });
  await render(<LocationScreen />);
  await screen.findByDisplayValue("Bob");
  await act(async () => press("Turn on nearby"));
  expect(await screen.findByText("Nope")).toBeTruthy();
  expect(screen.queryByLabelText("Open settings")).toBeNull();
});

it("shows an error when fetchNearby throws (with non-Error value)", async () => {
  m.startSharing.mockResolvedValue({ ok: true });
  m.fetchNearby.mockRejectedValue("fetch failed");
  await render(<LocationScreen />);
  await screen.findByDisplayValue("Bob");
  await act(async () => press("Turn on nearby"));
  expect(await screen.findByText("fetch failed")).toBeTruthy();
});

it("turn off stops sharing and clears nearby", async () => {
  m.startSharing.mockResolvedValue({ ok: true });
  m.fetchNearby.mockResolvedValue([{ display_name: "Ann", distance_bucket: "~3 mi" }]);
  m.stopSharing.mockResolvedValue();
  await render(<LocationScreen />);
  await screen.findByDisplayValue("Bob");
  await act(async () => press("Turn on nearby"));
  await screen.findByText("Ann");
  await act(async () => press("Turn off"));
  await waitFor(() => expect(screen.queryByText("Ann")).toBeNull());
  expect(m.stopSharing).toHaveBeenCalled();
  expect(screen.getByLabelText("Turn on nearby")).toBeTruthy();
});

it("turn off failure shows error and stays on", async () => {
  m.startSharing.mockResolvedValue({ ok: true });
  m.stopSharing.mockRejectedValue(new Error("stop failed"));
  await render(<LocationScreen />);
  await screen.findByDisplayValue("Bob");
  await act(async () => press("Turn on nearby"));
  await screen.findByLabelText("Turn off");
  await act(async () => press("Turn off"));
  expect(await screen.findByText("stop failed")).toBeTruthy();
  expect(screen.getByLabelText("Turn off")).toBeTruthy();
});

it("Refresh re-fetches", async () => {
  m.startSharing.mockResolvedValue({ ok: true });
  await render(<LocationScreen />);
  await screen.findByDisplayValue("Bob");
  await act(async () => press("Turn on nearby"));
  await screen.findByLabelText("Refresh");
  await act(async () => press("Refresh"));
  expect(m.startSharing).toHaveBeenCalledTimes(2);
});

describe("display name", () => {
  it("saves the name and confirms", async () => {
    m.saveDisplayName.mockResolvedValue();
    await render(<LocationScreen />);
    const input = await screen.findByDisplayValue("Bob");
    await fireEvent.changeText(input, "  Newname ");
    await act(async () => press("Save name"));
    expect(m.saveDisplayName).toHaveBeenCalledWith("u1", "  Newname ");
    expect(await screen.findByText("Name saved.")).toBeTruthy();
  });

  it("shows error when save fails", async () => {
    m.saveDisplayName.mockRejectedValue(new Error("save failed"));
    await render(<LocationScreen />);
    const input = await screen.findByDisplayValue("Bob");
    await fireEvent.changeText(input, "X");
    await act(async () => press("Save name"));
    expect(await screen.findByText("save failed")).toBeTruthy();
  });

  it("disables save and does not call when blank", async () => {
    await render(<LocationScreen />);
    const input = await screen.findByDisplayValue("Bob");
    await fireEvent.changeText(input, "   ");
    await fireEvent.press(screen.getByLabelText("Save name"));
    expect(m.saveDisplayName).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Save name").props.accessibilityState.disabled).toBe(true);
  });

  it("limits the name to 24 characters", async () => {
    await render(<LocationScreen />);
    const input = await screen.findByDisplayValue("Bob");
    expect(input.props.maxLength).toBe(24);
  });
});

describe("unmount safety and odd errors", () => {
  it("ignores a profile that resolves after unmount", async () => {
    let resolve!: (p: any) => void;
    m.getOrCreateProfile.mockReturnValue(new Promise((r) => (resolve = r)));
    const view = await render(<LocationScreen />);
    await view.unmount();
    await act(async () => resolve(profile({ share_location: true })));
    expect(m.startSharing).not.toHaveBeenCalled();
  });

  it("ignores a profile error after unmount", async () => {
    let reject!: (e: any) => void;
    m.getOrCreateProfile.mockReturnValue(new Promise((_, r) => (reject = r)));
    const view = await render(<LocationScreen />);
    await view.unmount();
    await act(async () => reject(new Error("late")));
    expect(m.startSharing).not.toHaveBeenCalled();
  });

  it("shows string errors from stopSharing and saveDisplayName", async () => {
    m.startSharing.mockResolvedValue({ ok: true });
    m.stopSharing.mockRejectedValue("stop str");
    m.saveDisplayName.mockRejectedValue("save str");
    await render(<LocationScreen />);
    const input = await screen.findByDisplayValue("Bob");
    await fireEvent.changeText(input, "Z");
    await act(async () => press("Save name"));
    expect(await screen.findByText("save str")).toBeTruthy();
    await act(async () => press("Turn on nearby"));
    await screen.findByLabelText("Turn off");
    await act(async () => press("Turn off"));
    expect(await screen.findByText("stop str")).toBeTruthy();
  });

  it("does not save when the session is not ready", async () => {
    await render(<LocationScreen />);
    const input = await screen.findByDisplayValue("Bob");
    mockUseSession.mockReturnValue({ status: "loading" });
    await fireEvent.changeText(input, "Q");
    expect(m.saveDisplayName).not.toHaveBeenCalled();
  });
});
