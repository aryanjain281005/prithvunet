# PrithviNet Mid Evaluation README

## 1. Project Name

PrithviNet: Smart Environmental Monitoring and Compliance Platform

## 2. Problem We Are Solving

PrithviNet is built to help pollution control authorities, industries, monitoring teams, and citizens work on one platform.

The system focuses on:

- Real-time environmental monitoring
- Industry compliance tracking
- Pollution violation detection
- Complaint registration for citizens
- Role-based access for different users

The goal is to make environmental management easier, faster, and more transparent.

## 3. Main Idea in Simple Words

This project acts like a central environmental control dashboard.

- Industries submit pollution compliance reports.
- Monitoring Teams review those reports and mark them.
- Regional Officers handle escalated compliance cases.
- Super Admin monitors the whole system.
- Citizens can view public information and submit complaints without login.

So the platform supports both public access and official regulatory workflow.

## 4. Current Features Implemented

### A. Secure Login and Role-Based Access

We implemented a role-based access system with login and protected pages.

Supported roles:

- Super Admin (State HQ)
- Regional Officer
- Monitoring Team
- Industry User
- Citizen

What is implemented:

- Secure login page
- Signed session cookie
- Role-based route protection
- Unauthorized page for blocked access
- Sidebar visibility based on role

### B. Public Citizen Portal

Citizen access is public.

What citizens can do:

- Open the citizen portal without login
- View environmental data
- Submit public complaints

Complaint form fields:

- Name
- Mobile number
- Email
- Full address
- State
- City
- Complaint category
- Location details
- Observed date and time
- Complaint description

### C. Industry Compliance Submission

Industry users can submit pollution and compliance data.

Submission includes:

- Industry ID
- Location
- Region
- Submitted by
- Report type
  - Daily Emission Log
  - Monthly Compliance Report
  - Special Monitoring Report
- Monitoring source
  - Self Report
  - IoT Sensor
- Air pollutant values
  - SO2
  - NOx
  - PM2.5
- Water pollutant values
  - pH
  - BOD
  - COD
- Noise value in dB

### D. Automatic Compliance Checking

When industry data is submitted, the system automatically checks pollutant values against limits.

If a value exceeds the limit:

- A violation alert is generated
- The report is flagged
- It becomes visible in the compliance dashboard

### E. Monitoring Team Review Workflow

Monitoring Team does not submit industry data.

Their job is to review and verify submitted industry reports.

They can:

- Open Monitoring Logs
- Review submitted industry reports
- Mark report as:
  - Verified
  - Recheck Required
  - Escalated

### F. Escalation to Compliance Cases

If Monitoring Team marks a report as Escalated:

- A formal compliance case is created automatically
- It is assigned to a Regional Officer
- It appears in the compliance dashboard

### G. Regional Officer Case Actions

Regional Officer can manage escalated compliance cases.

Available actions:

- Issue Warning
- Schedule Inspection
- Close Case

Case history is also stored and shown on the dashboard.

### H. Compliance Dashboard

The compliance dashboard currently shows:

- Violation alerts
- Missing reports
- Repeat offenders
- High-risk regions
- Escalation levels
- Formal compliance cases
- Case history timeline

### I. Industry Monitoring Map

The Industries section shows a map with industry markers.

Map features:

- Marker legend
- Filter by status
- Filter by state and category
- Industry detail panel
- Simple compliance visualization

Because live data coverage is limited, fallback marker colors are shown at first:

- Green
- Yellow
- Red

When actual detail data is loaded, the marker updates to the real compliance result.

### J. Admin Users Management

Admin page supports management of users and monitoring teams.

It shows:

- Role counts
- Search and filters
- Add user form
- User details panel

## 5. Role-Wise Workflow

### Super Admin

- Overall platform oversight
- Manage users and internal data
- View dashboards and compliance cases
- Cannot submit industry compliance data

### Regional Officer

- View compliance dashboard
- View escalated cases
- Take case actions
  - Warning
  - Inspection scheduling
  - Close case

### Monitoring Team

- Review industry submissions
- Verify or mark for recheck
- Escalate suspicious or high-risk reports

### Industry User

- Submit pollution compliance reports
- Provide monitoring data

### Citizen

- Access public portal without login
- Submit complaints

## 6. Tech Stack Used

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Lucide React icons
- Leaflet and React-Leaflet for maps

Frontend is responsible for:

- UI pages
- Dashboard views
- Role-based screens
- Forms
- Industry map
- Compliance panels

### Backend

- Python
- FastAPI
- Uvicorn

Backend is responsible for:

- API endpoints
- environmental intelligence services
- future real-time processing integration

### Data / Processing Libraries

- NumPy
- Pandas
- Scikit-learn
- Pydantic
- HTTPX
- python-dotenv

These are used for:

- data processing
- prediction/anomaly support
- backend validation
- API communication

### Authentication / Session Handling

- JWT-style signed session handling using `jose`
- HttpOnly cookie sessions

### Maps and Visualization

- OpenStreetMap tiles
- Leaflet map rendering

## 7. Project Structure

Main folders:

- `web/` -> frontend application
- `ai-service/` -> FastAPI backend

Important frontend areas:

- `web/src/app/` -> app pages
- `web/src/components/` -> reusable UI components
- `web/src/lib/` -> auth, compliance logic, utilities

Important backend areas:

- `ai-service/main.py` -> backend entry point
- `ai-service/routers/` -> backend routes
- `ai-service/forecaster.py` -> forecasting logic
- `ai-service/anomaly.py` -> anomaly detection logic

## 8. Pages and Modules

Important frontend routes currently used:

- `/login`
- `/`
- `/alerts`
- `/map`
- `/industries`
- `/compliance`
- `/monitoring/submit`
- `/monitoring/logs`
- `/admin/users`
- `/citizen`

## 9. Current Data Behavior

For hackathon MVP, some modules currently use local browser storage or temporary storage.

This means:

- submissions may not yet be centralized for all users
- some workflows are UI-complete but not fully database-backed
- industry compliance map currently uses a mix of cached/live/fallback display logic

This is acceptable for MVP demonstration, but the next step is persistent storage.

## 10. What Is Good for Demo in Mid Evaluation

Recommended demo flow:

1. Show login and role-based access
2. Open Citizen Portal and complaint form
3. Login as Industry User and submit compliance report
4. Login as Monitoring Team and review that report
5. Escalate the report
6. Login as Regional Officer and show generated compliance case
7. Perform RO actions like Issue Warning or Schedule Inspection
8. Show Industries map and filters

This gives evaluators a full workflow from submission to enforcement.

## 11. Current Limitations

- Some repo-wide lint issues still exist in unrelated files
- Some modules still use local browser storage instead of database persistence
- Industry map compliance coverage depends on live/cache/backend data quality
- Notifications (email/SMS) are represented logically but not fully integrated with external services yet

## 12. Next Steps

If development continues, best next improvements are:

1. Connect all workflows to Supabase or a real database
2. Add audit logging for every case action
3. Add proper notification integration
4. Add stronger complaint tracking and anti-spam protection
5. Add regional scoping so each officer only sees assigned cases

## 13. How to Run the Project

Frontend:

```bash
cd web
npm run dev
```

Backend:

```bash
cd ai-service
python main.py
```

URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

## 14. Final Summary

PrithviNet is not just a dashboard. It is a workflow-based environmental compliance platform.

It already demonstrates:

- environmental data visualization
- complaint handling
- role-based access
- industry compliance submission
- review by Monitoring Team
- escalation to Regional Officer
- case action workflow

For hackathon mid evaluation, this is a strong end-to-end prototype showing both public and regulatory system design.