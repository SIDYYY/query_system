export async function POST(req) {
  try {
    const formData = await req.formData();

    const email = formData.get("email");
    const name = formData.get("name");
    const message = formData.get("message");
    const files = formData.getAll("files");

    let attachments = [];

    for (const file of files) {
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        attachments.push({
          content: buffer.toString("base64"),
          name: file.name,
        });
      }
    }

    const htmlTemplate = `
      <div style="font-family: Arial;">
        <p>Hello <strong>${name}</strong>,</p>
        <p>${message}</p>
        <br/>
        <p>Best regards,<br/><strong>CITC Dean's Office</strong></p>
      </div>
    `;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "CITC Dean Office",
          email: process.env.VERIFIED_EMAIL,
        },
        to: [{ email }],
        subject: "Dean’s Query System: Submission Update",
        htmlContent: htmlTemplate,
        attachment: attachments.length ? attachments : undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Brevo error:", data);
      return new Response(JSON.stringify(data), { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return new Response("Email failed", { status: 500 });
  }
}