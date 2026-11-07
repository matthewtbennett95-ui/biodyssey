/* Boot camp: each level teaches one game skill and one AP Biology idea.
   map: 7 rows x 5 columns. '.' = you can place a cell here, '#' = you can't.
   fixed: cells already on the board [type, column, row]. waves: [seconds, lane, type].
   par: the cheapest cost that wins with no bacteria getting through (found by trying every layout:
   see docs/DESIGN.md). */
(function (root) {
  'use strict';
  const LEVELS = [
    {
      id: 'contact', title: 'First contact', topic: 'Phagocytosis',
      brief: 'Bacteria are coming down the middle lane. Place a macrophage to stop them.',
      learn: 'Macrophages engulf bacteria next to them. This is phagocytosis, part of your innate immune system.',
      map: ['#####', '#...#', '#...#', '#...#', '#...#', '#...#', '#####'],
      palette: { macrophage: 1 }, budget: 50, par: 50, tissue: 3,
      waves: [[1, 2], [4, 2], [7, 2]],
      tutorial: [
        { say: 'Bacteria will enter at the top of the middle lane and head for your tissue at the bottom.', highlight: 'lane:2' },
        { say: 'Tap Macrophage to pick it up.', highlight: 'tray:macrophage', waitFor: 'pick:macrophage' },
        { say: 'Now tap the glowing square to place it in the bacteria\'s path.', highlight: 'tile:2,4', waitFor: 'place' },
        { say: 'Press Run to watch what happens.', highlight: 'run', waitFor: 'run' }
      ],
      q: { q: 'What did the macrophage do to the bacteria?', opts: ['Engulfed and digested them (phagocytosis)', 'Made antibodies against them', 'Sent a hormone through the blood'],
        why: 'Macrophages are phagocytes: they surround a bacterium with their membrane, pull it inside and digest it.' }
    },
    {
      id: 'backup', title: 'Call for backup', topic: 'Paracrine signaling',
      brief: 'Two lanes this time. The capillaries can release neutrophils, but only when they receive chemokine.',
      learn: 'Macrophages release chemokine, a paracrine signal: it only reaches cells within 2 squares. Capillaries that receive it let neutrophils out of the blood.',
      map: ['#####', '#...#', '#...#', '#...#', '#...#', '#.#.#', '#####'],
      fixed: [['capillary', 1, 5], ['capillary', 3, 5]],
      palette: { macrophage: 1 }, budget: 50, par: 50, tissue: 3,
      waves: [[1, 1], [2, 3], [3.5, 1], [4.5, 3], [6, 1], [7, 3], [8.5, 1], [9.5, 3]],
      tutorial: [
        { say: 'Tap a capillary. It needs chemokine before it can release neutrophils.', highlight: 'tile:1,5', waitFor: 'select' },
        { say: 'Place your macrophage within 2 squares of BOTH capillaries. Watch the signal lines appear.', highlight: 'tray:macrophage', waitFor: 'place' },
        { say: 'Both capillaries are lit up, so both will work. Press Run.', highlight: 'run', waitFor: 'run' }
      ],
      q: { q: 'Why does chemokine only switch on capillaries near the macrophage?', opts: ['It is a paracrine signal that only travels a short distance', 'It travels in the blood to the whole body', 'It only works between cells that touch'],
        why: 'Paracrine signals diffuse a short distance from the cell that releases them, so only nearby cells receive them.' }
    },
    {
      id: 'reach', title: 'Out of reach', topic: 'Paracrine range',
      brief: 'The capillaries are far apart. Find the one spot where a single macrophage reaches both.',
      learn: 'A paracrine signal fades with distance. Placement decides which cells receive it.',
      map: ['#####', '.....', '.....', '.....', '.....', '.....', '#####'],
      fixed: [['capillary', 0, 2], ['capillary', 4, 5]],
      palette: { macrophage: 2 }, budget: 100, par: 50, tissue: 3,
      waves: [[1, 0], [2, 4], [4, 0], [5, 4], [7, 0], [8, 4], [10, 0], [11, 4]],
      q: { q: 'One macrophage switched on two capillaries. What had to be true about where you placed it?', opts: ['It was within the signal\'s short range of both', 'It touched both capillaries', 'It could be anywhere on the board'],
        why: 'Paracrine signals reach nearby cells only. The macrophage had to be close enough to both capillaries for chemokine to reach their receptors.' }
    },
    {
      id: 'touch', title: 'Touch to talk', topic: 'Juxtacrine signaling',
      brief: 'Too many bacteria for one macrophage. A B cell can tag them, but it needs a chain of contact signals. Tip: put the B cell behind the macrophage, in its lane.',
      learn: 'A dendritic cell shows antigen to a helper T cell it touches. The helper T cell switches on a B cell it touches. That is juxtacrine (contact) signaling.',
      map: ['#####', '#####', '#####', '#####', '.....', '..#..', '.....'],
      fixed: [['macrophage', 2, 5]],
      palette: { dendritic: 1, helperT: 1, bcell: 1 }, budget: 110, par: 110, tissue: 3,
      waves: [[1, 2], [2.2, 2], [3.4, 2], [4.6, 2], [5.8, 2], [7, 2], [8.2, 2], [9.4, 2]],
      q: { q: 'Your B cell only made antibodies while it touched an active helper T cell. What kind of signaling is that?', opts: ['Juxtacrine (direct contact)', 'Paracrine (short distance)', 'Endocrine (through the blood)'],
        why: 'Juxtacrine signals need contact: a protein on the helper T cell binds a receptor on the B cell.' }
    },
    {
      id: 'capsule', title: 'Slippery capsules', topic: 'Antibodies and opsonization',
      brief: 'These bacteria have capsules that macrophages can barely grab. Tag them with a B cell in each lane. One helper T cell can touch both.',
      learn: 'Antibodies coat bacteria (opsonization), giving phagocytes something to hold on to.',
      map: ['#####', '#####', '#####', '#...#', '#...#', '#...#', '#...#'],
      fixed: [['macrophage', 1, 2], ['macrophage', 3, 2]],
      palette: { dendritic: 1, helperT: 1, bcell: 2 }, budget: 150, par: 150, tissue: 3,
      waves: [[1, 1, 'capsule'], [1.5, 3, 'capsule'], [4, 1, 'capsule'], [4.5, 3, 'capsule'], [7, 1, 'capsule'], [7.5, 3, 'capsule']],
      q: { q: 'Why did antibodies help macrophages destroy the encapsulated bacteria?', opts: ['Antibodies coat the bacteria so phagocytes can grab them', 'Antibodies are poisonous to all bacteria', 'Antibodies give macrophages more ATP'],
        why: 'A capsule is slippery. Antibodies bound to it give the phagocyte\'s receptors something to grip, so engulfing is much faster. This is opsonization.' }
    },
    {
      id: 'blood', title: 'Through the blood', topic: 'Endocrine signaling',
      brief: 'Three lanes, three capillaries, and not enough neutrophils. One signal can reach them all.',
      learn: 'Endocrine signals (hormones) travel in the blood and reach every cell with the right receptor, near or far.',
      map: ['#####', '#####', '#####', '.....', '#...#', '#...#', '.....'],
      fixed: [['capillary', 0, 5], ['capillary', 2, 2], ['capillary', 4, 5], ['macrophage', 1, 4], ['macrophage', 3, 4]],
      palette: { adrenal: 1, macrophage: 1 }, budget: 60, par: 60, tissue: 3,
      waves: [[1.0, 0], [1.4, 2], [1.8, 4], [2.2, 0], [2.6, 2], [3.0, 4], [3.4, 0], [3.8, 2], [4.2, 4], [4.6, 0], [5.0, 2], [5.4, 4], [5.8, 0], [6.2, 2], [6.6, 4], [7.0, 0], [7.4, 2], [7.8, 4], [8.2, 0], [8.6, 2], [9.0, 4], [9.4, 0], [9.8, 2], [10.2, 4]],
      q: { q: 'Epinephrine from the adrenal gland reached capillaries on both sides of the board. How?', opts: ['It is a hormone carried by the blood (endocrine)', 'It passed from cell to cell by touch', 'It diffused a short distance'],
        why: 'Endocrine signals travel through the bloodstream, so distance doesn\'t matter. Any cell with the receptor responds.' }
    },
    {
      id: 'quorum', title: 'Quorum', topic: 'Quorum sensing',
      brief: 'These bacteria count each other. If 4 are on the board at once, they all switch on their toxins.',
      learn: 'Bacteria release a signal molecule (autoinducer). When enough of them are close together, the signal is strong enough to switch on toxin genes. This is quorum sensing.',
      map: ['#####', '.....', '.....', '.....', '#####', '#####', '#####'],
      fixed: [['macrophage', 1, 5], ['macrophage', 3, 5]],
      palette: { macrophage: 2, capillary: 2 }, budget: 180, tissue: 3, quorum: 4, star3: 'noQuorum',
      waves: [[1.0, 1, 'swarmer'], [1.3, 2, 'swarmer'], [1.6, 3, 'swarmer'], [2.6, 1, 'swarmer'], [2.9, 2, 'swarmer'], [3.2, 3, 'swarmer'], [4.2, 1, 'swarmer'], [4.5, 2, 'swarmer'], [4.8, 3, 'swarmer'], [5.8, 1, 'swarmer'], [6.1, 2, 'swarmer'], [6.4, 3, 'swarmer']],
      q: { q: 'Why did it matter how many bacteria were on the board at once?', opts: ['Their signal only switches on toxins when enough of them are together', 'Bigger groups move slower', 'Each bacterium needs a partner to divide'],
        why: 'Quorum sensing: each bacterium releases autoinducer. Only when many are together is there enough signal to switch on their toxin genes.' }
    },
    {
      id: 'storm', title: 'Cytokine storm', topic: 'Positive and negative feedback',
      brief: 'A huge infection. Fighting causes inflammation, and too much becomes a storm that hurts your own cells.',
      learn: 'Inflammation feeds on itself: positive feedback. IL-10 from regulatory T cells calms it: negative feedback.',
      map: ['#####', '#####', '#####', '.....', '.....', '.....', '.....'],
      fixed: [['macrophage', 0, 5], ['macrophage', 2, 5], ['macrophage', 4, 5]],
      palette: { treg: 2, wall: 2 }, budget: 100, tissue: 3, storm: true, star3: 'noStorm',
      waves: [[1, 0], [1, 2], [1, 4], [2.5, 0], [2.5, 2], [2.5, 4], [4, 0], [4, 2], [4, 4], [5.5, 0], [5.5, 2], [5.5, 4], [7, 0], [7, 2], [7, 4]],
      q: { q: 'Inflammation rose faster the higher it got, until IL-10 brought it down. Which feedback is which?', opts: ['Rising faster is positive feedback; IL-10 is negative feedback', 'Both are positive feedback', 'Rising faster is negative feedback; IL-10 is positive feedback'],
        why: 'Positive feedback amplifies a change (inflammation causing more inflammation). Negative feedback reverses it (IL-10 calming the response), which keeps the body stable.' }
    }
  ];

  /* ---------------- Cases: the real game. Case files instead of tips; predict before you run. ---------------- */
  const CASES = [
    {
      id: 'whoop', kind: 'case', title: 'The cough that won\'t stop', topic: 'Signal transduction can be blocked (4.4)',
      file: { story: 'A 15-year-old has had a violent, whooping cough for two weeks. Neutrophils aren\'t arriving where the bacteria are, even though chemokine levels are high.',
        findings: ['Bacteria release a toxin that disables Gi, a G protein', 'Chemokine receptors relay their signal through Gi', 'The toxin reaches cells within about 1 square of a bacterium'] },
      learn: 'Pertussis toxin disables Gi. The receptor still binds chemokine, but transduction fails, so there is no response. Contact signals that use kinase cascades are unaffected.',
      map: ['#####', '.....', '.....', '.....', '.....', '.....', '.....'],
      palette: { macrophage: 2, capillary: 2, dendritic: 1, helperT: 1, bcell: 2 }, budget: 200, tissue: 3, star3: 'noToxin',
      waves: [[1, 1, 'pertussis'], [2, 3, 'pertussis'], [2.5, 2], [3, 1], [4, 3], [5, 1], [5.5, 2], [6, 3], [7, 1, 'pertussis'], [8, 3, 'pertussis'], [8.5, 2], [9, 1], [10, 3]],
      q: { q: 'Pertussis toxin disables the Gi protein. Why did capillaries near the bacteria stop releasing neutrophils even though chemokine was present?', opts: ['The signal could not be relayed inside the cell (transduction failed)', 'The toxin destroyed all the chemokine', 'The capillaries ran out of neutrophils'],
        why: 'Reception still happened: chemokine bound its receptor. But the relay step (the G protein) was broken, so no response followed. A pathway is only as strong as its weakest component.' }
    },
    {
      id: 'cholera', kind: 'case', title: 'Stuck on', topic: 'A pathway locked on (4.4) and feedback (4.5)',
      file: { story: 'A patient\'s infection is spreading fast, and their inflammation is climbing faster than anyone expected. Some capillaries are releasing neutrophils nonstop.',
        findings: ['Some bacteria release a toxin that locks Gs, a G protein, in the "on" state', 'Capillaries have an epinephrine receptor that uses Gs', 'Too much inflammation turns into a cytokine storm'] },
      learn: 'Cholera toxin locks Gs on, so the cell keeps responding even with no signal. A response that can\'t switch off is as dangerous as one that can\'t switch on.',
      map: ['#####', '#####', '.....', '.....', '.....', '.....', '.....'],
      palette: { macrophage: 2, capillary: 3, treg: 2, wall: 2 }, budget: 240, tissue: 3, storm: true, star3: 'noStorm',
      waves: [[1, 0], [1.5, 2, 'cholera'], [2, 4], [3, 0], [3.5, 2], [4, 4, 'cholera'], [5, 0], [5.5, 2, 'cholera'], [6, 4], [7, 0], [7.5, 2], [8, 4], [9, 0], [9.5, 2], [10, 4]],
      q: { q: 'Cholera toxin locked Gs "on" in some capillaries. What happened to their response?', opts: ['It never switched off, even without a signal', 'It stopped completely', 'It only switched on with extra epinephrine'],
        why: 'With Gs stuck on, the relay keeps making second messenger (cAMP), so the response continues with no signal. In the gut this causes the massive fluid loss of cholera.' }
    },
    {
      id: 'pneumonia', kind: 'case', title: 'Slippery and crowded', topic: 'Opsonization and quorum sensing',
      file: { story: 'An older patient has pneumonia. Phagocytes are struggling to grab the bacteria, and the infection gets worse suddenly once the bacteria build up.',
        findings: ['Capsule stain: positive', 'The bacteria release autoinducer; toxins switch on at 6 or more', 'Lanes 2, 3 and 4 are infected'] },
      learn: 'Antibodies opsonize capsules so phagocytes can grab them. Quorum sensing means speed matters: destroy bacteria before enough gather to switch on their toxins.',
      map: ['#####', '.....', '.....', '.....', '.....', '.....', '.....'],
      palette: { macrophage: 2, capillary: 2, dendritic: 1, helperT: 1, bcell: 3 }, budget: 340, tissue: 3, quorum: 6, star3: 'noQuorum',
      waves: [[1, 2, 'capsule'], [1.5, 1], [2, 3, 'capsule'], [3, 1, 'capsule'], [3.5, 2], [4, 3], [5, 2, 'capsule'], [5.5, 1], [6, 3, 'capsule'], [7, 1, 'capsule'], [7.5, 2], [8, 3]],
      q: { q: 'Why did it help to destroy bacteria quickly in this case?', opts: ['Fewer bacteria at once meant their signal never reached the quorum that switches on toxins', 'Fast killing makes antibodies stronger', 'Bacteria divide only when they are attacked'],
        why: 'Quorum sensing depends on signal concentration: below the threshold, the toxin genes stay off.' }
    },
    {
      id: 'fronts', kind: 'case', title: 'Two fronts', topic: 'Prioritizing with limited resources',
      file: { story: 'A deep cut is infected along its whole length. You can\'t cover every lane with what you have.',
        findings: ['Fast bacteria in the outer lanes', 'Slower bacteria, in larger numbers, in the middle lanes', 'Your tissue can survive a little damage'] },
      learn: 'Real immune responses are limited by resources. Signals let one cell recruit many others, which is how a small response gets amplified.',
      map: ['#####', '.....', '.....', '.....', '.....', '.....', '.....'],
      palette: { macrophage: 3, capillary: 3, wall: 3 }, budget: 240, tissue: 3, par: 220,
      waves: [[1, 0, 'swarmer'], [1.3, 4, 'swarmer'], [2, 1], [2.4, 2], [2.8, 3], [3.5, 0, 'swarmer'], [3.8, 4, 'swarmer'], [4.5, 1], [4.9, 2], [5.3, 3], [6, 0, 'swarmer'], [6.3, 4, 'swarmer'], [7, 1], [7.4, 2], [7.8, 3], [8.5, 2]],
      q: { q: 'One macrophage switched on several capillaries, and each released many neutrophils. What is this an example of?', opts: ['Amplification of a signal', 'Negative feedback', 'Juxtacrine signaling'],
        why: 'One signaling cell triggers responses in many cells, and each response multiplies. Signal pathways amplify a small signal into a large response.' }
    },
    {
      id: 'sepsis', kind: 'case', title: 'Sepsis', topic: 'When the response is the danger',
      file: { story: 'A patient\'s infection has reached the bloodstream. Their own immune response is starting to damage their organs.',
        findings: ['Inflammation becomes a storm sooner than usual (at 70)', 'Many bacteria, including fast ones', 'Epinephrine is available to boost capillaries'] },
      learn: 'In sepsis the body\'s response is dysregulated: inflammation feeds on itself (positive feedback). IL-10 and other calming signals are negative feedback.',
      map: ['#####', '#####', '.....', '.....', '.....', '.....', '.....'],
      palette: { macrophage: 3, capillary: 2, treg: 2, adrenal: 1 }, budget: 270, tissue: 3, storm: true, stormAt: 70, star3: 'noStorm',
      waves: [[1, 0], [1.2, 2], [1.4, 4], [2.5, 1, 'swarmer'], [2.8, 3, 'swarmer'], [3.5, 0], [3.7, 2], [3.9, 4], [5, 1, 'swarmer'], [5.3, 3, 'swarmer'], [6, 0], [6.2, 2], [6.4, 4], [7.5, 1], [7.8, 3], [8.5, 2]],
      q: { q: 'In this case, why could killing bacteria faster make things worse?', opts: ['More fighting raised inflammation, which fed on itself into a storm', 'Fast killing uses up all the ATP', 'Dead bacteria turn into toxins'],
        why: 'Inflammation is a positive feedback loop. Past a threshold it damages the body\'s own cells, which is what happens in sepsis. Negative feedback (IL-10) keeps it in check.' }
    },
    {
      id: 'unknown', kind: 'case', title: 'The unknown patient', topic: 'Putting it all together',
      file: { story: 'A patient arrives with no history. You have three lab results. Read them carefully.',
        findings: ['Capsule stain: positive in some bacteria', 'Toxin assay: a toxin that disables Gi', 'Bacteria release autoinducer; toxins switch on at 6 or more'] },
      learn: 'Diagnosis is reasoning from evidence: each finding tells you which signals will fail and which defenses will work.',
      map: ['#####', '.....', '.....', '.....', '.....', '.....', '.....'],
      palette: { macrophage: 3, capillary: 2, dendritic: 1, helperT: 1, bcell: 2, wall: 2 }, budget: 340, tissue: 3, quorum: 6, par: 300,
      waves: [[1.3, 1, 'pertussis'], [2, 3, 'capsule'], [2.6, 2], [3.9, 1], [4.5, 3, 'capsule'], [5.2, 2, 'pertussis'], [6.5, 1, 'capsule'], [7.2, 3], [7.8, 2], [9.1, 1, 'pertussis'], [9.8, 3, 'capsule'], [10.4, 2]],
      q: { q: 'Which finding told you NOT to rely only on chemokine and capillaries near the bacteria?', opts: ['The toxin that disables Gi', 'The positive capsule stain', 'The autoinducer result'],
        why: 'Chemokine receptors relay through Gi. A Gi-disabling toxin breaks that pathway, so defenses that use other pathways (or that stop the bacteria early) are needed.' }
    }
  ];
  const ALL = LEVELS.concat(CASES);
  if (typeof module !== 'undefined' && module.exports) module.exports = ALL; else root.SiegeLevels = ALL;
})(typeof window !== 'undefined' ? window : globalThis);
