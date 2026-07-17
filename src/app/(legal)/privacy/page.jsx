import LegalLayout, {
  Section,
  SubHeading,
  P,
  Bullets,
} from "@/app/(components)/legal/LegalLayout";

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const metadata = {
  metadataBase: new URL("https://app.creativeklux.com"),
  title: "Privacy Policy · Creative Klux",
  description:
    "How Creative Klux collects, uses, protects, and shares your information across our AI content, design, and social publishing tools — and the privacy choices you control.",
  keywords: [
    "Creative Klux privacy",
    "privacy policy",
    "data protection",
    "GDPR",
    "how we use your data",
  ],
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy · Creative Klux",
    description:
      "How Creative Klux collects, uses, protects, and shares your information — and the choices you control.",
    url: "https://app.creativeklux.com/privacy",
    siteName: "Creative Klux",
    type: "website",
    images: [{ url: "/heroimg.png", alt: "Creative Klux" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy · Creative Klux",
    description:
      "How Creative Klux collects, uses, protects, and shares your information — and the choices you control.",
    images: ["/heroimg.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

// ─── Table of contents ────────────────────────────────────────────────────────

const TOC = [
  { id: "overview", label: "1. Overview" },
  { id: "collect", label: "2. Information we collect" },
  { id: "use", label: "3. How we use information" },
  { id: "ai", label: "4. AI processing of content" },
  { id: "connected", label: "5. Connected accounts" },
  { id: "share", label: "6. How we share information" },
  { id: "cookies", label: "7. Cookies & storage" },
  { id: "retention", label: "8. Data retention" },
  { id: "security", label: "9. Data security" },
  { id: "rights", label: "10. Your rights & choices" },
  { id: "transfers", label: "11. International transfers" },
  { id: "children", label: "12. Children’s privacy" },
  { id: "changes", label: "13. Changes to this policy" },
  { id: "contact", label: "14. Contact us" },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="July 17, 2026"
      summary="This Privacy Policy explains what information Creative Klux collects when you use our websites, applications, and APIs, how we use and protect that information, when we share it, and the choices and rights you have. We designed Creative Klux to help you create — and to handle your data responsibly while doing so."
      toc={TOC}
    >
      <Section id="overview" title="1. Overview">
        <P>
          Creative Klux (“we,” “us,” or “our”) provides an all-in-one creative
          platform with AI content generation, design tools, templates, client
          dashboards, analytics, and social publishing. This policy applies to
          the Services we offer at app.creativeklux.com and our related APIs and
          infrastructure. By using the Services, you agree to the practices
          described here.
        </P>
      </Section>

      <Section id="collect" title="2. Information we collect">
        <SubHeading>Information you provide</SubHeading>
        <Bullets
          items={[
            "Account details: your name, email address, and password (stored in hashed form), plus any license code you enter.",
            "Content you create or upload: prompts, images, video, audio, brand assets, templates, and generated Output.",
            "Billing information: plan selection and payment details, which are processed by our payment providers (we do not store full card numbers).",
            "Communications: messages you send to support and any feedback you share.",
          ]}
        />
        <SubHeading>Information collected automatically</SubHeading>
        <Bullets
          items={[
            "Usage data: features used, actions taken, and interactions with the Services.",
            "Device & log data: IP address, browser type, device identifiers, and timestamps.",
            "Cookies and local storage: used to keep you signed in, remember preferences, and operate certain on-device features.",
          ]}
        />
        <SubHeading>Information from connected platforms</SubHeading>
        <P>
          When you connect a social or advertising account (such as YouTube,
          TikTok, Meta, X, or Pinterest), we receive the access tokens and
          account information needed to provide the features you request, such
          as publishing posts or retrieving analytics.
        </P>
      </Section>

      <Section id="use" title="3. How we use information">
        <P>We use the information we collect to:</P>
        <Bullets
          items={[
            "Provide, operate, secure, and maintain the Services and your account.",
            "Generate the AI Output and designs you request, and store your files so you can access them.",
            "Publish content and retrieve analytics from platforms you connect.",
            "Process payments, manage trials and licenses, and prevent fraud and abuse.",
            "Communicate with you about your account, updates, security, and support requests.",
            "Understand usage and improve the performance, reliability, and features of the Services.",
            "Comply with legal obligations and enforce our Terms of Service.",
          ]}
        />
      </Section>

      <Section id="ai" title="4. AI processing of your content">
        <P>
          To power AI features, the prompts and content you submit may be sent
          to third-party AI providers and to our own on-device or cloud
          processing components solely to generate the Output you request. We do
          not sell your content, and we do not use it to train third-party
          foundation models except where a provider’s terms require it for
          delivering the feature. Where feasible, some processing runs directly
          in your browser so that your content is not transmitted to our servers.
        </P>
      </Section>

      <Section id="connected" title="5. Connected accounts & integrations">
        <P>
          Access tokens for connected platforms are used only to perform the
          actions you authorize, such as posting or reading analytics. You can
          revoke access at any time by disconnecting the platform in your
          account settings or through the platform’s own security controls.
          Disconnecting stops future access but does not undo actions already
          taken at your request.
        </P>
      </Section>

      <Section id="share" title="6. How we share information">
        <P>
          We do not sell your personal information. We share information only in
          the following circumstances:
        </P>
        <Bullets
          items={[
            "Service providers: cloud hosting and storage, content delivery, AI providers, analytics, and payment processors that perform services on our behalf under confidentiality obligations.",
            "Connected platforms: the third-party services you choose to connect and publish to, according to your instructions.",
            "Legal and safety: when required by law, legal process, or to protect the rights, safety, and security of our users, the public, or Creative Klux.",
            "Business transfers: in connection with a merger, acquisition, or sale of assets, subject to this policy.",
          ]}
        />
      </Section>

      <Section id="cookies" title="7. Cookies & local storage">
        <P>
          We use cookies and browser local storage to keep you signed in,
          remember preferences, run certain in-browser features, and understand
          how the Services are used. You can control cookies through your
          browser settings; disabling some cookies may affect functionality such
          as staying logged in.
        </P>
      </Section>

      <Section id="retention" title="8. Data retention">
        <P>
          We keep your information for as long as your account is active or as
          needed to provide the Services. We may retain certain information after
          account closure where necessary to comply with legal obligations,
          resolve disputes, prevent abuse, and enforce our agreements. When
          information is no longer needed, we delete or anonymize it.
        </P>
      </Section>

      <Section id="security" title="9. Data security">
        <P>
          We use technical and organizational measures designed to protect your
          information, including encryption in transit, hashed passwords, and
          access controls. No method of transmission or storage is completely
          secure, however, so we cannot guarantee absolute security. Please help
          protect your account by using a strong, unique password and keeping
          your credentials confidential.
        </P>
      </Section>

      <Section id="rights" title="10. Your rights & choices">
        <P>
          Depending on your location, you may have rights over your personal
          information, including the right to:
        </P>
        <Bullets
          items={[
            "Access, correct, or update the information we hold about you.",
            "Delete your account and associated personal information.",
            "Object to or restrict certain processing, and withdraw consent where processing is based on consent.",
            "Request a copy of your information in a portable format.",
            "Lodge a complaint with your local data protection authority.",
          ]}
        />
        <P>
          You can exercise many of these rights directly in your account
          settings, or by contacting us at{" "}
          <a
            href="mailto:support@creativeklux.com"
            className="text-[#1447e6] hover:underline"
          >
            support@creativeklux.com
          </a>
          . We will respond in accordance with applicable law.
        </P>
      </Section>

      <Section id="transfers" title="11. International data transfers">
        <P>
          Creative Klux operates globally, and your information may be processed
          and stored in countries other than your own, including where our
          service providers operate. Where required, we take steps to ensure
          appropriate safeguards are in place for such transfers.
        </P>
      </Section>

      <Section id="children" title="12. Children’s privacy">
        <P>
          The Services are not directed to children under 18, and we do not
          knowingly collect personal information from them. If you believe a
          child has provided us with personal information, please contact us so
          we can take appropriate action.
        </P>
      </Section>

      <Section id="changes" title="13. Changes to this policy">
        <P>
          We may update this Privacy Policy from time to time. When we make
          material changes, we will update the “Last updated” date above and,
          where appropriate, provide additional notice. We encourage you to
          review this policy periodically.
        </P>
      </Section>

      <Section id="contact" title="14. Contact us">
        <P>
          If you have questions about this Privacy Policy or how we handle your
          information, please contact us:
        </P>
        <SubHeading>Creative Klux</SubHeading>
        <P>
          Email:{" "}
          <a
            href="mailto:support@creativeklux.com"
            className="text-[#1447e6] hover:underline"
          >
            support@creativeklux.com
          </a>
        </P>
      </Section>
    </LegalLayout>
  );
}
