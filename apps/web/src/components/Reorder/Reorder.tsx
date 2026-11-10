import {
  type Active,
  type CollisionDetection,
  DndContext,
  KeyboardCode,
  KeyboardSensor,
  type Over,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { createContext, type ReactNode, useContext, useState } from 'react'
import type { DropTarget } from './placement'
import './Reorder.css'

const Target = createContext<DropTarget | undefined>(undefined)

const preferItems: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const pool = hits.length > 0 ? hits : rectIntersection(args)
  const onItem = pool.filter(
    (hit) =>
      args.droppableContainers.find((c) => c.id === hit.id)?.data.current?.item !== undefined,
  )
  return onItem.length > 0 ? onItem : pool
}

const targetOf = (active: Active, over: Over | null): DropTarget | undefined => {
  const data = over?.data.current
  if (over === null || data === undefined) return undefined
  if (data.item === undefined) return { list: data.list }
  const moving = active.rect.current.translated
  const middle = moving === null ? 0 : moving.top + moving.height / 2
  return {
    list: data.list,
    item: data.item,
    edge: middle < over.rect.top + over.rect.height / 2 ? 'before' : 'after',
  }
}

const same = (a: DropTarget | undefined, b: DropTarget | undefined) =>
  a?.list === b?.list && a?.item === b?.item && a?.edge === b?.edge

const dragKeys = {
  start: [KeyboardCode.Space],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space, KeyboardCode.Tab],
}

export function ReorderContext({
  children,
  onStart,
  onDrop,
  onEnd,
}: {
  readonly children: ReactNode
  readonly onStart: (id: string) => void
  readonly onDrop: (id: string, target: DropTarget) => void
  readonly onEnd: () => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { keyboardCodes: dragKeys }),
  )
  const [target, setTarget] = useState<DropTarget | undefined>()
  const track = ({ active, over }: { active: Active; over: Over | null }) => {
    const next = targetOf(active, over)
    setTarget((current) => (same(current, next) ? current : next))
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={preferItems}
      onDragStart={({ active }) => onStart(String(active.id))}
      onDragMove={track}
      onDragOver={track}
      onDragCancel={() => {
        setTarget(undefined)
        onEnd()
      }}
      onDragEnd={({ active, over }) => {
        const drop = targetOf(active, over)
        setTarget(undefined)
        onEnd()
        if (drop !== undefined) onDrop(String(active.id), drop)
      }}
    >
      <Target.Provider value={target}>{children}</Target.Provider>
    </DndContext>
  )
}

export const useReorderItem = (id: string, list: string, role?: string) => {
  const target = useContext(Target)
  const drag = useDraggable({ id, ...(role === undefined ? {} : { attributes: { role } }) })
  const drop = useDroppable({ id: `item:${id}`, data: { list, item: id } })
  return {
    attributes: drag.attributes,
    listeners: drag.listeners,
    isDragging: drag.isDragging,
    setNodeRef: (node: HTMLElement | null) => {
      drag.setNodeRef(node)
      drop.setNodeRef(node)
    },
    edge: target?.item === id && !drag.isDragging ? target.edge : undefined,
  }
}

export const useReorderList = (list: string) => {
  const target = useContext(Target)
  const drop = useDroppable({ id: `list:${list}`, data: { list } })
  return {
    setNodeRef: drop.setNodeRef,
    over: target?.list === list,
    blank: target?.list === list && target.item === undefined,
  }
}
