
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Challenge = {
  id: number;
  title: string;
  description: string;
  category: string;
  points: number;
  end_date: string | null;
};

type Submission = {
  id: number;
  challenge_id: number;
  proof_text: string | null;
  status: "pending" | "approved" | "rejected";
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        window.location.href = "/login";
        return;
      }

      const [challengeResult, submissionResult] = await Promise.all([
        supabase.from("challenges").select("*").order("created_at"),
        supabase
          .from("challenge_submissions")
          .select("id, challenge_id, proof_text, status")
          .eq("student_id", authData.user.id),
      ]);

      if (challengeResult.error) {
        setError(challengeResult.error.message);
      } else {
        setChallenges(challengeResult.data || []);
      }

      if (submissionResult.error) {
        setError(submissionResult.error.message);
      } else {
        setSubmissions(submissionResult.data || []);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  async function submitChallenge() {
    if (!selected) return;

    if (!proofText.trim() && !proofFile) {
      setMessage("Iltimos, izoh yoki rasm qo‘shing.");
      return;
    }

    if (proofFile) {
      const allowed = ["image/jpeg", "image/png", "image/webp"];

      if (!allowed.includes(proofFile.type)) {
        setMessage("Faqat JPG, PNG yoki WebP rasm yuklang.");
        return;
      }

      if (proofFile.size > 50 * 1024 * 1024) {
        setMessage("Rasm hajmi 50 MB dan oshmasligi kerak.");
        return;
      }
    }

    setSending(true);
    setMessage("");

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setMessage("Iltimos, avval tizimga kiring.");
      setSending(false);
      return;
    }

    let proofUrl: string | null = null;

    try {
      if (proofFile) {
        const compressedFile = await compressImage(proofFile);
        const filePath =
          `${authData.user.id}/${selected.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("challenge-proofs")
          .upload(filePath, compressedFile, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        proofUrl = filePath;
      }

      const { error: insertError } = await supabase
        .from("challenge_submissions")
        .insert({
          challenge_id: selected.id,
          student_id: authData.user.id,
          proof_text: proofText.trim() || null,
          proof_url: proofUrl,
          status: "pending",
          awarded_points: 0,
        });

      if (insertError) throw insertError;

      setMessage("Topshirig‘ingiz yuborildi! Tekshiruvdan so‘ng natija chiqadi.");
      setProofText("");
      setProofFile(null);
      setSelected(null);

      const { data } = await supabase
        .from("challenge_submissions")
        .select("id, challenge_id, proof_text, status")
        .eq("student_id", authData.user.id);

      setSubmissions(data || []);
    } catch (err) {
      console.error("SUBMISSION ERROR:", err);
      setMessage(
        err instanceof Error ? err.message : "Yuborishda xatolik yuz berdi."
      );
    } finally {
      setSending(false);
    }
  }

  async function compressImage(file: File): Promise<Blob> {
    const imageUrl = URL.createObjectURL(file);

    try {
      const image = new Image();
      image.src = imageUrl;

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Rasmni o‘qib bo‘lmadi."));
      });

      const maxDimension = 1600;
      const scale = Math.min(
        1,
        maxDimension / Math.max(image.width, image.height)
      );

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Rasmni qayta ishlash imkoni bo‘lmadi.");

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) =>
            blob
              ? resolve(blob)
              : reject(new Error("Rasmni kichraytirib bo‘lmadi.")),
          "image/jpeg",
          0.8
        );
      });
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  function statusLabel(status: Submission["status"]) {
    if (status === "approved") return "Tasdiqlangan";
    if (status === "rejected") return "Rad etilgan";
    return "Tekshirilmoqda";
  }

  if (loading) {
    return <main className="p-10">Yuklanmoqda...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7f0] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-sm text-green-800 hover:underline">
          ← Bosh sahifa
        </a>

        <header className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            ECO SCHOOL
          </p>
          <h1 className="mt-3 text-4xl font-bold text-[#253b2b]">
            Eco Challenges
          </h1>
          <p className="mt-4 text-gray-600">
            Har bir kichik harakatingiz maktabingiz uchun ijobiy o‘zgarishdir.
          </p>
        </header>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-6 rounded-xl bg-green-50 p-4 text-green-800">
            {message}
          </p>
        )}

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          {challenges.map((challenge) => {
            const submission = submissions.find(
              (item) => item.challenge_id === challenge.id
            );

            return (
              <article
                key={challenge.id}
                className="rounded-3xl border border-[#e5e9df] bg-white p-7 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-green-50 px-4 py-2 text-sm text-green-800">
                    {challenge.category}
                  </span>
                  <span className="font-semibold text-green-800">
                    +{challenge.points} ball
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-semibold text-[#253b2b]">
                  {challenge.title}
                </h2>
                <p className="mt-3 leading-7 text-gray-600">
                  {challenge.description}
                </p>

                {challenge.end_date && (
                  <p className="mt-4 text-sm text-gray-500">
                    Tugash sanasi: {challenge.end_date}
                  </p>
                )}

                {submission ? (
                  <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                    Holat: {statusLabel(submission.status)}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelected(challenge);
                      setMessage("");
                    }}
                    className="mt-6 rounded-xl bg-[#315b3b] px-6 py-3 font-medium text-white hover:bg-[#25482e]"
                  >
                    Men bajardim
                  </button>
                )}
              </article>
            );
          })}
        </section>

        {selected && (
          <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4">
            <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-7 shadow-xl">
              <h2 className="text-2xl font-bold text-[#253b2b]">
                Challenge topshirish
              </h2>
              <p className="mt-2 text-gray-600">{selected.title}</p>

              <label className="mt-6 block text-sm font-medium text-gray-700">
                Qanday bajardingiz?
              </label>
              <textarea
                value={proofText}
                onChange={(event) => setProofText(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Bajargan ishingiz haqida yozing..."
                className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-green-700"
              />

              <label className="mt-5 block text-sm font-medium text-gray-700">
                Rasm dalili (ixtiyoriy)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setProofFile(event.target.files?.[0] || null)
                }
                className="mt-2 block w-full text-sm"
              />

              {proofFile && (
                <p className="mt-2 text-sm text-gray-500">
                  Tanlangan fayl: {proofFile.name}
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => setSelected(null)}
                  disabled={sending}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-gray-700"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={submitChallenge}
                  disabled={sending}
                  className="rounded-xl bg-[#315b3b] px-5 py-3 font-medium text-white disabled:opacity-50"
                >
                  {sending ? "Yuborilmoqda..." : "Yuborish"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
