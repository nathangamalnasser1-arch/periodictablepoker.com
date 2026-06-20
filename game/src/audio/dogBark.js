export const DOG_BARK_SRC = '/audio/dog-bark.mp3';
export const DOG_BARK_PREF_KEY = 'ptp-dog-bark-enabled';

/** Bark is on by default for the first solo hand (game 4). */
export function getDefaultDogBarkEnabled(gameNumber) {
  return gameNumber === 4;
}

export function readDogBarkPreference() {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(DOG_BARK_PREF_KEY);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
}

export function writeDogBarkPreference(enabled) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DOG_BARK_PREF_KEY, enabled ? 'true' : 'false');
}

export function isDogBarkEnabled(gameNumber, preference = readDogBarkPreference()) {
  if (preference !== null) return preference;
  return getDefaultDogBarkEnabled(gameNumber);
}

/** Primary winner seat index when a solo bot wins the hand; null otherwise. */
export function getPrimaryBotWinnerIndex({
  winnerIndices,
  winnerIndex,
  humanIndex,
  isMultiplayer = false,
}) {
  if (isMultiplayer) return null;
  const indices = winnerIndices?.length
    ? winnerIndices
    : (winnerIndex != null ? [winnerIndex] : []);
  const primary = indices[0];
  if (primary == null || primary === humanIndex) return null;
  return primary;
}

export function getBotWinnerForBark({
  gameNumber,
  winnerIndices,
  winnerIndex,
  humanIndex,
  isMultiplayer = false,
  dogBarkEnabled = isDogBarkEnabled(gameNumber),
}) {
  if (!dogBarkEnabled) return null;
  return getPrimaryBotWinnerIndex({
    winnerIndices,
    winnerIndex,
    humanIndex,
    isMultiplayer,
  });
}

let barkAudio = null;

function getBarkAudio() {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (!barkAudio) {
    barkAudio = new Audio(DOG_BARK_SRC);
    barkAudio.preload = 'auto';
  }
  return barkAudio;
}

export async function playDogBark() {
  const audio = getBarkAudio();
  if (!audio) return;

  try {
    audio.currentTime = 0;
    await audio.play();
  } catch {
    // Autoplay blocked or asset failed to load.
  }
}
