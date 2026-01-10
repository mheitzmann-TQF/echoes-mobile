import { ExpoRequest, ExpoResponse } from 'expo-router/server';

const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Echoes</title>
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
  <h1>Privacy Policy</h1>
  <p class="updated">Last updated: February 26, 2026</p>

  <p>The Quiet Frame – Echoes ("the App") is designed to respect privacy by default.</p>
  <p>This Privacy Policy explains what data is (and is not) collected when you use the App.</p>

  <hr>

  <h2>1. No Accounts, No Profiles</h2>
  <p>Echoes does not require user accounts.</p>
  <p>We do not collect names, email addresses, phone numbers, or other personal identifiers. We do not create user profiles or track individuals across sessions.</p>

  <hr>

  <h2>2. Data We Do Not Collect</h2>
  <p>We do not collect or store:</p>
  <ul>
    <li>personal information</li>
    <li>behavioral tracking data</li>
    <li>usage analytics tied to identity</li>
    <li>advertising identifiers</li>
    <li>cross-app or cross-site tracking data</li>
  </ul>
  <p>Echoes does not use third-party advertising or analytics SDKs.</p>

  <hr>

  <h2>3. Device Identifier (Subscriptions Only)</h2>
  <p>For subscription validation, the App generates a random, device-based identifier ("install ID").</p>
  <p>This identifier:</p>
  <ul>
    <li>is stored locally on the device</li>
    <li>is used only to verify subscription access with our backend</li>
    <li>is not linked to personal identity</li>
    <li>is not used for tracking or analytics</li>
  </ul>
  <p>It exists solely to determine whether full access is active.</p>

  <hr>

  <h2>4. Location Data (Optional)</h2>
  <p>If you choose to enable location access:</p>
  <ul>
    <li>location is used only to calculate contextual information (e.g., local time, solar or lunar timing)</li>
    <li>location data is processed ephemerally and is not stored or profiled</li>
    <li>precise location is never shared with third parties</li>
  </ul>
  <p>You may disable location access at any time in your device settings.</p>

  <hr>

  <h2>5. Subscriptions and Payments</h2>
  <p>All payments are handled by Apple App Store or Google Play.</p>
  <p>We do not receive or store payment details. Subscription status is verified via the respective platform's APIs.</p>

  <hr>

  <h2>6. Content and External Sources</h2>
  <p>The App displays information derived from:</p>
  <ul>
    <li>public media sources</li>
    <li>cultural and traditional references</li>
    <li>astronomical and environmental data</li>
  </ul>
  <p>This information is presented for contextual and reflective purposes and is not personalized.</p>

  <hr>

  <h2>7. Data Security</h2>
  <p>We take reasonable measures to protect the limited data required to operate the App. No system can be guaranteed to be completely secure, but we minimize risk by collecting as little data as possible.</p>

  <hr>

  <h2>8. Children's Privacy</h2>
  <p>Echoes is not intended for children under the age required by applicable app store policies. We do not knowingly collect data from children.</p>

  <hr>

  <h2>9. Changes to This Policy</h2>
  <p>We may update this Privacy Policy from time to time. Any changes will be reflected by updating the "Last updated" date.</p>
  <p>Continued use of the App after changes constitutes acceptance of the updated policy.</p>

  <hr>

  <h2>10. Contact</h2>
  <p>If you have questions about this Privacy Policy, you may contact us at:</p>
  <p><a href="mailto:hey@thequietframe.com">hey@thequietframe.com</a></p>
</body>
</html>`;

export async function GET(request: ExpoRequest): Promise<ExpoResponse> {
  return new ExpoResponse(PRIVACY_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
