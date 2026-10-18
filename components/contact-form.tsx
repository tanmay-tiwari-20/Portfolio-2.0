"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Please provide your name."),
  email: z.string().email("Please provide a valid email."),
  subject: z.string().min(3, "Add a short subject."),
  message: z.string().min(10, "Please tell me a little more.").max(5000),
  botcheck: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export default function ContactForm() {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values) => {
    if (v.botcheck) return;
    const key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

    if (!key) {
      setStatus({
        type: "success",
        message: "Thank you for reaching out! (Demo mode: configure Web3Forms key to receive submissions).",
      });
      reset();
      return;
    }

    try {
      const r = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, access_key: key }),
      });
      const data = await r.json();
      if (!data.success) throw new Error();
      setStatus({
        type: "success",
        message: "Transmission received! I will review your signal and respond shortly.",
      });
      reset();
    } catch {
      setStatus({
        type: "error",
        message: "Transmission failed. Please reach out directly via email.",
      });
    }
  };

  return (
    <form
      className="timeline-card"
      style={{ padding: 36, display: "grid", gap: 20 }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <label className="form-label">Your Name</label>
        <input
          {...register("name")}
          placeholder="Peter Parker"
          className="form-input"
        />
        {errors.name && (
          <span style={{ color: "var(--spidey-red)", fontSize: 12, marginTop: 4, display: "block" }}>
            {errors.name.message}
          </span>
        )}
      </div>

      <div>
        <label className="form-label">Email Address</label>
        <input
          {...register("email")}
          type="email"
          placeholder="peter@dailybugle.com"
          className="form-input"
        />
        {errors.email && (
          <span style={{ color: "var(--spidey-red)", fontSize: 12, marginTop: 4, display: "block" }}>
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label className="form-label">Subject</label>
        <input
          {...register("subject")}
          placeholder="New Mission / Creative Collaboration"
          className="form-input"
        />
        {errors.subject && (
          <span style={{ color: "var(--spidey-red)", fontSize: 12, marginTop: 4, display: "block" }}>
            {errors.subject.message}
          </span>
        )}
      </div>

      <div>
        <label className="form-label">Message Details</label>
        <textarea
          {...register("message")}
          placeholder="Tell me about your project, timeline, and goals..."
          className="form-textarea"
          rows={5}
        />
        {errors.message && (
          <span style={{ color: "var(--spidey-red)", fontSize: 12, marginTop: 4, display: "block" }}>
            {errors.message.message}
          </span>
        )}
      </div>

      <label className="honeypot" aria-hidden="true" style={{ display: "none" }}>
        Leave this empty
        <input tabIndex={-1} autoComplete="off" {...register("botcheck")} />
      </label>

      <button
        type="submit"
        className="button button-primary"
        disabled={isSubmitting}
        style={{ width: "100%", marginTop: 8 }}
      >
        {isSubmitting ? "Transmitting..." : "Send Transmission"} <ArrowUpRight size={18} />
      </button>

      {status && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 14,
            borderRadius: "var(--radius-md)",
            backgroundColor: status.type === "success" ? "rgba(0, 255, 136, 0.12)" : "rgba(255, 30, 39, 0.12)",
            border: `1px solid ${status.type === "success" ? "#00ff88" : "var(--spidey-red)"}`,
            color: status.type === "success" ? "#00ff88" : "var(--spidey-red)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{status.message}</span>
        </div>
      )}
    </form>
  );
}
