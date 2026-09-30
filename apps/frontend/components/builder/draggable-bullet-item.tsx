'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface DraggableBulletItemProps {
  id: number;
  children: React.ReactNode;
}

/**
 * DraggableBulletItem Component
 *
 * Wraps a single description/bullet-point row (experience, project, or
 * custom-section entries) to make it draggable via @dnd-kit. Mirrors
 * DraggableListItem but uses an inline grip sized for a single-line row
 * instead of the absolute overlay meant for tall multi-field cards.
 */
export const DraggableBulletItem: React.FC<DraggableBulletItemProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex w-5 shrink-0 items-center justify-center self-stretch cursor-grab active:cursor-grabbing text-steel-grey hover:text-ink-soft"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
};
