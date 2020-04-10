/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Address,
  Child,
  ContactPerson,
  Crew,
  DayDate,
  DetailedAttendancesOnShift,
  DetailedAttendancesOnShifts,
  IChild,
  ICrew,
  IDetailedChildAttendance,
  IDetailedCrewAttendance,
  Shift,
} from '@hoepel.app/types'
import { AddressDomainService } from '@hoepel.app/domain'
import { SpreadsheetData } from './spreadsheet-types'
import groupBy from 'lodash.groupby'
import flatMap from 'lodash.flatmap'

export class XlsxExporter {
  createChildList(list: ReadonlyArray<IChild>): SpreadsheetData {
    return {
      worksheets: [
        {
          name: 'Alle kinderen',
          columns: [
            {
              values: ['Voornaam', ...list.map(row => row.firstName)],
              width: 20,
            },
            {
              values: ['Familienaam', ...list.map(row => row.lastName)],
              width: 25,
            },
            {
              values: [
                'Geboortedatum',
                ...list.map(row =>
                  row.birthDate ? new DayDate(row.birthDate) : undefined
                ),
              ],
              width: 15,
            },
            {
              values: [
                'Telefoonnummer',
                ...list.map(row => {
                  return row.phone
                    .map(
                      p => p.phoneNumber + (p.comment ? ` (${p.comment})` : '')
                    )
                    .join(', ')
                }),
              ],
              width: 25,
            },
            {
              values: ['Emailadres', ...list.map(row => row.email.join(', '))],
              width: 25,
            },
            {
              values: [
                'Adres',
                ...list.map(row => new Address(row.address).formatted()),
              ],
              width: 30,
            },
            {
              values: [
                'Gender',
                ...list.map(row => {
                  switch (row.gender) {
                    case 'male':
                      return 'Man'
                    case 'female':
                      return 'Vrouw'
                    case 'other':
                      return 'Anders'
                    default:
                      return ''
                  }
                }),
              ],
            },
            {
              values: [
                'Uitpasnummer',
                ...list.map(row => row.uitpasNumber || ''),
              ],
              width: 25,
            },
            {
              values: ['Opmerkingen', ...list.map(row => row.remarks)],
              width: 75,
            },
          ],
        },
      ],
      filename: 'Alle kinderen',
    }
  }

  createCrewMemberList(list: ReadonlyArray<ICrew>): SpreadsheetData {
    return {
      worksheets: [
        {
          name: 'Alle animatoren',
          columns: [
            {
              values: ['Voornaam', ...list.map(row => row.firstName)],
              width: 20,
            },
            {
              values: ['Familienaam', ...list.map(row => row.lastName)],
              width: 25,
            },
            {
              values: [
                'Geboortedatum',
                ...list.map(row =>
                  row.birthDate ? new DayDate(row.birthDate) : undefined
                ),
              ],
              width: 15,
            },
            {
              values: [
                'Telefoonnummer',
                ...list.map(row => {
                  return row.phone
                    .map(
                      p => p.phoneNumber + (p.comment ? ` (${p.comment})` : '')
                    )
                    .join(', ')
                }),
              ],
              width: 25,
            },
            {
              values: ['Emailadres', ...list.map(row => row.email.join(', '))],
              width: 25,
            },
            {
              values: [
                'Adres',
                ...list.map(row => new Address(row.address).formatted()),
              ],
              width: 30,
            },
            {
              values: [
                'Actief',
                ...list.map(row => (row.active ? 'Ja' : 'Nee')),
              ],
            },
            {
              values: [
                'Rekeningnummer',
                ...list.map(row => row.bankAccount || ''),
              ],
              width: 25,
            },
            { values: ['Gestart in', ...list.map(row => row.yearStarted)] },
            {
              values: [
                'Attesten',
                ...list.map(row => {
                  if (!row.certificates) {
                    return ''
                  }

                  return [
                    row.certificates.hasPlayworkerCertificate
                      ? 'Attest animator'
                      : '',
                    row.certificates.hasTeamleaderCertificate
                      ? 'Attest hoofdanimator'
                      : '',
                    row.certificates.hasTrainerCertificate
                      ? 'Attest instructeur'
                      : '',
                  ]
                    .filter(x => x)
                    .join(', ')
                }),
              ],
              width: 35,
            },
            {
              values: ['Opmerkingen', ...list.map(row => row.remarks)],
              width: 75,
            },
          ],
        },
      ],
      filename: 'Alle animatoren',
    }
  }

  createChildrenWithCommentList(list: ReadonlyArray<IChild>): SpreadsheetData {
    const childList = this.createChildList(list)

    return {
      worksheets: [
        { ...childList.worksheets[0], name: 'Kinderen met opmerking' },
      ],
      filename: 'Kinderen met opmerking',
    }
  }

  /**
   * Create a spreadsheet showing when crew members attended
   * @param allCrew All crew members for this tenant. Crew members without attendances will not be shown
   * @param shifts All shifts in the given year
   * @param attendances Attendances by shift for every given shift
   * @param year The year this list is about
   */
  createCrewMembersAttendanceList(
    allCrew: ReadonlyArray<Crew>,
    shifts: ReadonlyArray<Shift>,
    attendances: ReadonlyArray<{
      shiftId: string
      attendances: { [crewId: string]: IDetailedCrewAttendance }
    }>,
    year: number
  ): SpreadsheetData {
    const sortedShifts = Shift.sort(shifts)
    const richAttendances = new DetailedAttendancesOnShifts(
      attendances.map(
        att => new DetailedAttendancesOnShift(att.shiftId, {}, att.attendances)
      )
    )
    const filteredCrew = Crew.sorted(allCrew).filter(
      crew => richAttendances.numberOfCrewMemberAttendances(crew.id!) > 0
    )

    return {
      worksheets: [
        {
          name: `Aanwezigheden animatoren ${year}`,
          columns: [
            {
              values: [
                '',
                '',
                'Voornaam',
                ...filteredCrew.map(row => row.firstName),
              ],
              width: 20,
            },
            {
              values: [
                '',
                '',
                'Familienaam',
                ...filteredCrew.map(row => row.lastName),
              ],
              width: 25,
            },

            ...sortedShifts.map(shift => {
              return {
                values: [
                  DayDate.fromDayId(shift.dayId),
                  shift.kind,
                  shift.description,
                  ...filteredCrew.map(crew =>
                    richAttendances.didCrewMemberAttend(crew.id!, shift.id!)
                  ),
                ],
                width: 22,
              }
            }),
          ],
        },
      ],
      filename: `Aanwezigheden animatoren ${year}`,
    }
  }

  /**
   * Create a spreadsheet showing information for a specific day
   * @param allChildren All crew members for this tenant
   * @param shifts All shifts on day
   * @param childAttendances Child attendances for the given shifts
   * @param day The day for which this spreadsheet is requested
   */
  createDayOverview(
    allChildren: ReadonlyArray<Child>,
    shifts: ReadonlyArray<Shift>,
    childAttendances: ReadonlyArray<{
      shiftId: string
      attendances: { [childId: string]: IDetailedChildAttendance }
    }>,
    day: DayDate
  ): SpreadsheetData {
    const relevantShifts = shifts.filter(shift => shift.dayId === day.toDayId())

    const rows: {
      firstName: string
      lastName: string
      ageGroupName?: string
      shift: Shift
    }[] = flatMap(
      relevantShifts.map(shift => {
        const childAttendancesForShift =
          childAttendances.find(att => att.shiftId === shift.id)?.attendances ??
          {}
        const richAttendances = new DetailedAttendancesOnShift(
          shift.id!,
          childAttendancesForShift,
          {}
        )

        const filteredChildren = richAttendances
          .attendingChildren()
          .map(childId => allChildren.find(child => child.id === childId))
          .filter(child => child != null) as readonly Child[]

        return filteredChildren.map(child => {
          return {
            firstName: child.firstName,
            lastName: child.lastName,
            ageGroupName: childAttendancesForShift[child.id!]?.ageGroupName,
            shift,
          }
        })
      })
    )

    return {
      filename: `Overzicht voor ${day.toDDMMYYYY('-')}`,
      worksheets: [
        {
          name: 'Aanwezigheden kinderen',
          columns: [
            { values: ['Voornaam', ...rows.map(row => row.firstName)] },
            { values: ['Achternaam', ...rows.map(row => row.lastName)] },
            {
              values: ['Leeftijdsgroep', ...rows.map(row => row.ageGroupName)],
            },
            { values: ['Soort', ...rows.map(row => row.shift.kind)] },
            {
              values: [
                'Beschrijving',
                ...rows.map(row => row.shift.description),
              ],
            },
          ],
        },
      ],
    }
  }

  createChildAttendanceList(
    allChildren: ReadonlyArray<Child>,
    shifts: ReadonlyArray<Shift>,
    attendances: ReadonlyArray<{
      shiftId: string
      attendances: { [childId: string]: IDetailedChildAttendance }
    }>,
    year: number
  ): SpreadsheetData {
    const sortedShifts = Shift.sort(shifts)
    const richAttendances = new DetailedAttendancesOnShifts(
      attendances.map(
        att => new DetailedAttendancesOnShift(att.shiftId, att.attendances, {})
      )
    )

    const filteredChildren = Child.sorted(allChildren).filter(
      child => richAttendances.numberOfChildAttendances(child.id!) > 0
    ) // Only children with attendances

    return {
      worksheets: [
        {
          name: `Aanwezigheden kinderen ${year}`,
          columns: [
            {
              values: [
                '',
                '',
                'Voornaam',
                ...filteredChildren.map(row => row.firstName),
              ],
              width: 20,
            },
            {
              values: [
                '',
                '',
                'Familienaam',
                ...filteredChildren.map(row => row.lastName),
              ],
              width: 25,
            },

            ...sortedShifts.map(shift => {
              return {
                values: [
                  DayDate.fromDayId(shift.dayId),
                  shift.kind,
                  shift.description,
                  ...filteredChildren.map(child =>
                    richAttendances.didChildAttend(child.id!, shift.id!)
                  ),
                ],
                width: 22,
              }
            }),
          ],
        },
      ],
      filename: `Aanwezigheden kinderen ${year}`,
    }
  }

  createAllFiscalCertificates(
    allChildren: ReadonlyArray<Child>,
    allContacts: ReadonlyArray<ContactPerson>,
    shifts: ReadonlyArray<Shift>,
    attendances: ReadonlyArray<{
      shiftId: string
      attendances: { [childId: string]: IDetailedChildAttendance }
    }>,
    year: number
  ): SpreadsheetData {
    const sortedShifts = Shift.sort(shifts)
    const richAttendances = new DetailedAttendancesOnShifts(
      attendances.map(
        att => new DetailedAttendancesOnShift(att.shiftId, att.attendances, {})
      )
    )
    const sortedChildren = Child.sorted(allChildren).filter(
      child => richAttendances.numberOfChildAttendances(child.id!) > 0
    )

    const spacer = ['', '', '']

    return {
      filename: `Data fiscale attesten ${year}`,
      worksheets: [
        {
          name: `Data fiscale attesten ${year}`,
          columns: [
            {
              width: 20,
              values: [
                ...spacer,
                'Voornaam',
                ...sortedChildren.map(child => child.firstName),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Familienaam',
                ...sortedChildren.map(child => child.lastName),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Totaal (incl. korting)',
                ...sortedChildren.map(child =>
                  richAttendances.amountPaidByChild(child.id!)
                ),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Geboortedatum',
                ...sortedChildren.map(child =>
                  child.birthDate ? new DayDate(child.birthDate) : undefined
                ),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Contactpersoon',
                ...sortedChildren.map(child => {
                  const primaryContactPerson = child.primaryContactPerson
                    ? allContacts.find(
                        contact =>
                          contact.id ===
                          child.primaryContactPerson.contactPersonId
                      ) || null
                    : null

                  return primaryContactPerson
                    ? primaryContactPerson.fullName
                    : ''
                }),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Straat en nummer',
                ...sortedChildren.map(child => {
                  const address =
                    AddressDomainService.getAddressForChildWithExistingContacts(
                      child,
                      allContacts
                    ) || new Address({})
                  return (address.street || '') + ' ' + (address.number || '')
                }),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Postcode',
                ...sortedChildren.map(child => {
                  const address =
                    AddressDomainService.getAddressForChildWithExistingContacts(
                      child,
                      allContacts
                    ) || new Address({})
                  return address.zipCode || ''
                }),
              ],
            },
            {
              width: 25,
              values: [
                ...spacer,
                'Stad',
                ...sortedChildren.map(child => {
                  const address =
                    AddressDomainService.getAddressForChildWithExistingContacts(
                      child,
                      allContacts
                    ) || new Address({})
                  return address.city || ''
                }),
              ],
            },
            {
              width: 25,
              values: ['Dag', 'Type', 'Prijs'],
            },
            ...sortedShifts.map(shift => {
              return {
                width: 22,
                values: [
                  DayDate.fromDayId(shift.dayId),
                  shift.kind,
                  shift.price,
                  shift.description,
                  ...sortedChildren.map(child =>
                    richAttendances.didChildAttend(child.id!, shift.id!)
                  ),
                ],
              }
            }),
          ],
        },
      ],
    }
  }

  createChildrenPerDayList(
    allChildren: ReadonlyArray<Child>,
    shifts: ReadonlyArray<Shift>,
    allAttendances: ReadonlyArray<{
      shiftId: string
      attendances: { [childId: string]: IDetailedChildAttendance }
    }>,
    year: number
  ): SpreadsheetData {
    const detailedAttendances = new DetailedAttendancesOnShifts(
      allAttendances.map(
        detailed =>
          new DetailedAttendancesOnShift(
            detailed.shiftId,
            detailed.attendances,
            {}
          )
      )
    )

    const list = Object.entries(groupBy(shifts, shift => shift.dayId))
      .map(([dayId, shiftsOnDay]) => {
        const uniqueAttendancesOnDay = detailedAttendances.uniqueChildAttendances(
          shiftsOnDay.map(shift => shift.id!)
        )

        return {
          day: DayDate.fromDayId(dayId),
          shifts: shiftsOnDay,
          uniqueAttendancesOnDay,
        }
      })
      .sort((a, b) => a.day.compareTo(b.day))

    return {
      worksheets: [
        {
          name: `Unieke kinderen per dag ${year}`,
          columns: [
            { values: ['Dag', ...list.map(row => row.day)], width: 20 },
            {
              values: [
                'Aantal unieke kinderen',
                ...list.map(row => row.uniqueAttendancesOnDay),
              ],
              width: 25,
            },
          ],
        },
      ],
      filename: `Aantal unieke kinderen per dag ${year}`,
    }
  }
}
