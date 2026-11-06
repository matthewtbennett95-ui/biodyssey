/* The list of worlds on the odyssey, in the suggested order (small to large).
   Each entry is the "registry" part of the world contract: see docs/WORLD-CONTRACT.md. */
window.BIODYSSEY_LEVELS = [
  { id: 'molecules', name: 'Molecules', size: 'about 1 nanometer' },
  { id: 'cells', name: 'Cells', size: 'about 10 micrometers' },
  { id: 'populations', name: 'Populations', size: 'meters to kilometers' }
];

window.BIODYSSEY_WORLDS = [
  {
    id: 'codon-rush', n: 1, level: 'molecules', status: 'open',
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
    standards: ['GSE Biology SB2a', 'NGSS HS-LS1-1']
  },
  {
    id: 'signal-siege', n: 2, level: 'cells', status: 'soon',
    title: 'Signal Siege', art: '🦠', tint: '#fff1f2',
    goal: 'Build a lymph node whose cells signal each other well enough to stop an infection.',
    path: '', time: '1–2 class periods',
    goals: { goal: 'To be set when the world is brought in', stretch: 'To be set when the world is brought in' },
    prompts: [
      'A cell only responds to a signal if it has the right receptor. Explain why, using the words ligand and receptor.',
      'Describe one signal in your base: which cell sends it, which cell receives it, and what the receiving cell does.'
    ],
    topics: 'Cell communication, receptors and ligands, immune defense',
    standards: ['AP Biology Unit 4: Cell Communication']
  },
  {
    id: 'symbio', n: 3, level: 'populations', status: 'open',
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
    standards: ['NGSS HS-LS2-8', 'NGSS HS-LS4-4', 'Georgia CTAE TEH7 / TEH8 (see Symbio\'s Teacher tab)']
  }
];
