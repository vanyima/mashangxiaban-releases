'use strict';

const assert = require('assert');
const { movementBounds, horizontalTraversal, perimeterTraversal, sideDirection, depthScale } = require('../pet-walk-path');

const area = { x: 0, y: 25, width: 1920, height: 1055 };
const size = { width: 208, height: 254 };
const bounds = movementBounds(area, size);
assert.deepStrictEqual(bounds, { left: 0, top: 25, right: 1712, bottom: 826 });
assert.deepStrictEqual(horizontalTraversal(area, size, { x: 1600, y: 300 }), [{ x: 1712, y: 826 }, { x: 0, y: 826 }]);
assert.deepStrictEqual(horizontalTraversal(area, size, { x: 0, y: 300 }), [{ x: 0, y: 826 }, { x: 1712, y: 826 }]);
const lap = perimeterTraversal(area, size, { x: 1712, y: 826 });
assert.deepStrictEqual(lap[0], lap.at(-1));
assert(lap.some((point) => point.x === bounds.left && point.y === bounds.top));
assert(lap.some((point) => point.x === bounds.right && point.y === bounds.bottom));
assert(lap.every((point) => point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom));
const lapDistance = lap.slice(1).reduce((total, point, index) => total + Math.hypot(point.x - lap[index].x, point.y - lap[index].y), 0);
assert.strictEqual(lapDistance, 2 * ((bounds.right - bounds.left) + (bounds.bottom - bounds.top)));
assert.strictEqual(sideDirection({ x: 0, y: 25 }, { x: 0, y: 826 }, bounds), 'right');
assert.strictEqual(sideDirection({ x: 1712, y: 826 }, { x: 1712, y: 25 }, bounds), 'left');
assert.strictEqual(sideDirection({ x: 1712, y: 25 }, { x: 0, y: 25 }, bounds), 'left');
assert.strictEqual(depthScale({ x: 0, y: bounds.top }, bounds), 0.82);
assert.strictEqual(depthScale({ x: 0, y: bounds.bottom }, bounds), 1);
console.log('pet walk path tests passed');
