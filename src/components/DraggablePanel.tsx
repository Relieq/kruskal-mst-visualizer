import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { type ReactNode, type ReactElement } from "react";

interface DraggablePanelProps {
    id: string;
    children: ReactNode;
}

export function DraggablePanel({ id, children }: DraggablePanelProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Drag handle component
    const dragHandle = (
        <button
            className="drag-handle"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
        >
            ⋮⋮
        </button>
    );

    // Clone children (CollapsiblePanel) và truyền drag handle vào headerActions
    const enhancedChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as ReactElement<{ headerActions?: ReactNode }>, {
                headerActions: dragHandle,
            });
        }
        return child;
    });

    return (
        <div ref={setNodeRef} style={style} className="draggable-panel-wrapper">
            {enhancedChildren}
        </div>
    );
}

