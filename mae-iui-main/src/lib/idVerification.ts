import { supabase } from "./supabase";

export type School = { id: string; name: string };
export type Role =
  "student" | "faculty" | "teaching_assistant" | "tutor" | "staff";
export const ROLES: Role[] = [
  "student",
  "faculty",
  "teaching_assistant",
  "tutor",
  "staff",
];

export type QueueItem = {
  request_id: string;
  display_name: string | null;
  role: string;
  school_name: string;
  school_email: string | null;
  status: string;
  id_check_result: "pass" | "review" | null;
  id_check_reason: string | null;
  id_check_checks: Record<string, boolean> | null;
  id_path: string | null;
};

export async function listSchools(): Promise<School[]> {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// Starts a request, uploads the photo to the caller's own folder, queues it, then runs the check.
// Resolves with the request id. The check result is for admins only; the student just sees "under review".
export async function submitId(args: {
  userId: string;
  role: Role;
  schoolId: string;
  schoolEmail?: string | null;
  image: { uri: string; mimeType?: string | null };
}): Promise<{ requestId: string; checkInvocationFailed: boolean }> {
  const { data: requestId, error } = await supabase.rpc(
    "start_school_verification",
    {
      p_role: args.role,
      p_school_id: args.schoolId,
      p_school_email: args.schoolEmail?.trim() || null,
      p_method: "id_upload",
    },
  );
  if (error) throw error;

  const contentType =
    args.image.mimeType === "image/png" ? "image/png" : "image/jpeg";
  const path = `${args.userId}/${requestId}.${contentType === "image/png" ? "png" : "jpg"}`;
  // Upload raw bytes, not a Blob: for a Blob, storage-js sends the blob's own type (often text/plain from fetch)
  // and ignores contentType, so the bucket rejects it as an unsupported mime type.
  const bytes = await (await fetch(args.image.uri)).arrayBuffer();
  const upload = await supabase.storage
    .from("id-documents")
    // No upsert: the path is unique per request, and an upsert would also need select and update policies.
    .upload(path, bytes, { contentType });
  if (upload.error) throw upload.error;

  const queued = await supabase.rpc("record_id_upload", {
    p_request: requestId,
    p_path: path,
  });
  if (queued.error) throw queued.error;

  // Fire the check. If it fails, the request stays queued and an admin can still review it by hand.
  try {
    const check = await supabase.functions.invoke("verify-id", {
      body: { request_id: requestId },
    });
    return {
      requestId: requestId as string,
      checkInvocationFailed: Boolean(check.error),
    };
  } catch {
    // The upload is already queued. Report the check failure without asking for a duplicate upload.
    return { requestId: requestId as string, checkInvocationFailed: true };
  }
}

export async function fetchQueue(): Promise<QueueItem[]> {
  const { data, error } = await supabase.rpc("admin_queue");
  if (error) throw error;
  return data ?? [];
}

export async function imageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("id-documents")
    .createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

// Records the human decision, then deletes the uploaded image and clears its path.
export async function decide(
  requestId: string,
  decision: "approved" | "rejected",
  note?: string,
) {
  const { data: path, error } = await supabase.rpc("admin_decide", {
    p_request: requestId,
    p_decision: decision,
    p_note: note ?? null,
  });
  if (error) throw error;
  await deleteImage(requestId, path);
}

export async function requestReupload(requestId: string, note?: string) {
  const { data: path, error } = await supabase.rpc("admin_request_reupload", {
    p_request: requestId,
    p_note: note ?? null,
  });
  if (error) throw error;
  await deleteImage(requestId, path);
}

async function deleteImage(requestId: string, path: string | null) {
  if (!path) return;
  const removed = await supabase.storage.from("id-documents").remove([path]);
  if (removed.error) {
    throw new Error(
      `Decision saved, but the image could not be deleted (${path}): ${removed.error.message}`,
    );
  }
  const { error } = await supabase.rpc("clear_id_path", {
    p_request: requestId,
  });
  if (error) throw error;
}
