
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Impact = {
  paper_kg: number;
  plastic_kg: number;
  recycling_kg: number;
  recycling_points: number;
  approved_challenges: number;
  challenge_points: number;
  total_points: number;
  active_students: number;
};

export default function ImpactPage() {
  const [supabase] = useState(() => createClient());
  const [impact, setImpact] = useState<Impact | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadImpact() {
    setLoading(true);
    setMessage("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setMessage("Statistikani ko‘rish uchun tizimga kiring.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc(
      "get_school_overall_impact"
    );

    if (error) {
      setMessage("Statistikani yuklashda xatolik: " + error.message);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const row = data[0];

      setImpact({
        paper_kg: Number(row.paper_kg) || 0,
        plastic_kg: Number(row.plastic_kg) || 0,
        recycling_kg: Number(row.recycling_kg) || 0,
        recycling_points: Number(row.recycling_points) || 0,
        approved_challenges: Number(row.approved_challenges) || 0,
        challenge_points: Number(row.challenge_points) || 0,
        total_points: Number(row.total_points) || 0,
        active_students: Number(row.active_students) || 0,
      });
    } else {
      setImpact({
        paper_kg: 0,
        plastic_kg: 0,
        recycling_kg: 0,
        recycling_points: 0,
        approved_challenges: 0,
        challenge_points: 0,
        total_points: 0,
        active_students: 0,
      });
    }

    setLoading(false);
  }

  useEffect(() => {
    loadImpact();
  }, []);

  const stats = [
    {
      label: "Jami qayta ishlashga topshirilgan",
      value: impact?.recycling_kg ?? 0,
      unit: "kg",
      icon: "♻️",
    },
    {
      label: "Yig‘ilgan qog‘oz",
      value: impact?.paper_kg ?? 0,
      unit: "kg",
      icon: "📄",
    },
    {
      label: "Yig‘ilgan plastik",
      value: impact?.plastic_kg ?? 0,
      unit: "kg",
      icon: "🧴",
    },
    {
      label: "Faol o‘quvchilar",
      value: impact?.active_students ?? 0,
      unit: "nafar",
      icon: "👥",
    },
    {
      label: "Tasdiqlangan challenge'lar",
      value: impact?.approved_challenges ?? 0,
      unit: "ta",
      icon: "🌱",
    },
    {
      label: "Jami berilgan ballar",
      value: impact?.total_points ?? 0,
      unit: "ball",
      icon: "⭐",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-5 py-10 text-[#24352b]">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="text-sm font-medium text-green-800">
          ← Bosh sahifa
        </a>

        <header className="mb-10 mt-7">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            ECO SCHOOL · OUR IMPACT
          </p>

          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            Maktabimizning ta’siri
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-[#66746a]">
            Har bir kichik harakat katta o‘zgarishning bir qismidir.
            Maktabimizning ekologik natijalari real tasdiqlangan
            ma’lumotlar asosida hisoblanadi.
          </p>
        </header>

        {message && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-gray-500">
            Statistika yuklanmoqda...
          </div>
        ) : impact ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-[#e3e9df] bg-white p-6"
                >
                  <div className="text-3xl">{stat.icon}</div>

                  <p className="mt-5 text-sm text-[#66746a]">
                    {stat.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-green-900">
                    {stat.value.toLocaleString("uz-UZ")}
                    <span className="ml-2 text-base font-medium text-gray-500">
                      {stat.unit}
                    </span>
                  </p>
                </article>
              ))}
            </section>

            <section className="mt-8 grid gap-5 md:grid-cols-2">
              <article className="rounded-2xl border border-[#e3e9df] bg-white p-6">
                <p className="text-sm font-semibold text-green-800">
                  CHALLENGES
                </p>
                <h2 className="mt-3 text-2xl font-bold">
                  Ekologik topshiriqlar
                </h2>
                <p className="mt-3 text-4xl font-bold">
                  {impact.approved_challenges}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Tasdiqlangan topshiriqlar
                </p>
                <p className="mt-4 font-semibold text-green-800">
                  {impact.challenge_points} ball
                </p>
              </article>

              <article className="rounded-2xl border border-[#e3e9df] bg-white p-6">
                <p className="text-sm font-semibold text-green-800">
                  RECYCLING
                </p>
                <h2 className="mt-3 text-2xl font-bold">
                  Qayta ishlash
                </h2>
                <p className="mt-3 text-4xl font-bold">
                  {impact.recycling_kg.toLocaleString("uz-UZ")} kg
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Tasdiqlangan chiqindi vazni
                </p>
                <p className="mt-4 font-semibold text-green-800">
                  {impact.recycling_points} ball
                </p>
              </article>
            </section>

            <section className="mt-8 rounded-2xl border border-[#e3e9df] bg-white p-6">
              <h2 className="text-xl font-bold">
                Natijalar haqida
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#66746a]">
                Recycling ko‘rsatkichlari Eco Team tasdiqlagan haqiqiy
                vaznlardan olinadi. Challenge natijalari esa tasdiqlangan
                topshiriqlarga asoslanadi.
              </p>
              <p className="mt-3 text-sm leading-7 text-[#66746a]">
                Bu raqamlar chiqindilar qayta ishlashga topshirilganini
                bildiradi, ularning zavodda qayta ishlangani haqida
                mustaqil dalil hisoblanmaydi.
              </p>
            </section>
          </>
        ) : null}

        <button
          onClick={loadImpact}
          disabled={loading}
          className="mt-7 rounded-xl bg-green-800 px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          Statistikani yangilash
        </button>
      </div>
    </main>
  );
}
