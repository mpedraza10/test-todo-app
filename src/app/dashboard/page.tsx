"use client";

import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/lib/actions/users";

export default function DashboardPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading users</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Users</h1>
            <ul>
                {data?.map((user) => (
                    <li key={user.id} className="border-b py-2">
                        {user.name} — {user.email}
                    </li>
                ))}
            </ul>
        </div>
    );
}
