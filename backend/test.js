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

    // 5. Test Booking Extension flow
    console.log('Testing booking extension flow (18:00-19:00 extended with 19:00-20:00 and 20:00-21:00)...');
    const extBookingRes = await query(
      `INSERT INTO bookings (facility_id, user_id, date, start_time, end_time, total_price, status) 
       VALUES ($1, $2, $3, '18:00:00', '19:00:00', $4, 'confirmed') RETURNING *`,
      [testFacility.id, testUser.id, testDate, testFacility.price_per_hour]
    );
    const initialBooking = extBookingRes.rows[0];

    // Simulate extension update
    const extSlots = [
      { startTime: '19:00', endTime: '20:00', price: parseFloat(testFacility.price_per_hour) },
      { startTime: '20:00', endTime: '21:00', price: parseFloat(testFacility.price_per_hour) }
    ];
    const addPrice = extSlots.reduce((s, x) => s + x.price, 0);

    const updatedRes = await query(
      `UPDATE bookings 
       SET 
         original_start_time = COALESCE(original_start_time, start_time),
         original_end_time = COALESCE(original_end_time, end_time),
         end_time = '21:00:00', 
         total_price = total_price + $1,
         is_extended = TRUE,
         extended_slots = COALESCE(extended_slots, '[]'::jsonb) || $2::jsonb
       WHERE id = $3 
       RETURNING *`,
      [addPrice, JSON.stringify(extSlots), initialBooking.id]
    );

    const extendedBooking = updatedRes.rows[0];
    if (
      extendedBooking.is_extended === true &&
      extendedBooking.original_start_time === '18:00:00' &&
      extendedBooking.original_end_time === '19:00:00' &&
      extendedBooking.end_time === '21:00:00' &&
      parseFloat(extendedBooking.total_price) === parseFloat(testFacility.price_per_hour) * 3
    ) {
      console.log('✅ Booking Extension test passed! Total Duration: 18:00-21:00 (3 Hours), is_extended: true');
    } else {
      throw new Error('❌ Booking Extension test failed! Result: ' + JSON.stringify(extendedBooking));
    }

    // 6. Test conflict prevention on extended slot (20:00-21:00)
    const checkExtConflict = await query(
      `SELECT * FROM bookings 
       WHERE facility_id = $1 
         AND date = $2 
         AND status = 'confirmed' 
         AND (start_time < '21:00:00' AND end_time > '20:00:00')`,
      [testFacility.id, testDate]
    );
    if (checkExtConflict.rows.length > 0) {
      console.log('✅ Success! Extended slot 20:00-21:00 is properly protected from double bookings.');
    } else {
      throw new Error('❌ Test Failed: Extended slot was not flagged as booked!');
    }

    // 7. Cleanup test bookings
    await query('DELETE FROM bookings WHERE id IN ($1, $2)', [testBooking.id, initialBooking.id]);
    console.log('✅ Test data cleaned up.');
    console.log('--- All Sanity Tests Completed Successfully ---');

  } catch (error) {
    console.error('❌ Test Execution Failed:', error.message);
  } finally {
    process.exit(0);
  }
};

runTests();
