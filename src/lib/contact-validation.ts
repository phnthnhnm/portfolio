export interface ContactInput {
  name: unknown;
  email: unknown;
  subject: unknown;
  message: unknown;
}

export interface ContactData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export type ValidationResult = { valid: true; data: ContactData } | { valid: false; errors: string[] };

export function validateContact(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, errors: ["Invalid JSON body"] };
  }

  const { name, email, subject, message } = body as Record<string, unknown>;

  const errors: string[] = [];

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Name is required.");
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("A valid email is required.");
  }
  if (subject !== undefined && subject !== null && typeof subject !== "string") {
    errors.push("Subject must be a string.");
  }
  if (!message || typeof message !== "string" || message.trim().length < 10) {
    errors.push("Message must be at least 10 characters.");
  }
  if (name && typeof name === "string" && name.length > 100) {
    errors.push("Name must be under 100 characters.");
  }
  if (subject && typeof subject === "string" && subject.trim().length > 200) {
    errors.push("Subject must be under 200 characters.");
  }
  if (message && typeof message === "string" && message.length > 5000) {
    errors.push("Message must be under 5,000 characters.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const trimmedSubject = subject && typeof subject === "string" ? subject.trim() : undefined;

  return {
    valid: true,
    data: {
      name: (name as string).trim(),
      email: (email as string).trim(),
      subject: trimmedSubject && trimmedSubject.length ? trimmedSubject : undefined,
      message: (message as string).trim(),
    },
  };
}
