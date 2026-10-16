export type Field = 'Number Theory' | 'Combinatorics' | 'Analysis' | 'Algebra' | 'Topology' | 'Logic' | 'Geometry'
export type Status = 'open' | 'proven' | 'disproven' | 'expired'

export type Market = {
  id: string
  title: string
  field: Field
  statement: string // Lean 4 statement
  prob: number // market probability that a proof lands before close
  change24h: number // percentage points
  volume: number // USDC
  liquidity: number
  bounty: number
  submissions: number
  created: string
  closes: string
  status: Status
}

export const FIELDS: Field[] = ['Number Theory', 'Combinatorics', 'Analysis', 'Algebra', 'Topology', 'Logic', 'Geometry']

export const MARKETS: Market[] = [
  { id: 'twin-primes', title: 'Twin Prime Conjecture', field: 'Number Theory', statement: '∀ n : ℕ, ∃ p > n, p.Prime ∧ (p + 2).Prime', prob: 0.03, change24h: 0.2, volume: 1824000, liquidity: 410000, bounty: 250000, submissions: 41, created: '2025-03-02', closes: '2030-12-31', status: 'open' },
  { id: 'collatz-2-40', title: 'Collatz holds for all n < 2⁴⁰', field: 'Number Theory', statement: '∀ n < 2 ^ 40, 0 < n → ∃ k, collatz^[k] n = 1', prob: 0.41, change24h: 6.4, volume: 284500, liquidity: 52000, bounty: 8000, submissions: 17, created: '2026-08-11', closes: '2027-03-01', status: 'open' },
  { id: 'flt-mathlib', title: "Fermat's Last Theorem fully in Mathlib", field: 'Number Theory', statement: '∀ n > 2, ∀ a b c : ℕ, 0 < a → 0 < b → a ^ n + b ^ n ≠ c ^ n', prob: 0.38, change24h: -1.1, volume: 961200, liquidity: 188000, bounty: 50000, submissions: 9, created: '2024-10-20', closes: '2029-01-01', status: 'open' },
  { id: 'erdos-straus', title: 'Erdős–Straus conjecture', field: 'Number Theory', statement: '∀ n ≥ 2, ∃ x y z : ℕ+, (4 : ℚ) / n = 1 / x + 1 / y + 1 / z', prob: 0.04, change24h: 0, volume: 133900, liquidity: 30100, bounty: 15000, submissions: 23, created: '2025-11-05', closes: '2028-06-30', status: 'open' },
  { id: 'odd-perfect', title: 'No odd perfect number below 10¹⁵⁰⁰', field: 'Number Theory', statement: '∀ n < 10 ^ 1500, Odd n → ¬ n.Perfect', prob: 0.22, change24h: 2.8, volume: 77400, liquidity: 14800, bounty: 4000, submissions: 6, created: '2026-06-14', closes: '2027-06-14', status: 'open' },
  { id: 'cap-set', title: 'Cap set bound (Ellenberg–Gijswijt)', field: 'Combinatorics', statement: '∃ c < 3, ∀ n, ∀ A : Finset (Fin n → ZMod 3), IsCapSet A → A.card ≤ c ^ n', prob: 0.72, change24h: 3.5, volume: 202300, liquidity: 41000, bounty: 6000, submissions: 12, created: '2026-05-02', closes: '2027-01-15', status: 'open' },
  { id: 'union-closed', title: 'Union-closed sets with constant ½', field: 'Combinatorics', statement: '∀ F : Finset (Finset α), UnionClosed F → F ≠ {∅} → ∃ x, 2 * (F.filter (x ∈ ·)).card ≥ F.card', prob: 0.09, change24h: -0.6, volume: 158000, liquidity: 26700, bounty: 20000, submissions: 31, created: '2025-09-09', closes: '2028-09-09', status: 'open' },
  { id: 'lonely-runner-8', title: 'Lonely runner for 8 runners', field: 'Combinatorics', statement: 'LonelyRunner 8', prob: 0.17, change24h: 1.9, volume: 64100, liquidity: 12200, bounty: 5000, submissions: 4, created: '2026-02-21', closes: '2027-08-01', status: 'open' },
  { id: 'hadwiger-nelson-5', title: 'Chromatic number of the plane ≥ 5', field: 'Combinatorics', statement: '5 ≤ chromaticNumber (unitDistanceGraph (EuclideanSpace ℝ (Fin 2)))', prob: 0.55, change24h: -4.2, volume: 118700, liquidity: 23500, bounty: 3000, submissions: 8, created: '2026-04-30', closes: '2026-12-31', status: 'open' },
  { id: 'pfr', title: 'Polynomial Freiman–Ruzsa (char 2)', field: 'Combinatorics', statement: 'PFR_conjecture (A : Finset (Fin n → ZMod 2)) (hK : (A + A).card ≤ K * A.card)', prob: 1, change24h: 0, volume: 540900, liquidity: 0, bounty: 10000, submissions: 3, created: '2023-11-14', closes: '2024-06-01', status: 'proven' },
  { id: 'sensitivity', title: 'Sensitivity conjecture', field: 'Combinatorics', statement: '∀ f : (Fin n → Bool) → Bool, (degree f : ℝ) ≤ (sensitivity f) ^ 2', prob: 1, change24h: 0, volume: 88200, liquidity: 0, bounty: 2000, submissions: 2, created: '2024-02-01', closes: '2024-12-31', status: 'proven' },
  { id: 'riemann', title: 'Riemann Hypothesis', field: 'Analysis', statement: '∀ s : ℂ, riemannZeta s = 0 → ¬ (∃ n : ℕ, s = -2 * (n + 1)) → s ≠ 1 → s.re = 1 / 2', prob: 0.01, change24h: 0.1, volume: 3412000, liquidity: 820000, bounty: 1000000, submissions: 112, created: '2024-01-01', closes: '2035-01-01', status: 'open' },
  { id: 'carleson', title: "Carleson's theorem", field: 'Analysis', statement: '∀ f ∈ Lp ℝ 2 (AddCircle (2 * π)), ∀ᵐ x, Tendsto (partialFourierSum f · x) atTop (𝓝 (f x))', prob: 0.64, change24h: 5.1, volume: 302600, liquidity: 61000, bounty: 12000, submissions: 5, created: '2025-07-19', closes: '2027-02-28', status: 'open' },
  { id: 'kakeya-3', title: 'Kakeya conjecture in ℝ³', field: 'Analysis', statement: '∀ K ⊆ EuclideanSpace ℝ (Fin 3), IsKakeya K → dimH K = 3', prob: 0.47, change24h: 8.7, volume: 197500, liquidity: 39900, bounty: 15000, submissions: 7, created: '2026-03-11', closes: '2027-12-31', status: 'open' },
  { id: 'cfsg', title: 'Classification of finite simple groups', field: 'Algebra', statement: '∀ G [Group G] [Finite G], IsSimpleGroup G → InClassificationList G', prob: 0.12, change24h: -0.3, volume: 455000, liquidity: 90200, bounty: 80000, submissions: 2, created: '2025-01-10', closes: '2030-01-01', status: 'open' },
  { id: 'inverse-galois-m23', title: 'M₂₃ is a Galois group over ℚ', field: 'Algebra', statement: '∃ K : IntermediateField ℚ (AlgebraicClosure ℚ), IsGalois ℚ K ∧ Nonempty ((K ≃ₐ[ℚ] K) ≃* MathieuGroup 23)', prob: 0.02, change24h: 0, volume: 41800, liquidity: 9100, bounty: 30000, submissions: 1, created: '2026-01-04', closes: '2029-01-04', status: 'open' },
  { id: 'abel-ruffini', title: 'Abel–Ruffini for general quintic', field: 'Algebra', statement: '¬ IsSolvableByRad ℚ (rootOfGeneralQuintic)', prob: 0, change24h: 0, volume: 12300, liquidity: 0, bounty: 500, submissions: 6, created: '2025-05-05', closes: '2025-11-05', status: 'expired' },
  { id: 'jordan-curve', title: 'Jordan curve theorem', field: 'Topology', statement: '∀ γ : Circle → ℂ, Continuous γ → Injective γ → (Set.range γ)ᶜ.ncard_components = 2', prob: 0.83, change24h: 1.2, volume: 99300, liquidity: 20400, bounty: 2500, submissions: 14, created: '2026-07-07', closes: '2026-11-30', status: 'open' },
  { id: 'brouwer', title: 'Brouwer fixed point (all dimensions)', field: 'Topology', statement: '∀ n, ∀ f : closedBall (0 : EuclideanSpace ℝ (Fin n)) 1 → _, Continuous f → ∃ x, f x = x', prob: 0.91, change24h: 0.4, volume: 71200, liquidity: 15300, bounty: 1500, submissions: 19, created: '2026-08-28', closes: '2026-11-15', status: 'open' },
  { id: 'poincare-false', title: 'Counterexample to smooth 4D Poincaré', field: 'Topology', statement: '∃ M : SmoothManifold 4, HomotopyEquiv M (Sphere 4) ∧ ¬ Diffeomorphic M (Sphere 4)', prob: 0, change24h: 0, volume: 26100, liquidity: 0, bounty: 40000, submissions: 11, created: '2025-02-02', closes: '2026-02-02', status: 'disproven' },
  { id: 'ch-independent', title: 'Independence of the Continuum Hypothesis', field: 'Logic', statement: '¬ ZFC ⊢ CH ∧ ¬ ZFC ⊢ ¬ CH', prob: 1, change24h: 0, volume: 143400, liquidity: 0, bounty: 5000, submissions: 4, created: '2024-04-04', closes: '2025-04-04', status: 'proven' },
  { id: 'bb5', title: 'BB(5) = 47,176,870', field: 'Logic', statement: 'busyBeaver 5 = 47176870', prob: 1, change24h: 0, volume: 229900, liquidity: 0, bounty: 7000, submissions: 5, created: '2024-05-01', closes: '2025-01-01', status: 'proven' },
  { id: 'bb6-bound', title: 'BB(6) > 10↑↑15', field: 'Logic', statement: 'busyBeaver 6 > tetration 10 15', prob: 0.68, change24h: -2.7, volume: 55600, liquidity: 11000, bounty: 3000, submissions: 3, created: '2026-09-01', closes: '2027-03-01', status: 'open' },
  { id: 'sphere-8', title: 'Optimal sphere packing in dimension 8', field: 'Geometry', statement: 'spherePackingDensity 8 = π ^ 4 / 384', prob: 0.88, change24h: 0.9, volume: 176300, liquidity: 34000, bounty: 9000, submissions: 4, created: '2025-12-12', closes: '2026-12-12', status: 'open' },
  { id: 'kepler', title: 'Kepler conjecture (Lean port of Flyspeck)', field: 'Geometry', statement: 'spherePackingDensity 3 = π / (3 * √2)', prob: 0.29, change24h: -0.8, volume: 108800, liquidity: 22100, bounty: 20000, submissions: 2, created: '2026-01-20', closes: '2028-01-20', status: 'open' },
]

export const PROVERS = [
  { handle: 'lemma_llama', proofs: 31, earned: 182400 },
  { handle: 'tactic_goblin', proofs: 24, earned: 96100 },
  { handle: 'ω-agent-7', proofs: 22, earned: 88250 },
  { handle: 'simp_only', proofs: 17, earned: 51900 },
  { handle: 'norm_num_enjoyer', proofs: 12, earned: 30700 },
]

export type SubmissionStatus = 'verified' | 'failed' | 'checking'
export type Submission = { id: string; market: string; submitted: string; status: SubmissionStatus; lines: number; note: string; payout: number }

export const ME = { handle: 'you', joined: '2026-02-11' }

export const MY_SUBMISSIONS: Submission[] = [
  { id: 's7', market: 'brouwer', submitted: '2026-10-15 18:42', status: 'checking', lines: 412, note: 'lake build running (3/5 modules)', payout: 0 },
  { id: 's6', market: 'jordan-curve', submitted: '2026-10-12 09:10', status: 'failed', lines: 980, note: "error: unsolved goals at Jordan/Winding.lean:211", payout: 0 },
  { id: 's5', market: 'collatz-2-40', submitted: '2026-10-02 22:31', status: 'failed', lines: 64, note: "declaration uses 'sorry'", payout: 0 },
  { id: 's4', market: 'sensitivity', submitted: '2024-11-30 14:05', status: 'verified', lines: 1310, note: 'axioms: propext, Classical.choice, Quot.sound', payout: 2000 },
  { id: 's3', market: 'bb5', submitted: '2024-09-17 11:48', status: 'verified', lines: 5822, note: 'axioms: propext, Quot.sound', payout: 3500 },
  { id: 's2', market: 'abel-ruffini', submitted: '2025-10-30 16:20', status: 'failed', lines: 220, note: 'timeout after 600s (maxHeartbeats)', payout: 0 },
  { id: 's1', market: 'ch-independent', submitted: '2025-03-29 08:02', status: 'verified', lines: 2740, note: 'axioms: propext, Classical.choice, Quot.sound', payout: 6900 },
]

export type Position = { market: string; side: 'Yes' | 'No'; shares: number; avg: number }

export const MY_POSITIONS: Position[] = [
  { market: 'carleson', side: 'Yes', shares: 1200, avg: 0.51 },
  { market: 'kakeya-3', side: 'Yes', shares: 800, avg: 0.33 },
  { market: 'riemann', side: 'No', shares: 5000, avg: 0.985 },
  { market: 'hadwiger-nelson-5', side: 'No', shares: 600, avg: 0.38 },
  { market: 'sphere-8', side: 'Yes', shares: 450, avg: 0.8 },
]
