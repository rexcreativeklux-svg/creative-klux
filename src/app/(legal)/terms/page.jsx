import LegalLayout, {
  Section,
  SubHeading,
  P,
  Bullets,
} from "@/app/(components)/legal/LegalLayout";

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const metadata = {
  metadataBase: new URL("https://app.creativeklux.com"),
  title: "Terms of Service · Creative Klux",
  description:
    "The Terms of Service governing your use of Creative Klux — the all-in-one platform for AI-powered content, design tools, and social publishing for creators, managers and brands.",
  keywords: [
    "Creative Klux terms",
    "terms of service",
    "terms and conditions",
    "user agreement",
    "acceptable use policy",
  ],
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service · Creative Klux",
    description:
      "The agreement that governs your use of Creative Klux and its creative, AI and publishing tools.",
    url: "https://app.creativeklux.com/terms",
    siteName: "Creative Klux",
    type: "website",
    images: [{ url: "/heroimg.png", alt: "Creative Klux" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service · Creative Klux",
    description:
      "The agreement that governs your use of Creative Klux and its creative, AI and publishing tools.",
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
  { id: "acceptance", label: "1. Acceptance of terms" },
  { id: "accounts", label: "2. Eligibility & accounts" },
  { id: "plans", label: "3. Trials, licenses & plans" },
  { id: "acceptable-use", label: "4. Acceptable use" },
  { id: "your-content", label: "5. Your content" },
  { id: "ai-content", label: "6. AI-generated content" },
  { id: "integrations", label: "7. Third-party integrations" },
  { id: "ip", label: "8. Intellectual property" },
  { id: "billing", label: "9. Billing & refunds" },
  { id: "termination", label: "10. Termination" },
  { id: "disclaimers", label: "11. Disclaimers" },
  { id: "liability", label: "12. Limitation of liability" },
  { id: "indemnification", label: "13. Indemnification" },
  { id: "changes", label: "14. Changes to these terms" },
  { id: "governing-law", label: "15. Governing law" },
  { id: "contact", label: "16. Contact us" },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="July 17, 2026"
      summary="These Terms of Service (the “Terms”) form a binding agreement between you and Creative Klux and govern your access to and use of our websites, applications, APIs, and related services (together, the “Services”). Please read them carefully — by creating an account or using the Services, you agree to these Terms."
      toc={TOC}
    >
      <Section id="acceptance" title="1. Acceptance of terms">
        <P>
          By accessing or using Creative Klux — including the application at
          app.creativeklux.com and any associated tools, APIs, and content — you
          confirm that you have read, understood, and agree to be bound by these
          Terms and by our Privacy Policy, which is incorporated here by
          reference. If you are using the Services on behalf of a company or
          other organization, you represent that you have authority to bind that
          organization, and “you” refers to that organization.
        </P>
        <P>
          If you do not agree to these Terms, you must not access or use the
          Services.
        </P>
      </Section>

      <Section id="accounts" title="2. Eligibility & accounts">
        <P>
          You must be at least 18 years old, or the age of legal majority in
          your jurisdiction, to use Creative Klux. To access most features you
          must create an account and verify your email address.
        </P>
        <Bullets
          items={[
            "You are responsible for providing accurate information and keeping your account details up to date.",
            "You are responsible for safeguarding your password and for all activity that occurs under your account.",
            "Notify us promptly at support@creativeklux.com if you suspect any unauthorized use of your account.",
            "One person or entity may not maintain more than one free trial account.",
          ]}
        />
      </Section>

      <Section id="plans" title="3. Trials, licenses & plans">
        <P>
          Creative Klux offers a free trial as well as paid plans and
          license-based access. When you register without a license code, you
          may be granted a free trial account (currently 7 days). Continued
          access after a trial or license period may require a paid plan or a
          valid license code.
        </P>
        <Bullets
          items={[
            "Trial access is provided “as is” and may be modified or discontinued at any time.",
            "License codes are issued for a specific account and plan and may not be shared, resold, or transferred except where we expressly permit reselling through our program.",
            "We may change plan features, limits, and pricing; where required, we will give you reasonable notice before changes take effect.",
          ]}
        />
      </Section>

      <Section id="acceptable-use" title="4. Acceptable use">
        <P>
          You agree to use the Services lawfully and responsibly. You must not,
          and must not permit anyone else to:
        </P>
        <Bullets
          items={[
            "Create, upload, or distribute content that is unlawful, infringing, defamatory, hateful, harassing, deceptive, or sexually exploitative — particularly any content involving minors.",
            "Infringe the intellectual property, privacy, publicity, or other rights of any person or entity, including generating imitations of a real person or brand without authorization.",
            "Attempt to reverse engineer, decompile, scrape, or gain unauthorized access to the Services, our AI models, or our infrastructure.",
            "Interfere with, overload, or disrupt the Services, including by circumventing usage limits or security measures.",
            "Use the Services to generate spam, malware, or content that violates the rules of any connected third-party platform.",
            "Resell or provide the Services to third parties except through a reselling arrangement we authorize in writing.",
          ]}
        />
        <P>
          We may investigate suspected violations and may suspend or terminate
          access for conduct we reasonably believe breaches these Terms or
          harms other users, third parties, or Creative Klux.
        </P>
      </Section>

      <Section id="your-content" title="5. Your content">
        <P>
          “Your Content” means any text, images, audio, video, prompts, brand
          assets, and other materials you upload to or create with the Services.
          You retain all ownership rights you hold in Your Content.
        </P>
        <P>
          You grant Creative Klux a worldwide, non-exclusive, royalty-free
          license to host, store, reproduce, process, and display Your Content
          solely as needed to operate, secure, maintain, and improve the
          Services and to provide them to you — for example, to store files on
          our content delivery network and to send content to the AI providers
          that power a feature you use. This license ends when Your Content is
          deleted, except where retention is required to comply with law or to
          resolve disputes.
        </P>
        <P>
          You are solely responsible for Your Content and represent that you
          have all rights necessary to submit it and to grant the license above.
        </P>
      </Section>

      <Section id="ai-content" title="6. AI-generated content">
        <P>
          Creative Klux includes AI-powered features that generate images,
          video, audio, voiceovers, and text based on your inputs (“Output”).
          You should be aware of the following:
        </P>
        <Bullets
          items={[
            "Output is generated automatically and may be inaccurate, incomplete, or unintentionally similar to existing works. You are responsible for reviewing Output before relying on or publishing it.",
            "As between you and Creative Klux, you own the Output you create through your account, to the extent permitted by applicable law and by the terms of the underlying AI providers.",
            "You must not use AI features to create content that is illegal, deceptive, or that misappropriates the identity or likeness of others.",
            "AI Output is not professional advice (legal, medical, financial, or otherwise) and should not be treated as such.",
          ]}
        />
      </Section>

      <Section id="integrations" title="7. Third-party integrations & platforms">
        <P>
          The Services let you connect and publish to third-party platforms such
          as YouTube, TikTok, Meta (Facebook and Instagram), X, and Pinterest.
          When you connect an account, you authorize Creative Klux to access and
          use that platform on your behalf as needed to provide the features you
          request.
        </P>
        <Bullets
          items={[
            "Your use of each connected platform is also governed by that platform’s own terms and policies, and you are responsible for complying with them.",
            "We are not responsible for the availability, accuracy, or actions of third-party platforms, and they may change or revoke access at any time.",
            "You can disconnect a platform at any time from your account settings.",
          ]}
        />
      </Section>

      <Section id="ip" title="8. Intellectual property">
        <P>
          The Services, including our software, design, branding, templates, and
          underlying technology, are owned by Creative Klux and its licensors
          and are protected by intellectual property laws. Except for the rights
          expressly granted to you in these Terms, we reserve all rights in and
          to the Services.
        </P>
        <P>
          Templates and stock assets we provide may be used within the Services
          to create your own designs, but you may not extract, redistribute, or
          resell them as standalone assets.
        </P>
      </Section>

      <Section id="billing" title="9. Billing & refunds">
        <P>
          Paid plans are billed in advance on the cycle shown at checkout.
          Unless otherwise stated or required by law:
        </P>
        <Bullets
          items={[
            "Fees are charged through our third-party payment processors, and you authorize us to charge your selected payment method for the applicable fees and taxes.",
            "Subscriptions renew automatically until cancelled; you can cancel at any time and your plan will remain active until the end of the current billing period.",
            "Fees already paid are generally non-refundable except where required by applicable law or expressly stated in a plan’s terms.",
            "If a payment fails, we may suspend or downgrade your access until the balance is resolved.",
          ]}
        />
      </Section>

      <Section id="termination" title="10. Termination">
        <P>
          You may stop using the Services and delete your account at any time.
          We may suspend or terminate your access, with or without notice, if we
          reasonably believe you have violated these Terms, if required by law,
          or to protect the Services or other users.
        </P>
        <P>
          Upon termination, your right to use the Services ends immediately. We
          may delete Your Content after a reasonable period, so you should keep
          your own copies of anything you wish to retain. Provisions that by
          their nature should survive termination (including ownership,
          disclaimers, limitation of liability, and indemnification) will
          survive.
        </P>
      </Section>

      <Section id="disclaimers" title="11. Disclaimers">
        <P>
          The Services are provided “as is” and “as available,” without
          warranties of any kind, whether express, implied, or statutory,
          including implied warranties of merchantability, fitness for a
          particular purpose, and non-infringement. We do not warrant that the
          Services will be uninterrupted, error-free, secure, or that any Output
          will meet your expectations. Your use of the Services is at your own
          risk.
        </P>
      </Section>

      <Section id="liability" title="12. Limitation of liability">
        <P>
          To the maximum extent permitted by law, Creative Klux and its
          officers, employees, and suppliers will not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or
          for any loss of profits, revenue, data, or goodwill, arising out of or
          related to your use of the Services.
        </P>
        <P>
          To the maximum extent permitted by law, our total aggregate liability
          for any claim relating to the Services will not exceed the greater of
          the amount you paid us for the Services in the twelve months before
          the event giving rise to the claim, or one hundred US dollars
          (USD&nbsp;100).
        </P>
      </Section>

      <Section id="indemnification" title="13. Indemnification">
        <P>
          You agree to indemnify and hold harmless Creative Klux and its
          affiliates from any claims, damages, liabilities, and expenses
          (including reasonable legal fees) arising out of Your Content, your
          use of the Services, your violation of these Terms, or your violation
          of any law or the rights of a third party.
        </P>
      </Section>

      <Section id="changes" title="14. Changes to these terms">
        <P>
          We may update these Terms from time to time. When we make material
          changes, we will update the “Last updated” date above and, where
          appropriate, provide additional notice. Your continued use of the
          Services after changes take effect constitutes acceptance of the
          revised Terms.
        </P>
      </Section>

      <Section id="governing-law" title="15. Governing law">
        <P>
          These Terms are governed by the laws applicable at Creative Klux’s
          principal place of business, without regard to conflict-of-laws
          rules. Any disputes will be subject to the exclusive jurisdiction of
          the competent courts in that location, unless mandatory local law
          provides otherwise.
        </P>
      </Section>

      <Section id="contact" title="16. Contact us">
        <P>
          If you have questions about these Terms, please contact us:
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
