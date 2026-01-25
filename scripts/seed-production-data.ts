import { neon } from "@neondatabase/serverless";

const NEON_DATABASE_URL = process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL;
if (!NEON_DATABASE_URL) {
  console.error("Error: EXTERNAL_DATABASE_URL or DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(NEON_DATABASE_URL);

const locations = [
  { name: "Office - Devaryamjal", type: "office", address: "Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-Malkajigiri District - 500078", capacity: 0 },
  { name: "Sale - Devaryamjal 659 & 661", type: "sale", address: "Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-Malkajigiri District - 500078", capacity: 5000 },
  { name: "Storage/Packing/Processing - Devaryamjal 659 & 661", type: "storage", address: "Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-Malkajigiri District - 500078", capacity: 10000 },
  { name: "Storage/Packing/Processing - Prabhavati Seeds", type: "storage", address: "C/o Prabhavati Seeds, Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-Malkajigiri District - 500078", capacity: 10000 },
  { name: "Storage/Packing/Processing - Sri Sai Harsha Seeds", type: "storage", address: "C/o Sri Sai Harsha Seeds, Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-Malkajigiri District - 500078", capacity: 8000 },
  { name: "Gnr Cold Storage - Raj Bollaram", type: "cold_storage", address: "C/o Gnr Cold Storage, Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-Malkajigiri District - 501401", capacity: 15000 },
  { name: "Gubba Cold Storage - Yellampet 85/B", type: "cold_storage", address: "C/o Gubba Cold Storage, Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-Malkajigiri District - 501401", capacity: 20000 },
  { name: "Gubba Cold Storage - IDA Medchal 109, 111", type: "cold_storage", address: "C/o Gubba Cold Storage Pvt Ltd, Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-Malkajigiri District - 501401", capacity: 25000 },
  { name: "Gubbs Green Cold - Athevelli", type: "cold_storage", address: "C/o Gubbs Green Cold, Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-Malkajigiri District - 501401", capacity: 15000 },
  { name: "Gubba Cold Storage - Athevelli 150 & 151", type: "cold_storage", address: "C/o Gubba Cold Storage, Sy. No. 150 & 151, Athevelli, Near Rekula Bavi, Atevelle (V), Medchal (M), Medchal-Malkajigiri District - 501401", capacity: 20000 },
  { name: "Gubba Cold Storage - IDA Medchal 101 & 103", type: "cold_storage", address: "C/o Gubba Cold Storage Pvt Ltd, Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-Malkajigiri District - 501401", capacity: 22000 },
  { name: "Gubba Cold Storage - Yellampet 84 C & G", type: "cold_storage", address: "C/o Gubba Cold Storage, Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-Malkajigiri District - 501401", capacity: 18000 },
  { name: "Gubba Cold Storage - Kandlakoya 255", type: "cold_storage", address: "C/o Gubba Cold Storage Pvt Ltd, Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-Malkajigiri District - 501401", capacity: 20000 },
  { name: "Thrimural Thirupathi Agro Cold Storage", type: "cold_storage", address: "C/o Thrimural Thirupathi Agro Cold Storage Pvt Ltd, Plot No 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-Malkajigiri District - 501401", capacity: 25000 },
  { name: "Himalaya Cold Storage - Somaram", type: "cold_storage", address: "C/o Himalaya Cold Storage, Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-Malkajigiri District - 501401", capacity: 15000 },
  { name: "Storage/Packing/Processing - Soni Biogene Kompally", type: "storage", address: "C/o Soni Biogene, 2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-Malkajigiri District - 500014", capacity: 8000 },
  { name: "Storage/Packing/Processing - Ayyan Seeds", type: "storage", address: "C/o Ayyan Seeds, Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-Malkajigiri District - 501401", capacity: 10000 },
  { name: "Storage - Primary Agri Coop Society Utoor", type: "storage", address: "C/o The Primary Agricultural Coop Society, Utoor, 2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar District - 505505", capacity: 5000 },
  { name: "Processing/Storage - GMR Hi Technology Seeds", type: "processing", address: "GMR Hi Technology Seeds, Main Road, Pachchunur (V), Manakondur (M), Karimnagar District - 505505", capacity: 8000 },
  { name: "Processing/Packing/Storage - Vinayaka Seeds & Farms", type: "processing", address: "C/o Vinayaka Seeds & Farms, Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar District - 505469", capacity: 10000 },
  { name: "Main Office/Processing/Packing/Sale/Storage", type: "office", address: "Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-Malkajigiri District - 500078", capacity: 15000 },
  { name: "Sale/Processing/Packing/Storage - Patti Toopran", type: "processing", address: "Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle [Patti Tupra] (V), Manoharabad (M), Medak District - 502334", capacity: 12000 },
];

const products = [
  // Notified Varieties
  { cropName: "Tomato", variety: "ARKA VIKAS", type: "notified" },
  { cropName: "Tomato", variety: "S-22", type: "notified" },
  { cropName: "Brinjal", variety: "BHAGYAMATI", type: "notified" },
  { cropName: "Brinjal", variety: "Gulabi", type: "notified" },
  { cropName: "Brinjal", variety: "Syamala", type: "notified" },
  { cropName: "Brinjal", variety: "PPL", type: "notified" },
  { cropName: "Bhendi", variety: "ARKA ANAMIKA", type: "notified" },
  { cropName: "Chilli", variety: "PUSA JWALA", type: "notified" },
  { cropName: "Paddy", variety: "BPT-5204 (SAMBA MASURI)", type: "notified" },
  { cropName: "Paddy", variety: "MTU-1010", type: "notified" },
  { cropName: "Paddy", variety: "TELLA HAMSA", type: "notified" },
  { cropName: "Paddy", variety: "RNR-15048 (TELANGANA SONA)", type: "notified" },
  { cropName: "Bitter Gourd", variety: "GREEN LONG", type: "notified" },
  { cropName: "Bottle Gourd", variety: "PSPL", type: "notified" },
  { cropName: "Cucumber", variety: "GREEN LONG", type: "notified" },
  { cropName: "Cucumber", variety: "YELLOW ROUND", type: "notified" },
  { cropName: "Ridge Gourd", variety: "JAIPUR LONG", type: "notified" },
  { cropName: "Snake Gourd", variety: "SWETHA", type: "notified" },
  { cropName: "Amaranthus", variety: "RNA 1", type: "notified" },
  { cropName: "Cluster Bean", variety: "PUSA NAVBAHAR", type: "notified" },
  { cropName: "Dolichos Bean", variety: "PUSA EARLY PROLIFIC", type: "notified" },
  { cropName: "Dolichos Bean", variety: "RND-1", type: "notified" },
  { cropName: "Spinach", variety: "ALL GREEN", type: "notified" },
  { cropName: "Cowpea", variety: "PUSA KOMAL", type: "notified" },
  { cropName: "Black Gram", variety: "T-9", type: "notified" },
  { cropName: "Red Gram", variety: "ICPL-85063 (LAXMI)", type: "notified" },
  { cropName: "Coriander", variety: "CS 4", type: "notified" },
  
  // Private Research Varieties
  { cropName: "Maize", variety: "RISHI-11", type: "private_research" },
  { cropName: "Maize", variety: "RISHI-22", type: "private_research" },
  { cropName: "Maize", variety: "RISHI-33", type: "private_research" },
  { cropName: "Maize", variety: "RISHI-44", type: "private_research" },
  { cropName: "Maize", variety: "RISHI-55", type: "private_research" },
  { cropName: "Maize", variety: "RISHI-66", type: "private_research" },
  { cropName: "Bitter Gourd", variety: "RISHI-18", type: "private_research" },
  { cropName: "Bitter Gourd", variety: "APSARA", type: "private_research" },
  { cropName: "Bottle Gourd", variety: "SWETHA", type: "private_research" },
  { cropName: "Bottle Gourd", variety: "REKHA", type: "private_research" },
  { cropName: "Cucumber", variety: "HARINI", type: "private_research" },
  { cropName: "Ridge Gourd", variety: "RHR-786", type: "private_research" },
  { cropName: "Watermelon", variety: "RISHI-5", type: "private_research" },
  { cropName: "Watermelon", variety: "HIMABINDU", type: "private_research" },
  { cropName: "Bhendi", variety: "RHB-101", type: "private_research" },
  { cropName: "Bhendi", variety: "JOSH", type: "private_research" },
  { cropName: "Bhendi", variety: "NEHA", type: "private_research" },
  { cropName: "Chilli", variety: "YAGNA", type: "private_research" },
  { cropName: "Chilli", variety: "GREESHMA", type: "private_research" },
  { cropName: "Chilli", variety: "RHC-623", type: "private_research" },
  { cropName: "Chilli", variety: "RHC-633", type: "private_research" },
  { cropName: "Chilli", variety: "RHC-613", type: "private_research" },
  { cropName: "Chilli", variety: "RHC-678", type: "private_research" },
  { cropName: "Tomato", variety: "RHT-900", type: "private_research" },
  { cropName: "Tomato", variety: "RHT-910", type: "private_research" },
  { cropName: "Tomato", variety: "RHT-918", type: "private_research" },
  { cropName: "Tomato", variety: "RHT-990", type: "private_research" },
  { cropName: "Tomato", variety: "RHT-550", type: "private_research" },
  { cropName: "Cluster Bean", variety: "RISHI-111", type: "private_research" },
  { cropName: "Dolichos Bean", variety: "RDS-222", type: "private_research" },
  { cropName: "Dolichos Bean", variety: "RDS-333", type: "private_research" },
  { cropName: "Bajra", variety: "RISHI-555", type: "private_research" },
  { cropName: "Jowar", variety: "RSH-20", type: "private_research" },
  { cropName: "Castor", variety: "RHC-09", type: "private_research" },
  { cropName: "Castor", variety: "RHC-19", type: "private_research" },
  { cropName: "Red Gram", variety: "ARUN", type: "private_research" },
  { cropName: "Sunflower", variety: "RHS-117", type: "private_research" },
  { cropName: "Sunflower", variety: "RHS-118", type: "private_research" },
  { cropName: "Paddy", variety: "NANDIKA-55", type: "private_research" },
  { cropName: "French Bean", variety: "RDS-333", type: "private_research" },
];

async function seedData() {
  console.log("Starting seed for production Neon database...\n");

  // First, clear existing data
  console.log("Clearing existing locations and products...");
  await sql`DELETE FROM locations WHERE id > 0`;
  await sql`DELETE FROM products WHERE id > 0`;

  // Seed locations
  console.log("\nSeeding locations...");
  for (const loc of locations) {
    try {
      await sql`
        INSERT INTO locations (name, type, address, capacity)
        VALUES (${loc.name}, ${loc.type}, ${loc.address}, ${loc.capacity})
      `;
      console.log(`  + Added location: ${loc.name}`);
    } catch (error: any) {
      console.log(`  ! Skipped (may already exist): ${loc.name}`);
    }
  }

  // Seed products
  console.log("\nSeeding products/varieties...");
  for (const prod of products) {
    try {
      await sql`
        INSERT INTO products (crop, variety, type)
        VALUES (${prod.cropName}, ${prod.variety}, ${prod.type})
      `;
      console.log(`  + Added product: ${prod.cropName} - ${prod.variety}`);
    } catch (error: any) {
      console.log(`  ! Skipped (may already exist): ${prod.cropName} - ${prod.variety}`);
    }
  }

  console.log("\n=== Seed completed ===");
  console.log(`Locations: ${locations.length}`);
  console.log(`Products: ${products.length}`);
}

seedData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
