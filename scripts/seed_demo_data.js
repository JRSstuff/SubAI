const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const env = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
env.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  setDoc,
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = new Date();
const iso = (daysAgo = 0, hoursAgo = 0) => {
  const d = new Date(now.getTime() - (daysAgo * 86400000 + hoursAgo * 3600000));
  return d.toISOString();
};

const futureIso = (daysAhead = 1) => {
  const d = new Date(now.getTime() + daysAhead * 86400000);
  return d.toISOString().split('T')[0];
};

async function seed() {
  console.log('Seeding rich presentation demo data into Firestore...');

  // ─── 1. REPORTS ───
  const demoReports = [
    // --- SUBMITTED (Awaiting Triage) ---
    {
      id: 'demo-rep-01',
      reference_no: 'REF-2026-081',
      site_id: 'ustp-cdo-main',
      reporter_id: 'user-cdo-cit1',
      reporter_name: 'Engr. Danica Flores',
      location_name: 'Lapasan Highway Curb Inlet (Near Shell)',
      latitude: 8.4875,
      longitude: 124.6560,
      description: 'Severe accumulation of single-use PET beverage bottles and plastic snack wrappers completely choking the inlet grate. Stormwater starting to spill onto highway lanes.',
      photo_url: '/demo/drainage_1.png',
      review_state: 'Submitted',
      dataset_origin: 'presentation_demo',
      is_demo: true,
      created_at: iso(0, 1),
      ai_analyses: [{
        suggested_categories: ['pet_bottles', 'flexible_packaging', 'silt'],
        confidence: 0.94,
      }],
    },
    {
      id: 'demo-rep-02',
      reference_no: 'REF-2026-082',
      site_id: 'ustp-cdo-main',
      reporter_id: 'user-cdo-cit2',
      reporter_name: 'Capt. Mateo Rodriguez',
      location_name: 'Carmen Market Outfall Canal',
      latitude: 8.4795,
      longitude: 124.6390,
      description: 'Thick sediment, tree branches, and beverage containers creating a dam effect in the open drainage channel. Water level elevated by 40cm.',
      photo_url: '/demo/drainage_2.png',
      review_state: 'Submitted',
      dataset_origin: 'presentation_demo',
      is_demo: true,
      created_at: iso(0, 3),
      ai_analyses: [{
        suggested_categories: ['silt', 'organic_debris', 'residual_waste'],
        confidence: 0.89,
      }],
    },
    {
      id: 'demo-rep-03',
      reference_no: 'REF-2026-083',
      site_id: 'ustp-cdo-main',
      reporter_id: 'user-cdo-cit3',
      reporter_name: 'Bea Clarisse Santos',
      location_name: 'USTP Science Complex Quad Catch Basin',
      latitude: 8.4858,
      longitude: 124.6567,
      description: 'Internal quadrangle drop inlet clogged with coffee cups, plastic straws, and packaging blown from the campus canteen walkway.',
      photo_url: '/demo/drainage_3.png',
      review_state: 'Submitted',
      dataset_origin: 'presentation_demo',
      is_demo: true,
      created_at: iso(0, 5),
      ai_analyses: [{
        suggested_categories: ['pet_bottles', 'flexible_packaging'],
        confidence: 0.96,
      }],
    },

    // --- VERIFIED (Active Dispatched Tasks) ---
    {
      id: 'demo-rep-04',
      reference_no: 'REF-2026-074',
      site_id: 'ustp-cdo-main',
      reporter_id: 'user-cdo-cit4',
      reporter_name: 'Aldren Macasarte',
      location_name: 'CM Recto Highway Box Culvert Inflow',
      latitude: 8.4842,
      longitude: 124.6521,
      description: 'Critical inflow culvert submerged with mud, discarded PET bottles, and floating debris. High flooding hazard for commercial traffic.',
      photo_url: '/demo/drainage_4.png',
      review_state: 'Verified',
      reviewed_at: iso(0, 4),
      reviewer_id: 'rev-cdo-officer',
      review_notes: 'Priority 5/5. Immediate drainage clearance required before expected afternoon rainfall.',
      dataset_origin: 'presentation_demo',
      is_demo: true,
      created_at: iso(1, 2),
      ai_analyses: [{
        suggested_categories: ['pet_bottles', 'silt', 'residual_waste'],
        confidence: 0.97,
      }],
      cleanup_tasks: [{
        id: 'demo-task-01',
        report_id: 'demo-rep-04',
        assigned_to: 'Facilities Operations Team 1',
        state: 'Assigned',
        priority_score: 5,
        priority_band: 'High',
        obstruction_score: 3,
        disruption_score: 2,
        target_date: futureIso(1),
        created_at: iso(0, 4),
        is_demo: true,
      }],
    },
    {
      id: 'demo-rep-05',
      reference_no: 'REF-2026-075',
      site_id: 'ustp-cdo-main',
      reporter_id: 'user-cdo-cit5',
      reporter_name: 'Karlo Pimentel',
      location_name: 'Cogon Public Market Perimeter Gutter',
      latitude: 8.4755,
      longitude: 124.6480,
      description: 'Market vegetable refuse, corrugated boxes, and plastic packaging obstructing sidewalk curb inlet.',
      photo_url: '/demo/drainage_5.png',
      review_state: 'Verified',
      reviewed_at: iso(0, 8),
      reviewer_id: 'rev-cdo-officer',
      review_notes: 'Dispatched to Municipal Drainage Maintenance Squad for scheduled clearance.',
      dataset_origin: 'presentation_demo',
      is_demo: true,
      created_at: iso(1, 6),
      ai_analyses: [{
        suggested_categories: ['flexible_packaging', 'organic_debris'],
        confidence: 0.91,
      }],
      cleanup_tasks: [{
        id: 'demo-task-02',
        report_id: 'demo-rep-05',
        assigned_to: 'Drainage Maintenance Squad',
        state: 'Assigned',
        priority_score: 3,
        priority_band: 'Medium',
        obstruction_score: 2,
        disruption_score: 1,
        target_date: futureIso(2),
        created_at: iso(0, 8),
        is_demo: true,
      }],
    },
    {
      id: 'demo-rep-06',
      reference_no: 'REF-2026-076',
      site_id: 'ustp-cdo-main',
      reporter_id: 'user-cdo-cit6',
      reporter_name: 'Rowena Alcantara',
      location_name: 'Macasandig Riverside Canal Cross-Drain',
      latitude: 8.4680,
      longitude: 124.6415,
      description: 'Heavy bamboo sticks, plastic containers, and household waste restricting outfall volume to the river.',
      photo_url: '/demo/drainage_6.png',
      review_state: 'Verified',
      reviewed_at: iso(0, 12),
      reviewer_id: 'rev-cdo-officer',
      review_notes: 'High flood vulnerability zone. Dispatched with Eco-Volunteer support.',
      dataset_origin: 'presentation_demo',
      is_demo: true,
      created_at: iso(1, 10),
      ai_analyses: [{
        suggested_categories: ['organic_debris', 'pet_bottles', 'flexible_packaging'],
        confidence: 0.93,
      }],
      cleanup_tasks: [{
        id: 'demo-task-03',
        report_id: 'demo-rep-06',
        assigned_to: 'Community Eco-Volunteer Crew',
        state: 'In progress',
        priority_score: 4,
        priority_band: 'High',
        obstruction_score: 2,
        disruption_score: 2,
        target_date: futureIso(2),
        created_at: iso(0, 12),
        is_demo: true,
      }],
    },

    // --- NEEDS INSPECTION ---
    {
      id: 'demo-rep-07',
      reference_no: 'REF-2026-077',
      site_id: 'ustp-cdo-main',
      reporter_id: 'user-cdo-cit7',
      reporter_name: 'Jerome Tan',
      location_name: 'Kauswagan Overpass Underground Siphon',
      latitude: 8.4980,
      longitude: 124.6320,
      description: 'Water ponding on roadway with no visible surface debris. Possible internal pipe collapse or deep subterranean silt accumulation.',
      photo_url: '/demo/drainage_1.png',
      review_state: 'Needs inspection',
      reviewed_at: iso(0, 6),
      reviewer_id: 'rev-cdo-officer',
      review_notes: 'Requires camera borescope inspection by engineering squad before dispatching manual collectors.',
      dataset_origin: 'presentation_demo',
      is_demo: true,
      created_at: iso(1, 8),
      ai_analyses: [{
        suggested_categories: ['silt', 'construction_debris'],
        confidence: 0.84,
      }],
    },
    {
      id: 'demo-rep-08',
      reference_no: 'REF-2026-078',
      site_id: 'ustp-cdo-main',
      reporter_id: 'user-cdo-cit8',
      reporter_name: 'Maria Elena Lim',
      location_name: 'Nazareth 12th Street Grated Catch Basin',
      latitude: 8.4710,
      longitude: 124.6510,
      description: 'Partially buried grate obscured by road asphalt resurfacing residue and plastic wrappers.',
      photo_url: '/demo/drainage_2.png',
      review_state: 'Needs inspection',
      reviewed_at: iso(0, 10),
      reviewer_id: 'rev-cdo-officer',
      review_notes: 'Verify municipal right-of-way easement before deploying heavy jackhammer or desilting tools.',
      dataset_origin: 'presentation_demo',
      is_demo: true,
      created_at: iso(1, 14),
      ai_analyses: [{
        suggested_categories: ['construction_debris', 'flexible_packaging'],
        confidence: 0.88,
      }],
    },

    // --- REJECTED ---
    {
      id: 'demo-rep-09',
      reference_no: 'REF-2026-079',
      site_id: 'ustp-cdo-main',
      reporter_id: 'user-cdo-cit9',
      reporter_name: 'Anonymous Submitter',
      location_name: 'Private Warehouse Internal Gutter',
      latitude: 8.4820,
      longitude: 124.6620,
      description: 'Blocked roof downspout inside private commercial perimeter fence.',
      photo_url: '/demo/drainage_3.png',
      review_state: 'Rejected',
      reviewed_at: iso(0, 14),
      reviewer_id: 'rev-cdo-officer',
      review_notes: 'Rejected: Structure is inside private property boundary and not part of the municipal or campus drainage network.',
      dataset_origin: 'presentation_demo',
      is_demo: true,
      created_at: iso(2, 4),
      ai_analyses: [{
        suggested_categories: ['residual_waste'],
        confidence: 0.72,
      }],
    },

    // --- DUPLICATE (Linked to REF-2026-081) ---
    {
      id: 'demo-rep-10',
      reference_no: 'REF-2026-080',
      site_id: 'ustp-cdo-main',
      reporter_id: 'user-cdo-cit10',
      reporter_name: 'Samuel Oca',
      location_name: 'Lapasan Highway Curb Inlet (Near Gas Station)',
      latitude: 8.4876,
      longitude: 124.6561,
      description: 'Plastic bottles and cups blocking the canal near Shell gas station.',
      photo_url: '/demo/drainage_1.png',
      review_state: 'Duplicate',
      duplicate_of_id: 'demo-rep-01',
      reviewed_at: iso(0, 2),
      reviewer_id: 'rev-cdo-officer',
      review_notes: 'Duplicate report of REF-2026-081. Linked to primary ticket to maintain accurate mass ledger.',
      dataset_origin: 'presentation_demo',
      is_demo: true,
      created_at: iso(0, 1),
      ai_analyses: [{
        suggested_categories: ['pet_bottles', 'flexible_packaging'],
        confidence: 0.95,
      }],
    },
  ];

  // Write reports to Firestore
  for (const rep of demoReports) {
    await setDoc(doc(db, 'reports', rep.id), rep);
  }
  console.log(`Saved ${demoReports.length} demo reports.`);

  // ─── 2. ACTIVE CLEANUP TASKS ───
  const activeTasks = [
    {
      id: 'demo-task-01',
      report_id: 'demo-rep-04',
      assigned_to: 'Facilities Operations Team 1',
      state: 'Assigned',
      status: 'Assigned',
      priority_score: 5,
      priority_band: 'High',
      obstruction_score: 3,
      disruption_score: 2,
      target_date: futureIso(1),
      created_at: iso(0, 4),
      dataset_origin: 'presentation_demo',
      is_demo: true,
      report: {
        reference_no: 'REF-2026-074',
        location_name: 'CM Recto Highway Box Culvert Inflow',
        photo_url: '/demo/drainage_4.png',
        description: 'Critical inflow culvert submerged with mud, discarded PET bottles, and floating debris.',
      },
    },
    {
      id: 'demo-task-02',
      report_id: 'demo-rep-05',
      assigned_to: 'Drainage Maintenance Squad',
      state: 'Assigned',
      status: 'Assigned',
      priority_score: 3,
      priority_band: 'Medium',
      obstruction_score: 2,
      disruption_score: 1,
      target_date: futureIso(2),
      created_at: iso(0, 8),
      dataset_origin: 'presentation_demo',
      is_demo: true,
      report: {
        reference_no: 'REF-2026-075',
        location_name: 'Cogon Public Market Perimeter Gutter',
        photo_url: '/demo/drainage_5.png',
        description: 'Market vegetable refuse, corrugated boxes, and plastic packaging obstructing sidewalk curb inlet.',
      },
    },
    {
      id: 'demo-task-03',
      report_id: 'demo-rep-06',
      assigned_to: 'Community Eco-Volunteer Crew',
      state: 'In progress',
      status: 'In progress',
      priority_score: 4,
      priority_band: 'High',
      obstruction_score: 2,
      disruption_score: 2,
      target_date: futureIso(2),
      created_at: iso(0, 12),
      dataset_origin: 'presentation_demo',
      is_demo: true,
      report: {
        reference_no: 'REF-2026-076',
        location_name: 'Macasandig Riverside Canal Cross-Drain',
        photo_url: '/demo/drainage_6.png',
        description: 'Heavy bamboo sticks, plastic containers, and household waste restricting outfall volume to the river.',
      },
    },
  ];

  // ─── 3. COMPLETED CLEANUP TASKS (With Mass Balance & Photos) ───
  const completedTasks = [
    {
      id: 'demo-task-comp-01',
      report_id: 'demo-rep-04',
      assigned_to: 'Facilities Operations Team 1',
      state: 'Collected',
      status: 'Completed',
      priority_score: 4,
      priority_band: 'High',
      obstruction_score: 2,
      disruption_score: 2,
      created_at: iso(3, 0),
      completed_at: iso(1, 4),
      total_kg: 28.5,
      is_unmeasured: false,
      before_photo_url: '/demo/drainage_1.png',
      after_photo_url: '/demo/drainage_2.png',
      batches: [
        { category: 'pet_bottles', kg: 14.2 },
        { category: 'flexible_packaging', kg: 8.3 },
        { category: 'residual_waste', kg: 6.0 },
      ],
      dataset_origin: 'presentation_demo',
      is_demo: true,
      report: {
        reference_no: 'REF-2026-071',
        location_name: 'USTP Entrance Main Highway Culvert',
        photo_url: '/demo/drainage_1.png',
      },
    },
    {
      id: 'demo-task-comp-02',
      report_id: 'demo-rep-05',
      assigned_to: 'Drainage Maintenance Squad',
      state: 'Collected',
      status: 'Completed',
      priority_score: 5,
      priority_band: 'High',
      obstruction_score: 3,
      disruption_score: 2,
      created_at: iso(4, 0),
      completed_at: iso(2, 6),
      total_kg: 45.0,
      is_unmeasured: false,
      before_photo_url: '/demo/drainage_3.png',
      after_photo_url: '/demo/drainage_4.png',
      batches: [
        { category: 'pet_bottles', kg: 22.0 },
        { category: 'flexible_packaging', kg: 15.0 },
        { category: 'silt', kg: 8.0 },
      ],
      dataset_origin: 'presentation_demo',
      is_demo: true,
      report: {
        reference_no: 'REF-2026-070',
        location_name: 'Bitan-ag Creek Culvert Inflow Point',
        photo_url: '/demo/drainage_3.png',
      },
    },
    {
      id: 'demo-task-comp-03',
      report_id: 'demo-rep-06',
      assigned_to: 'Community Eco-Volunteer Crew',
      state: 'Collected',
      status: 'Completed',
      priority_score: 2,
      priority_band: 'Low',
      obstruction_score: 1,
      disruption_score: 1,
      created_at: iso(2, 0),
      completed_at: iso(1, 2),
      total_kg: 0,
      is_unmeasured: true,
      disposition_notes: 'Qualitative clearance: Hanging field scale unavailable. Complete channel flow restored and validated via after-photo.',
      before_photo_url: '/demo/drainage_5.png',
      after_photo_url: '/demo/drainage_6.png',
      batches: [],
      dataset_origin: 'presentation_demo',
      is_demo: true,
      report: {
        reference_no: 'REF-2026-072',
        location_name: 'Lapasan Coastal Ditch Outlet',
        photo_url: '/demo/drainage_5.png',
      },
    },
  ];

  for (const t of [...activeTasks, ...completedTasks]) {
    await setDoc(doc(db, 'cleanup_tasks', t.id), t);
  }
  console.log(`Saved ${activeTasks.length + completedTasks.length} demo cleanup tasks.`);

  // ─── 4. RECIPIENT HANDOVERS (Step 5 & 6) ───
  const demoHandovers = [
    {
      id: 'demo-ho-01',
      task_id: 'demo-task-comp-01',
      batch_id: 'BATCH-2026-088',
      material_category: 'pet_bottles',
      recipient_org: 'CDO Materials Recovery Facility (Barangay Lapasan)',
      submitted_kg: 28.5,
      accepted_kg: 22.0,
      confirmation_state: 'pending',
      evidence_url: '/demo/drainage_2.png',
      notes: 'Weigh ticket #4812. 6.5 kg contaminated silt/labels excluded and kept in collector custody for re-sorting.',
      handover_timestamp: iso(0, 5),
      created_at: iso(0, 5),
      dataset_origin: 'presentation_demo',
      is_demo: true,
    },
    {
      id: 'demo-ho-02',
      task_id: 'demo-task-comp-02',
      batch_id: 'BATCH-2026-087',
      material_category: 'pet_bottles',
      recipient_org: 'Green Loop Recycling Hub (Poblacion)',
      submitted_kg: 22.0,
      accepted_kg: 22.0,
      confirmation_state: 'confirmed',
      evidence_url: '/demo/drainage_4.png',
      notes: 'Clean baled PET beverage bottles. Verified 100% accepted without deductions.',
      reviewer_notes: 'Digital receipt verified against scales ticket.',
      confirmed_at: iso(0, 8),
      handover_timestamp: iso(1, 2),
      created_at: iso(1, 2),
      dataset_origin: 'presentation_demo',
      is_demo: true,
    },
    {
      id: 'demo-ho-03',
      task_id: 'demo-task-comp-02',
      batch_id: 'BATCH-2026-086',
      material_category: 'flexible_packaging',
      recipient_org: 'Northern Mindanao Plastic Recovery (Macabalan)',
      submitted_kg: 15.0,
      accepted_kg: 12.0,
      confirmation_state: 'pending',
      evidence_url: '/demo/drainage_6.png',
      notes: 'Clean poly-film & sachets. 3.0 kg wet residual kept for drying.',
      handover_timestamp: iso(0, 10),
      created_at: iso(0, 10),
      dataset_origin: 'presentation_demo',
      is_demo: true,
    },
  ];

  for (const h of demoHandovers) {
    await setDoc(doc(db, 'handovers', h.id), h);
  }
  console.log(`Saved ${demoHandovers.length} demo handovers.`);

  console.log('\nDemo seeding completed successfully! All data tagged with is_demo: true.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
