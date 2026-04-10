const nodemailer = require("nodemailer");

const IS_CONFIGURED =
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  !process.env.EMAIL_USER.includes("tu_correo");

/**
 * Envía el correo de recuperación de contraseña.
 * - Si las credenciales están configuradas → envía correo real por Gmail.
 * - Si no → usa cuenta de prueba Ethereal y muestra el link en consola.
 */
async function sendResetEmail(toEmail, resetUrl) {
  if (IS_CONFIGURED) {
    // ── Modo producción: Gmail SMTP ────────────────────────────
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `OptiData <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Recupera tu contraseña — OptiData",
      html: buildEmailHtml(resetUrl),
    });

    console.log(`✉  Correo de recuperación enviado a: ${toEmail}`);

  } else {
    // ── Modo desarrollo: Ethereal (sin configuración) ──────────
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: `OptiData <no-reply@optidata.dev>`,
      to: toEmail,
      subject: "Recupera tu contraseña — OptiData",
      html: buildEmailHtml(resetUrl),
    });

    console.log("\n" + "─".repeat(55));
    console.log("  📧  MODO DESARROLLO — correo no enviado realmente");
    console.log("─".repeat(55));
    console.log(`  Para:     ${toEmail}`);
    console.log(`  Link:     ${resetUrl}`);
    console.log(`  Preview:  ${nodemailer.getTestMessageUrl(info)}`);
    console.log("─".repeat(55) + "\n");
    console.log("  Para enviar correos reales, configura .env:");
    console.log("  EMAIL_USER=tu@gmail.com");
    console.log("  EMAIL_PASS=xxxx xxxx xxxx xxxx  (App Password)");
    console.log("─".repeat(55) + "\n");
  }
}

function buildEmailHtml(resetUrl) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;
                padding:32px 16px;background:#f1f5f9;">

      <div style="background:#0f172a;border-radius:10px;padding:18px 24px;
                  margin-bottom:20px;">
        <span style="font-size:1.1rem;font-weight:700;color:#fff;">⚡ OptiData Pricing</span>
      </div>

      <div style="background:#fff;border-radius:10px;padding:28px 24px;
                  border:1px solid #e2e8f0;">
        <h2 style="margin:0 0 10px;font-size:1.15rem;color:#0f172a;">
          Recupera tu contraseña
        </h2>
        <p style="margin:0 0 24px;color:#64748b;font-size:0.9rem;line-height:1.6;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta.
          Haz clic en el botón — el enlace expira en <strong>1 hora</strong>.
        </p>

        <a href="${resetUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;
                  padding:12px 28px;border-radius:8px;text-decoration:none;
                  font-weight:600;font-size:0.9rem;">
          Restablecer contraseña
        </a>

        <p style="margin:24px 0 0;font-size:0.78rem;color:#94a3b8;line-height:1.5;">
          Si no solicitaste este cambio, ignora este correo.<br/>
          El enlace expirará automáticamente.
        </p>
      </div>

      <p style="margin:14px 0 0;text-align:center;font-size:0.72rem;color:#94a3b8;">
        © ${new Date().getFullYear()} OptiData Pricing System
      </p>
    </div>
  `;
}

module.exports = { sendResetEmail };
