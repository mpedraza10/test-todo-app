"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LoginPage from "@/app/login/page";
import DashboardPage from "@/app/dashboard/page";

export default function AuthGuard() {
    const [session, setSession] = useState<boolean | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(!!data.session);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(!!s);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    if (session === null) return <p>Loading...</p>;
    if (!session) return <LoginPage />;
    return <DashboardPage />;
}
