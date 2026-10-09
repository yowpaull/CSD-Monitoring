'use client';

import { Sparkles } from "lucide-react";

import PasswordInput from "@/components/PasswordInput";
import { ActionResult, login } from "@/lib/actions/auth";
import { useActionToast } from "@/lib/hooks/useActionToast";
import { useActionState } from "react";

const INPUT_CLASS =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export default function Home() {

  const initialState: ActionResult = {}
  const[state, formAction, isPending] = useActionState(login, initialState);

  useActionToast(state, "Unable to log in. Please try again.");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 sm:p-6">

      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="mb-6 flex flex-col items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <Sparkles size={19} />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold tracking-tight text-slate-900">
              CSD Monitoring
            </p>
            <p className="text-xs text-slate-500">
              2026
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-500">
              Sign in to your workspace
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-4 w-full">
            {state?.error && (
                <p className="text-xs text-red-600">
                    {state.error}
                </p>
            )}

            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Enter your email"
                required
                className={INPUT_CLASS}
              />
              {state.fieldErrors?.email && (
                <p className="text-red-500 text-xs">{state.fieldErrors.email[0]}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <PasswordInput
                name="password"
                id="password"
                required
                placeholder="Enter your password"
                className={INPUT_CLASS}
              />
              {state.fieldErrors?.password && (
                <p className="text-red-500 text-xs">{state.fieldErrors.password[0]}</p>
              )}
            </div>

            <button
              disabled={isPending}
              type="submit"
              className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Logging in...' : 'Login'}
            </button>

          </form>
        </div>

      </div>

    </main>
  );
}
