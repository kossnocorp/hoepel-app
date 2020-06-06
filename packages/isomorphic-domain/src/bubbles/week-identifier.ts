import { DayDateRange, DayDate } from '@hoepel.app/types'
import { getWeek, startOfWeek, endOfWeek, setWeek, setYear } from 'date-fns'

export class WeekIdentifier {
  private constructor(
    private readonly year: number,
    private readonly weekNumber: number
  ) {}

  get value(): string {
    return `${this.year}-${this.weekNumber}`
  }

  get range(): DayDateRange {
    const weekStartsOn = 1
    const dateZero = new Date(0)
    const week = setYear(
      setWeek(dateZero, this.weekNumber, { weekStartsOn }),
      this.year
    )
    const start = startOfWeek(week, { weekStartsOn })
    const end = endOfWeek(week, { weekStartsOn })

    return new DayDateRange({
      from: DayDate.fromNative(start),
      to: DayDate.fromNative(end),
    })
  }

  belongsToThisWeek(date: DayDate): boolean {
    return this.range.containsInclusive(date)
  }

  static forDate(day: DayDate): WeekIdentifier {
    return new WeekIdentifier(day.year, getWeek(day.nativeDate))
  }

  static get allSummer2020(): readonly WeekIdentifier[] {
    return [
      new WeekIdentifier(2020, 27),
      new WeekIdentifier(2020, 28),
      new WeekIdentifier(2020, 29),
      new WeekIdentifier(2020, 30),
      new WeekIdentifier(2020, 31),
      new WeekIdentifier(2020, 32),
      new WeekIdentifier(2020, 33),
      new WeekIdentifier(2020, 34),
      new WeekIdentifier(2020, 35),
      new WeekIdentifier(2020, 36),
    ]
  }
}
