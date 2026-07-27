/**
 * event_volunteers rows are shared between IVS imports and the Volunteers roster.
 * Roster visibility uses onVolunteerRoster (IVS fields stay intact for dual membership).
 */
export const volunteerRosterWhere = {
  onVolunteerRoster: true,
} as const
