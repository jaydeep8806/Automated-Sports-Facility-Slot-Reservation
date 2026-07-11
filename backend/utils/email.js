import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const isConfigured = 
  process.env.EMAIL_USER && 
  process.env.EMAIL_PASS && 
  process.env.EMAIL_USER !== 'your-gmail@gmail.com' &&
  process.env.EMAIL_PASS !== 'your-16-character-gmail-app-password' &&
  process.env.DISABLE_EMAIL !== 'true';

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Send email helper
 */
const sendMail = async ({ to, subject, html, text }) => {
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log(`[Email Fallback] Email sending is disabled. Printing content here instead:`);
    printConsoleFallback(to, subject, text);
    return true;
  }

  // 1. Try Brevo HTTP API if configured
  if (process.env.BREVO_API_KEY) {
    try {
      console.log(`[Email] Sending via Brevo API...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: 'SportSlot',
            email: process.env.EMAIL_USER || 'tempjaydeep@gmail.com'
          },
          to: [
            {
              email: to
            }
          ],
          subject: subject,
          htmlContent: html,
          textContent: text
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Email] Sent successfully via Brevo API:`, data.messageId || data);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
    } catch (err) {
      console.error(`[Email Error] Failed to send email to ${to} via Brevo API:`, err.message);
      console.log(`[Email Fallback] Due to API errors, printing content here instead:`);
      printConsoleFallback(to, subject, text);
      return true; // Avoid crashing/rolling back user signup
    }
  }

  // 2. Fallback to Gmail SMTP if configured
  if (isConfigured && transporter) {
    try {
      await transporter.sendMail({
        from: `"SportSlot" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`[Email] Sent: "${subject}" to ${to}`);
      return true;
    } catch (err) {
      console.error(`[Email Error] Failed to send email to ${to} via SMTP:`, err.message);
      console.log(`[Email Fallback] Due to network restrictions or credentials error, printing content here instead:`);
      printConsoleFallback(to, subject, text);
      return true; // Avoid crashing/rolling back user signup
    }
  } else {
    console.log(`[Email Fallback] SMTP / Brevo not configured. Printing content here instead:`);
    printConsoleFallback(to, subject, text);
    return true;
  }
};

const printConsoleFallback = (to, subject, text) => {
  console.log(`\n======================================================`);
  console.log(`📧  EMAIL SIMULATION RUN (No SMTP configured / failed)`);
  console.log(`======================================================`);
  console.log(`TO:      ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`CONTENT:`);
  console.log(text);
  console.log(`======================================================\n`);
};

/**
 * Send OTP Verification Email
 */
export const sendVerificationEmail = async (email, userName, otp) => {
  const verifyLink = `http://localhost:5173/verify-email?email=${encodeURIComponent(email)}&otp=${otp}`;
  const subject = 'Verify your email - SportSlot';
  const text = `Hello ${userName},\n\nThank you for registering at SportSlot! Please use the following 6-digit OTP code to verify your account:\n\n👉 ${otp}\n\nAlternatively, you can verify your email directly by clicking the link below:\n${verifyLink}\n\nThis OTP will expire shortly. If you did not create this account, please ignore this email.\n\nBest regards,\nThe SportSlot Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - SportSlot</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #090d16;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #f8fafc;
        }
        .container {
          max-width: 580px;
          margin: 30px auto;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #10b981, #6366f1);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #020617;
          letter-spacing: -0.5px;
        }
        .header h1 span {
          color: #ffffff;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .otp-container {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 6px;
          color: #10b981;
          margin: 0;
        }
        .otp-label {
          font-size: 12px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 8px;
        }
        .btn-container {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          background-color: #6366f1;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
          transition: background 0.2s ease;
        }
        .footer {
          background-color: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }
        .footer p {
          margin: 6px 0;
        }
        a {
          color: #10b981;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sport<span>Slot</span></h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${userName},</div>
          <p>Thank you for signing up at SportSlot! We are thrilled to welcome you to our community of athletes and sports enthusiasts.</p>
          <p>Please enter the 6-digit OTP code below to verify your email and complete your registration:</p>
          
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
            <div class="otp-label">Verification OTP Code</div>
          </div>
          
          <p style="text-align: center;">Alternatively, you can complete verification instantly by clicking the link below:</p>
          <div class="btn-container">
            <a href="${verifyLink}" class="btn" target="_blank">Verify My Email</a>
          </div>

          <p>This verification OTP is valid for 24 hours. If you did not create a SportSlot account, please safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 SportSlot Inc. All rights reserved.</p>
          <p>Fastest turf and playground slot booking system in Gujarat.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendMail({ to: email, subject, html, text });
};

/**
 * Send Booking Confirmation Email
 */
export const sendBookingConfirmationEmail = async (email, details) => {
  const { userName, bookingIds, sportName, venueName, venueLocation, date, slots, totalPrice } = details;
  const bookingIdsStr = `#${bookingIds.join(', #')}`;
  
  const subject = `Booking Confirmed: ${venueName} - SportSlot`;

  // Format slots text
  const slotsText = slots.map(s => `• ${s.startTime} - ${s.endTime} (₹${parseFloat(s.price).toFixed(2)})`).join('\n');
  const text = `Hello ${userName},\n\nYour booking at SportSlot has been successfully confirmed!\n\nBooking ID(s): ${bookingIdsStr}\nVenue: ${venueName}\nLocation: ${venueLocation}\nSport: ${sportName}\nDate: ${date}\nTime Slots:\n${slotsText}\n\nTotal Paid: ₹${totalPrice.toFixed(2)}\nPayment Status: Successful\n\nThank you for booking with SportSlot! Please display this email confirmation or your booking ID at the stadium reception prior to entering the court.\n\nEnjoy your game!\n\nBest regards,\nThe SportSlot Team`;

  // Generate slots rows for HTML
  const slotsHtmlRows = slots.map(s => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 14px;">${s.startTime} - ${s.endTime}</td>
      <td style="padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 14px; text-align: right; font-weight: 600; color: #10b981;">₹${parseFloat(s.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - SportSlot</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #090d16;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #10b981, #6366f1);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #020617;
          letter-spacing: -0.5px;
        }
        .header h1 span {
          color: #ffffff;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #10b981;
        }
        .status-badge {
          display: inline-block;
          background-color: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 99px;
          margin-bottom: 24px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
        }
        .details-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 14px;
        }
        .details-table tr:last-child td {
          border-bottom: none;
        }
        .details-label {
          color: #94a3b8;
          font-weight: 500;
          width: 40%;
        }
        .details-value {
          font-weight: 600;
        }
        .slots-card {
          margin: 25px 0;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
        }
        .slots-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .slots-table {
          width: 100%;
          border-collapse: collapse;
        }
        .total-row {
          background-color: rgba(16, 185, 129, 0.05);
        }
        .total-row td {
          padding: 16px;
          font-size: 16px;
          font-weight: 800;
        }
        .footer {
          background-color: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }
        .footer p {
          margin: 6px 0;
        }
        .thank-you {
          text-align: center;
          font-size: 16px;
          font-weight: 600;
          color: #f8fafc;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sport<span>Slot</span></h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${userName},</div>
          <div class="status-badge">Booking Confirmed</div>
          <p>Awesome! Your slot bookings are confirmed and the payment is completed. Below are the details of your reservation:</p>
          
          <table class="details-table">
            <tr>
              <td class="details-label">Booking ID(s)</td>
              <td class="details-value" style="color: #6366f1;">${bookingIdsStr}</td>
            </tr>
            <tr>
              <td class="details-label">Stadium / Venue</td>
              <td class="details-value">${venueName}</td>
            </tr>
            <tr>
              <td class="details-label">Location</td>
              <td class="details-value" style="font-size: 13px; font-weight: 500; color: #94a3b8;">${venueLocation}</td>
            </tr>
            <tr>
              <td class="details-label">Sport</td>
              <td class="details-value" style="text-transform: capitalize;">${sportName}</td>
            </tr>
            <tr>
              <td class="details-label">Date</td>
              <td class="details-value">${date}</td>
            </tr>
          </table>

          <div class="slots-card">
            <div class="slots-title">Reserved Time Slots</div>
            <table class="slots-table">
              ${slotsHtmlRows}
              <tr class="total-row">
                <td style="padding: 16px; font-weight: 700;">Total Amount Paid</td>
                <td style="padding: 16px; text-align: right; font-weight: 800; color: #10b981;">₹${totalPrice.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #94a3b8; text-align: center;">
            💡 <em>Show this booking receipt on your phone at the stadium entry reception to check in.</em>
          </p>

          <div class="thank-you">
            Thank you for choosing SportSlot! Enjoy your game! ⚽🏏🎾
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2026 SportSlot Inc. All rights reserved.</p>
          <p>Fastest turf and playground slot booking system in Gujarat.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendMail({ to: email, subject, html, text });
};
