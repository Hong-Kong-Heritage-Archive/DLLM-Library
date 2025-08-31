# 20 Minutes Library (20-minute-Library)

## Table of Contents
- [Project Background and Objectives](#project-background-and-objectives)
- [Phase 1 Core Features](#phase-1-core-features)
  - [2.1 User Profile](#21-user-profile)
  - [2.2 Item Listing & Browsing](#22-item-listing--browsing)
  - [2.3 Virtual Ownership Transfer](#23-virtual-ownership-transfer)
  - [2.4 Language and Interface](#24-language-and-interface)
- [Open-Source Operational Model](#open-source-operational-model)
- [Setup Guide](./docs/SETUP.en.md)
- [Technical Overview](#technical-overview)
- [Community Engagement](#community-engagement)
- [Future Outlook](#future-outlook)

The "20 Minutes Library" empowers local communities through an open-source model, allowing each region to independently operate its own cultural preservation platform. Through transparent code and a decentralized architecture, we hope that every book and every artifact can find its home, collectively safeguarding the cultural memory.

## Project Background and Objectives
The "20 Minutes Library" is an open-source community platform designed for small local community, aiming to promote the preservation and inheritance of precious books and cultural artifacts. Given that personal collections may face the risk of being discarded due to space limitations or a lack of interest from the next generation with lack of cultural heritage, this project aims to empower the global community through a decentralized approach to:
- **List and Share** personal collections of books or cultural items and connect with like-minded individuals;
- **Borrow or Transfer** items to those who truly cherish them, preventing the loss of cultural heritage;
- **Enable Communities** where different regional communities can set up their own servers to flexibly manage localized platforms.

As an open-source project, the source code will be publicly available on GitHub, allowing any overseas community to freely download, modify, and deploy it, ensuring the spirit of "decentralization" is upheld without relying on a single central server.

## Phase 1 Core Features
Phase 1 focuses on providing simple and stable features to support item data uploading, browsing, and virtual ownership transfer, while ensuring the open-source architecture is easy to deploy. The core features are as follows:

**2.1 User Profile**
- Users can register and create a personal profile, including:
  - **Email Address** (the only mandatory contact method to protect privacy)
  - **Postcode** (only displays a general area, e.g., "Sydney, Australia"; users decide whether to share their precise address)
  - Optional: Other contact methods (e.g., Telegram, WhatsApp, with privacy settings controlled by the user)
- Users can choose to be anonymous or use a nickname to protect their personal information.

**2.2 Item Listing & Browsing**
- Users can upload information about books or other cultural artifacts, including:
  - **Item Name** (e.g., "Stories of Streets")
  - **Condition** (e.g., "Like New," "Slightly creased")
  - **Category** (e.g., Literature, History, Photography, with support for multilingual tags)
  - **Optional Details** (e.g., year of publication, photos, the story behind the item)
- The platform provides basic **Search & Filter** functions to find items by region, category, or keyword.
- Items can be marked as "For Loan," "For Exchange," or "For Gift," as decided by the owner.

**2.3 Virtual Ownership Transfer**
- Users can mark an item's status as "On Loan" or "Transferred" through the app to record the transaction's intent.
- The platform only provides **Virtual Confirmation**; actual contact and logistics are arranged by the parties involved.
- For example: User A marks "Loaning out 'Kowloon Walled City'," User B requests to borrow it, the system updates the status and notifies both parties, and subsequent arrangements are handled privately.

**2.4 Language and Interface**
- The app supports both **Traditional Chinese** and **English** interfaces to meet the needs of overseas users.
- Users can choose the language for their uploaded information, and the system can automatically generate bilingual tags (e.g., "漫畫 / Comics").

## Open-Source Operational Model
- **Decentralized Principle**: This project does not rely on a single server and encourages communities in different regions to set up their own independent instances. For example, the London community can run its own server to manage local user and item data independently.
- **Open Source Code**: All code (frontend, backend, and database schema) will be uploaded to GitHub under the MIT License, allowing for free use, modification, and distribution.
- **Deployment Flexibility**: A detailed **Deployment Guide** will be provided, including Docker container setups, making it easy for non-technical users to run the platform on the cloud (e.g., AWS, Heroku) or a local server.
- **Privacy Protection**: User data (especially addresses) is not made public. Server administrators must adhere to basic data protection guidelines (with reference to GDPR).
- **Free to Use**: The open-source model ensures the platform is free. Communities can cover their own server operational costs or sustain it through donations.

## Technical Overview
- **Open Source Stack**:
  - **Frontend**: To be decided (clean, bilingual UI, supporting mobile and desktop)
  - **Backend**: To be decided, exposing GraphQL (lightweight and easily extendable API)
  - **Database**: PostgreSQL (open-source, efficient, and supports multi-region deployment)
  - **Containerization**: Docker (simplifies server setup and ensures consistency)
- **GitHub Repository**: Will contain the complete source code, installation guides, and API documentation to facilitate developer contributions.
- **Security**: Uses HTTPS encryption to ensure secure data transmission; server administrators can configure additional security measures.
- **UI/UX**: Minimalist design featuring three core tabs: "Upload Item," "Browse," and "My Profile," designed for easy localization.

## Community Engagement
- **How to Contribute**: We welcome developers and communities worldwide to participate by submitting Pull Requests to improve features, translate the interface, or fix bugs.
- **Localization Support**: Multilingual templates will be provided to make it easy for communities to translate the app into other languages (e.g., Japanese, German) to integrate with local networks.
- **Discussion Channels**: A Discord or Matrix group will be set up for developers and users to discuss technical issues and suggestions.

## Future Outlook
Phase 1 will validate the feasibility of the open-source model and gather community feedback. Possible future directions include:
- A cross-server data sharing protocol to enable global item searches.
- Integration of a cultural stories feature to document the unique background of each item.
- A plugin system to allow communities to customize features (e.g., event notifications, item exhibitions).
