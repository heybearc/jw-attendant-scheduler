package sdd

deny[msg] {
  input.unresolved > 0
  msg := sprintf("Spec contains %d unresolved [NEEDS CLARIFICATION] marker(s).", [input.unresolved])
}

deny[msg] {
  input.schema_count < 1
  msg := "No contract schemas found under /contracts."
}

deny[msg] {
  input.tests_contract_count < 1
  msg := "No contract tests found under /tests/contract."
}
