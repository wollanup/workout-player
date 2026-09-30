/** French count with agreement: plural(1, 'étape') -> "1 étape", plural(2, 'morceau', 'morceaux') -> "2 morceaux". */
export function plural(n, singular, pluralForm = `${singular}s`) {
  return `${n} ${Math.abs(n) >= 2 ? pluralForm : singular}`;
}
