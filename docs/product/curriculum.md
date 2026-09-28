# Curriculum, KG to Grade 8

What a child can learn in Radlic, grade by grade. **KG, Grade 1 and Grade 2** are story chapters, one skill each.
**Grades 3 to 8** are modules of short lessons, one skill per lesson (a "topic"), each followed by adaptive practice.
How either kind is built: [building-lessons.md](building-lessons.md). What is still to write or fix:
[content-backlog.md](content-backlog.md).

> ⚠️ **A test reads this file.** `src/__tests__/lessonsAllModules.test.ts` takes the Grade 3–8 topic titles from here as
> its independent statement of what each module must teach, and fails when a module's lessons differ from them, in
> order. So:
>
> - The bold module lines and the numbered topic lines under them are the approved intent. Change one only as a
>   decision (a topic added, renamed or moved), and change the lesson data in the same pull request.
> - Never regenerate them from the code. The test would then compare the code with itself and pass on any mistake.
> - Keep the shape: a `## Grade N` heading, then each module as its own paragraph (the bold `Module N · Title` line,
>   then `1 Topic · 2 Topic · …`), then a blank line. A note about a module goes in a separate paragraph.
> - Do not start any other heading with `## Grade` followed by a digit, and do not start any other paragraph with a
>   bold `Module` line: the parser would read them.
> - The test's first case is a positive control: 36 modules, Grade 3 Module 2 starting with "Read the clock to 5
>   minutes", Grade 8 Module 6 ending with "Relative frequency".

## Where the content comes from

- **Module titles** follow the school curriculum documents the founder supplied (one for Grades 1–5, one for Grades
  6–12). For Grades 6–8 a "module" is one of that document's topic bands, in its order.
- **Grade 3's topic split** (all six modules) was approved by the founder on 2026-09-13. Grade 3 Module 1's lesson
  scripts were approved word for word the same day.
- **Grade 3 Modules 2–6 and Grades 4–8** were written on 2026-09-14 and built **without founder review** of the scripts
  (the founder's call: "no review, build all"). Grades 4–8's topic split was not reviewed either. See
  [content-backlog.md](content-backlog.md).
- **Grade 8** is the regular track (the founder's call). Algebra I (the accelerated track) is not built.
- The approved wording of Grade 3 Module 1 is held word for word by `src/__tests__/lessonsGrade3Module1.test.ts`.

## Ids

| what | id | example |
|---|---|---|
| a Grade 3–8 module | `g<grade>m<module>` | `g5m2` |
| a Grade 3–8 topic (lesson) | `g<grade>m<module>-t<topic>` | `g5m2-t3` |
| a KG–2 module (grade 0 = KG) | `k<grade>m<n>` | `k1m4` |
| a KG–2 module's one "topic", the chapter itself | `c:<chapter id>` | `c:placeValue` |

Progress and points are recorded under the topic id or the `c:` id (see [points.md](points.md)).

Module titles as the app shows them live in `TITLES` in `src/features/lessons/modules.ts`; no test compares them with
this file, so the two can differ in wording (the app calls Grade 3 Module 1 "Multiplication and Division with 2, 3, 4,
5 and 10").

## KG, Grade 1 and Grade 2 (story chapters)

Each chapter is one module with one topic. The grade and the order come from `CHAPTERS` in `src/core/chapters.ts`
(the `grade` field; array order is play order), and `src/__tests__/storyModules.test.ts` holds the list by hand, so
moving a chapter is a decision that takes an edit there too. The title is the one the child sees. The skill line is
read from each chapter's own component (`src/features/chapters/story/`, and `game/CountingStoryChapter.tsx`).

### KG

| module | chapter (title) | chapter id | the skill |
|---|---|---|---|
| `k0m1` | Counting | `counting` | count a set by touching each one |
| `k0m2` | Number Order | `numberOrdering` | put numbers in order, smallest first |
| `k0m3` | Nest Tree | `numberRecognition` | hear a number, find its numeral (the number is spoken, never written in the question) |
| `k0m4` | Home Time | `matchingQuantities` | count out exactly the number asked for, and stop |
| `k0m5` | Bigger or Smaller | `numberComparison` | which group has more, or fewer (or the most of three) |
| `k0m6` | Shape House | `shapes` | know a shape by fitting it into its outline |
| `k0m7` | Rainbow Town | `colors` | name colours, in a colouring picture |
| `k0m8` | Bead Shop | `patterns` | continue a repeating pattern (AB, then ABC, then ABCD) |
| `k0m9` | Measuring | `measurement` | measure height or length by laying blocks end to end |

### Grade 1

| module | chapter (title) | chapter id | the skill |
|---|---|---|---|
| `k1m1` | Play Time | `addition` | add: more join the group, how many now |
| `k1m2` | Time to Go | `subtraction` | take away: some leave, how many are left |
| `k1m3` | Numbers to 100 | `numbersTo100` | read a two-digit number |
| `k1m4` | Tens & Ones | `placeValue` | build a number from tens and ones (targets 11–99; nothing past 100 can be built) |
| `k1m5` | Story Problems | `storyProblems` | hear a short story, then add, take away or compare |
| `k1m6` | Time | `time` | read and set a clock: o'clock, half and quarter hours, then five minutes |
| `k1m7` | Compare Numbers | `compareNumbers` | compare two numbers with >, < or = |

### Grade 2

| module | chapter (title) | chapter id | the skill |
|---|---|---|---|
| `k2m1` | Skip Counting | `skipCounting` | count equal groups the fast way, by 2s, 5s and 10s |
| `k2m2` | Multiplication | `multiplication` | multiplication as equal groups and arrays |
| `k2m3` | Fractions | `fractions` | cut a whole into equal parts: halves, thirds, quarters |
| `k2m4` | Money | `money` | pay a price with coins |
| `k2m5` | Add to 100 | `additionTo100` | add two-digit numbers, trading ten ones for a ten |
| `k2m6` | Subtract to 100 | `subtractionTo100` | subtract two-digit numbers, breaking a ten |
| `k2m7` | Shapes 2D & 3D | `shapes2d3d` | name flat and solid shapes, count sides |

Grade 2 has no place value to 1,000 yet: see [content-backlog.md](content-backlog.md).

## Grades 3 to 8 (lesson modules)

Content lives in `src/features/lessons/content/g<grade>m<module>.ts`, except Grade 3 Module 1, which is
`src/features/lessons/grade3Module1.ts`. Under each Grade 3 module, the "one idea" line is the founder-approved idea of
each topic (2026-09-13), in topic order.

## Grade 3

**Module 1 · Multiplication and division with 2, 3, 4, 5, 10** — built (`grade3Module1.ts`)
1 Plates of cookies · 2 Rows of chairs · 3 Turn the tray · 4 Counting by 2s, 5s, 10s · 5 Counting by 3s and 4s ·
6 Share the apples fairly · 7 How many bags can we fill? · 8 The missing number

One idea: equal groups · arrays · 3 × 4 = 4 × 3 · counting by 2s, 5s, 10s · counting by 3s and 4s · how many in each ·
how many groups · the missing number (4 × ? = 20). Module 1 uses only the units 2, 3, 4, 5 and 10.

**Module 2 · Place value through metric measurement**
1 Read the clock to 5 minutes · 2 Read the clock to 1 minute · 3 How long did it take? · 4 Heavy or light (grams, kilograms) ·
5 How much water? (liters, milliliters) · 6 Round to the nearest 10 · 7 Round to the nearest 100 ·
8 Add big numbers (trade 10 ones for a ten) · 9 Take away big numbers (break a ten)

One idea: each number on the clock is 5 minutes · count the little marks after the 5s · elapsed time by jumping on a
line · measuring how heavy · measuring how much a container holds · which ten is it closer to? · which hundred is it
closer to? · regrouping when adding · regrouping when subtracting.

**Module 3 · Multiplication and division with 0, 1, 6, 7, 8, 9**
1 Empty plates (×0) · 2 One on each plate (×1) · 3 6s: five groups and one more · 4 7s · 5 8s: double the 4s ·
6 9s: ten groups minus one · 7 Break the big fact apart · 8 Multiply by tens (3 × 40) · 9 Two-step stories

One idea: zero groups or groups of zero make 0 · times 1 keeps the number the same · 6 × 4 = 5 × 4 + 4 · build 7s
from facts you know · 8 × 3 = double 4 × 3 · 9 × 6 = 10 × 6 − 6 · 7 × 8 = 5 × 8 + 2 × 8 · 3 groups of 4 tens = 12 tens
· solve the first part, then the second.

**Module 4 · Multiplication and area**
1 Cover the floor with tiles · 2 Count the rows instead · 3 Break the rug into two pieces · 4 An L-shaped room

One idea: area = how many squares cover it · area = rows × tiles in a row · split a rectangle, add the parts · area of
shapes made of rectangles.

**Module 5 · Fractions as numbers**
1 Cut the sandwich fairly · 2 One piece: 1/4 · 3 Three pieces: 3/4 · 4 Fractions on a number line ·
5 Same amount, different pieces · 6 A whole pizza: 4/4 = 1 · 7 Which is bigger? Same pieces cut ·
8 Which is bigger? Same pieces taken

One idea: equal parts only · bottom number = how many pieces make the whole · top number = how many pieces you have ·
equal jumps from 0 to 1 · 1/2 = 2/4 · whole numbers as fractions · 3/8 vs 5/8 · 1/3 vs 1/6 (more pieces, smaller
pieces).

**Module 6 · Shapes, measuring and graphs**
1 Picture graph, each picture = 2 · 2 Bar graph · 3 Measure to the half inch · 4 Line plot of our measurements ·
5 Four-sided shapes · 6 Walk around the fence · 7 Same fence, different garden

One idea: reading a scaled picture graph · reading bars against a scale · a ruler has halves and quarters · showing
measurements on a line · squares, rectangles, rhombuses and what makes them different · perimeter = the distance
around · same perimeter, different area.

---

## Grade 4

**Module 1 · Place value for addition and subtraction**
1 Read big numbers (to a million) · 2 Each place is 10 times the next · 3 Compare big numbers · 4 Round big numbers ·
5 Add big numbers · 6 Subtract big numbers (across zeros) · 7 Is my answer about right? · 8 Two-step add and subtract stories

**Module 2 · Place value for multiplication and division**
1 Times as many · 2 Factor pairs · 3 Prime or composite? · 4 Multiples · 5 Multiply by 10, 100, 1,000 ·
6 Multiply tens by ones (4 × 30) · 7 Divide tens (80 ÷ 4) · 8 Division with a remainder

**Module 3 · Multiplication and division of multi-digit numbers**
1 Break a number apart to multiply (16 × 3) · 2 Multiply a big number by one digit · 3 The standard way to multiply ·
4 Two-digit times two-digit · 5 Break a number apart to divide · 6 Divide a big number by one digit ·
7 What to do with the remainder · 8 Multi-step stories

**Module 4 · Foundations for fraction operations**
1 Same amount, smaller pieces · 2 Compare with one half · 3 Compare by making pieces match · 4 Break a fraction apart ·
5 Add fractions with the same bottom number · 6 Take away fractions with the same bottom number ·
7 Mixed numbers and fractions · 8 Add mixed numbers · 9 A whole number times a fraction

**Module 5 · Angle measurements and plane figures**
1 Points, lines and rays · 2 Right, acute or obtuse? · 3 Measure an angle in degrees · 4 Angles add up ·
5 Parallel and perpendicular lines · 6 Sort triangles · 7 Sort four-sided shapes · 8 Lines of symmetry

**Module 6 · Place value for decimal fractions**
1 Tenths as decimals · 2 Hundredths as decimals · 3 0.5 is the same as 0.50 · 4 Decimals on a number line ·
5 Compare decimals · 6 Add tenths and hundredths · 7 Money as decimals

---

## Grade 5

**Module 1 · Place value concepts for multiplication and division with whole numbers**
1 Relate place value neighbors · 2 Multiply and divide by 10, 100, 1,000 · 3 Exponents and powers of 10 ·
4 Estimate products and quotients · 5 Convert metric units · 6 Metric word problems · 7 Multiply with methods you know ·
8 Multiply by breaking a number apart · 9 Standard way: 2 or 3 digits × 2 digits · 10 Standard way: 3 or 4 digits × 3 digits ·
11 Multiply two big numbers · 12 Divide by multiples of 10 · 13 2-digit ÷ 2-digit, one-digit answer ·
14 3-digit ÷ 2-digit, one-digit answer · 15 3-digit ÷ 2-digit, two-digit answer · 16 4-digit ÷ 2-digit ·
17 Write, read and compare expressions · 18 Make a story for an expression · 19 Multi-step stories with × and ÷ ·
20 Multi-step stories with all four operations

Module 1 was re-split on 2026-09-15 into the 20 lessons of a textbook contents page the founder photographed: the
lesson and part names only; every screen, story and number is ours. Its four parts are 1–6 place value for whole
numbers, 7–11 multiplying whole numbers, 12–16 dividing whole numbers, 17–20 multi-step problems. Built without script
review, like Grades 4–8. (The earlier 8-topic version is in git history.)

**Module 2 · Addition and subtraction with fractions**
1 Different-size pieces · 2 Make the pieces match · 3 Take away different-size pieces · 4 Add mixed numbers ·
5 Take away mixed numbers (break a whole) · 6 Is it more or less than 1? · 7 Fraction stories · 8 Line plot with fractions

**Module 3 · Multiplication and division with fractions**
1 A fraction is a division · 2 A fraction of a whole number · 3 A fraction of a fraction · 4 Area with fraction sides ·
5 Times less than 1 makes it smaller · 6 How many small pieces fit? · 7 Share a small piece · 8 Fraction times-and-share stories

**Module 4 · Place value for decimal operations**
1 Thousandths · 2 Compare decimals to thousandths · 3 Round decimals · 4 Add decimals (line up the point) ·
5 Take away decimals · 6 Multiply a decimal by a whole number · 7 Multiply and divide by 10, 100, 1,000 ·
8 Divide a decimal by a whole number · 9 Change metric units

**Module 5 · Addition and multiplication with area and volume**
1 Volume is counting cubes · 2 One layer times how many layers · 3 Length × width × height · 4 Two boxes joined together ·
5 Tiles with fraction sides · 6 Sort four-sided shapes into families · 7 Cubic units

**Module 6 · Foundations to geometry in the coordinate plane**
1 Points on a grid · 2 Plot a point · 3 Two number patterns · 4 Graph the pattern pairs · 5 Distance along a grid line ·
6 Maps on a grid

---

## Grade 6

**Module 1 · Ratios, rates and proportions**
1 What a ratio is · 2 Equivalent ratios · 3 Unit rate · 4 Use a unit rate · 5 Ratio tables · 6 Part-part-whole ratios ·
7 Change units with a rate · 8 Speed

**Module 2 · Operations with fractions and mixed numbers**
1 How many fractions fit in a fraction? · 2 Flip and multiply · 3 Multiply mixed numbers · 4 Divide mixed numbers ·
5 Fraction division stories · 6 Greatest common factor · 7 Least common multiple

**Module 3 · Operations with decimals**
1 Add and take away decimals · 2 Multiply decimals · 3 Divide a decimal by a whole number · 4 Divide by a decimal ·
5 Long division with big numbers · 6 Money stories

**Module 4 · Percentages**
1 Percent means out of 100 · 2 Fraction, decimal, percent · 3 Percent of a number · 4 Find the whole from a part ·
5 Discounts · 6 Sales tax · 7 Simple interest

**Module 5 · Algebraic expressions and one-step equations**
1 A letter stands for a number · 2 Write an expression from words · 3 Work out an expression · 4 Exponents ·
5 Order of operations · 6 Equivalent expressions · 7 Solve x + a = b · 8 Solve ax = b · 9 Inequalities on a number line

**Module 6 · Area, surface area, volume, shapes and angles**
1 Area of a parallelogram · 2 Area of a triangle · 3 Area of a shape made of pieces · 4 Nets and surface area ·
5 Volume with fraction edges · 6 Angles on a straight line

**Module 7 · Data analysis and probability**
1 Mean: share it out fairly · 2 Median: the middle · 3 Mode: the most common · 4 Range: the spread ·
5 Which middle fits best? · 6 Dot plots and histograms · 7 Probability as a fraction · 8 Likely or unlikely

---

## Grade 7

**Module 1 · Proportional relationships and percent applications**
1 Proportional or not? · 2 The constant of proportionality · 3 Proportional graphs · 4 Unit rates with fractions ·
5 Solve a proportion · 6 Percent increase and decrease · 7 Markup, tax and tip · 8 Percent error

**Module 2 · Operations with rational numbers**
1 Opposites · 2 Absolute value · 3 Add positive and negative numbers · 4 Subtract by adding the opposite ·
5 Multiply signed numbers · 6 Divide signed numbers · 7 Negative fractions and decimals · 8 Signed number stories

**Module 3 · Equivalent expressions, equations and inequalities**
1 Combine like terms · 2 Expand parentheses · 3 Factor out a common number · 4 Two-step equations ·
5 Equations with parentheses · 6 Two-step inequalities · 7 Flip the sign · 8 Equation stories

**Module 4 · Geometry**
1 Scale drawings · 2 Circumference · 3 Area of a circle · 4 Complementary and supplementary angles · 5 Vertical angles ·
6 Can these sides make a triangle? · 7 Surface area of prisms · 8 Volume of prisms

**Module 5 · Statistics and probability**
1 A fair sample · 2 Predict from a sample · 3 Compare two groups · 4 Probability of an event ·
5 Expected and actual results · 6 Two things happening

---

## Grade 8 (regular)

**Module 1 · Integer exponents, scientific notation and roots**
1 Multiply powers: add the exponents · 2 Divide powers: subtract the exponents · 3 A power of a power ·
4 Zero and negative exponents · 5 Scientific notation for big numbers · 6 Scientific notation for small numbers ·
7 Multiply in scientific notation · 8 Square roots and cube roots · 9 Estimate a square root

**Module 2 · Linear relationships, slope and systems**
1 Slope: rise over run · 2 Slope from two points · 3 y = mx + b · 4 Graph a line from its equation ·
5 Variables on both sides · 6 One, none or many solutions · 7 Where two lines cross · 8 Solve a system by substitution ·
9 System stories

**Module 3 · Functions**
1 One input, one output · 2 Evaluate a function · 3 Linear or not? · 4 Compare two functions · 5 Build a model from a story ·
6 Read a graph's story

**Module 4 · Congruence, similarity and the Pythagorean theorem**
1 Slides (translations) · 2 Flips (reflections) · 3 Turns (rotations) · 4 Stretches (dilations) · 5 Similar triangles ·
6 Angles in a triangle · 7 The Pythagorean theorem · 8 Find a missing leg · 9 Distance between two points

**Module 5 · Volume of cylinders, cones and spheres**
1 Volume of a cylinder · 2 Volume of a cone · 3 Volume of a sphere · 4 Volume stories

**Module 6 · Bivariate data and scatter plots**
1 Scatter plot patterns · 2 A line of best fit · 3 Predict with the line · 4 Two-way tables · 5 Relative frequency
