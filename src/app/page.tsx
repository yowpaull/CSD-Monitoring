'use client';

import { ActionResult, login } from "@/lib/actions/auth";
import { useActionState } from "react";

export default function Home() {

  const initialState: ActionResult = {}
  const[state, formAction, isPending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen">
      
      <aside className="flex bg-[#0F1F3D] h-screen w-md">
        <div>

        </div>
      </aside>

      <div className="flex flex-col justify-center items-center w-full">
        <div className="flex flex-col max-w-md w-full p-8">
          <div className="flex flex-col gap-2 mb-8 text-left">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-gray-500">Sign in to your workspace</p>
          </div>
          
          <form action={formAction} className="flex flex-col gap-4 w-full">
            {state?.error && (
                <p className="text-xs text-red-600">
                    {state.error}
                </p>
            )}
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                name="email" 
                id="email" 
                placeholder="Enter your email"
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {state.fieldErrors?.email && (
                <p className="text-red-500 text-xs">{state.fieldErrors.email[0]}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                name="password" 
                id="password" 
                required
                placeholder="Enter your password" 
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {state.fieldErrors?.password && (
                <p className="text-red-500 text-xs">{state.fieldErrors.password[0]}</p>
              )}
            </div>
            
            <button 
              disabled={isPending}
              type="submit"
              className="bg-[#0F1F3D] hover:bg-[#1c2d4e] text-white font-bold py-2 px-4 rounded-md cursor-pointer transition duration-300 ease-in-out"
            >
              {isPending ? 'Logging in...' : 'Login'}
            </button>

          </form>
        </div>
      </div>

    </main>
  );
}
