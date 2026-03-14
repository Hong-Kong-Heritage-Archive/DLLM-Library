# De-centralised Hong Kong Library (DLLM-Library)

## Table of Contents

- [Project Background and Objectives](#project-background-and-objectives)
- [Implemented Features](#implemented-features)
- [Technical Architecture](#technical-architecture)
- [Open-Source Operational Model](#open-source-operational-model)
- [Setup Guide](./docs/SETUP.en.md)
- [Community Engagement](#community-engagement)
- [Future Outlook](#future-outlook)

The "De-centralised Hong Kong Library" empowers overseas Hong Kong communities through an open-source model, allowing each region to independently operate its own cultural preservation platform. Through transparent code and a decentralized architecture, we hope that every book and every artifact can find its home, collectively safeguarding the cultural memory of Hong Kong.

## Project Background and Objectives

The "De-centralised Hong Kong Library" is an open-source community platform designed for overseas Hong Kongers, aiming to promote the preservation and inheritance of precious books and cultural artifacts. Given that personal collections may face the risk of being discarded due to space limitations or a lack of interest from the next generation after Hong Kongers emigrate, this project aims to empower the global Hong Kong community through a decentralized approach to:

- **List and Share** personal collections of books or cultural items and connect with like-minded individuals;
- **Borrow or Transfer** items to those who truly cherish them, preventing the loss of cultural heritage;
- **Enable Communities** where different regional Hong Kong communities can set up their own servers to flexibly manage localized platforms.

As an open-source project, the source code is publicly available on GitHub, allowing any overseas Hong Kong community to freely download, modify, and deploy it, ensuring the spirit of "decentralization" is upheld without relying on a single central server.

## Implemented Features

The following features are fully built and operational:

### User System

- Registration and login via **Firebase Authentication** with email verification.
- User profiles with nickname, address (displays general area only), and multiple contact methods (WhatsApp, Signal, Telegram, Email).
- **Role management**: User, Admin, Moderator, and Exchange Point Admin roles.
- Users can pin up to 5 items on their profile page.

### Item Management

- Full CRUD operations for books and cultural artifacts.
- Multiple item statuses: Available, Exchangeable, Gift, Reserved, Transferred.
- Item condition tracking: New, Like New, Good, Fair, Poor.
- **Image upload**: Signed URL upload via Google Cloud Storage with server-side compression and thumbnail generation.
- **NSFW detection**: Client-side image content moderation before upload.
- **Multi-dimensional search**: By keyword, category, classification, status, and location with geospatial queries (Geofire).
- **Category system**: Hierarchical category trees with bilingual labels (Traditional Chinese + English), hot categories, recently updated categories, and default categories.
- **Item recommendations**: Four recommendation types — User Picked, New Arrivals, Popular, and Admin Picked.

### Transaction System

- Complete loan/transfer lifecycle: **Request → Approve → Transfer → Receive**, with cancellation and expiration handling.
- **Quick transactions**: Face-to-face instant handover, bypassing the standard approval flow.
- Multiple handover location options: holder's address, requestor's address, public exchange point, or face-to-face.
- Transaction status tracking with visual flow diagrams.
- QR code sharing for transaction details.
- Receipt image upload for handover confirmation.

### Exchange Points

- Public exchange point directory and listings.
- Dedicated Exchange Point Admin role to manage exchange point information.
- Map display of exchange point locations.

### News / Announcements System

- Admins and moderators can create, edit, and hide news posts.
- Supports **Markdown** content formatting.
- News posts can be linked to related items and tags.
- Recent news banner display on the home page.

### Comments

- Users can add, edit, and delete comments on items.
- Paginated comment browsing, queryable by item or by user.

### Map & Geocoding

- Forward geocoding via **Google Maps API**.
- Interactive map rendering with **Leaflet** on the client.
- **Geofire**-based geospatial item search.

### Bulk Import

- JSON-format bulk item import.
- **GoodReads import**: Dedicated page for importing book data from GoodReads.
- Automatic duplicate title detection before import.

### Internationalization (i18n)

- Full **Traditional Chinese** and **English** bilingual interface.
- Language switching via i18next with automatic browser language detection.
- Bilingual labels for item categories.

### SEO & Server-Side Rendering (SSR)

- Automatic search engine crawler detection, serving SSR pages for key routes (home, item detail, user profile, transaction detail).
- Optimized social media sharing previews (Open Graph).

### Other Features

- New user onboarding tour.
- Configurable splash screen (managed by admins).
- Tag cloud visualization for category distribution.
- Platform admin settings (chat link, about us, splash screen configuration).

## Technical Architecture

| Layer                | Technology                                                                     |
| -------------------- | ------------------------------------------------------------------------------ |
| **Frontend**         | React 19, TypeScript, Vite, Material UI 7 (MUI), Apollo Client, React Router 7 |
| **Backend**          | Node.js 22, Express, Apollo Server 4, TypeScript                               |
| **API**              | GraphQL (28 queries + 22 mutations)                                            |
| **Database**         | Firebase Firestore                                                             |
| **Authentication**   | Firebase Authentication                                                        |
| **Storage**          | Google Cloud Storage (signed URL upload)                                       |
| **Hosting**          | Firebase Hosting + Firebase Cloud Functions                                    |
| **Maps**             | Leaflet (client-side), Google Maps Services (server-side geocoding)            |
| **Image Processing** | Sharp (server-side compression), NSFW.js (client-side content moderation)      |
| **i18n**             | i18next (Traditional Chinese + English)                                        |
| **Code Generation**  | GraphQL Codegen (shared schema between client and server)                      |
| **Testing**          | Vitest (frontend), Jest (backend)                                              |

### Architecture Highlights

- **Single Cloud Function**: One Firebase Cloud Function serves both the GraphQL API and SSR pages.
- **Shared Schema**: Frontend and backend types are auto-generated from a single `schema.graphql` via `graphql-codegen`.
- **SPA + SSR Hybrid**: Regular users receive the SPA; search engine crawlers are served SSR pages automatically.
- **GitHub Repository**: Contains complete source code, setup guides, and API documentation to facilitate developer contributions.
- **Security**: HTTPS encryption, Firebase Auth token verification, and server-side permission checks.

## Open-Source Operational Model

- **Decentralized Principle**: This project does not rely on a single server and encourages Hong Kong communities in different regions to set up their own independent instances. For example, the London community can run its own Firebase project to manage local user and item data independently.
- **Open Source Code**: All code (frontend, backend, and GraphQL schema) is publicly available on GitHub under the MIT License, allowing for free use, modification, and distribution.
- **Deployment Flexibility**: A detailed [Setup Guide](./docs/SETUP.en.md) is provided, based on the Firebase platform, making it easy for communities to deploy quickly.
- **Privacy Protection**: User data (especially addresses) is not made public. Server administrators must adhere to basic data protection guidelines (with reference to GDPR).
- **Free to Use**: The open-source model ensures the platform is free. Communities can operate within Firebase's free tier or cover their own operational costs.

## Community Engagement

- **How to Contribute**: We welcome developers and Hong Kong communities worldwide to participate by submitting Pull Requests to improve features, translate the interface, or fix bugs.
- **Localization Support**: The i18next framework makes it easy for communities to translate the app into other languages (e.g., Japanese, German) to integrate with local Hong Kong networks.
- **Discussion Channels**: A Discord or Matrix group will be set up for developers and users to discuss technical issues and suggestions.

## Future Outlook

The platform continues to gather community feedback. Possible future directions include:

- A cross-server data sharing protocol to enable global item searches;
- Email notification system for automatic transaction status updates;
- Full-text search engine to enhance item discovery;
- WebSocket real-time subscriptions for live loan status updates;
- A plugin system to allow communities to customize features (e.g., event notifications, item exhibitions).
