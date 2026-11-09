# Teacher dashboard

Open this directory through GitHub Pages to inspect student worlds in Qin, Lemon and Seven.

The source contains no student names, account roster, progress payloads, private Sites identifiers, or administrative credentials. Add known cloud-save codes through Manage accounts, or import an account-list JSON file. Codes and hidden-account preferences stay in this browser; they are not saved to GitHub.

The game Firebase API configuration is the existing public client configuration. Cloud rules permit named-save reads but not account enumeration. This dashboard does not weaken those rules.

Student previews use sandboxed, in-memory storage and block cloud writes. The game HTML comes from the existing sibling Qin, Lemon and Seven directories. Teacher interactions do not write student saves.

The owner-private hosted dashboard remains available separately and keeps its verified roster.
