/** Dog portraits cropped from the club dogs-playing-poker artwork. */
export const DOG_AVATAR_PIPE = '/avatars/dog-pipe.png';
export const DOG_AVATAR_PINCE_NEZ = '/avatars/dog-pince-nez.png';
export const DOG_AVATAR_PEERING = '/avatars/dog-peering.png';
export const DOG_AVATAR_CIGAR = '/avatars/dog-cigar.png';
export const DOG_AVATAR_SCHOLAR = '/avatars/dog-scholar.png';

const SEAT_DOG_AVATARS = [
  DOG_AVATAR_PIPE,
  DOG_AVATAR_PINCE_NEZ,
  DOG_AVATAR_PEERING,
  DOG_AVATAR_CIGAR,
  DOG_AVATAR_SCHOLAR,
];

/** Human always gets the pipe dog; other seats use fixed portraits. */
export function getDogAvatarSrc(seatIndex, humanIndex = 0) {
  if (seatIndex === humanIndex) return DOG_AVATAR_PIPE;
  const src = SEAT_DOG_AVATARS[seatIndex] ?? DOG_AVATAR_SCHOLAR;
  if (src === DOG_AVATAR_PIPE) return DOG_AVATAR_SCHOLAR;
  return src;
}

export function getDogAvatarAlt(seatIndex, humanIndex, displayName) {
  if (seatIndex === humanIndex) return `${displayName}, distinguished club hound`;
  return `${displayName} the hound`;
}
