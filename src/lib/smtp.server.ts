/**
 * Minimal SMTP client (STARTTLS + AUTH LOGIN) for the Worker runtime.
 * Uses Cloudflare's TCP socket API — no Node-only dependencies.
 */

type Sock = {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  startTls: () => Sock;
  close: () => Promise<void>;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function b64(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}

class SmtpConnection {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private buffer = "";

  constructor(private socket: Sock) {
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
  }

  async read(): Promise<string> {
    // Read until we have a complete SMTP reply (last line has no dash after code).
    for (;;) {
      const lines = this.buffer.split(/\r?\n/).filter((line) => line.length > 0);
      const last = lines[lines.length - 1];
      if (last && /^\d{3} /.test(last)) {
        const reply = this.buffer;
        this.buffer = "";
        return reply;
      }
      const { value, done } = await this.reader.read();
      if (done) {
        const reply = this.buffer;
        this.buffer = "";
        return reply;
      }
      this.buffer += decoder.decode(value, { stream: true });
    }
  }

  async send(command: string, expect = 2): Promise<string> {
    await this.writer.write(encoder.encode(command + "\r\n"));
    const reply = await this.read();
    if (!reply.startsWith(String(expect))) {
      throw new Error(`SMTP error after "${command.split(" ")[0]}": ${reply.trim()}`);
    }
    return reply;
  }

  release() {
    try {
      this.reader.releaseLock();
      this.writer.releaseLock();
    } catch {
      /* ignore */
    }
  }

  get raw() {
    return this.socket;
  }
}

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendMail(message: MailMessage): Promise<void> {
  const host = process.env["EMAIL_HOST"]!;
  const port = Number(process.env["EMAIL_PORT"] ?? "587");
  const user = process.env["EMAIL_USER"]!;
  const password = process.env["EMAIL_PASSWORD"]!;
  const from = process.env["EMAIL_FROM"] ?? user;

  if (!host || !user || !password) throw new Error("SMTP credentials are not configured");

  const { connect } = (await import("cloudflare:sockets")) as {
    connect: (address: string, options?: Record<string, unknown>) => Sock;
  };

  const plain = connect(`${host}:${port}`, { secureTransport: "starttls", allowHalfOpen: false });
  let conn = new SmtpConnection(plain);

  await conn.read(); // greeting
  await conn.send(`EHLO firstheritage.online`);
  await conn.send("STARTTLS", 2);
  conn.release();

  const secure = plain.startTls();
  conn = new SmtpConnection(secure);

  await conn.send(`EHLO firstheritage.online`);
  await conn.send("AUTH LOGIN", 3);
  await conn.send(b64(user), 3);
  await conn.send(b64(password), 2);
  await conn.send(`MAIL FROM:<${from}>`);
  await conn.send(`RCPT TO:<${message.to}>`);
  await conn.send("DATA", 3);

  const boundary = `bnd_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `From: Heritage Bank <${from}>`,
    `To: <${message.to}>`,
    `Subject: ${message.subject}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    message.html
      ? `Content-Type: multipart/alternative; boundary="${boundary}"`
      : 'Content-Type: text/plain; charset="utf-8"',
  ].join("\r\n");

  const body = message.html
    ? [
        `--${boundary}`,
        'Content-Type: text/plain; charset="utf-8"',
        "",
        message.text,
        `--${boundary}`,
        'Content-Type: text/html; charset="utf-8"',
        "",
        message.html,
        `--${boundary}--`,
      ].join("\r\n")
    : message.text;

  const payload = `${headers}\r\n\r\n${body.replace(/\r?\n\./g, "\r\n..")}\r\n.`;
  await conn.send(payload);
  try {
    await conn.send("QUIT", 2);
  } catch {
    /* some servers close abruptly */
  }
  conn.release();
  await secure.close().catch(() => undefined);
}
