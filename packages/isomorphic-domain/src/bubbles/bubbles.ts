import { Aggregate } from '@hoepel.app/ddd-library'
import { BubbleProps, Bubble } from './bubble'

export type BubblesProps = {
  readonly bubbles: readonly BubbleProps[]
  readonly tenantId: string
}

export class Bubbles implements Aggregate {
  private constructor(private readonly props: BubblesProps) {}

  static createEmpty(tenantId: string): Bubbles {
    return new Bubbles({ tenantId, bubbles: [] })
  }

  static fromProps(props: BubblesProps): Bubbles {
    return new Bubbles(props)
  }

  toProps(): BubblesProps {
    return this.props
  }

  get id(): string {
    return `${this.tenantId}-bubbles`
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get names(): ReadonlySet<string> {
    return new Set(this.bubbles.map((bubble) => bubble.name))
  }

  get namesSorted(): readonly string[] {
    return [...this.names].sort()
  }

  get bubbles(): readonly Bubble[] {
    return [
      ...this.props.bubbles.map((props) => Bubble.fromProps(props)),
    ].sort((a, b) => a.name.localeCompare(b.name))
  }

  get isEmpty(): boolean {
    return this.bubbles.length === 0
  }

  withBubbleAdded(bubble: Bubble): Bubbles {
    if (!this.mayAddBubble(bubble)) {
      return this
    }

    return Bubbles.fromProps({
      ...this.toProps(),
      bubbles: [...this.toProps().bubbles, bubble.toProps()],
    })
  }

  withBubbleRemoved(name: string): Bubbles {
    return Bubbles.fromProps({
      ...this.toProps(),
      bubbles: this.toProps().bubbles.filter((c) => c.name !== name),
    })
  }

  withChangedMaxChildrenForBubble(name: string, newCapacity: number): Bubbles {
    const bubble = this.findBubbleByName(name)

    if (!bubble) {
      return this
    }

    return Bubbles.fromProps({
      ...this.toProps(),
      bubbles: [
        ...this.toProps().bubbles.filter((c) => c.name !== name),
        bubble.withMaxChildren(newCapacity).toProps(),
      ],
    })
  }

  withRenamedBubble(oldName: string, newName: string): Bubbles {
    const currentBubble = this.findBubbleByName(oldName)

    if (this.bubbleWithNameExists(newName) || currentBubble == null) {
      return this
    }

    return Bubbles.fromProps({
      ...this.toProps(),
      bubbles: [
        ...this.toProps().bubbles.filter((c) => c.name !== oldName),
        currentBubble.withName(newName).toProps(),
      ],
    })
  }

  withChildAddedToBubble(
    bubbleName: string,
    weekIdentifier: string,
    childId: string
  ): Bubbles {
    const bubble = this.findBubbleByName(bubbleName)

    if (bubble == null) {
      return this
    }

    return Bubbles.fromProps({
      ...this.toProps(),
      bubbles: [
        ...this.toProps().bubbles.filter((c) => c.name !== bubbleName),
        bubble.withChildAdded(weekIdentifier, childId).toProps(),
      ],
    })
  }

  withChildRemovedFromBubble(
    bubbleName: string,
    weekIdentifier: string,
    childId: string
  ): Bubbles {
    const bubble = this.findBubbleByName(bubbleName)

    if (bubble == null) {
      return this
    }

    return Bubbles.fromProps({
      ...this.toProps(),
      bubbles: [
        ...this.toProps().bubbles.filter((c) => c.name !== bubbleName),
        bubble.withChildRemoved(weekIdentifier, childId).toProps(),
      ],
    })
  }

  findBubbleByName(name: string): Bubble | null {
    return this.bubbles.find((bubble) => bubble.name === name) ?? null
  }

  findBubbleChildIsAssignedTo(
    weekIdentifier: string,
    childId: string
  ): Bubble | null {
    return (
      this.bubbles.find((bubble) =>
        bubble.includesChild(weekIdentifier, childId)
      ) ?? null
    )
  }

  childIsAssignedABubble(weekIdentifier: string, childId: string): boolean {
    return this.findBubbleChildIsAssignedTo(weekIdentifier, childId) != null
  }

  mayAddBubble(bubble: Bubble): boolean {
    return !this.bubbleWithNameExists(bubble.name)
  }

  bubbleWithNameExists(name: string): boolean {
    return this.findBubbleByName(name) != null
  }

  assignmentsForChild(
    childId: string
  ): readonly {
    weekIdentifier: string
    bubbleName: string
  }[] {
    return this.bubbles.reduce(
      (acc, bubble) => [
        ...acc,
        ...bubble.weeksForChild(childId).map((weekIdentifier) => {
          return {
            weekIdentifier,
            bubbleName: bubble.name,
          }
        }),
      ],
      [] as {
        weekIdentifier: string
        bubbleName: string
      }[]
    )
  }

  /** Returns all children (represented by their id) already assigned to a bubble */
  allChildIdsAssignedToABubble(weekIdentifier: string): ReadonlySet<string> {
    return this.bubbles.reduce((set, bubble) => {
      return new Set([
        ...bubble.childIdsInBubble(weekIdentifier),
        ...set.values(),
      ])
    }, new Set<string>())
  }
}
