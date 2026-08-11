import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  return resend.emails.send({
    from: "Reservation Portal <onboarding@resend.dev>", // Resend's shared test sender
    to,
    subject,
    html,
  });
};