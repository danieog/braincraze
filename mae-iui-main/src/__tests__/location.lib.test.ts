import { Linking, Platform } from "react-native";
import * as Location from "expo-location";

const mockRpc = jest.fn();
const mockFrom = jest.fn();
jest.mock("../lib/supabase", () => ({
  supabase: { rpc: (...a: any[]) => mockRpc(...a), from: (...a: any[]) => mockFrom(...a) },
}));
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

import {
  fetchNearby,
  getOrCreateProfile,
  openAppSettings,
  saveDisplayName,
  startSharing,
  stopSharing,
} from "../lib/location";

const L = Location as jest.Mocked<typeof Location>;

function selectChain(result: any) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  return { select, eq, maybeSingle };
}

beforeEach(() => {
  jest.resetAllMocks();
  Platform.OS = "ios";
});

describe("getOrCreateProfile", () => {
  it("returns an existing profile", async () => {
    const profile = { id: "u1", display_name: "Bob", share_location: true };
    const chain = selectChain({ data: profile, error: null });
    mockFrom.mockReturnValue({ select: chain.select });
    await expect(getOrCreateProfile("u1")).resolves.toEqual(profile);
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(chain.eq).toHaveBeenCalledWith("id", "u1");
  });

  it("throws on select error", async () => {
    const err = new Error("boom");
    mockFrom.mockReturnValue({ select: selectChain({ data: null, error: err }).select });
    await expect(getOrCreateProfile("u1")).rejects.toBe(err);
  });

  it("creates a profile with a random name, sharing off", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockFrom
      .mockReturnValueOnce({ select: selectChain({ data: null, error: null }).select })
      .mockReturnValueOnce({ insert });
    const p = await getOrCreateProfile("u2");
    expect(p.id).toBe("u2");
    expect(p.share_location).toBe(false);
    expect(p.display_name).toMatch(/^[A-Z][a-z]+ Possum \d{2}$/);
    expect(insert).toHaveBeenCalledWith(p);
  });

  it("throws on insert error", async () => {
    const err = new Error("insert fail");
    mockFrom
      .mockReturnValueOnce({ select: selectChain({ data: null, error: null }).select })
      .mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({ error: err }) });
    await expect(getOrCreateProfile("u2")).rejects.toBe(err);
  });
});

describe("saveDisplayName", () => {
  function updateChain(error: any) {
    const eq = jest.fn().mockResolvedValue({ error });
    const update = jest.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ update });
    return { update, eq };
  }
  it("trims and saves", async () => {
    const c = updateChain(null);
    await saveDisplayName("u1", "  Ann  ");
    expect(c.update).toHaveBeenCalledWith({ display_name: "Ann" });
    expect(c.eq).toHaveBeenCalledWith("id", "u1");
  });
  it("throws on error", async () => {
    const err = new Error("nope");
    updateChain(err);
    await expect(saveDisplayName("u1", "x")).rejects.toBe(err);
  });
});

describe("startSharing", () => {
  const granted = { status: "granted", canAskAgain: true } as any;

  it("uploads the position on success", async () => {
    L.requestForegroundPermissionsAsync.mockResolvedValue(granted);
    L.hasServicesEnabledAsync.mockResolvedValue(true);
    L.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: 1.5, longitude: 2.5 } } as any);
    mockRpc.mockResolvedValue({ error: null });
    await expect(startSharing()).resolves.toEqual({ ok: true });
    expect(L.getCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: 3 });
    expect(mockRpc).toHaveBeenCalledWith("set_location", { p_lat: 1.5, p_lng: 2.5 });
  });

  it("reports denied when it can ask again", async () => {
    L.requestForegroundPermissionsAsync.mockResolvedValue({ status: "denied", canAskAgain: true } as any);
    const r = await startSharing();
    expect(r).toMatchObject({ ok: false, reason: "denied" });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("reports blocked with settings message on native", async () => {
    L.requestForegroundPermissionsAsync.mockResolvedValue({ status: "denied", canAskAgain: false } as any);
    const r: any = await startSharing();
    expect(r.reason).toBe("blocked");
    expect(r.message).toMatch(/Open Settings/);
  });

  it("reports blocked with browser message on web", async () => {
    Platform.OS = "web";
    L.requestForegroundPermissionsAsync.mockResolvedValue({ status: "denied", canAskAgain: false } as any);
    const r: any = await startSharing();
    expect(r.reason).toBe("blocked");
    expect(r.message).toMatch(/browser/);
  });

  it("reports unavailable when services are off", async () => {
    L.requestForegroundPermissionsAsync.mockResolvedValue(granted);
    L.hasServicesEnabledAsync.mockResolvedValue(false);
    expect(await startSharing()).toMatchObject({ ok: false, reason: "unavailable" });
    expect(L.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it("returns rpc error message", async () => {
    L.requestForegroundPermissionsAsync.mockResolvedValue(granted);
    L.hasServicesEnabledAsync.mockResolvedValue(true);
    L.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: 0, longitude: 0 } } as any);
    mockRpc.mockResolvedValue({ error: { message: "rpc bad" } });
    expect(await startSharing()).toEqual({ ok: false, reason: "error", message: "rpc bad" });
  });

  it("catches thrown errors (with and without message)", async () => {
    L.requestForegroundPermissionsAsync.mockRejectedValueOnce(new Error("kaput"));
    expect(await startSharing()).toEqual({ ok: false, reason: "error", message: "kaput" });
    L.requestForegroundPermissionsAsync.mockRejectedValueOnce("plain");
    expect(await startSharing()).toEqual({ ok: false, reason: "error", message: "plain" });
  });
});

describe("stopSharing", () => {
  it("calls stop_sharing", async () => {
    mockRpc.mockResolvedValue({ error: null });
    await stopSharing();
    expect(mockRpc).toHaveBeenCalledWith("stop_sharing");
  });
  it("throws on error", async () => {
    const err = new Error("x");
    mockRpc.mockResolvedValue({ error: err });
    await expect(stopSharing()).rejects.toBe(err);
  });
});

describe("fetchNearby", () => {
  it("requests 25 miles in metres and returns rows", async () => {
    const rows = [{ display_name: "A", distance_bucket: "~5 mi" }];
    mockRpc.mockResolvedValue({ data: rows, error: null });
    await expect(fetchNearby()).resolves.toEqual(rows);
    expect(mockRpc).toHaveBeenCalledWith("nearby_users", { radius_m: 40234 });
  });
  it("returns [] for null data", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    await expect(fetchNearby()).resolves.toEqual([]);
  });
  it("throws on error", async () => {
    const err = new Error("e");
    mockRpc.mockResolvedValue({ data: null, error: err });
    await expect(fetchNearby()).rejects.toBe(err);
  });
});

describe("openAppSettings", () => {
  it("opens settings on native", () => {
    const spy = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    openAppSettings();
    expect(spy).toHaveBeenCalled();
  });
  it("does nothing on web", () => {
    Platform.OS = "web";
    const spy = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    openAppSettings();
    expect(spy).not.toHaveBeenCalled();
  });
});
