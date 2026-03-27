import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, text }) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g. smtp.sendpulse.com
      port: 2525,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Dean Office" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });

    return { success: true, info };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
}