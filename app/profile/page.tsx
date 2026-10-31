
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Profile = {
  full_name: string | null;
  class_name: string | null;
  school_code: string | null;
  points: number | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = createClient();

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          throw new Error(authError.message);
        }

        if (!authData.user) {
          router.replace("/login");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, class_name, school_code, points")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("PROFILE ERROR:", {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code,
          });

          throw new Error(
            `Profilni yuklashda xatolik: ${profileError.message} (kod: ${profileError.code})`
          );
        }

        if (!active) return;

        if (!data) {
          setError("Profil topilmadi. Maktab administratori bilan bog‘laning.");
        } else {
          setProfile(data as Profile);
        }
      } catch (err) {
        console.error("PROFILE LOAD ERROR:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Kutilmagan xatolik yuz berdi."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f5f7f0]">
        <p>Profilingiz yuklanmoqda...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f5f7f0] p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Profilni yuklashda muammo
          </h1>
          <p className="mt-3 text-gray-600">{error || "Profil topilmadi."}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 text-green-800 underline"
          >
            Bosh sahifaga qaytish
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f0] p-6 md:p-12">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => router.push("/")}
          className="mb-8 text-green-800 hover:underline"
        >
          ← Bosh sahifaga qaytish
        </button>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            ECO SCHOOL
          </p>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Profilim
          </h1>

          <div className="mt-8 space-y-5">
            <div>
              <p className="text-sm text-gray-500">Ism</p>
              <p className="text-lg font-semibold text-gray-900">
                {profile.full_name || "Kiritilmagan"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Sinf</p>
              <p className="text-lg font-semibold text-gray-900">
                {profile.class_name || "Kiritilmagan"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Maktab kodi</p>
              <p className="text-lg font-semibold text-gray-900">
                {profile.school_code || "Kiritilmagan"}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 p-5">
              <p className="text-sm text-green-700">Eco ballaringiz</p>
              <p className="mt-1 text-3xl font-bold text-green-900">
                {profile.points ?? 0}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-8 rounded-xl bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-700"
          >
            Tizimdan chiqish
          </button>
        </section>
      </div>
    </main>
  );
}
