import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Shield,
  Eye,
  FileCheck,
} from "lucide-react";
import { getAdminQueue, adminDecide, adminRequestReupload } from "../lib/store";

interface Props {
  onRefresh: () => void;
}

export const AdminReviewView: React.FC<Props> = ({ onRefresh }) => {
  const queue = getAdminQueue();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleDecide = async (requestId: string, decision: "approved" | "rejected") => {
    setBusyId(requestId);
    setNotice(null);

    try {
      await adminDecide(requestId, decision);
      setNotice(
        decision === "approved"
          ? "Decision saved: Approved. Verified badge awarded, and ID photo was permanently deleted from storage."
          : "Decision saved: Rejected. Applicant notified and ID photo was permanently deleted.",
      );
      onRefresh();
    } catch {
      setNotice("Failed to record decision.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReupload = async (requestId: string) => {
    setBusyId(requestId);
    setNotice(null);

    try {
      await adminRequestReupload(requestId);
      setNotice("Requested replacement photo from applicant. Previous image was cleaned up.");
      onRefresh();
    } catch {
      setNotice("Failed to request re-upload.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B2F5C]">
            ID review
          </h1>
          <span className="px-3 py-1 bg-[#E3D9FF] text-[#3B2F5C] text-xs font-bold rounded-full">
            {queue.length} pending
          </span>
        </div>
        <p className="text-sm sm:text-base text-[#4A4458] leading-relaxed">
          The automatic check is only a hint. Nothing is rejected without a person deciding.
          The photo is deleted when you record a decision.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      {/* Queue items */}
      {queue.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E3D9FF] text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#F3EEFF] text-[#6B4FBB] flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#3B2F5C]">
            Nothing waiting for review
          </h3>
          <p className="text-sm text-[#4A4458] max-w-sm mx-auto">
            All submitted school IDs have been reviewed and their images safely deleted.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <div
              key={item.request_id}
              className="bg-[#F3EEFF] border border-[#D9D0E8] rounded-2xl p-5 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9D0E8] pb-3">
                <div>
                  <h3 className="font-bold text-base text-[#2B2340]">
                    {item.display_name || "Unnamed"} ·{" "}
                    <span className="capitalize">{item.role.replace("_", " ")}</span> ·{" "}
                    {item.school_name}
                  </h3>
                  <p className="text-xs text-[#4A4458] mt-0.5">{item.school_email}</p>
                </div>
                <span className="text-[11px] font-mono bg-white text-[#4A4458] px-2 py-0.5 rounded border border-[#D9D0E8] self-start sm:self-auto">
                  {item.request_id}
                </span>
              </div>

              {/* Automated Check breakdown */}
              <div className="p-3.5 bg-white/80 rounded-xl border border-[#D9D0E8]/70 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3B2F5C]">
                  <Shield className="w-3.5 h-3.5 text-[#6B4FBB]" />
                  Auto check: {item.id_check_result || "not run yet"}
                  {item.id_check_reason ? ` (${item.id_check_reason})` : ""}
                </div>

                {item.id_check_checks && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    {Object.entries(item.id_check_checks).map(([k, v]) => (
                      <div
                        key={k}
                        className={`flex items-center gap-1 font-medium ${
                          v ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {v ? "✓" : "✗"} {k.replace(/_/g, " ")}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ID Photo */}
              {item.id_path && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#4A4458] flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> ID photo document
                  </div>
                  <div className="rounded-xl overflow-hidden border border-[#D9D0E8] bg-white p-2">
                    <img
                      src={item.id_path}
                      alt="Uploaded School ID"
                      className="w-full max-h-72 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Decision Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleDecide(item.request_id, "approved")}
                  disabled={busyId === item.request_id}
                  className="px-4 py-2.5 bg-[#6B4FBB] hover:bg-[#583da7] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve & Delete Photo
                </button>

                <button
                  onClick={() => handleDecide(item.request_id, "rejected")}
                  disabled={busyId === item.request_id}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Reject & Delete Photo
                </button>

                <button
                  onClick={() => handleReupload(item.request_id)}
                  disabled={busyId === item.request_id}
                  className="px-4 py-2.5 bg-white border border-[#D9D0E8] hover:bg-gray-50 text-[#3B2F5C] rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Ask to re-upload
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
