// Facts that change with time, counted from the year so the answers never go stale.
const MOVED_TO_PRAGUE = 2016;
const MONTIK_BORN = 2014; // the owner's best guess

/** "10 років", "21 рік", "22 роки". */
export function uaYears(n) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return `${n} років`;
  if (last === 1) return `${n} рік`;
  if (last >= 2 && last <= 4) return `${n} роки`;
  return `${n} років`;
}

export function yearsInPrague(now = new Date()) {
  return now.getFullYear() - MOVED_TO_PRAGUE;
}

/** Whole years Montik is at least, whatever month he was born in. */
export function montikAgeAtLeast(now = new Date()) {
  return now.getFullYear() - MONTIK_BORN - 1;
}
