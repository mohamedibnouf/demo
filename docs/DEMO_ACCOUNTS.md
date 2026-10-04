# Demo accounts

**Shared password (all accounts):** `SamcoDemo@2026`

Quick-login buttons appear only when `DEMO_MODE=true`.

| Email | Name | Role | Department |
|---|---|---|---|
| quality.manager@samco.demo | Khalid Al-Harbi | Quality Manager | Quality |
| quality.supervisor@samco.demo | Noura Al-Otaibi | Quality Supervisor | Quality |
| quality.engineer@samco.demo | Omar Al-Qahtani | Quality Engineer | Quality |
| inspector@samco.demo | Yusuf Al-Dosari | Quality Inspector | Quality |
| supplychain@samco.demo | Lina Al-Mutairi | Supply Chain | Supply Chain |
| product.engineer@samco.demo | Faisal Al-Shammari | Product Engineer | Product Engineering |
| management@samco.demo | Abdullah Al-Saud | Management | Management |
| admin@samco.demo | Reem Al-Faisal | Admin | Management |
| supplier@samco.demo | Hiroshi Tanaka | Supplier | External — Alpha Components |
| customer@samco.demo | James Whitaker | Customer | External — Gulf Climate Solutions |

Additional seeded users (same password) exist for assignment coverage: inspectors on AHU/WRAC, a paint-shop lead, and a second supplier contact.

## Portal isolation

- `supplier@samco.demo` only sees Alpha Components supplier NCRs and responses.
- `customer@samco.demo` only sees Gulf Climate Solutions complaints and customer-facing status — never internal RCA or CAPA.

## Recommended login for a live demo

1. **Quality Manager** — full operational story  
2. **Supplier** — portal response  
3. **Customer** — complaint portal  
4. **Management** — executive dashboard (read-only)  
5. **Admin** — reset demo data, configuration
