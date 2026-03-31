export async function POST(req) {
  try {
    const { email,name, message } = await req.json();
    

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        <p>Hello <strong>${name}</strong>,</p>

        <p>${message}</p>

        <br/>

        <p>Best regards,</p>
        <p><strong>CITC Dean's Office</strong></p>

        <hr/>
        <small>This is an automated response. Please do not reply.</small>
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