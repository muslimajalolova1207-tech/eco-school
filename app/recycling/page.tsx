
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type RecyclingSubmission = {
  id: number;
  material: "paper" | "plastic";
  amount_kg: number;
  status: "pending" | "approved" | "rejected";
  awarded_points: number;
  submitted_at: string;
};

export default function RecyclingPage() {
  const [supabase] = useState(() => createClient());
  const [material, setMaterial] = useState<"paper" | "plastic">("paper");
  const [amount, setAmount] = useState("");
  const [submissions, setSubmissions] = useState<RecyclingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSubmissions() {
    const { data, error } = await supabase
      .from("recycling_submissions")
      .select("id, material, amount_kg, status, awarded_points, submitted_at")
      .order("submitted_at", { ascending: false });

    if (error) {
      setMessage("Ma'lumotlarni yuklashda xatolik: " + error.message);
    } else {
      setSubmissions(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function submitRecycling(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const kg = Number(amount);

    if (!Number.isFinite(kg) || kg <= 0) {
      setMessage("Iltimos, to‘g‘ri vazn kiriting.");
      return;
    }

    setSending(true);

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setMessage("Davom etish uchun tizimga kiring.");
      setSending(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile?.school_id) {
      setMessage("Profilingizga maktab biriktirilmagan.");
      setSending(false);
      return;
    }

    const { error } = await supabase
      .from("recycling_submissions")
      .insert({
        school_id: profile.school_id,
        student_id: authData.user.id,
        material,
        amount_kg: kg,
      });

    if (error) {
      setMessage("Yuborishda xatolik: " + error.message);
    } else {
      setMessage("Topshirig‘ingiz yuborildi! Eco Team tasdiqlashini kuting.");
      setAmount("");
      await loadSubmissions();
    }

    setSending(false);
  }

  const statusText = {
    pending: "Tekshirilmoqda",
    approved: "Tasdiqlandi",
    rejected: "Rad etildi",
  };

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-5 py-10 text-[#24352b]">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-medium text-green-800">
          ← Bosh sahifa
        </a>

        <header className="mb-8 mt-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            ECO SCHOOL · RECYCLING
          </p>
          <h1 className="mt-3 text-4xl font-bold">Chiqindini resursga aylantiring.</h1>
          <p className="mt-3 text-[#66746a]">
            Qog‘oz va plastikni qayta ishlashga topshiring, natijangizni maktab
            ekologik ta’siriga qo‘shing.
          </p>
        </header>

        <form
          onSubmit={submitRecycling}
          className="rounded-3xl border border-[#e3e9df] bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-semibold">Yangi topshiruv</h2>

          <p className="mb-3 mt-5 text-sm font-medium">Chiqindi turi</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMaterial("paper")}
              className={`rounded-2xl border p-4 text-left ${
                material === "paper"
                  ? "border-green-700 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <span className="text-3xl">📄</span>
              <span className="mt-2 block font-semibold">Qog‘oz</span>
              <span className="text-sm text-gray-500">1 kg = 10 ball</span>
            </button>

            <button
              type="button"
              onClick={() => setMaterial("plastic")}
              className={`rounded-2xl border p-4 text-left ${
                material === "plastic"
                  ? "border-green-700 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <span className="text-3xl">♻️</span>
              <span className="mt-2 block font-semibold">Plastik</span>
              <span className="text-sm text-gray-500">1 kg = 15 ball</span>
            </button>
          </div>

          <label className="mb-2 mt-6 block text-sm font-medium">
            Taxminiy vazn (kg)
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Masalan: 2.5"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-700"
            required
          />

          <p className="mt-2 text-xs text-gray-500">
            Yakuniy vaznni Eco Team a’zosi tekshiradi.
          </p>

          <button
            type="submit"
            disabled={sending}
            className="mt-6 w-full rounded-xl bg-green-800 px-5 py-3 font-semibold text-white transition hover:bg-green-900 disabled:opacity-50"
          >
            {sending ? "Yuborilmoqda..." : "Topshiruvni yuborish"}
          </button>

          {message && (
            <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-900">
              {message}
            </p>
          )}
        </form>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">Mening topshiriqlarim</h2>

          {loading ? (
            <p className="text-gray-500">Yuklanmoqda...</p>
          ) : submissions.length === 0 ? (
            <p className="rounded-2xl bg-white p-5 text-gray-500">
              Hozircha topshiriqlar yo‘q.
            </p>
          ) : (
            <div className="space-y-3">
              {submissions.map((item) => (
                <article
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[#e3e9df] bg-white p-5"
                >
                  <div>
                    <p className="font-semibold">
                      {item.material === "paper" ? "📄 Qog‘oz" : "♻️ Plastik"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.amount_kg} kg
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(item.submitted_at).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {statusText[item.status]}
                    </p>
                    {item.status === "approved" && (
                      <p className="mt-1 font-bold text-green-700">
                        +{item.awarded_points} ball
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
