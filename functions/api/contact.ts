import { validateContact } from "../../src/lib/contact-validation";

interface Env {
  RESEND_API_KEY: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

const FROM_EMAIL = "contact@phanthanhnam.com";
const TO_EMAIL = "namthanh.phan@proton.me";

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  // Parse and validate body
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validation = validateContact(parsed);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.errors.join(" ") }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { name, email, subject, message } = validation.data;

  const emailSubject = subject ? `Portfolio Contact: ${subject}` : `Portfolio Contact: ${name.trim()}`;

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
        subject: emailSubject,
        reply_to: email.trim(),
        text: `Name: ${name.trim()}\nEmail: ${email.trim()}${subject ? `\nSubject: ${subject}` : ""}\n\nMessage:\n${message.trim()}`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend API error:", res.status, err);
      return new Response(JSON.stringify({ error: "Failed to send message. Please try again later." }), { status: 502, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, message: "Message sent! I'll get back to you soon!" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Resend request failed:", err);
    return new Response(JSON.stringify({ error: "Failed to send message. Please try again later." }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
};
