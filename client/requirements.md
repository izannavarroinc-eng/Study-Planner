## Packages
nanoid | Generating unique IDs for local storage items
date-fns | Handling calendar dates and week views
framer-motion | Smooth page transitions and micro-interactions
zustand | Simple global state management for theme and i18n

## Notes
- Application relies entirely on localStorage for CRUD operations.
- The /api/quiz endpoint is treated as a stub; if it fails or returns 404, an offline fallback generation is triggered.
- Zod schemas are imported from @shared/schema and routes from @shared/routes.
