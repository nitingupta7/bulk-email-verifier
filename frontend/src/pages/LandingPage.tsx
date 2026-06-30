import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileUp,
  Gauge,
  Layers3,
  MailCheck,
  Network,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";

import heroImage from "../assets/landing-hero.png";
import { Button } from "../components/Button";

const features = [
  {
    title: "Three-tier verification",
    description: "Syntax, MX, and SMTP checks are coordinated into one structured pipeline.",
    icon: Layers3
  },
  {
    title: "Controlled concurrency",
    description: "Bulk runs are processed with configurable limits, retries, and graceful timeouts.",
    icon: Gauge
  },
  {
    title: "Catch-all awareness",
    description: "Random mailbox probes help separate true accepts from domains that accept everything.",
    icon: ShieldCheck
  }
];

const workflow = [
  { label: "Upload", detail: "CSV or TXT files are parsed in memory.", icon: FileUp },
  { label: "Validate", detail: "Malformed addresses are rejected before network checks.", icon: CheckCircle2 },
  { label: "Resolve", detail: "DNS and MX records establish mail routing readiness.", icon: Network },
  { label: "Probe", detail: "SMTP RCPT responses predict delivery without sending DATA.", icon: MailCheck }
];

const faqs = [
  {
    question: "Does the system send emails?",
    answer: "No. SMTP sessions stop after RCPT TO and immediately issue QUIT."
  },
  {
    question: "Why can some addresses be unknown?",
    answer: "Timeouts, graylisting, temporary failures, and port restrictions can prevent definitive SMTP answers."
  },
  {
    question: "Can it process large files?",
    answer: "The backend is designed for bulk processing with controlled concurrency and progress snapshots."
  },
  {
    question: "What is a catch-all domain?",
    answer: "A domain that accepts random recipient addresses, making individual inbox existence hard to prove."
  }
];

export const LandingPage = () => {
  return (
    <div className="grid gap-20 pb-10">
      <section className="relative left-1/2 min-h-[76vh] w-screen -translate-x-1/2 overflow-hidden border-b border-ink-100 bg-white">
        <img
          src={heroImage}
          alt="Layered email verification dashboard preview"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/45" />
        <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(247,248,247,0.96)_0%,rgba(247,248,247,0.86)_34%,rgba(247,248,247,0.28)_70%,rgba(247,248,247,0.08)_100%)]" />
        <div className="relative mx-auto flex min-h-[76vh] w-full max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white/80 px-3 py-1.5 text-sm font-semibold text-ink-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-signal-blue" aria-hidden="true" />
              Bulk Email Verifier
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-normal text-ink-900 sm:text-6xl lg:text-7xl">
              Verify email lists before they damage your sender reputation.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink-700 sm:text-lg">
              A focused verification workspace for parsing bulk lists, classifying risky addresses, and preparing clean export-ready results.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/verify">
                <Button type="button" className="w-full sm:w-auto">
                  Start Verification
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <a href="#workflow" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-ink-300 bg-white/80 px-4 py-2 text-sm font-semibold text-ink-900 backdrop-blur transition hover:bg-white">
                View Workflow
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.title}
              className="animate-rise rounded-md border border-ink-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-panel"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink-900 text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-ink-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">{feature.description}</p>
            </article>
          );
        })}
      </section>

      <section id="workflow" className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase text-signal-blue">Workflow</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-ink-900 sm:text-4xl">
            From raw list to categorized output.
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-500">
            The pipeline keeps high-latency network checks controlled while preserving clear progress and final classifications.
          </p>
        </div>
        <div className="grid gap-3">
          {workflow.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="group grid grid-cols-[auto_1fr] gap-4 rounded-md border border-ink-100 bg-white p-4 shadow-sm transition hover:border-ink-300">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-ink-50 text-ink-700 ring-1 ring-ink-100 transition group-hover:bg-ink-900 group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-ink-500">Step {index + 1}</span>
                    <h3 className="text-base font-semibold text-ink-900">{step.label}</h3>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-ink-500">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-md border border-ink-100 bg-white p-5 shadow-panel lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
          <div>
            <p className="text-sm font-semibold uppercase text-signal-blue">FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-ink-900">Built for practical verification limits.</h2>
          </div>
          <div className="grid gap-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-md border border-ink-100 bg-ink-50 p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink-900">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-ink-500">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-md border border-ink-100 bg-ink-900 p-6 text-white shadow-panel sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-100">
                <Zap className="h-4 w-4 text-signal-amber" aria-hidden="true" />
                Ready for bulk validation
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">Upload a list and inspect the first validation layer.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-100">
                The verification console is connected to the backend parser and syntax validation endpoint.
              </p>
            </div>
            <Link to="/verify">
              <Button type="button" variant="secondary" className="w-full border-white lg:w-auto">
                Open Console
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
