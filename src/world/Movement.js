// Shared displacement boundary for walking, gusts and guardian movement.
export function moveWithCollisions(entity, dx, dy, world) {
  entity.x += dx;
  const colX = world.checkCollision(entity.x, entity.y, entity.radius);
  if (colX.colliding) entity.x += colX.pushX;
  entity.y += dy;
  const colY = world.checkCollision(entity.x, entity.y, entity.radius);
  if (colY.colliding) entity.y += colY.pushY;
}
