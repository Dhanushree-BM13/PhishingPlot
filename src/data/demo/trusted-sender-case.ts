export const trustedSenderCaseFixture = {
  thread: {
    threadId: "THREAD-PARTNER-204",
    from: "ap@partner.example",
    replyTo: "ap@partner.example",
    to: "finance@company.example",
    subject: "Re: Updated remittance details",
    sentAt: "2026-10-30T10:14:00Z",
    infrastructure: "mx.partner.example",
    sendHourUtc: 10,
    linkDomain: "remittance-update.example",
    requestsPayment: true,
    requestsCredentials: false,
    body: [
      { text: "Following up in our existing remittance thread." },
      { text: "Please use the new portal for the next invoice: " },
      { text: "https://remittance-update.example/portal", emphasis: "link" },
      { text: "Our bank details have changed. Please update them before processing." ,
        emphasis: "bank-detail" },
    ],
  },
  signals: [
    {
      id: "NEW_LINK_DOMAIN",
      weight: 25,
      detail: "Link domain has not appeared in the sender's prior messages.",
    },
    {
      id: "FIRST_PAYMENT_REQUEST",
      weight: 30,
      detail: "The sender has not previously requested payment or invoice changes.",
    },
    {
      id: "BANK_DETAIL_CHANGE",
      weight: 30,
      detail: "The message asks the recipient to update bank details.",
    },
  ],
  score: 85,
  rulesetVersion: "trusted-sender-v1",
} as const;
