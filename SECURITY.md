# Security policy

## Reporting a vulnerability

Please report vulnerabilities **privately** through GitHub's private vulnerability reporting:
go to the **Security** tab of this repository and choose **Report a vulnerability**
(https://github.com/rolkapone/P152/security/advisories/new).

Do not open a public issue or pull request for a suspected vulnerability, and do not
include exploit details in public discussions.

## Scope

In scope:

- The Deskfit web application served from this repository (source in `src/`, build in `dist/`).
- Parsing of shared or imported setups (`SetupV1`) and any user-supplied file or link.
- The Content Security Policy and HTTP security headers (`config/security-headers.mjs`).
- The CI/CD workflows in `.github/` and the dependency supply chain.

Out of scope: social engineering, denial of service by volumetric traffic, issues in
third-party services or browsers themselves, and findings that need a compromised device.

## What to expect

These delays are indicative, not a contractual commitment (this is a personal project):

- Acknowledgement within 7 days.
- Initial assessment within 14 days.
- Fix or mitigation for confirmed High or Critical issues targeted within 30 days.
- Credit in the advisory if you wish.

## Supported versions

Only the latest state of the `main` branch is supported.
