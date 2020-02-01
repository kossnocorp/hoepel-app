import * as admin from 'firebase-admin'
import {
  ChildAttendancesByChildDoc,
  ChildAttendancesByShiftDoc,
  DocumentNotFoundError,
  IDetailedChildAttendance,
  IShift,
  store,
  TenantIndexedRepository,
} from '@hoepel.app/types'
import { FirebaseTenantIndexedRepository } from './repository'

export type IChildAttendanceByChildRepository = TenantIndexedRepository<
  ChildAttendancesByChildDoc & { id: string }
>
export type IChildAttendanceByShiftRepository = TenantIndexedRepository<
  ChildAttendancesByShiftDoc & { id: string }
>

export const createChildAttendanceByChildRepository = (
  db: admin.firestore.Firestore
): IChildAttendanceByChildRepository => {
  return new FirebaseTenantIndexedRepository<
    ChildAttendancesByChildDoc,
    ChildAttendancesByChildDoc & { id: string }
  >(db, store.childAttendancesByChild)
}

export const createChildAttendanceByShiftRepository = (
  db: admin.firestore.Firestore
): IChildAttendanceByShiftRepository => {
  return new FirebaseTenantIndexedRepository<
    ChildAttendancesByShiftDoc,
    ChildAttendancesByShiftDoc & { id: string }
  >(db, store.childAttendancesByShift)
}

export class ChildAttendanceService {
  constructor(
    private byChildRepository: IChildAttendanceByChildRepository,
    private byShiftRepository: IChildAttendanceByShiftRepository
  ) {}

  async getAttendancesForChild(
    tenant: string,
    childId: string
  ): Promise<{ [p: string]: IDetailedChildAttendance }> {
    try {
      const data = await this.byChildRepository.get(tenant, childId)

      return data && data.attendances ? data.attendances : {}
    } catch (e) {
      if (e instanceof DocumentNotFoundError) {
        return {}
      } else {
        throw e
      }
    }
  }

  async getChildAttendancesOnShifts(
    tenant: string,
    shifts: ReadonlyArray<IShift>
  ): Promise<
    ReadonlyArray<{
      shiftId: string
      attendances: { [childId: string]: IDetailedChildAttendance }
    }>
  > {
    if (shifts.length === 0) {
      return Promise.resolve([])
    }

    const all = await this.byShiftRepository.getMany(
      tenant,
      shifts.map(shift => shift.id).filter(id => id)
    )

    return all.map(attendance => {
      return {
        shiftId: attendance.id,
        attendances: attendance.attendances,
      }
    })
  }
}