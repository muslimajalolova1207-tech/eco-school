
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Submission = {
  id: number;
  challenge_id: number;
  student_id: string;
  proof_text: string | null;
  proof_url: string | null;
  status: "pending" | "approved" | "rejected";
  awarded_points: number;
  submitted_at: string;
  challenges: {
    title: string;
    points: number;
  } | null;
  profiles: {
    full_name: string | null;
    class_name: string | null;
  } | null;
};

export default function AdminPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});

  async function loadSubmissions() {
    const supabase = createClient();

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      setError("Bu sahifaga faqat admin kira oladi.");
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("challenge_submissions")
      .select(`
        id,
        challenge_id,
        student_id,
        proof_text,
        proof_url,
        status,
        awarded_points,
        submitted_at,
        challenges (title, points),
        profiles (full_name, class_name)
      `)
      .order("submitted_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const submissions = (data || []) as unknown as Submission[];
    setItems(submissions);

    const urls: Record<number, string> = {};

    for (const item of submissions) {
      if (!item.proof_url) continue;

      const { data: signedData, error: signedError } = await supabase.storage
        .from("challenge-proofs")
        .createSignedUrl(item.proof_url, 60 * 10);

      if (!signedError && signedData) {
        urls[item.id] = signedData.signedUrl;
      }
    }

    setImageUrls(urls);
    setLoading(false);
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function reviewSubmission(
    item: Submission,
    status: "approved" | "rejected"
  ) {
    const confirmed = window.confirm(
      status === "approved"
        ? "Bu topshiriqni tasdiqlaysizmi? Ballar avtomatik qo‘shiladi."
        : "Bu topshiriqni rad etasizmi?"
    );

    if (!confirmed) return;

    setBusyId(item.id);
    setMessage("");
    setError("");

    const supabase = createClient();

    const { data, error: updateError } = await supabase
      .from("challenge_submissions")
      .update({ status })
      .eq("id", item.id)
      .eq("status", "pending")
      .select("id");

    if (updateError) {
      setError(updateError.message);
    } else if (!data || data.length === 0) {
      setError("Topshiriq allaqachon ko‘rib chiqilgan.");
    } else {
      setMessage(
        status === "approved"
          ? "Topshiriq tasdiqlandi. Ballar qo‘shildi."
          : "Topshiriq rad etildi."
      );
      await loadSubmissions();
    }

    setBusyId(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7f0] p-10">
        Admin panel yuklanmoqda...
      </main>
    );
  }

  if (error && items.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5f7f0] p-10">
        <h1 className="text-2xl font-bold">Admin panel</h1>
        <p className="mt-4 text-red-700">{error}</p>
        <a href="/" className="mt-6 inline-block text-green-800 underline">
          Bosh sahifaga qaytish
        </a>
      </main>
    );
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
            Admin panel
          </h1>
          <p className="mt-3 text-gray-600">
            O‘quvchilar yuborgan ekologik topshiriqlarni tekshiring.
          </p>
        </header>

        {message && (
          <p className="mt-6 rounded-xl bg-green-50 p-4 text-green-800">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        <section className="mt-10 space-y-5">
          {items.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-gray-600">
              Hozircha yuborilgan topshiriqlar yo‘q.
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[#e5e9df] bg-white p-7 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#253b2b]">
                      {item.challenges?.title || "Challenge"}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                      {item.profiles?.full_name || "Noma’lum o‘quvchi"}
                      {" · "}
                      {item.profiles?.class_name || "Sinf ko‘rsatilmagan"}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-4 py-2 text-sm">
                    {item.status === "pending"
                      ? "Tekshirilmoqda"
                      : item.status === "approved"
                        ? "Tasdiqlangan"
                        : "Rad etilgan"}
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-[#f7f8f4] p-4">
                  <p className="text-sm text-gray-500">O‘quvchi izohi</p>
                  <p className="mt-2 whitespace-pre-wrap text-gray-800">
                    {item.proof_text || "Izoh kiritilmagan"}
                  </p>
                </div>

                {imageUrls[item.id] && (
                  <img
                    src={imageUrls[item.id]}
                    alt="Challenge dalili"
                    className="mt-5 max-h-80 rounded-2xl object-contain"
                  />
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <p className="font-semibold text-green-800">
                    {item.challenges?.points ?? 0} ball
                  </p>

                  {item.status === "pending" && (
                    <div className="flex gap-3">
                      <button
                        disabled={busyId === item.id}
                        onClick={() => reviewSubmission(item, "rejected")}
                        className="rounded-xl border border-red-200 px-5 py-3 text-red-700 disabled:opacity-50"
                      >
                        Rad etish
                      </button>
                      <button
                        disabled={busyId === item.id}
                        onClick={() => reviewSubmission(item, "approved")}
                        className="rounded-xl bg-[#315b3b] px-5 py-3 text-white disabled:opacity-50"
                      >
                        {busyId === item.id ? "Kutilmoqda..." : "Tasdiqlash"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
