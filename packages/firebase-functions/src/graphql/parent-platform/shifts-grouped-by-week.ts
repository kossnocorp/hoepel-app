import {
  ChildAttendanceIntention,
  WeekIdentifier,
  ChildAttendanceIntentionApplicationService,
} from '@hoepel.app/isomorphic-domain'
import { FirestoreChildAttendanceIntentionRepository } from '@hoepel.app/isomorphic-data'
import { first } from 'rxjs/operators'
import { ParentPlatform } from './parent-platform'

const attendanceIntentionService = new ChildAttendanceIntentionApplicationService(
  new FirestoreChildAttendanceIntentionRepository()
)
export class ShiftsGroupedByWeek {
  static async attendanceIntentionsForChild(
    organisationId: string,
    week: WeekIdentifier,
    childId: string,
    parentUid: string
  ): Promise<ChildAttendanceIntention | null> {
    // Check if parent manages child
    const managedByParent = await ParentPlatform.childrenManagedByMe(
      parentUid,
      organisationId
    )

    if (!managedByParent.map((child) => child.id).includes(childId)) {
      throw new Error(`Parent ${parentUid} can not acces child ${childId}`)
    }

    const res = await attendanceIntentionService
      .getAttendanceIntentionsForChildInWeek(organisationId, childId, week)
      .pipe(first())
      .toPromise()

    console.log(res)

    return res
  }
}
