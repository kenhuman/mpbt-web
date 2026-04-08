"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/"), 2500);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const msg: string =
        Array.isArray(data?.message)
          ? (data.message as string[]).join(" ")
          : (data?.message as string | undefined) ?? "Registration failed.";
      setError(msg);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 text-green-400 p-8">
        <p className="text-2xl font-bold mb-2">Registration complete!</p>
        <p className="text-neutral-400">Redirecting…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-green-400 mb-1 tracking-wide">
          MPBT
        </h1>
        <p className="text-neutral-400 mb-8 text-sm">
          Create your MechWarrior account
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 bg-neutral-900 border border-neutral-800 rounded-xl p-8"
        >
          <Field
            label="Username"
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            minLength={3}
            maxLength={64}
            required
            autoComplete="username"
          />

          <Field
            label="Email"
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            maxLength={255}
            required
            autoComplete="email"
          />

          <Field
            label="Password"
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            maxLength={64}
            required
            autoComplete="new-password"
          />

          <Field
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            minLength={8}
            maxLength={64}
            required
            autoComplete="new-password"
          />

          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-black font-bold py-2 rounded-md transition-colors"
          >
            {loading ? "Registering…" : "Create Account"}
          </button>
        </form>
      </div>
    </main>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

function Field({ label, id, ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-neutral-400 uppercase tracking-widest"
      >
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-neutral-600"
      />
    </div>
  );
}
