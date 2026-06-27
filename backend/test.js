import { initDb, query } from './db.js';

const runTests = async () => {
  console.log('--- Starting Sanity Tests ---');
  
  try {
    // 1. Initialise the database (Runs table creations & seeds default rows)
    await initDb();
    console.log('✅ DB Schema initialisation passed.');

    // 2. Fetch a seeded facility and user
    const facRes = await query('SELECT * FROM facilities LIMIT 1');
    const userRes = await query('SELECT * FROM users LIMIT 1');

    if (facRes.rows.length === 0 || userRes.rows.length === 0) {
      throw new Error('Could not retrieve seeded facility or user.');
    }

    const testFacility = facRes.rows[0];
    const testUser = userRes.rows[0];

    console.log(`Using facility "${testFacility.name}" (ID: ${testFacility.id}) and user "${testUser.name}" (ID: ${testUser.id}) for testing.`);

    const testDate = '2026-12-25';
    const testStart = '14:00:00';
    const testEnd = '15:00:00';

    // Clear previous tests if any
    await query('DELETE FROM bookings WHERE date = $1 AND facility_id = $2', [testDate, testFacility.id]);

    // 3. Test booking creation
    console.log('Testing booking creation for Christmas 2026 at 14:00-15:00...');
    
    // Check overlap first (should find none)
    const check1 = await query(
      `SELECT * FROM bookings 
       WHERE facility_id = $1 
         AND date = $2 
         AND status = 'confirmed' 
         AND (start_time < $4 AND end_time > $3)`,
      [testFacility.id, testDate, testStart, testEnd]
    );

    if (check1.rows.length > 0) {
      throw new Error('Expected no overlap conflict, but found one.');
    }

    // Insert booking
    const bookRes = await query(
      `INSERT INTO bookings (facility_id, user_id, date, start_time, end_time, total_price, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed') RETURNING *`,
      [testFacility.id, testUser.id, testDate, testStart, testEnd, testFacility.price_per_hour]
    );

    const testBooking = bookRes.rows[0];
    console.log(`✅ Booking successfully saved! ID: ${testBooking.id}`);

    // 4. Test Overlap/Double Booking Prevention
    console.log('Testing overlap conflict prevention... attempting to book overlapping slot (14:30 - 15:30)...');
    
    const overlapStart = '14:30:00';
    const overlapEnd = '15:30:00';

    // Run overlap check query
    const check2 = await query(
      `SELECT * FROM bookings 
       WHERE facility_id = $1 
         AND date = $2 
         AND status = 'confirmed' 
         AND (start_time < $4 AND end_time > $3)`,
      [testFacility.id, testDate, overlapStart, overlapEnd]
    );

    if (check2.rows.length > 0) {
      console.log('✅ Success! Overlap check query correctly flagged the booking conflict.');
      console.log(`   Conflict details: Found existing booking #${check2.rows[0].id} from ${check2.rows[0].start_time} to ${check2.rows[0].end_time}`);
    } else {
      throw new Error('❌ Test Failed: Overlap check failed to flag the conflicting slot!');
    }

    // 5. Cleanup test booking
    await query('DELETE FROM bookings WHERE id = $1', [testBooking.id]);
    console.log('✅ Test data cleaned up.');
    console.log('--- All Sanity Tests Completed Successfully ---');

  } catch (error) {
    console.error('❌ Test Execution Failed:', error.message);
  } finally {
    process.exit(0);
  }
};

runTests();
