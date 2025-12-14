# TEAM DCG
**BSIT-3C**

---

## 🏛️ iBayan Portal
*A web-based platform for barangay governance through digital voting, community feedback, and data-driven analytics. Empowering local communities with transparent, accessible, and secure tools for civic participation.*

---

## 🔮 Future Enhancements
* **Enhanced Voting Features** – Implement ranked-choice voting, multi-question surveys, and real-time result visualization.
* **Mobile Application** – Develop native iOS and Android apps with push notifications.
* **AI-Powered Insights** – Advanced analytics for sentiment trends and predictive insights.
* **UI Improvements and Enhancements** – Modifications in displaying and fetching data on certain pages, along with overall interface enhancements for better user experience.
* **Dashboard Development** – Build and refine:
  * User Management Dashboard
  * Voting Analytics Dashboard
  * Community Engagement Dashboard
* **Multilingual Support** – Add local dialects and multiple languages for inclusivity.
* **Blockchain Verification** – Explore blockchain for immutable vote recording.

---

## � Firebase Services

### 1. Authentication
**Service:** Firebase Authentication

| Feature | Description |
|---------|-------------|
| Email/Password | Secure login for residents and admins |
| Role-Based Access | Separate portals for residents and administrators |
| Session Management | Automatic token refresh and secure sessions |
| Password Recovery | Email-based password reset functionality |

### 2. Firestore Database
**Service:** Cloud Firestore

| Collection | Description |
|------------|-------------|
| `users` | User profiles, roles, and registration data |
| `votes` | Voting records and poll submissions |
| `polls` | Active and archived voting polls |
| `feedback` | Community feedback and suggestions |
| `announcements` | Barangay announcements and updates |
| `analytics` | Engagement metrics and KPI data |

### 3. Storage
**Service:** Firebase Storage

| Use Case | Description |
|----------|-------------|
| Profile Images | User profile photo uploads |
| Documents | Supporting documents for registration |
| Report Exports | Generated PDF reports and analytics |

### 4. Firestore Security Rules
**Access Control:** Role-based security rules

| Rule Type | Description |
|-----------|-------------|
| User Data | Users can only read/write their own data |
| Voting | Authenticated users can vote on active polls |
| Admin Only | Only admins can manage polls, users, and announcements |
| Public Read | Announcements are publicly readable |

---

## 📧 EmailJS Integration

### Email Notifications
**Service:** EmailJS

| Notification Type | Trigger | Recipient |
|-------------------|---------|-----------|
| Registration Approval | Admin approves user | New resident |
| Registration Decline | Admin declines user | Applicant |
| Feedback Confirmation | User submits feedback | User |
| Poll Created | Admin creates new poll | All residents |
| Vote Confirmation | User submits vote | Voter |

---

## 🤖 Google Generative AI (Gemini)

### AI Features
**Service:** Google Gemini API

| Feature | Description |
|---------|-------------|
| Chat Assistant | AI-powered help for residents and admins |
| Content Generation | Auto-generate announcements and descriptions |
| Sentiment Analysis | Analyze community feedback trends |
| Smart Insights | Predictive analytics for engagement |

---

## 👥 Team
**TEAM DCG** - BSIT-3C