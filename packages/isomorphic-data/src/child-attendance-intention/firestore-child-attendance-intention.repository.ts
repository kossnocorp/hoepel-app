import {
  ChildAttendanceIntentionRepository,
  ChildAttendanceIntention,
  ChildAttendanceIntentionProps,
  WeekIdentifier,
} from '@hoepel.app/isomorphic-domain'
import { remove, collection, upset, query, where, get } from 'typesaurus'
import { Observable, from } from 'rxjs'
import { map } from 'rxjs/operators'

export class FirestoreChildAttendanceIntentionRepository
  implements ChildAttendanceIntentionRepository {
  private readonly collection = collection<ChildAttendanceIntentionProps>(
    'child-attendance-intention'
  )

  findForWeek(
    tenantId: string,
    week: WeekIdentifier
  ): Observable<ChildAttendanceIntention[]> {
    return from(
      query(this.collection, [
        where('tenant', '==', tenantId),
        where('year', '==', week.year),
        where('weekNumber', '==', week.weekNumber),
      ])
    ).pipe(
      map((data) => {
        return data.map((props) =>
          ChildAttendanceIntention.fromProps(props.data)
        )
      })
    )
  }

  findForChildOnRegistrationWaitingList(
    tenantId: string,
    childId: string
  ): Observable<ChildAttendanceIntention[]> {
    return from(
      query(this.collection, [
        where('tenant', '==', tenantId),
        where('childId', '==', childId),
        where('status', '==', 'child-on-registration-waiting-list'),
      ])
    ).pipe(
      map((data) => {
        return data.map((props) =>
          ChildAttendanceIntention.fromProps(props.data)
        )
      })
    )
  }

  findForChild(
    tenantId: string,
    childId: string
  ): Observable<ChildAttendanceIntention[]> {
    return from(
      query(this.collection, [
        where('tenant', '==', tenantId),
        where('childId', '==', childId),
      ])
    ).pipe(
      map((data) => {
        return data.map((props) =>
          ChildAttendanceIntention.fromProps(props.data)
        )
      })
    )
  }

  findForChildInWeek(
    tenantId: string,
    childId: string,
    week: WeekIdentifier
  ): Observable<ChildAttendanceIntention | null> {
    return from(
      get(
        this.collection,
        `${tenantId}-${childId}-${week.year}-${week.weekNumber}`
      )
    ).pipe(
      map((doc) => {
        if (doc == null) {
          return null
        }

        return ChildAttendanceIntention.fromProps(doc.data)
      })
    )
  }

  put(entity: ChildAttendanceIntention): Promise<void> {
    return upset(this.collection, entity.id, entity.toProps())
  }

  async remove(
    tenantId: string,
    childId: string,
    week: WeekIdentifier
  ): Promise<void> {
    await remove(
      this.collection,
      `${tenantId}-${childId}-${week.year}-${week.weekNumber}`
    )
  }
}
