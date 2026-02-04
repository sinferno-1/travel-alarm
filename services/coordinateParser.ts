export function parseCoordinate(input: string): number | null {
  if (!input) return null;

  // Try decimal first
  const decimal = Number(input);
  if (!isNaN(decimal)) return decimal;

  // Try DMS: 72° 7' 00.480" N
  const regex =
    /(\d+)[°\s]+(\d+)[′'\s]+([\d.]+)[″"\s]*([NSEW])/i;

  const match = input.trim().match(regex);
  if (!match) return null;

  const degrees = parseFloat(match[1]);
  const minutes = parseFloat(match[2]);
  const seconds = parseFloat(match[3]);
  const direction = match[4].toUpperCase();

  let value = degrees + minutes / 60 + seconds / 3600;

  if (direction === 'S' || direction === 'W') {
    value *= -1;
  }

  return value;
}
