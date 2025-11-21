## NONTECHNICALIMPL

### What Teach & Serve Is

Teach & Serve is an online platform that **connects students from underrepresented and underserved backgrounds with mentors who care**. It gives both mentors and mentees simple tools to set up a profile, get matched based on interests and goals, and communicate in a safe, private space.

### What the Platform Can Do Today (Current Features)

- **Sign Up and Log In**
  - People can create accounts as either **Mentor** or **Mentee** with basic email + password login.
  - Once logged in, they see a dashboard tailored to their role.

- **Profile Creation**
  - Users can fill out a rich profile with:
    - A bio (who they are and what they care about).
    - Interests and goals (e.g., subjects, careers, personal growth).
    - Skills, experience level, location, time zone, and availability.
  - The system tracks whether profiles are “complete” and encourages users to finish setup.

- **Smart Matching Between Mentors and Mentees**
  - When profiles are complete, the system uses AI‑assisted logic to suggest strong matches:
    - It reads the bio, interests, and goals to find mentors and mentees who are likely to be a good fit.
    - Matches are scored and stored so they can be reviewed later.
  - Users can see their matches, accept or reject them, and focus on the best relationships.

- **Role‑Based Dashboards**
  - **Mentors** see mentees they’ve been matched with, profile completion status, and calls to action.
  - **Mentees** see their mentors, their own progress, and prompts to complete steps like finishing a profile.
  - Friendly banners and pop‑ups guide users through what to do next.

- **Private Messaging**
  - Once a mentor and mentee are matched and both accept, they can message each other inside the platform.
  - Messages are:
    - Exchanged in real time (like a chat app).
    - Encrypted and stored securely in the database.
    - Marked as read/unread, so it’s clear when messages have been seen.
  - A single messaging screen lets users see all their conversations and continue ongoing chats.

### What We Need to Move Toward a Real Production Launch

- **AI Provider Setup**
  - Today, the system can run with “mock” AI, which is good for development and demos.
  - To get **full‑quality AI matching**, we need to connect to a real AI provider (OpenAI) by:
    - Obtaining an **OpenAI API key**.
    - Configuring the backend to use this key securely in production.

- **Cloud Hosting (e.g., AWS)**
  - To serve real users, we need to deploy the app to a reliable cloud provider such as **AWS**:
    - A place to run the application itself (servers or containers).
    - Managed database and caching services for reliability and backups.
    - Storage for logs and any static content.

- **Domain Name and Secure Website**
  - Purchase and configure a custom domain (for example, `app.teachandserve.org`).
  - Set up **HTTPS** (the padlock in the browser) so that all traffic is encrypted end‑to‑end.
  - Update the app configuration so the frontend and backend both use this public domain.

- **Production‑Grade Operations**
  - A simple **deployment pipeline** so new versions can be rolled out safely.
  - Secure management of passwords, API keys, and other secrets (not stored in the code).
  - Monitoring and logs so we can quickly spot and fix issues affecting mentors and mentees.

### What We Plan to Implement Next (Roadmap)

- **Email Verification**
  - When new users sign up, they will receive an email with a verification link.
  - Clicking the link will confirm that:
    - The email address is real.
    - The person has access to that inbox.
  - This improves trust, reduces fake accounts, and protects the community.

- **Email Mentoring Buttons**
  - In addition to in‑app messaging, we plan to add **“Email Mentor” / “Email Mentee”** buttons:
    - These will appear on match cards and/or profile or messaging pages.
    - With one click, users will be able to start an email to their mentor or mentee with key details pre‑filled.
  - Depending on privacy and security needs, we may:
    - Use simple email links that open the user’s email client, or
    - Route emails through the platform so addresses can be protected if desired.

- **Further Polish for Launch**
  - Clearer error messages and guidance when something goes wrong.
  - More visible notifications for new matches and new messages.
  - Potential admin tools to help staff support and manage the mentor/mentee community.

In summary, the **core experience is already built**: people can sign up, complete profiles, get matched, and chat securely. The remaining work is mainly about **connecting to external services (AI, email, cloud hosting), adding safeguards like email verification, and polishing the experience** so it is ready for real‑world use at scale.


