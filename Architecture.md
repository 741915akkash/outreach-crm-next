outreach-crm-next/
├── public/
│
├── src/
│   ├── app/                         # Next.js routing and UI
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (crm)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── contacts/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── contacts/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/                  # Shared UI components
│   └── lib/                         # Generic shared utilities
│
├── server/                          # Backend application code
│   ├── api/                         # Feature-specific backend logic
│   │   ├── contacts/
│   │   │   ├── contact.schema.ts
│   │   │   ├── contact.service.ts
│   │   │   └── contact.repository.ts
│   │   ├── companies/
│   │   ├── deals/
│   │   └── activities/
│   ├── auth/                        # Authentication and authorization
│   ├── db/
│   │   └── db.ts                    # Database client
│   ├── middleware/                  # Reusable security helpers
│   └── integrations/                # Email, payments, external APIs
│
├── prisma/                          # Schema and migrations
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── integration/
│   └── e2e/
│
├── .github/
│   └── workflows/
├── .env.example
├── package.json
└── tsconfig.json

