"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "instructor">("student");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Signup successful! Check your email to confirm your account."
      );
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md space-y-4 rounded-xl border p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold">Create Account</h1>

        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full rounded-md border p-3"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md border p-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-md border p-3"
        />

        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "student" | "instructor")
          }
          className="w-full rounded-md border p-3"
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black p-3 text-white"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        {message && <p className="text-sm">{message}</p>}
      </form>
    </main>
  );
}