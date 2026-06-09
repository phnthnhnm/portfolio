interface ContactBody {
  name: string;
  email: string;
  message: string;
}

interface Env {
  RESEND_API_KEY: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

const FROM_EMAIL = "contact@phanthanhnam.com";
const TO_EMAIL = "namthanh.phan@proton.me";

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  // Parse and validate body
  let body: ContactBody;
  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { name, email, message } = body;

  // Validate fields
  const errors: string[] = [];
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Name is required.");
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("A valid email is required.");
  }
  if (!message || typeof message !== "string" || message.trim().length < 10) {
    errors.push("Message must be at least 10 characters.");
  }
  if (name && name.length > 100) {
    errors.push("Name must be under 100 characters.");
  }
  if (message && message.length > 5000) {
    errors.push("Message must be under 5,000 characters.");
  }

  if (errors.length > 0) {
    return new Response(JSON.stringify({ error: errors.join(" ") }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Send email via Resend
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: `Portfolio Contact: ${name.trim()}`,
        reply_to: email.trim(),
        text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend API error:", res.status, err);
      return new Response(JSON.stringify({ error: "Failed to send message. Please try again later." }), { status: 502, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, message: "Message sent! I'll get back to you soon." }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Resend request failed:", err);
    return new Response(JSON.stringify({ error: "Failed to send message. Please try again later." }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
};
