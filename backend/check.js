const db = require('./database/db');

// Trigger seeding if not run yet
require('./database/seed');

const tables = [
  'schedules',
  'rooms',
  'room_bookings',
  'events',
  'event_registrations',
  'announcements',
  'assignments'
];

console.log('================ DATABASE DATA INSPECTION ================');

tables.forEach(table => {
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
  console.log(`\n--- TABLE: ${table.toUpperCase()} (${count} rows) ---`);
  
  if (count > 0) {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    console.table(rows);
  } else {
    console.log('[ Empty Table ]');
  }
});

console.log('==========================================================');