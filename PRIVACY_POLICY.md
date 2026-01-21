# Privacy Policy for AI Comment Generator

**Last updated: January 21, 2026**

## Overview

AI Comment Generator is a browser extension that helps users generate AI-powered responses for Quora comments. This privacy policy explains how the extension handles user data.

## Data Collection

### What We Collect

The AI Comment Generator extension collects and stores the following data **locally on your device only**:

- **API Key**: Your chosen AI provider's API key (stored locally using Chrome's storage API)
- **User Preferences**: Your selected AI provider, default tone, and language settings

### What We Do NOT Collect

- We do not collect personally identifiable information
- We do not collect browsing history
- We do not collect analytics or usage data
- We do not track your activity
- We do not collect the content of your comments or responses

## Data Storage

All data is stored locally on your device using Chrome's built-in `chrome.storage.local` API. No data is transmitted to or stored on our servers.

## Third-Party Services

When you use the extension to generate responses, your request is sent directly from your browser to your chosen AI provider:

- **Google Gemini** (if selected)
- **Groq** (if selected)
- **OpenAI** (if selected)
- **Anthropic** (if selected)

These requests include:
- The context text you provide (question/answer content from Quora)
- Your selected tone preference

Your API key is used to authenticate these requests. Please review the privacy policy of your chosen AI provider for information about how they handle data.

## Data Sharing

We do not sell, trade, or otherwise transfer your data to third parties. The only data transmission occurs directly between your browser and your chosen AI provider when generating responses.

## Data Security

- API keys are stored locally and never transmitted to our servers
- All communications with AI providers use HTTPS encryption
- No data is logged or stored externally

## User Rights

You can:
- Delete your stored data at any time by removing the extension
- View your stored settings in the extension popup
- Change your API key and preferences at any time

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last updated" date at the top of this document.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository.

## Consent

By using the AI Comment Generator extension, you consent to this privacy policy.
