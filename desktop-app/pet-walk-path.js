'use strict';

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function coordinate(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function movementBounds(workArea, windowSize) {
  const left = Math.round(workArea.x);
  const top = Math.round(workArea.y);
  return {
    left,
    top,
    right: Math.max(left, Math.round(workArea.x + workArea.width - windowSize.width)),
    bottom: Math.max(top, Math.round(workArea.y + workArea.height - windowSize.height))
  };
}

function horizontalTraversal(workArea, windowSize, currentPosition = {}) {
  const bounds = movementBounds(workArea, windowSize);
  const currentX = clamp(coordinate(currentPosition.x, bounds.right), bounds.left, bounds.right);
  const startsLeft = currentX <= (bounds.left + bounds.right) / 2;
  return [
    { x: startsLeft ? bounds.left : bounds.right, y: bounds.bottom },
    { x: startsLeft ? bounds.right : bounds.left, y: bounds.bottom }
  ];
}

function perimeterTraversal(workArea, windowSize, currentPosition = {}) {
  const bounds = movementBounds(workArea, windowSize);
  const x = clamp(coordinate(currentPosition.x, bounds.right), bounds.left, bounds.right);
  const y = clamp(coordinate(currentPosition.y, bounds.bottom), bounds.top, bounds.bottom);
  const nearest = [
    { side: 'top', distance: Math.abs(y - bounds.top), point: { x, y: bounds.top } },
    { side: 'right', distance: Math.abs(x - bounds.right), point: { x: bounds.right, y } },
    { side: 'bottom', distance: Math.abs(y - bounds.bottom), point: { x, y: bounds.bottom } },
    { side: 'left', distance: Math.abs(x - bounds.left), point: { x: bounds.left, y } }
  ].sort((a, b) => a.distance - b.distance)[0];
  const routes = {
    top: [nearest.point, { x: bounds.right, y: bounds.top }, { x: bounds.right, y: bounds.bottom }, { x: bounds.left, y: bounds.bottom }, { x: bounds.left, y: bounds.top }, nearest.point],
    right: [nearest.point, { x: bounds.right, y: bounds.bottom }, { x: bounds.left, y: bounds.bottom }, { x: bounds.left, y: bounds.top }, { x: bounds.right, y: bounds.top }, nearest.point],
    bottom: [nearest.point, { x: bounds.left, y: bounds.bottom }, { x: bounds.left, y: bounds.top }, { x: bounds.right, y: bounds.top }, { x: bounds.right, y: bounds.bottom }, nearest.point],
    left: [nearest.point, { x: bounds.left, y: bounds.top }, { x: bounds.right, y: bounds.top }, { x: bounds.right, y: bounds.bottom }, { x: bounds.left, y: bounds.bottom }, nearest.point]
  };
  return routes[nearest.side];
}

function sideDirection(from, to, bounds, fallback = 'right') {
  const dx = to.x - from.x;
  if (Math.abs(dx) > 1) return dx > 0 ? 'right' : 'left';
  if (Math.abs(from.x - bounds.right) <= 1) return 'left';
  if (Math.abs(from.x - bounds.left) <= 1) return 'right';
  return fallback;
}

function depthScale(position, bounds) {
  const range = Math.max(1, bounds.bottom - bounds.top);
  const depth = clamp((position.y - bounds.top) / range, 0, 1);
  return Math.round((0.82 + depth * 0.18) * 1000) / 1000;
}

module.exports = { movementBounds, horizontalTraversal, perimeterTraversal, sideDirection, depthScale };
