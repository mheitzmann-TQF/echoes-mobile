import { ExpoRequest, ExpoResponse } from 'expo-router/server';

const TERMS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Echoes</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0A0A0A;
      color: #E5E5E5;
      line-height: 1.7;
      padding: 40px 20px;
      max-width: 680px;
      margin: 0 auto;
    }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #FFFFFF; }
    h2 { font-size: 18px; font-weight: 600; margin: 32px 0 12px; color: #FFFFFF; }
    p, li { font-size: 15px; margin-bottom: 12px; color: #A3A3A3; }
    ul { padding-left: 20px; margin-bottom: 16px; }
    li { margin-bottom: 8px; }
    .updated { font-size: 13px; color: #737373; margin-bottom: 32px; }
    a { color: #F59E0B; text-decoration: none; }
    a:hover { text-decoration: underline; }
    hr { border: none; border-top: 1px solid #262626; margin: 32px 0; }
  </style>
</head>
<body>
  <h1>Terms of Service</h1>
  <p class="updated">Last updated: February 26, 2026</p>

  <p>Welcome to The Quiet Frame – Echoes ("the App").</p>
  <p>By using the App, you agree to the following terms. If you do not agree, please do not use the App.</p>

  <hr>

  <h2>1. What the App Is</h2>
  <p>Echoes is a reflective application that presents contextual information, patterns, and cultural or environmental markers. It is designed to support awareness and reflection.</p>
  <p>The App does not provide:</p>
  <ul>
    <li>professional advice (medical, psychological, financial, legal, or otherwise)</li>
    <li>predictions or guarantees</li>
    <li>instructions or recommendations for action</li>
  </ul>
  <p>All content is provided for informational and reflective purposes only.</p>

  <hr>

  <h2>2. No Accounts, No Profiles</h2>
  <p>Echoes does not require user accounts.</p>
  <p>We do not create personal profiles, track user behavior across sessions, or associate usage with an identifiable individual. Access to paid features is managed using a device-based identifier solely for subscription validation.</p>

  <hr>

  <h2>3. Access and Subscriptions</h2>
  <p>Echoes provides an initial period of full access. After this period, access may pause unless continued through a paid subscription.</p>
  <p>Subscriptions:</p>
  <ul>
    <li>are handled through Apple App Store or Google Play</li>
    <li>renew automatically unless canceled through the platform's subscription settings</li>
    <li>are subject to the terms of the respective app store</li>
  </ul>
  <p>Echoes does not manage billing directly and cannot modify subscriptions on your behalf.</p>

  <hr>

  <h2>4. Content and Interpretation</h2>
  <p>Content in the App may include:</p>
  <ul>
    <li>aggregated media patterns</li>
    <li>cultural or traditional timekeeping references</li>
    <li>astronomical or environmental data</li>
  </ul>
  <p>Such content:</p>
  <ul>
    <li>is contextual, not causal</li>
    <li>is not personalized</li>
    <li>should not be interpreted as guidance, instruction, or prediction</li>
  </ul>
  <p>You are responsible for how you interpret and use any information presented.</p>

  <hr>

  <h2>5. Geographic and Cultural Scope</h2>
  <p>Echoes draws on sources, traditions, and markers from multiple regions and cultures. The presence or absence of specific content does not imply completeness, endorsement, or prioritization.</p>

  <hr>

  <h2>6. Acceptable Use</h2>
  <p>You agree not to:</p>
  <ul>
    <li>misuse or attempt to interfere with the App's functionality</li>
    <li>reverse engineer or exploit the App or its services</li>
    <li>use the App for unlawful purposes</li>
  </ul>

  <hr>

  <h2>7. Availability and Changes</h2>
  <p>We may update, modify, or discontinue parts of the App at any time. We do not guarantee uninterrupted availability.</p>
  <p>We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the updated Terms.</p>

  <hr>

  <h2>8. Limitation of Liability</h2>
  <p>To the extent permitted by law:</p>
  <ul>
    <li>The App is provided "as is"</li>
    <li>We make no warranties regarding accuracy, completeness, or suitability</li>
    <li>We are not liable for decisions or actions taken based on the App's content</li>
  </ul>

  <hr>

  <h2>9. Contact</h2>
  <p>If you have questions about these Terms, you may contact us at:</p>
  <p><a href="mailto:hey@thequietframe.com">hey@thequietframe.com</a></p>
</body>
</html>`;

export async function GET(request: ExpoRequest): Promise<ExpoResponse> {
  return new ExpoResponse(TERMS_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
