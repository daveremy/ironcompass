export const TEST_DATE = "2099-01-01";
export const TEST_DATE_EMPTY = "2099-01-02";
// 2099-01-01 is a Thursday. Week starts Monday 2098-12-29.
export const TEST_WEEK_MONDAY = "2098-12-29";

export const DAILY_ENTRY = {
  date: TEST_DATE,
  weight: 175.5,
  energy: 4,
  alcohol: false,
};

export const SLEEP = {
  date: TEST_DATE,
  hours: 7.5,
  oura_score: 88,
  apple_score: 82,
};

export const FASTING = {
  date: TEST_DATE,
  protocol: "16:8",
  window_start: "12:00",
  window_end: "20:00",
  compliant: true,
};

export const BLOOD_PRESSURE = {
  date: TEST_DATE,
  systolic: 122,
  diastolic: 76,
};

export const WORKOUTS = [
  {
    date: TEST_DATE,
    type: "strength",
    duration_min: 45,
    completed: true,
    details: {
      exercises: [
        { name: "Bench Press", sets: [{ reps: 8, weight: 135 }] },
        { name: "Pull-ups", sets: [{ reps: 10, weight: 0 }] },
      ],
    },
  },
  {
    date: TEST_DATE,
    type: "hike",
    duration_min: 60,
    distance_mi: 3.2,
    elevation_ft: 800,
    completed: true,
  },
];

export const MEALS = [
  {
    date: TEST_DATE,
    name: "Protein shake",
    protein_g: 40,
    fat_g: 5,
    carbs_g: 10,
    calories: 245,
  },
  {
    date: TEST_DATE,
    name: "Salmon dinner",
    protein_g: 35,
    fat_g: 15,
    carbs_g: 30,
    calories: 395,
  },
];

export const PULLUPS = {
  date: TEST_DATE,
  total_count: 18,
  sets: [3, 3, 3, 3, 3, 3],
};

export const SUPPLEMENTS = {
  date: TEST_DATE,
  supplements: ["vitamin-d", "magnesium", "omega-3", "creatine"],
};

export const BODY_COMPOSITION = {
  date: TEST_DATE,
  body_fat_pct: 18.5,
  muscle_mass_lbs: 148,
};
