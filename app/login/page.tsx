
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              class_name: className,
              school_code: schoolCode.trim().toUpperCase(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push("/");
          router.refresh();
          return;
        }

        setMessage(
          "Ro‘yxatdan o‘tish muvaffaqiyatli! Email manzilingizga tasdiqlash xabari yuborildi."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/");
        router.refresh();
        return;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Noma'lum xatolik yuz berdi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafaf7] px-5 py-12 text-[#242b24]">
      <div className="w-full max-w-md">
        <a href="/" className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#315b3b] text-xl font-bold text-white">
            E
          </div>
          <div>
            <p className="font-bold tracking-tight">ECO SCHOOL</p>
            <p className="text-[10px] tracking-[0.2em] text-[#788078]">
              MEASURE. ACT. IMPROVE.
            </p>
          </div>
        </a>

        <div className="rounded-3xl border border-[#e8e9e1] bg-white p-7 shadow-sm sm:p-9">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#648367]">
            ECO SCHOOL COMMUNITY
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            {mode === "register" ? "Jamoamizga qo‘shil!" : "Xush kelibsan!"}
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#81877e]">
            {mode === "register"
              ? "Ekologik o‘zgarishlarning bir qismiga aylan."
              : "Eco School profilingga kir."}
          </p>

          <div className="mt-7 grid grid-cols-2 rounded-xl bg-[#f3f4ef] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setMessage("");
                setError("");
              }}
              className={`rounded-lg py-3 text-sm font-medium ${
                mode === "register"
                  ? "bg-white text-[#315b3b] shadow-sm"
                  : "text-[#858b82]"
              }`}
            >
              Ro‘yxatdan o‘tish
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage("");
                setError("");
              }}
              className={`rounded-lg py-3 text-sm font-medium ${
                mode === "login"
                  ? "bg-white text-[#315b3b] shadow-sm"
                  : "text-[#858b82]"
              }`}
            >
              Kirish
            </button>
          </div>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Ism va familiya
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ismingizni kiriting"
                    className="w-full rounded-xl border border-[#e3e5dc] px-4 py-3.5 text-sm outline-none focus:border-[#648367]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Sinf
                  </label>
                  <select
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full rounded-xl border border-[#e3e5dc] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#648367]"
                  >
                    <option value="">Sinfingizni tanlang</option>
                    {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={`${n}-sinf`}>
                        {n}-sinf
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Maktab kodi
                  </label>
                  <input
                    required
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    placeholder="Masalan: ECO-2026"
                    className="w-full rounded-xl border border-[#e3e5dc] px-4 py-3.5 text-sm uppercase outline-none focus:border-[#648367]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email manzil
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-[#e3e5dc] px-4 py-3.5 text-sm outline-none focus:border-[#648367]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Parol
              </label>
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 8 ta belgi"
                className="w-full rounded-xl border border-[#e3e5dc] px-4 py-3.5 text-sm outline-none focus:border-[#648367]"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#315b3b] py-4 text-sm font-semibold text-white transition hover:bg-[#25482e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Kuting..."
                : mode === "register"
                  ? "Akkaunt yaratish ↗"
                  : "Profilga kirish ↗"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-6 text-[#969b92]">
            Davom etish orqali platformaning foydalanish qoidalariga rozilik
            bildirasiz. Voyaga yetmaganlar uchun tegishli ruxsat va rozilik
            tartibi ham qo‘llaniladi.
          </p>
        </div>

        <a
          href="/"
          className="mt-7 block text-center text-sm text-[#71806e] hover:text-[#315b3b]"
        >
          ← Bosh sahifaga qaytish
        </a>
      </div>
    </main>
  );
}
