"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getUsers() {
    try {
        const result = await db.select().from(users);
        return result;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw new Error("Failed to fetch users");
    }
}
