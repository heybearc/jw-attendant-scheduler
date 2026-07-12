/** IVS approval values — keep in sync with row status dropdowns in IVSApprovalsContent. */
export const IVS_APPROVAL_STATUSES = ['Pending', 'Requested', 'Approved', 'Not Approved'] as const

export type IvsApprovalStatus = (typeof IVS_APPROVAL_STATUSES)[number]

export function isValidIvsApprovalStatus(value: string): value is IvsApprovalStatus {
  return (IVS_APPROVAL_STATUSES as readonly string[]).includes(value)
}

/** Placeholder email for IVS volunteers without a real address (global registry key). */
export function ivsPlaceholderEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${(lastName || 'volunteer').toLowerCase()}@temp.local`
}
