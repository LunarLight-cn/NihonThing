# NihonThing - Japan Import Goods Platform

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
    Users {
        integer id PK
        text username
        text email UK
        text password_hash
        text birth_date
        text gender
        text role
        text cdate
        text udate
    }

    Addresses {
        integer id PK
        integer user_id FK
        text title
        text fullname
        text surname
        text tel
        text address_line
        integer subdistrict_id FK
        text tag
    }

    Countries {
        integer id PK
        text name_th
        text name_en
        text name_jp
    }

    Provinces {
        integer id PK
        integer country_id FK
        text name_th
        text name_en
        text name_jp
    }

    Districts {
        integer id PK
        integer province_id FK
        text name_th
        text name_en
        text name_jp
    }

    Subdistricts {
        integer id PK
        integer district_id FK
        text name_th
        text name_en
        text name_jp
        text postal_code
    }

    Ships {
        integer id PK
        text type
        text ship_date
        text track_no
        real ship_price
        text courier_name
        integer origin_id FK
        integer destination_id FK
        text max_cap
        text current_cap
        text status
        text cdate
        text udate
    }

    Categories {
        integer id PK
        text name_th
        text name_en
        text name_jp
    }

    Products {
        integer id PK
        integer category_id FK
        text name
        text desc
        text brand
        real price_tentative
        text img
        text tag
        integer amount
        integer remain
        text status
        text cdate
        text udate
    }

    Orders {
        integer id PK
        integer user_id FK
        integer trip_id FK
        integer address_id FK
        text deliv_date
        text track_no
        text courier_name
        real item_price_total
        real shipping_fee_jp_th
        real shipping_fee_th_th
        real grand_total
        text payment_status
        text status
        integer sender_id FK
        text shipped_date
        text cdate
        text udate
    }

    Order_Items {
        integer id PK
        integer order_id FK
        integer ticket_id FK
        integer product_id FK
        real final_price
        integer quantity
        integer missing
        text udate
    }

    Purchases {
        integer id PK
        integer order_item_id FK
        integer agent_id FK
        integer quantity
        real actual_cost
        text shop_name
        text receipt_img
        text cdate
    }

    Tickets {
        integer id PK
        integer client_id FK
        integer agent_id FK
        integer trip_id FK
        text item_name
        text brand
        text shop_name
        text area_name
        text spec
        text img
        text external_link
        text replacement
        real expected_price
        real proposed_price
        text status
        text cdate
        text udate
    }

    Payments {
        integer id PK
        integer order_id FK
        integer ticket_id FK
        real amount
        text payment_type
        text method
        text slip_img
        text status
        text verify_ref
        text cdate
    }

    Areas {
        integer id PK
        text name_th
        text name_en
        text name_jp
        text map_location
    }

    Shops {
        integer id PK
        integer area_id FK
        text name
        text map_location
    }

    Product_Locations {
        integer id PK
        integer product_id FK
        integer area_id FK
        integer shop_id FK
    }

    Events {
        integer id PK
        text title
        text desc
        text start_date
        text end_date
        text banner_img
        integer trip_id FK
        integer area_id FK
        integer shop_id FK
    }

    Event_Products {
        integer id PK
        integer event_id FK
        integer product_id FK
    }

    Follows {
        integer id PK
        integer user_id FK
        text target_type
        text target_brand
        text target_product
        text target_event
        text cdate
    }

    %% Relationships
    Users ||--o{ Addresses : "has"
    Subdistricts ||--o{ Addresses : "located in"
    
    Countries ||--o{ Provinces : "has"
    Provinces ||--o{ Districts : "has"
    Districts ||--o{ Subdistricts : "has"
    
    Countries ||--o{ Ships : "origin"
    Countries ||--o{ Ships : "destination"
    
    Categories ||--o{ Products : "categorizes"
    
    Users ||--o{ Orders : "customer"
    Users ||--o{ Orders : "sender"
    Ships ||--o{ Orders : "transports"
    Addresses ||--o{ Orders : "delivered to"
    
    Orders ||--o{ Order_Items : "contains"
    Tickets ||--o{ Order_Items : "fulfilled by"
    Products ||--o{ Order_Items : "includes"
    
    Order_Items ||--o{ Purchases : "bought via"
    Users ||--o{ Purchases : "agent"
    
    Users ||--o{ Tickets : "client"
    Users ||--o{ Tickets : "agent"
    Ships ||--o{ Tickets : "shipped via"
    
    Orders ||--o{ Payments : "paid by"
    Tickets ||--o{ Payments : "paid by"
    
    Areas ||--o{ Shops : "contains"
    
    Products ||--o{ Product_Locations : "located at"
    Areas ||--o{ Product_Locations : "located at"
    Shops ||--o{ Product_Locations : "located at"
    
    Ships ||--o{ Events : "associated with"
    Areas ||--o{ Events : "held at"
    Shops ||--o{ Events : "held at"
    
    Events ||--o{ Event_Products : "features"
    Products ||--o{ Event_Products : "featured in"
    
    Users ||--o{ Follows : "tracks"
```

## Project Structure

```
NihonThing/
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
