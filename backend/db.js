import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text, params) => pool.query(text, params);

export const initDb = async () => {
  try {
    console.log('Initializing PostgreSQL database schemas...');

    // 0. Ensure target database exists by connecting to default 'postgres' database first
    const connectionString = process.env.DATABASE_URL;
    const lastSlashIndex = connectionString.lastIndexOf('/');
    const baseConnectionString = connectionString.substring(0, lastSlashIndex);
    const dbName = connectionString.substring(lastSlashIndex + 1);

    const defaultClient = new pg.Client({
      connectionString: `${baseConnectionString}/postgres`,
    });

    try {
      await defaultClient.connect();
      const checkDb = await defaultClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
      
      if (checkDb.rows.length === 0) {
        console.log(`Database "${dbName}" does not exist. Creating it now...`);
        await defaultClient.query(`CREATE DATABASE ${dbName}`);
        console.log(`Database "${dbName}" created successfully.`);
      }
    } catch (dbErr) {
      console.warn('Warning: Could not auto-create database (might already exist or permission restricted):', dbErr.message);
    } finally {
      try {
        await defaultClient.end();
      } catch (e) {}
    }

    // 1. Create Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        phone VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Facilities Table
    await query(`
      CREATE TABLE IF NOT EXISTS facilities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        price_per_hour NUMERIC(10, 2) NOT NULL,
        images TEXT[] DEFAULT '{}',
        description TEXT,
        amenities TEXT[] DEFAULT '{}',
        open_time TIME DEFAULT '00:00',
        close_time TIME DEFAULT '23:59',
        slot_duration INTEGER DEFAULT 60,
        status VARCHAR(50) DEFAULT 'active'
      );
    `);

    // 3. Create Bookings Table
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        facility_id INTEGER REFERENCES facilities(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Seed default Admin and User if empty
    const userCheck = await query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      console.log('No users found. Seeding default user and admin...');
      
      const adminHash = await bcrypt.hash('admin123', 10);
      const userHash = await bcrypt.hash('user123', 10);

      await query(
        `INSERT INTO users (name, email, password, role, phone) VALUES 
         ($1, $2, $3, $4, $5)`,
        ['System Administrator', 'admin@sports.com', adminHash, 'admin', '1234567890']
      );

      await query(
        `INSERT INTO users (name, email, password, role, phone) VALUES 
         ($1, $2, $3, $4, $5)`,
        ['John Doe', 'user@sports.com', userHash, 'user', '9876543210']
      );

      console.log('Seeded Users:');
      console.log(' - Admin: admin@sports.com / admin123');
      console.log(' - User: user@sports.com / user123');
    }

    // 5. Seed default Facilities (9 grounds across Gujarat cities: Cricket, Tennis, and Pickleball)
    console.log('Checking and seeding default facilities...');
    
    // Clear out old facilities first to avoid leftover category types
    await query("DELETE FROM facilities");

    const defaultFacilities = [
      {
        name: 'Lords Arena Cricket Ground',
        type: 'cricket',
        location: 'Downtown Sports Complex, Ahmedabad',
        price_per_hour: 1200.00,
        images: ['/fac_cricket_1.jpg'],
        description: 'A premium international-standard turf designed for both box cricket and full outfield matches. Equipped with high-intensity LED floodlights, professional-grade artificial turf, and a comfortable pavilion.',
        amenities: ['Floodlights', 'Locker Room', 'Parking', 'Showers', 'Equipment Rental'],
        open_time: '00:00:00',
        close_time: '23:59:00',
        slot_duration: 60,
        status: 'active'
      },
      {
        name: 'Sardar Patel Cricket Ground',
        type: 'cricket',
        location: 'Motera Stadium Road, Ahmedabad',
        price_per_hour: 1500.00,
        images: ['/fac_cricket_2.png'],
        description: 'A professional cricket ground with a well-maintained clay pitch, turf outfield, and grand stand view. Suitable for club games and practice matches.',
        amenities: ['Floodlights', 'Professional Pitch', 'Locker Room', 'Parking', 'Showers'],
        open_time: '00:00:00',
        close_time: '23:59:00',
        slot_duration: 60,
        status: 'active'
      },
      {
        name: 'Rajkot King\'s Box Cricket',
        type: 'cricket',
        location: 'Kalawad Road, Rajkot',
        price_per_hour: 800.00,
        images: ['/fac_cricket_3.jpg'],
        description: 'Premium box cricket court with seamless turf carpet, professional night lighting, and spectator seating.',
        amenities: ['Floodlights', 'Nets', 'Parking', 'Drinking Water'],
        open_time: '00:00:00',
        close_time: '23:59:00',
        slot_duration: 60,
        status: 'active'
      },
      {
        name: 'Wimbledon Tennis Arena',
        type: 'tennis',
        location: 'Adajan Main Road, Surat',
        price_per_hour: 900.00,
        images: ['/fac_tennis_1.jpg'],
        description: 'A state-of-the-art synthetic hard tennis court with professional netting and surrounding fences. Perfect for coaching and friendly matches.',
        amenities: ['Floodlights', 'Parking', 'Drinking Water', 'Restrooms'],
        open_time: '00:00:00',
        close_time: '23:59:00',
        slot_duration: 60,
        status: 'active'
      },
      {
        name: 'Vadodara Tennis Academy',
        type: 'tennis',
        location: 'Akota Ring Road, Vadodara',
        price_per_hour: 700.00,
        images: ['/fac_tennis_2.jpg'],
        description: 'High-quality indoor clay tennis courts. Fully ventilated and well-lit. Professional coaching available.',
        amenities: ['Locker Room', 'Restrooms', 'Parking', 'Water Dispenser'],
        open_time: '00:00:00',
        close_time: '23:59:00',
        slot_duration: 60,
        status: 'active'
      },
      {
        name: 'Bhavnagar Tennis Club',
        type: 'tennis',
        location: 'Sardar Nagar, Bhavnagar',
        price_per_hour: 500.00,
        images: ['/fac_tennis_3.jpg'],
        description: 'Versatile outdoor tennis court with modern acrylic surface, night floodlights, and coaching staff.',
        amenities: ['Night Lights', 'Restrooms', 'Parking', 'Drinking Water'],
        open_time: '00:00:00',
        close_time: '23:59:00',
        slot_duration: 60,
        status: 'active'
      },
      {
        name: 'Ahmedabad Pickleball Hub',
        type: 'pickleball',
        location: 'Bopal, Ahmedabad',
        price_per_hour: 600.00,
        images: ['/fac_pickleball_1.jpg'],
        description: 'A vibrant pickleball court with premium USAPA-approved surfaces. Perfect for the fastest growing sport in Gujarat.',
        amenities: ['Paddle Rental', 'Parking', 'Drinking Water', 'Restrooms'],
        open_time: '00:00:00',
        close_time: '23:59:00',
        slot_duration: 60,
        status: 'active'
      },
      {
        name: 'Surat Pickleball Club',
        type: 'pickleball',
        location: 'Dumas Road, Surat',
        price_per_hour: 650.00,
        images: ['/fac_pickleball_2.jpg'],
        description: 'Dedicated indoor pickleball courts with professional lighting, equipment retail shop, and coaching.',
        amenities: ['Air Conditioning', 'Equipment Store', 'Showers', 'Parking'],
        open_time: '00:00:00',
        close_time: '23:59:00',
        slot_duration: 60,
        status: 'active'
      },
      {
        name: 'Gandhinagar Pickleball Court',
        type: 'pickleball',
        location: 'Sector 21, Gandhinagar',
        price_per_hour: 550.00,
        images: ['/fac_pickleball_3.jpg'],
        description: 'Beautiful outdoor pickleball courts surrounded by greenery. Excellent lighting for night sessions.',
        amenities: ['Floodlights', 'Parking', 'Restrooms', 'Water Dispenser'],
        open_time: '00:00:00',
        close_time: '23:59:00',
        slot_duration: 60,
        status: 'active'
      }
    ];

    for (const f of defaultFacilities) {
      console.log(`Seeding facility: ${f.name}`);
      await query(`
        INSERT INTO facilities (name, type, location, price_per_hour, images, description, amenities, open_time, close_time, slot_duration, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [f.name, f.type, f.location, f.price_per_hour, f.images, f.description, f.amenities, f.open_time, f.close_time, f.slot_duration, f.status]);
    }

    console.log('Seeded default facilities.');



    console.log('Database initialization completed successfully.');
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
};
