"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type SchoolClass = {
  class_name: string;
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"register" | "login">("register");

  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadClasses(code: string) {
    const normalizedCode = code.trim().toUpperCase();

    setSchoolCode(normalizedCode);
    setClasses([]);
    setClassName("");
    setError("");
    setMessage("");

    if (!normalizedCode) {
      setError("Avval maktab kodini kiriting.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_school_classes_by_code",
        {
          input_school_code: normalizedCode,
        }
      );

      if (rpcError) {
        setError("Sinflarni yuklashda xatolik: " + rpcError.message);
        return;
      }

      setClasses((data ?? []) as SchoolClass[]);

      if (!data || data.length === 0) {
        setError("Maktab kodi topilmadi yoki sinflar hali kiritilmagan.");
        return;
      }

      setMessage(`${data.length} ta sinf muvaffaqiyatli yuklandi.`);
    } catch (err) {
      console.error("Class loading error:", err);
      setError("Sinflarni yuklashda kutilmagan xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!name.trim()) {
          setError("Ism va familiyangizni kiriting.");
          return;
        }

        if (!schoolCode.trim()) {
          setError("Maktab kodini kiriting.");
          return;
        }

        if (!className) {
          setError("Iltimos, sinfingizni tanlang.");
          return;
        }

        if (!classes.some((item) => item.class_name === className)) {
          setError("Iltimos, maktab sinflarini qayta yuklang.");
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              class_name: className,
              school_code: schoolCode.trim().toUpperCase(),
            },
          },
        });

        if (signUpError) {
          setError("Ro‘yxatdan o‘tishda xatolik: " + signUpError.message);
          return;
        }

        if (!data.user || data.user.identities?.length === 0) {
          setError(
            "Bu email manzil bilan akkaunt mavjud bo‘lishi mumkin. Boshqa email kiriting yoki avvalgi akkauntingizga kiring."
          );
          return;
        }

        if (data.session) {
          setMessage("Ro‘yxatdan muvaffaqiyatli o‘tdingiz!");
          router.push("/profile");
          router.refresh();
        } else {
          setMessage(
            "Akkauntingiz yaratildi. Email manzilingizga tasdiqlash xabari yuborilishi kerak. Inbox va Spam papkasini tekshiring."
          );
        }
      } else {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) {
          setError("Email yoki parol noto‘g‘ri. Qayta urinib ko‘ring.");
          return;
        }

        router.push("/profile");
        router.refresh();
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Kutilmagan xatolik yuz berdi. Qayta urinib ko‘ring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm border border-[#e8eae3]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#28583b]">
            ECO SCHOOL
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Ekologik o‘zgarishlarning bir qismiga aylaning.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 rounded-2xl bg-[#f1f2ed] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
              setMessage("");
            }}
            className={`rounded-xl px-3 py-4 text-sm font-medium transition ${
              mode === "register"
                ? "bg-white text-[#28583b] shadow-sm"
                : "text-gray-500"
            }`}
          >
            Ro‘yxatdan o‘tish
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
            className={`rounded-xl px-3 py-4 text-sm font-medium transition ${
              mode === "login"
                ? "bg-white text-[#28583b] shadow-sm"
                : "text-gray-500"
            }`}
          >
            Kirish
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "register" && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Ism va familiya
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ismingizni kiriting"
                  required
                  className="w-full rounded-2xl border border-[#e1e4da] px-5 py-4 outline-none transition focus:border-[#28583b]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Maktab kodi
                </label>

                <input
                  type="text"
                  value={schoolCode}
                  onChange={(e) => {
                    setSchoolCode(e.target.value.toUpperCase());
                    setClasses([]);
                    setClassName("");
                    setError("");
                    setMessage("");
                  }}
                  placeholder="Maktab kodini kiriting"
                  required
                  className="w-full rounded-2xl border border-[#e1e4da] px-5 py-4 uppercase outline-none transition focus:border-[#28583b]"
                />

                <button
                  type="button"
                  onClick={() => loadClasses(schoolCode)}
                  disabled={loading}
                  className="mt-2 text-sm font-medium text-[#28583b] hover:underline disabled:opacity-50"
                >
                  {loading ? "Yuklanmoqda..." : "Sinflarni yuklash"}
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Sinfingiz
                </label>

                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  disabled={classes.length === 0}
                  required
                  className="w-full rounded-2xl border border-[#e1e4da] bg-[#f1f2ed] px-5 py-4 outline-none transition focus:border-[#28583b] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="">
                    {classes.length > 0
                      ? "Sinfingizni tanlang"
                      : "Avval maktab kodini kiriting"}
                  </option>

                  {classes.map((item) => (
                    <option key={item.class_name} value={item.class_name}>
                      {item.class_name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Email manzil
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full rounded-2xl border border-[#e1e4da] px-5 py-4 outline-none transition focus:border-[#28583b]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Parol
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kamida 8 ta belgi"
              minLength={8}
              required
              className="w-full rounded-2xl border border-[#e1e4da] px-5 py-4 outline-none transition focus:border-[#28583b]"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl bg-green-50 p-4 text-sm text-[#28583b]">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#28583b] px-5 py-4 font-semibold text-white transition hover:bg-[#214a31] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Kuting..."
              : mode === "register"
                ? "Ro‘yxatdan o‘tish"
                : "Kirish"}
          </button>
        </form>
      </div>
    </main>
  );
}