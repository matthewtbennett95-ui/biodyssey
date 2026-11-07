/* The list of worlds on the odyssey, in the suggested order (small to large).
   Each entry is the "registry" part of the world contract: see docs/WORLD-CONTRACT.md. */
/* The odyssey follows the AP Biology course framework, unit by unit. Worlds also list Georgia (GSE) Biology
   standards, so they work for regular Biology too. */
window.BIODYSSEY_UNITS = [
  { n: 1, name: 'Chemistry of Life' },
  { n: 2, name: 'Cell Structure and Function' },
  { n: 3, name: 'Cellular Energetics' },
  { n: 4, name: 'Cell Communication and Cell Cycle' },
  { n: 5, name: 'Heredity' },
  { n: 6, name: 'Gene Expression and Regulation' },
  { n: 7, name: 'Natural Selection' },
  { n: 8, name: 'Ecology' }
];

window.BIODYSSEY_WORLDS = [
  {
    id: 'codon-rush', unit: 6, status: 'open',
    title: 'Codon Rush', art: '🧬', tint: '#ecfdf5',
    goal: 'Read a gene and build its protein before the clock runs out.',
    path: 'worlds/codon-rush/index.html', time: '1 class period',
    goals: {
      goal: 'Finish a Gene → Protein round on Standard or Challenge with 90% accuracy or better',
      stretch: 'Finish Gene → Protein on Challenge with no mistakes, under par'
    },
    prompts: [
      'How does the information in a gene become a protein? Use the words template, mRNA, codon and ribosome.',
      'Which bases pair in DNA, and which pair when DNA is transcribed into RNA? Which mistake did you make most?',
      'What happens when the ribosome reaches a stop codon?'
    ],
    topics: 'DNA replication, transcription, translation, the genetic code',
    standards: ['AP Biology 6.2–6.4', 'GSE Biology SB2a', 'NGSS HS-LS1-1']
  },
  {
    id: 'signal-siege', unit: 4, status: 'open',
    title: 'Signal Siege', art: '🦠', tint: '#fff1f2',
    goal: 'Place immune cells, press Run, and see how cells signal each other.',
    path: 'worlds/signal-siege/index.html', time: '1–2 class periods',
    goals: {
      goal: 'Solve 4 of the 6 cases (at least one star each)',
      stretch: 'Earn 3 stars on all 6 cases'
    },
    prompts: [
      'Pick one signal from the game. Describe it as reception, transduction and response: which cell sends it, which receives it, and what changes?',
      'Explain juxtacrine, paracrine and endocrine signaling, with one example of each from the game.',
      'How do bacteria use quorum sensing? Why did it matter how many bacteria were on the board at once?',
      'Give one example of positive feedback and one of negative feedback from the cytokine storm level.',
      'Pertussis toxin disables Gi; cholera toxin locks Gs on. For each, which step of the pathway broke, and how did the cell\'s response change?'
    ],
    topics: 'Cell communication, signal transduction, quorum sensing, feedback, immune defense',
    standards: ['AP Biology 4.1–4.5', 'NGSS HS-LS1-2', 'NGSS HS-LS1-3']
  },
  {
    id: 'symbio', unit: 8, status: 'open',
    title: 'Symbio', art: '🦇', tint: '#eef2ff',
    goal: 'Discover why cooperation evolves in a selfish world.',
    path: 'worlds/symbio/index.html', time: '2 class periods',
    goals: {
      goal: 'Finish all 8 chapters of the Expedition',
      stretch: 'Score 9 or 10 out of 10 on the Check-in Quiz'
    },
    prompts: [
      'Why would a selfish organism ever help another one? Give one example from nature.',
      'Describe Tit for Tat in your own words. Why did it do so well?',
      'Where do you see cooperation, or cheating, in your own life? What keeps it going?'
    ],
    topics: 'Game theory, reciprocity, kin selection, the evolution of cooperation',
    standards: ['AP Biology 8.1 and Unit 7', 'NGSS HS-LS2-8', 'NGSS HS-LS4-4', 'Georgia CTAE TEH7 / TEH8 (see Symbio\'s Teacher tab)']
  }
];
