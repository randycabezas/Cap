"use server";

import { db } from "@cap/database";
import { organizationInvites, users } from "@cap/database/schema";
import { and, eq } from "drizzle-orm";

export async function checkEmailAllowed(
	email: string,
): Promise<{ allowed: boolean; reason?: string }> {
	const userEmail = email.toLowerCase().trim();

	const [existingUser] = await db()
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, userEmail))
		.limit(1);

	if (existingUser) return { allowed: true };

	const [anyUser] = await db().select({ id: users.id }).from(users).limit(1);

	if (!anyUser) return { allowed: true };

	const [pendingInvite] = await db()
		.select({ id: organizationInvites.id })
		.from(organizationInvites)
		.where(
			and(
				eq(organizationInvites.invitedEmail, userEmail),
				eq(organizationInvites.status, "pending"),
			),
		)
		.limit(1);

	if (pendingInvite) return { allowed: true };

	return {
		allowed: false,
		reason:
			"This email is not authorized to sign in. Contact your administrator for an invite.",
	};
}
