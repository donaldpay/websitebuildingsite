// /functions/api/contact.js
// Cloudflare Pages Function — handles POST /api/contact
// Sends an email via MailChannels (no API key needed; auth happens via
// DNS records on your domain — see the SETUP.md instructions).

const TO_EMAIL = "donaldpaybusiness@gmail.com";
const TO_NAME = "Donald Pay";
const FROM_EMAIL = "donald@donaldpay.com"; // must match your verified sending domain
const FROM_NAME = "Donald Pay — Website";

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function onRequestPost(context) {
  const { request } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { name, email, project_type, message, company } = body || {};

  // Honeypot — if filled, pretend success but don't send
  if (company && company.trim() !== "") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: "Missing required fields." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email address." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const safeName = escapeHtml(name).slice(0, 200);
  const safeEmail = escapeHtml(email).slice(0, 200);
  const safeType = escapeHtml(project_type || "Not specified").slice(0, 100);
  const safeMessage = escapeHtml(message).slice(0, 5000);

  const payload = {
    personalizations: [{ to: [{ email: TO_EMAIL, name: TO_NAME }] }],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    reply_to: { email: email, name: name },
    subject: `New project inquiry — ${safeType} (${safeName})`,
    content: [
      {
        type: "text/plain",
        value: `New message from the website contact form.

Name: ${name}
Email: ${email}
Project type: ${project_type || "Not specified"}

Message:
${message}`,
      },
      {
        type: "text/html",
        value: `
          <h2>New project inquiry</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Project type:</strong> ${safeType}</p>
          <p><strong>Message:</strong></p>
          <p>${safeMessage.replace(/\n/g, "<br>")}</p>
        `,
      },
    ],
  };

  try {
    const mcRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!mcRes.ok) {
      const errText = await mcRes.text();
      console.error("MailChannels error:", mcRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to send message. Please email directly." }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Contact form error:", err);
    return new Response(
      JSON.stringify({ error: "Server error. Please email directly." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
