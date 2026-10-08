# Inventory Report Warning

## Do not treat the current API report as equivalent to the Crystal report

`RepStockArticulosxAlmacen_new2.rpt` has not been fully ported. The current
inventory API uses live Diveteca warehouse stock from
`N_DIVETE_A.dbo.saStockAlmacen`, which fixes the empty `saLoteEntrada` source.

The Crystal report's filter behavior is still missing. Its available native
functions expose filters for article range, dates, warehouse, branch, product
line, category, unit, movement type, lot range, assignment, and sorting.

Until those filters are implemented and validated against the Crystal report,
do not use the API inventory totals, replenishment analysis, or exports as an
audited replacement for the Crystal report.
