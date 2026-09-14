#!/usr/bin/env node
/**
 * Print a module's questions WITHOUT their answers or worked steps, for whoever writes the independent answer key
 * (src/__tests__/answerKeys/<module>.ts). The solver sees what a child sees: the question text and the picture data.
 *
 *   node scripts/lesson-questions.mjs g4m2
 *
 * Content files import only types, so Node's built-in type stripping loads them directly.
 */
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const id = process.argv[2]
if (!/^g\d+m\d+$/.test(id ?? '')) { console.error('usage: node scripts/lesson-questions.mjs g4m2'); process.exit(2) }

const mod = await import(pathToFileURL(resolve(`src/features/lessons/content/${id}.ts`)).href)
const lessons = mod[id.toUpperCase()]
if (!Array.isArray(lessons)) { console.error(`${id}.ts does not export ${id.toUpperCase()}`); process.exit(2) }

const strip = p => ({ text: p.text, picture: p.picture, ...(p.answer && typeof p.answer === 'object' && 'choices' in p.answer ? { choices: p.answer.choices } : {}),
  answerForm: p.answer === undefined ? '?' : typeof p.answer === 'number' ? 'number' : Object.keys(p.answer).includes('frac') ? 'fraction' : Object.keys(p.answer).includes('time') ? 'time h:mm' : 'pick one choice (write its exact text)' })

console.log(JSON.stringify(lessons.map(l => ({
  id: l.id, topic: l.title,
  questions: [['your turn', l.turn], ['twin', l.turn.twin], ...l.practice.map((x, i) => [`practice ${i + 1}`, x.problem])]
    .map(([where, p]) => ({ where, ...strip(p) })),
})), null, 1))
