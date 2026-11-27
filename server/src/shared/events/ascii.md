Incoming event
      |
      v
EventRegistry
      |
      v
Find definition by name + version
      |
      v
Get its Zod payload schema
      |
      v
Validate payload
      |
      ├── Valid → Return validated payload
      |
      └── Invalid → Return validation errors