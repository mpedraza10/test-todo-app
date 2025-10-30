"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const [email, setEmail] = useState("");

    const handleLogin = async () => {
        await supabase.auth.signInWithOtp({ email });
        alert("Check your email!");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded px-3 py-2"
            />
            <button
                onClick={handleLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                Login
            </button>
        </div>
    );
}
