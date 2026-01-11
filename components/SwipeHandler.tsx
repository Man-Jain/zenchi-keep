"use client";

import { useState, useRef, ReactNode } from "react";
import { useSwipeable } from "react-swipeable";

interface SwipeHandlerProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
}

// Haptic feedback helper for mobile devices
function triggerHapticFeedback() {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(50); // 50ms vibration
  }
}

export default function SwipeHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
}: SwipeHandlerProps) {
  const [deltaX, setDeltaX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (disabled) return;
      setIsSwiping(true);
      setDeltaX(eventData.deltaX);
    },
    onSwipedLeft: (eventData) => {
      if (disabled) return;
      setIsSwiping(false);
      setDeltaX(0);
      triggerHapticFeedback();
      onSwipeLeft();
    },
    onSwipedRight: (eventData) => {
      if (disabled) return;
      setIsSwiping(false);
      setDeltaX(0);
      triggerHapticFeedback();
      onSwipeRight();
    },
    onTouchEndOrOnMouseUp: () => {
      // Reset position if swipe wasn't completed
      if (isSwiping) {
        setIsSwiping(false);
        setDeltaX(0);
      }
    },
    trackMouse: false, // Only track touch events
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 50, // Minimum distance for a swipe
  });

  // Determine background color based on swipe direction
  const getBackgroundColor = () => {
    if (!isSwiping || Math.abs(deltaX) < 30) return "bg-white";
    if (deltaX < 0) return "bg-red-50"; // Left swipe (skip) - red
    return "bg-green-50"; // Right swipe (reviewed) - green
  };

  // Calculate rotation based on swipe distance
  const rotation = deltaX * 0.1; // Slight rotation for visual effect

  return (
    <div
      {...handlers}
      ref={cardRef}
      className={`transition-all duration-200 ease-out ${getBackgroundColor()}`}
      style={{
        transform: isSwiping
          ? `translateX(${deltaX}px) rotate(${rotation}deg)`
          : "translateX(0) rotate(0deg)",
        transition: isSwiping ? "none" : "transform 0.3s ease-out",
      }}
    >
      {children}
    </div>
  );
}
