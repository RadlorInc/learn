/** Independent solvers for g5m1's practice ladders — each written from sample questions alone (scripts/ladder-questions.mts), never the generators. */
import { SOLVE_A } from './g5m1_a'
import { SOLVE_BD } from './g5m1_bd'
import { SOLVE_C } from './g5m1_c'

export const SOLVE = { ...SOLVE_A, ...SOLVE_BD, ...SOLVE_C }
