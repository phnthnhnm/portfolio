---
title: 'EVDMS'
description: 'My 2nd year team project — a dealer management system for electric vehicles. I led a team of 5, designed the database schema and backend architecture, and enforced PR reviews and CI pipeline discipline.'
techStack:
  - '.NET 8'
  - 'PostgreSQL'
  - 'Entity Framework Core'
  - 'JWT Auth'
  - 'xUnit'
  - 'Testcontainers'
  - 'Microsoft.ML'
  - 'Docker'
githubUrl: 'https://github.com/FA25-SWP391-SE1839-Group5/evdms-be'
featured: true
order: 3
---

EVDMS (Electric Vehicle Dealer Management System) was my 2nd year team project at university. It's a lot smaller in scope than my graduation thesis — no AI pipelines, no real-time telemetry — but it's where I first learned to **actually** lead a team and design a backend from scratch.

I led 5 people over about two months (September–November 2025). I owned the PostgreSQL schema, the backend architecture, the CI pipeline, and the PR review workflow. The rest of the team built out the remaining controllers and frontend.

---

## What it does

The system manages the full workflow of an EV dealership: vehicle inventory tracking, customer and dealer management, sales orders, quotations, test drive scheduling, payments, promotions, and OEM inventory. There's also a demand forecasting module that uses Microsoft.ML to predict future vehicle demand based on historical order data.

20 API controllers cover the domain. Role-based auth splits users into admins, sales staff, and dealers, each with different access levels. Every mutation is logged to an audit trail.

---

## Architecture

The backend follows a 4-layer structure:

```
EVDMS.API          → Controllers, middleware (JWT auth, error handling), Swagger
EVDMS.BLL          → Service layer, AutoMapper profiles, ML forecasting, email logic
EVDMS.DAL          → EF Core DbContext, 19 entity models, repository implementations
EVDMS.Common       → DTOs, enums, utilities, shared response wrappers
```

I designed the project layout, the layer boundaries, and the dependency direction: API depends on BLL, BLL depends on DAL, everything depends on Common. No circular references, and the API layer never touches EF Core directly.

### Database schema

I modeled 19 entities covering the dealership domain:

- **Vehicle catalog** — `Vehicle`, `VehicleModel`, `VehicleVariant` (hierarchical: a dealer orders variants of a model of a vehicle)
- **Sales pipeline** — `SalesOrder`, `Quotation`, `Payment`, `Promotion`
- **Dealer network** — `Dealer`, `DealerContract`, `DealerOrder`, `DealerPayment`
- **Operations** — `Customer`, `TestDrive`, `Feedback`, `OemInventory`
- **System** — `User`, `RefreshToken`, `AuditLog`

All entities inherit from `BaseEntity` which provides `Id`, `CreatedAt`, `UpdatedAt`, and a soft-delete flag. I used `EFCore.NamingConventions` so all table and column names map to `snake_case` in PostgreSQL without manual attributes.

### Auth system

I built the auth flow: JWT access tokens (short-lived) paired with refresh tokens stored in the database. Endpoints cover login, logout, token refresh, password reset via email link, and account creation with email verification. Middleware extracts the user ID from the JWT claims and makes it available to controllers through a scoped utility class.

The `User` entity has a `Role` enum (Admin, SalesStaff, Dealer). Controllers check roles through an authorization filter, so for example only admins can create dealer accounts and only sales staff can approve quotations.

---

## What I set up (team infrastructure)

### PR review workflow

Every change went through a pull request. I required at least one approval before merging and made sure each PR had a clear description of what it changed and why. This caught a lot of bugs early, especially around database queries and auth checks.

### Git hooks with Husky.Net

I configured Husky.Net to run `dotnet test` before every commit. If a test failed, the commit was blocked. This prevented the classic "forgot to run tests locally" push that breaks the build for everyone.

### CI pipeline

The project was structured to be CI-ready from day one. All integration tests use Testcontainers to spin up a real PostgreSQL instance in Docker, so the test suite doesn't depend on a shared dev database. Unit tests use Moq for service dependencies and EF Core's in-memory provider for repository tests.

The test projects mirror the source structure:

```
tests/
├── EVDMS.API.Tests/                  # Controller tests (unit + integration)
├── EVDMS.BusinessLogicLayer.Tests/   # Service logic tests
├── EVDMS.Common.Tests/               # Utility tests
└── EVDMS.DataAccessLayer.Tests/      # Repository + EF Core tests
```

Integration tests use `Microsoft.AspNetCore.Mvc.Testing` with `WebApplicationFactory` to spin up the API in-process and hit real endpoints against a Testcontainers PostgreSQL.

---

## Demand forecasting (ML.NET)

One feature I'm proud of: we used Microsoft.ML's time series forecasting to predict future vehicle demand. The `DemandForecastController` exposes an endpoint that takes a vehicle ID and a forecast horizon (e.g. 6 months) and returns predicted monthly demand based on historical sales order data.

The model uses Singular Spectrum Analysis (SSA) from `Microsoft.ML.TimeSeries`. It's not production-grade ML, but it worked well enough for a 2nd year project and gave me early exposure to integrating ML into a .NET backend.

---

## Design decisions

| Decision                               | Why                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **4-layer over Clean Architecture**    | Clean Architecture would have been overkill for a 2-month project with 5 people. API → BLL → DAL → Common kept things simple while still separating concerns |
| **Testcontainers over shared dev DB**  | Each test run gets its own PostgreSQL container. No test pollution between runs, and tests work on any machine with Docker                                   |
| **Husky.Net for pre-commit hooks**     | Same tool I'd use later on iRAS-RAG. Native .NET integration, no npm dependency                                                                              |
| **Refresh tokens in DB**               | Storing refresh tokens in the database (rather than just signing them as JWTs) lets the server revoke them on logout                                         |
| **Microsoft.ML over a Python service** | No need to add a Python dependency when .NET has a built-in time series library. SSA forecasting was enough for our use case                                 |

---

## Running it

```bash
dotnet restore
dotnet tool restore
dotnet husky install
dotnet ef database update --project src/EVDMS.DataAccessLayer --startup-project src/EVDMS.API
dotnet run --project src/EVDMS.API
```

The API starts at `localhost:5197/api` with Swagger at `/swagger`.
