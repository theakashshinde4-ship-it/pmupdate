import { useState } from 'react';

/**
 * Simple drag and drop hook for Kanban queue
 * Works without external libraries using native HTML5 drag API
 *
 * Usage:
 * const { draggedItem, handleDragStart, handleDragEnd, handleDrop, handleDragOver } = useDragAndDrop({
 *   onDrop: (item, targetStatus) => { ... }
 * });
 */
export default function useDragAndDrop({ onDrop }) {
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();

    if (draggedItem && draggedItem.status !== targetStatus) {
      // Call the onDrop callback with item and new status
      onDrop(draggedItem, targetStatus);
    }

    setDraggedItem(null);
  };

  return {
    draggedItem,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDragOver
  };
}
