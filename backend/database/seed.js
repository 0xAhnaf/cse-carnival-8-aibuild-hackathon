const fs = require('fs');
const path = require('path');
const db = require('./db');

function seedDatabase() {
  // 1. Safe Guard: Check if seeding has already been performed
  const sampleSchedule = db.prepare('SELECT COUNT(*) AS count FROM schedules').get();
  if (sampleSchedule.count > 0) {
    console.log('Database already seeded. Skipping seed process.');
    return;
  }

  console.log('Starting initial database seeding from data/ directory...');

  // Path to root data directory (1 level up from backend/database -> root -> data)
  const dataDir = path.join(__dirname, '../../data');

  // Helper to safely read and parse JSON files
  const readJson = (filename) => {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: Seed file not found at ${filePath}`);
      return [];
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  };

  // 2. Load Seed Files
  const schedulesData = readJson('schedules.json');
  const roomsData = readJson('rooms.json');
  const eventsData = readJson('events.json');
  const announcementsData = readJson('announcements.json');
  const assignmentsData = readJson('assignments.json');

  // 3. Prepare SQLite Insert Statements
  const insertSchedule = db.prepare(`
    INSERT INTO schedules (id, course_code, title, day, time_slot, room, instructor)
    VALUES (@id, @course_code, @title, @day, @time_slot, @room, @instructor)
  `);

  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, room_number, building, capacity, features)
    VALUES (@id, @room_number, @building, @capacity, @features)
  `);

  const insertEvent = db.prepare(`
    INSERT INTO events (id, title, description, date, time, location, capacity, registered_count)
    VALUES (@id, @title, @description, @date, @time, @location, @capacity, @registered_count)
  `);

  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (id, title, content, date_posted, category)
    VALUES (@id, @title, @content, @date_posted, @category)
  `);

  const insertAssignment = db.prepare(`
    INSERT INTO assignments (id, course_code, title, due_date, description, status)
    VALUES (@id, @course_code, @title, @due_date, @description, @status)
  `);

  // 4. Wrap inserts in a single high-performance Transaction
  const runSeeder = db.transaction(() => {
    // Seed Schedules
    for (const item of schedulesData) {
      insertSchedule.run({
        id: item.id || `sched_${Math.random().toString(36).substring(2, 9)}`,
        course_code: item.course_code || item.courseCode || '',
        title: item.title || '',
        day: item.day || '',
        time_slot: item.time_slot || item.timeSlot || item.time || '',
        room: item.room || '',
        instructor: item.instructor || ''
      });
    }

    // Seed Rooms
    for (const item of roomsData) {
      insertRoom.run({
        id: item.id || `room_${Math.random().toString(36).substring(2, 9)}`,
        room_number: item.room_number || item.roomNumber || item.number || '',
        building: item.building || '',
        capacity: Number(item.capacity) || 0,
        features: Array.isArray(item.features) ? JSON.stringify(item.features) : String(item.features || '')
      });
    }

    // Seed Events
    for (const item of eventsData) {
      insertEvent.run({
        id: item.id || `evt_${Math.random().toString(36).substring(2, 9)}`,
        title: item.title || '',
        description: item.description || '',
        date: item.date || '',
        time: item.time || '',
        location: item.location || '',
        capacity: Number(item.capacity) || 0,
        registered_count: Number(item.registered_count || item.registeredCount || 0)
      });
    }

    // Seed Announcements
    for (const item of announcementsData) {
      insertAnnouncement.run({
        id: item.id || `anc_${Math.random().toString(36).substring(2, 9)}`,
        title: item.title || '',
        content: item.content || item.body || '',
        date_posted: item.date_posted || item.datePosted || item.date || '',
        category: item.category || 'General'
      });
    }

    // Seed Assignments
    for (const item of assignmentsData) {
      insertAssignment.run({
        id: item.id || `asgn_${Math.random().toString(36).substring(2, 9)}`,
        course_code: item.course_code || item.courseCode || '',
        title: item.title || '',
        due_date: item.due_date || item.dueDate || '',
        description: item.description || '',
        status: item.status || 'Pending'
      });
    }
  });

  // Execute transaction
  try {
    runSeeder();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}

// Automatically seed when imported/executed directly
seedDatabase();

module.exports = seedDatabase;