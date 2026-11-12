"use client";

import * as React from "react";
import { Check, Copy, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";

const TOPICS = [
  { value: "Resource request", label: "Request a resource" },
  { value: "Report a resource", label: "Report a problem with a resource" },
  { value: "Takedown request", label: "Copyright / takedown request" },
  { value: "Community listing", label: "List an event or study group" },
  { value: "Tool suggestion", label: "Suggest a tool" },
  { value: "General", label: "Something else" },
];

/** No backend form: composes a prefilled email in the user's mail app, and only when a contact address is configured. */
export function ContactPanel({ email }: { email: string | null }) {
  const [copied, setCopied] = React.useState(false);
  const [topic, setTopic] = React.useState(TOPICS[0].value);
  const [name, setName] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const copy = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (message.trim().length < 10) {
      setError("Please write at least a sentence so we know what you need.");
      return;
    }
    setError(null);
    const subject = `[MUJ Study Buddy] ${topic}`;
    const body = `${message.trim()}\n\n— ${name.trim() || "A student"}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6">
      {email ? (
        <div className="card-surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" aria-hidden />
            <a href={`mailto:${email}`} className="font-semibold text-text hover:text-lavender">
              {email}
            </a>
          </div>
          <Button variant="secondary" size="sm" onClick={copy} leftIcon={copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}>
            {copied ? "Copied" : "Copy address"}
          </Button>
        </div>
      ) : (
        <Alert variant="info" title="Contact email not configured yet">
          The site administrator hasn&apos;t published a contact address. It can be set in the admin dashboard under Settings.
        </Alert>
      )}

      <form onSubmit={submit} className="card-surface space-y-4 p-5 sm:p-6" aria-describedby="contact-note">
        <h2 className="text-lg font-semibold text-text">Write to us</h2>
        <p id="contact-note" className="text-sm text-text-3">
          This opens your email app with the message filled in — nothing is stored on this website.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} options={TOPICS} disabled={!email} />
          <Input label="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} disabled={!email} maxLength={80} />
        </div>
        <Textarea
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          disabled={!email}
          error={error ?? undefined}
          hint="For a resource problem, include the page link, subject code and what's wrong."
        />
        <Button type="submit" disabled={!email} leftIcon={<Send className="h-4 w-4" aria-hidden />}>
          Compose email
        </Button>
        {!email && <p className="text-xs text-muted">The form is disabled until a contact email is configured.</p>}
      </form>
    </div>
  );
}
