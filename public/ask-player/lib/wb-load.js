// Loads every whiteboard library file after recipes.js. A category = lib/wb/<name>.js (code) + lib/wb/<name>.txt
// (one catalogue line per recipe: "signature | example | what it draws"). Add new categories to this list.
window.WB_CATS = ["physics", "chemistry", "cells", "body", "earth", "math", "tech", "world", "diagrams", "computing", "health", "history", "daily", "engineering", "economy", "calculus"];
window.WB_EXTRA = ["biology", "anatomy", "life", "phys", "physuni", "physadv", "biouni", "chemuni", "physgr", "chemgr", "biogr", "carfix", "homefix", "objects", "schoolmath"];   // subject-only categories: loaded here, listed only in their subject's prompt (build-prompts.mjs)
// App copy: no ?cat= (it was written into document.write unescaped: an XSS). Only the listed categories load.
const _extra = null;
// Subject-only categories per chat subject (each subject's WB_EXTRA cats in build-prompts.mjs SUBJECTS; a test keeps them
// in step). The page is given ?subject=; an unknown or missing subject (old videos, Explore, shares) loads all of WB_EXTRA.
window.WB_SUBJECT = { biology: ["biology", "anatomy", "life", "biouni", "biogr", "objects"], physics: ["anatomy", "phys", "physuni", "physadv", "physgr", "objects"], chemistry: ["anatomy", "chemuni", "chemgr", "objects"], car: ["anatomy", "carfix", "objects"], home: ["anatomy", "homefix", "objects"], maths: ["schoolmath"] };
const _s = new URLSearchParams(location.search).get('subject');
const _sub = Object.hasOwn(window.WB_SUBJECT, _s ?? '') ? window.WB_SUBJECT[_s] : window.WB_EXTRA;   // only listed names reach document.write
for (const c of [...window.WB_CATS, ..._sub, ...(_extra && !window.WB_CATS.includes(_extra) ? [_extra] : [])]) document.write(`<script src="${document.currentScript.src.replace(/wb-load\.js.*$/, '')}wb/${c}.js"><\/script>`);
