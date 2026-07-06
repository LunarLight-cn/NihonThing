# 🇯🇵 NihonThing - Japan Import Goods Platform

![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Cloudflare D1](https://img.shields.io/badge/Cloudflare%20D1-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=Swagger&logoColor=black)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)

A comprehensive e-commerce and logistics platform for pre-ordering and managing the shipment of goods from Japan to Thailand.

Users can browse products, create custom item requests (tickets), place orders tied to specific shipping trips, and track deliveries - all powered by role-based access control for Admins, Agents, and Clients.

## Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Salted SHA-256 password hashing via WebCrypto API - zero external dependencies |
| 🛡️ **Role-Based Access (RBAC)** | Middleware-enforced route protection for Admin, Agent, and Client roles |
| 📖 **Auto-Generated API Docs** | Live Swagger UI - routes, schemas, and auth are auto-generated from Zod + OpenAPI |
| 🗄️ **Type-Safe Database** | Drizzle ORM with full relation definitions - schema-as-code with auto-generated SQL migrations |
| ✈️ **Trip-Based Logistics** | Orders and tickets tied to shipping trips with capacity limits (FCFS queue system) |
| 🎫 **Custom Request System** | Ticket workflow for sourcing unlisted items - negotiation, agent assignment, and price proposal |
| 🌏 **Multi-Language Ready** | Geographic data (Areas, Shops, Addresses) supports Thai, English, and Japanese names |

## ER Diagram

```mermaid
erDiagram
    Users ||--o{ Addresses : has
    Users ||--o{ Orders : "places"
    Users ||--o{ Orders : "sends (agent)"
    Users ||--o{ Tickets : "requests (client)"
    Users ||--o{ Tickets : "handles (agent)"
    Users ||--o{ Purchases : "buys as agent"
    Users ||--o{ Follows : follows

    Countries ||--o{ Provinces : contains
    Provinces ||--o{ Districts : contains
    Districts ||--o{ Subdistricts : contains
    Subdistricts ||--o{ Addresses : "used by"

    Countries ||--o{ Ships : "origin"
    Countries ||--o{ Ships : "destination"
    Ships ||--o{ Orders : "assigned to"
    Ships ||--o{ Tickets : "linked to"
    Ships ||--o{ Events : "tied to"

    Categories ||--o{ Products : categorizes
    Products ||--o{ Order_Items : "ordered as"
    Products ||--o{ Product_Locations : "available at"
    Products ||--o{ Event_Products : "featured in"

    Orders ||--o{ Order_Items : contains
    Orders ||--o{ Payments : "paid via"
    Orders }o--|| Addresses : "ships to"

    Order_Items }o--o| Products : references
    Order_Items }o--o| Tickets : references
    Order_Items ||--o{ Purchases : "sourced by"

    Tickets ||--o{ Payments : "paid via"

    Areas ||--o{ Shops : contains
    Areas ||--o{ Product_Locations : "located in"
    Areas ||--o{ Events : "hosted in"

    Shops ||--o{ Product_Locations : "sold at"
    Shops ||--o{ Events : "hosted at"

    Events ||--o{ Event_Products : showcases

    Users {
        int id PK
        varchar username
        varchar email
        varchar pass_hash
        varchar role
        date cdate
    }

    Ships {
        int id PK
        varchar type
        date ship_date
        varchar track_no
        varchar status
        int origin_id FK
        int destination_id FK
    }

    Products {
        int id PK
        int category_id FK
        varchar name
        varchar brand
        real price_tentative
        varchar status
    }

    Orders {
        int id PK
        int user_id FK
        int trip_id FK
        int address_id FK
        real grand_total
        varchar payment_status
        varchar status
    }

    Order_Items {
        int id PK
        int order_id FK
        int product_id FK
        int ticket_id FK
        real final_price
        int quantity
    }

    Tickets {
        int id PK
        int client_id FK
        int agent_id FK
        int trip_id FK
        varchar item_name
        varchar status
    }

    Payments {
        int id PK
        int order_id FK
        int ticket_id FK
        real amount
        varchar payment_type
        varchar status
    }

    Purchases {
        int id PK
        int order_item_id FK
        int agent_id FK
        real actual_cost
        int quantity
    }
```

## Project Structure

```
NihonThing/
├── docs/                              # Documentation & design
│   ├── REQUIREMENTS.md                # Full platform requirements (PRD)
│   ├── PLAN.md                        # Development roadmap & milestones
│   └── DBdesign.md                    # Database schema (DBML for dbdiagram.io)
│
├── server/                            # Backend API (Cloudflare Workers + Hono)
│   ├── migrations/                    # Auto-generated SQL migration files
│   ├── src/
│   │   ├── index.ts                   # App entry point, route registration, Swagger setup
│   │   ├── db/
│   │   │   └── schema.ts             # Drizzle ORM tables, columns & relation definitions
│   │   ├── routes/                    # OpenAPI route handlers (Controllers)
│   │   ├── services/                  # Business logic layer
│   │   ├── middlewares/               # JWT verification & RBAC guard
│   │   ├── models/                    # Zod schemas & data access helpers
│   │   └── utils/                     # Shared helper functions
│   │
│   ├── drizzle.config.ts             # Drizzle Kit configuration
│   ├── wrangler.jsonc                 # Cloudflare Workers & D1 binding config
│   └── package.json
│
├── LICENSE
├── README.md
└── .gitignore
```

<p align="center">
  <sub>Built for a seamless Japan-to-Thailand shopping experience 🛒✈️🇹🇭</sub><br>
  <sub>Copyright © 2026 LunarLight-cn · All Rights Reserved</sub>
</p>
