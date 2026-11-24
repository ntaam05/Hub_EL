"use client"; // Chuyển sang Client

import { signIn } from "next-auth/react"; // Import từ react

export default function SignIn() {
  return (
    <div className="flex flex-col gap-4">
      <button 
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="..."
      >
        Login Google
      </button>
      
      <button 
        onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
        className="..."
      >
        Login GitHub
      </button>
    </div>
  );
}