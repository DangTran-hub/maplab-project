# M0–M3 manual acceptance

This is a backend–web demo, not the full Android MVP. Run README setup first.

1. Start API and web. Open localhost:5173. Four business seed reports appear as
   markers and list entries; there is no route polyline or static sample count.
2. Use the PowerShell POST example in backend/README.md. Record its UUID.
3. Click Làm mới. Find the same ID in report details; verify Vietnamese text,
   category, coordinates and NEW status. A marker outside the initial campus
   bounds must be reachable by selecting it in the list.
4. Select markers and list items in both directions. Verify map focus, selected
   marker, popup, details, tile attribution and zoom interactions.
5. Choose Mới filter. Advance the selected report to Đang xử lý. It disappears
   from that filtered list; success feedback remains. Choose Đang xử lý, select
   it and advance to Đã xử lý. There is no further status action.
6. Reload browser, stop/restart API without seeding, and GET by UUID. Status and
   fields must persist. Running migration and seed again must not reset it.
7. Try POST with category start, a supplied status/id, a non-null imageUrl or
   latitude 91. Expect 400 and no extra record. Invalid JSON returns 400; unknown
   ID returns 404; skipping NEW straight to RESOLVED returns 400.
8. Stop API and click Làm mới. Expect an error, not sample markers or a false
   empty success. Previously loaded reports may remain, explicitly marked stale.
   Restart API and retry; error clears.
9. For a truly empty database, configure a separate new DATABASE_PATH, migrate
   without seed and start API. Web shows no reports after refresh. A filter with
   no matches has a distinct message.
10. At desktop and 390 px / 320 px widths check readable controls, no horizontal
    page overflow, keyboard focus, report selection and status actions. Disable
    internet tiles temporarily: list/details/status still work against local API.

Automated checks: npm test, npm run lint, npm run build. Tiles and cross-device
LAN access depend on network and must be checked on the intended demo machine.
