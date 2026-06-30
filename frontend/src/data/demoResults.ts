import type { VerificationResultRow } from "../types/results";

export const demoResults: VerificationResultRow[] = [
  {
    id: "r-001",
    email: "alice@northstar.dev",
    status: "Valid",
    stage: "SMTP",
    detail: "SMTP accepted recipient",
    domain: "northstar.dev",
    mxHost: "mx1.northstar.dev",
    responseCode: 250,
    checkedAt: "10:08:12"
  },
  {
    id: "r-002",
    email: "bad-format",
    status: "Bounce",
    stage: "Syntax",
    detail: "Missing @ symbol",
    domain: "-",
    mxHost: "-",
    responseCode: null,
    checkedAt: "10:08:13"
  },
  {
    id: "r-003",
    email: "sales@atlasmail.io",
    status: "Catch-All",
    stage: "SMTP",
    detail: "Random mailbox also accepted",
    domain: "atlasmail.io",
    mxHost: "mx.atlasmail.io",
    responseCode: 250,
    checkedAt: "10:08:14"
  },
  {
    id: "r-004",
    email: "support@clearpath.co",
    status: "Valid",
    stage: "SMTP",
    detail: "Recipient accepted",
    domain: "clearpath.co",
    mxHost: "mail.clearpath.co",
    responseCode: 250,
    checkedAt: "10:08:15"
  },
  {
    id: "r-005",
    email: "missing@paperplane.test",
    status: "Bounce",
    stage: "DNS/MX",
    detail: "Domain does not publish MX records",
    domain: "paperplane.test",
    mxHost: "-",
    responseCode: null,
    checkedAt: "10:08:16"
  },
  {
    id: "r-006",
    email: "ops@slowmx.example",
    status: "Unknown/Error",
    stage: "DNS/MX",
    detail: "DNS MX lookup timed out",
    domain: "slowmx.example",
    mxHost: "-",
    responseCode: null,
    checkedAt: "10:08:17"
  },
  {
    id: "r-007",
    email: "newsletter@brightside.app",
    status: "Valid",
    stage: "SMTP",
    detail: "Recipient accepted",
    domain: "brightside.app",
    mxHost: "aspmx.brightside.app",
    responseCode: 250,
    checkedAt: "10:08:19"
  },
  {
    id: "r-008",
    email: "disabled@riverbank.org",
    status: "Bounce",
    stage: "SMTP",
    detail: "Mailbox unavailable",
    domain: "riverbank.org",
    mxHost: "mx.riverbank.org",
    responseCode: 550,
    checkedAt: "10:08:20"
  },
  {
    id: "r-009",
    email: "team@evergreen.design",
    status: "Valid",
    stage: "SMTP",
    detail: "Recipient accepted",
    domain: "evergreen.design",
    mxHost: "mx1.evergreen.design",
    responseCode: 250,
    checkedAt: "10:08:21"
  },
  {
    id: "r-010",
    email: "random@allaccept.net",
    status: "Catch-All",
    stage: "SMTP",
    detail: "Server accepts any mailbox",
    domain: "allaccept.net",
    mxHost: "mail.allaccept.net",
    responseCode: 250,
    checkedAt: "10:08:22"
  },
  {
    id: "r-011",
    email: "finance@meridian.io",
    status: "Valid",
    stage: "SMTP",
    detail: "Recipient accepted",
    domain: "meridian.io",
    mxHost: "mx.meridian.io",
    responseCode: 250,
    checkedAt: "10:08:24"
  },
  {
    id: "r-012",
    email: "temp@graylist.example",
    status: "Unknown/Error",
    stage: "SMTP",
    detail: "Temporary SMTP response",
    domain: "graylist.example",
    mxHost: "mx.graylist.example",
    responseCode: 451,
    checkedAt: "10:08:25"
  },
  {
    id: "r-013",
    email: "hello@orbitlabs.dev",
    status: "Valid",
    stage: "SMTP",
    detail: "Recipient accepted",
    domain: "orbitlabs.dev",
    mxHost: "mx1.orbitlabs.dev",
    responseCode: 250,
    checkedAt: "10:08:26"
  },
  {
    id: "r-014",
    email: "user@@example.com",
    status: "Bounce",
    stage: "Syntax",
    detail: "Multiple @ symbols",
    domain: "-",
    mxHost: "-",
    responseCode: null,
    checkedAt: "10:08:27"
  },
  {
    id: "r-015",
    email: "careers@launchgrid.ai",
    status: "Valid",
    stage: "SMTP",
    detail: "Recipient accepted",
    domain: "launchgrid.ai",
    mxHost: "mail.launchgrid.ai",
    responseCode: 250,
    checkedAt: "10:08:28"
  },
  {
    id: "r-016",
    email: "postmaster@inboxrelay.com",
    status: "Valid",
    stage: "SMTP",
    detail: "Recipient accepted",
    domain: "inboxrelay.com",
    mxHost: "mx.inboxrelay.com",
    responseCode: 250,
    checkedAt: "10:08:30"
  },
  {
    id: "r-017",
    email: "unknown@blockedmx.test",
    status: "Unknown/Error",
    stage: "SMTP",
    detail: "Connection blocked or dropped",
    domain: "blockedmx.test",
    mxHost: "mx.blockedmx.test",
    responseCode: null,
    checkedAt: "10:08:31"
  },
  {
    id: "r-018",
    email: "lead@wildcardmail.co",
    status: "Catch-All",
    stage: "SMTP",
    detail: "Catch-all behavior detected",
    domain: "wildcardmail.co",
    mxHost: "mx.wildcardmail.co",
    responseCode: 250,
    checkedAt: "10:08:32"
  }
];
