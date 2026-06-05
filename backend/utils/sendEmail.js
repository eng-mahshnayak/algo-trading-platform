import nodemailer from "nodemailer";


export const sendResetMail = async (toEmail, resetCode) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Your App" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${resetCode}`,
      html: `<p>Your password reset code is: <b>${resetCode}</b></p>`,
    });

    console.log(`✅ Email sent to ${toEmail}`);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Email could not be sent");
  }
};