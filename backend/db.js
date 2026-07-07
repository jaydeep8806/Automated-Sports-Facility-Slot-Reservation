import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'Asia/Kolkata'").catch(err => console.error('Error setting timezone:', err));
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
        status VARCHAR(50) DEFAULT 'Unverified',
        verification_otp VARCHAR(6),
        otp_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure table has the status, verification_otp and otp_expiry columns if it was already created
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Unverified',
      ADD COLUMN IF NOT EXISTS verification_otp VARCHAR(6),
      ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
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
        `INSERT INTO users (name, email, password, role, phone, status) VALUES 
         ($1, $2, $3, $4, $5, 'Verified')`,
        ['System Administrator', 'admin@sports.com', adminHash, 'admin', '1234567890']
      );

      await query(
        `INSERT INTO users (name, email, password, role, phone, status) VALUES 
         ($1, $2, $3, $4, $5, 'Verified')`,
        ['John Doe', 'user@sports.com', userHash, 'user', '9876543210']
      );

      console.log('Seeded Users:');
      console.log(' - Admin: admin@sports.com / admin123');
      console.log(' - User: user@sports.com / user123');
    }

    // Always ensure default seeded users are verified
    await query(`
      UPDATE users SET status = 'Verified' 
      WHERE email IN ('admin@sports.com', 'user@sports.com') AND (status != 'Verified' OR status IS NULL)
    `);

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

    // ─── CANTEEN TABLES ───────────────────────────────────────────────────────

    // 6. Food Categories
    await query(`
      CREATE TABLE IF NOT EXISTS food_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(10) DEFAULT '🍽️',
        display_order INTEGER DEFAULT 0
      );
    `);

    // 7. Food Items
    await query(`
      CREATE TABLE IF NOT EXISTS food_items (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES food_categories(id) ON DELETE SET NULL,
        facility_id INTEGER REFERENCES facilities(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        price NUMERIC(10,2) NOT NULL,
        image_url TEXT DEFAULT '',
        is_veg BOOLEAN DEFAULT TRUE,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Food Orders
    await query(`
      CREATE TABLE IF NOT EXISTS food_orders (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        facility_id INTEGER REFERENCES facilities(id) ON DELETE SET NULL,
        items JSONB NOT NULL DEFAULT '[]',
        total_price NUMERIC(10,2) NOT NULL,
        delivery_time VARCHAR(20) DEFAULT 'before',
        payment_method VARCHAR(20) DEFAULT 'canteen',
        payment_status VARCHAR(30) DEFAULT 'pending',
        order_status VARCHAR(30) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Seed food categories (only if empty)
    const catCheck = await query('SELECT COUNT(*) FROM food_categories');
    if (parseInt(catCheck.rows[0].count) === 0) {
      console.log('Seeding food categories...');
      const categories = [
        { name: 'Snacks', icon: '🍿', display_order: 1 },
        { name: 'Fast Food', icon: '🍔', display_order: 2 },
        { name: 'Drinks', icon: '🥤', display_order: 3 },
        { name: 'Tea & Coffee', icon: '☕', display_order: 4 },
      ];
      for (const cat of categories) {
        await query(
          'INSERT INTO food_categories (name, icon, display_order) VALUES ($1, $2, $3)',
          [cat.name, cat.icon, cat.display_order]
        );
      }
      console.log('Seeded food categories.');
    }

    // 10. Seed food items (only if empty)
    const itemCheck = await query('SELECT COUNT(*) FROM food_items');
    if (parseInt(itemCheck.rows[0].count) === 0) {
      console.log('Seeding food items...');
      // Get category ids
      const cats = await query('SELECT id, name FROM food_categories ORDER BY display_order');
      const catMap = {};
      for (const c of cats.rows) catMap[c.name] = c.id;

      const foodItems = [
        // Snacks
        { category: 'Snacks', name: 'French Fries', description: 'Crispy golden fries with seasoning and dip', price: 90, is_veg: true, image_url: 'https://images.unsplash.com/photo-1630431341973-02e1b662ec35?w=400&q=80' },
        { category: 'Snacks', name: 'Veg Samosa (2 pcs)', description: 'Flaky pastry filled with spiced potato and peas', price: 40, is_veg: true, image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80' },
        { category: 'Snacks', name: 'Peanut Chikki', description: 'Classic jaggery peanut brittle, energy on the go', price: 20, is_veg: true, image_url: 'https://images.unsplash.com/photo-1548940740-204726a19be3?w=400&q=80' },
        // Fast Food
        { category: 'Fast Food', name: 'Veg Burger', description: 'Crispy aloo tikki patty with lettuce and special sauce', price: 120, is_veg: true, image_url: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=400&q=80' },
        { category: 'Fast Food', name: 'Chicken Burger', description: 'Juicy grilled chicken fillet with mayo and veggies', price: 160, is_veg: false, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
        { category: 'Fast Food', name: 'Veg Pizza (6")', description: 'Cheesy margherita with fresh veggies on thin crust', price: 250, is_veg: true, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80' },
        { category: 'Fast Food', name: 'Veg Sandwich', description: 'Grilled veggie sandwich with mint chutney', price: 100, is_veg: true, image_url: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&q=80' },
        { category: 'Fast Food', name: 'Chicken Roll', description: 'Spicy chicken wrapped in flaky paratha', price: 140, is_veg: false, image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80' },
        // Drinks
        { category: 'Drinks', name: 'Coca-Cola (300 ml)', description: 'Ice-cold refreshing cola', price: 40, is_veg: true, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
        { category: 'Drinks', name: 'Water Bottle (1 L)', description: 'Chilled packaged mineral water', price: 20, is_veg: true, image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80' },
        { category: 'Drinks', name: 'Fresh Lime Soda', description: 'Sweet or salted – your choice', price: 50, is_veg: true, image_url: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80' },
        // Tea & Coffee
        { category: 'Tea & Coffee', name: 'Masala Chai', description: 'Traditional spiced milk tea', price: 20, is_veg: true, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
        { category: 'Tea & Coffee', name: 'Hot Coffee', description: 'Rich filter coffee or instant — pick your brew', price: 40, is_veg: true, image_url: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=400&q=80' },
      ];

      for (const item of foodItems) {
        await query(
          `INSERT INTO food_items (category_id, name, description, price, image_url, is_veg, is_available)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
          [catMap[item.category], item.name, item.description, item.price, item.image_url, item.is_veg]
        );
      }
      console.log('Seeded food items.');
    } else {
      // Always refresh image URLs so fixes propagate to existing DB rows
      const imageUpdates = [
        { name: 'French Fries',         image_url: 'https://images.unsplash.com/photo-1630431341973-02e1b662ec35?w=400&q=80' },
        { name: 'Veg Samosa (2 pcs)',    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80' },
        { name: 'Peanut Chikki',         image_url: 'https://images.unsplash.com/photo-1548940740-204726a19be3?w=400&q=80' },
        { name: 'Veg Burger',            image_url: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=400&q=80' },
        { name: 'Chicken Burger',        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
        { name: 'Veg Pizza (6")',        image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80' },
        { name: 'Veg Sandwich',          image_url: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&q=80' },
        { name: 'Chicken Roll',          image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80' },
        { name: 'Coca-Cola (300 ml)',    image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
        { name: 'Water Bottle (1 L)',    image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80' },
        { name: 'Fresh Lime Soda',       image_url: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80' },
        { name: 'Masala Chai',           image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
        { name: 'Hot Coffee',            image_url: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=400&q=80' },
      ];
      for (const u of imageUpdates) {
        await query('UPDATE food_items SET image_url = $1 WHERE name = $2', [u.image_url, u.name]);
      }
      console.log('Refreshed food item images.');
    }



    console.log('Database initialization completed successfully.');
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
};
