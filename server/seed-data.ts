import { db } from "./db";
import { products, locations } from "@shared/schema";

export async function seedProductsAndWarehouses() {
  console.log("Seeding products and warehouses from license document...");

  // Notified Varieties
  const notifiedProducts = [
    { crop: "Tomato", variety: "ARKA VIKAS", type: "notified" },
    { crop: "Tomato", variety: "S-22", type: "notified" },
    { crop: "Brinjal", variety: "BHAGYAMATI", type: "notified" },
    { crop: "Brinjal", variety: "Gulabi", type: "notified" },
    { crop: "Brinjal", variety: "Syamala", type: "notified" },
    { crop: "Brinjal", variety: "PPL", type: "notified" },
    { crop: "Bhendi", variety: "ARKA ANAMIKA", type: "notified" },
    { crop: "Chilli", variety: "PUSA JWALA", type: "notified" },
    { crop: "Paddy", variety: "BPT-5204 (SAMBA MASURI)", type: "notified" },
    { crop: "Paddy", variety: "MTU-1010", type: "notified" },
    { crop: "Paddy", variety: "TELLA HAMSA", type: "notified" },
    { crop: "Paddy", variety: "RNR-15048 (TELANGANA SONA)", type: "notified" },
    { crop: "Bitter Gourd", variety: "GREEN LONG", type: "notified" },
    { crop: "Bottle Gourd", variety: "PSPL", type: "notified" },
    { crop: "Cucumber", variety: "GREEN LONG", type: "notified" },
    { crop: "Cucumber", variety: "YELLOW ROUND", type: "notified" },
    { crop: "Ridge Gourd", variety: "JAIPUR LONG", type: "notified" },
    { crop: "Snake Gourd", variety: "SWETHA", type: "notified" },
    { crop: "Amaranthus", variety: "RNA 1", type: "notified" },
    { crop: "Cluster Bean", variety: "PUSA NAVBAHAR", type: "notified" },
    { crop: "Dolichos Bean", variety: "PUSA EARLY PROLIFIC", type: "notified" },
    { crop: "Dolichos Bean", variety: "RND-1", type: "notified" },
    { crop: "Spinach", variety: "ALL GREEN", type: "notified" },
    { crop: "Cowpea", variety: "PUSA KOMAL", type: "notified" },
    { crop: "Black Gram", variety: "T-9", type: "notified" },
    { crop: "Red Gram", variety: "ICPL-85063 (LAXMI)", type: "notified" },
    { crop: "Coriander", variety: "CS 4", type: "notified" },
    { crop: "MAIZE", variety: "RCH-111 (MH-2601)", type: "notified" },
    { crop: "MAIZE", variety: "RCH-222 (MH-2602)", type: "notified" },
    { crop: "MAIZE", variety: "RCH-333 (MH-2603)", type: "notified" },
    { crop: "MAIZE", variety: "RCH-444 (MH-2604)", type: "notified" },
    { crop: "MAIZE", variety: "RCH-555 (MH-2605)", type: "notified" },
    { crop: "MAIZE", variety: "RCH-666 (MH-2606)", type: "notified" },
    { crop: "MAIZE", variety: "RCH-777 (MH-2607)", type: "notified" },
    { crop: "MAIZE", variety: "RCH-888 (MH-2608)", type: "notified" },
    { crop: "MAIZE", variety: "RCH-999 (MH-2609)", type: "notified" },
    { crop: "MAIZE", variety: "RCH-010 (MH-2610)", type: "notified" },
    { crop: "PADDY", variety: "RCH-101", type: "notified" },
    { crop: "PADDY", variety: "RCH-202", type: "notified" },
    { crop: "PADDY", variety: "RCH-303", type: "notified" },
    { crop: "COTTON", variety: "RCH-GOLD", type: "notified" },
    { crop: "COTTON", variety: "RCH-SILVER", type: "notified" },
    { crop: "COTTON", variety: "RCH-PLATINUM", type: "notified" },
  ];

  // Private Research Varieties
  const privateProducts = [
    { crop: "Maize", variety: "RISHI-11", type: "private_research" },
    { crop: "Maize", variety: "RISHI-22", type: "private_research" },
    { crop: "Maize", variety: "RISHI-33", type: "private_research" },
    { crop: "Maize", variety: "RISHI-44", type: "private_research" },
    { crop: "Maize", variety: "RISHI-55", type: "private_research" },
    { crop: "Maize", variety: "RISHI-66", type: "private_research" },
    { crop: "Bitter Gourd", variety: "RISHI-18", type: "private_research" },
    { crop: "Bitter Gourd", variety: "APSARA", type: "private_research" },
    { crop: "Bottle Gourd", variety: "SWETHA", type: "private_research" },
    { crop: "Bottle Gourd", variety: "REKHA", type: "private_research" },
    { crop: "Cucumber", variety: "HARINI", type: "private_research" },
    { crop: "Ridge Gourd", variety: "RHR-786", type: "private_research" },
    { crop: "Watermelon", variety: "RISHI-5", type: "private_research" },
    { crop: "Watermelon", variety: "HIMABINDU", type: "private_research" },
    { crop: "Bhendi", variety: "RHB-101", type: "private_research" },
    { crop: "Bhendi", variety: "JOSH", type: "private_research" },
    { crop: "Bhendi", variety: "NEHA", type: "private_research" },
    { crop: "Chilli", variety: "YAGNA", type: "private_research" },
    { crop: "Chilli", variety: "GREESHMA", type: "private_research" },
    { crop: "Chilli", variety: "RHC-623", type: "private_research" },
    { crop: "Chilli", variety: "RHC-633", type: "private_research" },
    { crop: "Chilli", variety: "RHC-613", type: "private_research" },
    { crop: "Chilli", variety: "RHC-678", type: "private_research" },
    { crop: "Tomato", variety: "RHT-900", type: "private_research" },
    { crop: "Tomato", variety: "RHT-910", type: "private_research" },
    { crop: "Tomato", variety: "RHT-918", type: "private_research" },
    { crop: "Tomato", variety: "RHT-990", type: "private_research" },
    { crop: "Tomato", variety: "RHT-550", type: "private_research" },
    { crop: "Cluster Bean", variety: "RISHI-111", type: "private_research" },
    { crop: "Dolichos Bean", variety: "RDS-222", type: "private_research" },
    { crop: "Dolichos Bean", variety: "RDS-333", type: "private_research" },
    { crop: "Bajra", variety: "RISHI-555", type: "private_research" },
    { crop: "Jowar", variety: "RSH-20", type: "private_research" },
    { crop: "Castor", variety: "RHC-09", type: "private_research" },
    { crop: "Castor", variety: "RHC-19", type: "private_research" },
    { crop: "Red Gram", variety: "ARUN", type: "private_research" },
    { crop: "Sunflower", variety: "RHS-117", type: "private_research" },
    { crop: "Sunflower", variety: "RHS-118", type: "private_research" },
    { crop: "Paddy", variety: "NANDIKA-55", type: "private_research" },
    { crop: "French Bean", variety: "RDS-333", type: "private_research" },
  ];

  const allProducts = [...notifiedProducts, ...privateProducts];

  // Warehouses from license document
  const warehouses = [
    { name: "Main Office - Devaryamjal", address: "Sy.No.713 Part, Sai Greeta Ashram Road, Devaryamjal, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078", type: "office" },
    { name: "Plant - Devaryamjal 659 & 661", address: "Sy. No. 659 & 661, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078", type: "storage" },
    { name: "Prabhavati Seeds - Devaryamjal", address: "Sy. No. 725, 726 & 727, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078", type: "storage" },
    { name: "Sri Sai Harsha Seeds - Devaryamjal", address: "Sy. No. 659, Devaryamjal, Near Svr Garden, Devar Yamjal (V), Shamirpet (M), Medchal-malkajigiri - 500078", type: "storage" },
    { name: "GNR Cold Storage - Raj Bollaram", address: "Sy. No. 46, Medicity Hospital Road, Near Medicity Hospital, Raj Bollaram (V), Medchal (M), Medchal-malkajigiri - 501401", type: "cold_storage" },
    { name: "Gubba Cold Storage - Yellampet 85/b", address: "Sy. No. 85/b, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401", type: "cold_storage" },
    { name: "Gubba Cold Storage - IDA Medchal 109", address: "Sy. No. 109, 111, Ida Medchal, Near Check Post Medchal, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401", type: "cold_storage" },
    { name: "Gubbs Green Cold - Athevelli 151", address: "Sy. No. 151/a/2, Athevelli, Near Rekulabavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401", type: "cold_storage" },
    { name: "Gubba Cold Storage - Athevelli 150", address: "Sy. No. 150 & 151, Athevelli, Nera Rekula Bavi, Atevelle (V), Medchal (M), Medchal-malkajigiri - 501401", type: "cold_storage" },
    { name: "Gubba Cold Storage - IDA Medchal 101", address: "Sy. No. 101 & 103, Ida Medchal, Near Medchal Checkpost, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401", type: "cold_storage" },
    { name: "Gubba Cold Storage - Yellampet 84", address: "Sy. No. 84 C & G, Yellampet, Yellampet (V), Medchal (M), Medchal-malkajigiri - 501401", type: "cold_storage" },
    { name: "Gubba Cold Storage - Kandlakoya", address: "Sy. No. 255, Kandlakoya, Kandlakoi (V), Medchal (M), Medchal-malkajigiri - 501401", type: "cold_storage" },
    { name: "Thrimural Thirupathi Agro Cold Storage - IDA Medchal", address: "Plot no 12 & 14, Sy. No. 862/2, Ida Medchal, Near Medchal Check Post, Medchal (V), Medchal (M), Medchal-malkajigiri - 501401", type: "cold_storage" },
    { name: "Himalaya Cold Storage - Somaram", address: "Sy. No. 169/a, Somaram, Somaram (V), Medchal (M), Medchal-malkajigiri - 501401", type: "cold_storage" },
    { name: "Soni Biogene - Kompally", address: "2-65, Sy. No. 99, Kompally, Petbashirabad (V), Quthbullapur (M), Medchal-malkajigiri - 500014", type: "storage" },
    { name: "Ayyan Seeds - Gundlapochampalli", address: "Sy. No. 85, Beside Emri, Near Sri Chaitanya Techno School, Gundlapochampalli (V), Medchal (M), Medchal-malkajigiri - 501401", type: "storage" },
    { name: "PACS Utoor - Karimnagar", address: "2-41/1/A, Utoor, Utoor (V), Manakondur (M), Karimnagar - 505505", type: "storage" },
    { name: "GMR Hi Technology Seeds - Pachchunur", address: "Main Road, Gmr Hi Technology Seeds, Pachchunur (V), Manakondur (M), Karimnagar - 505505", type: "storage" },
    { name: "Vinayaka Seeds & Farms - Pachchunur", address: "Sy.No. 82/A, Pachunur, Main Road, Pachchunur (V), Manakondur (M), Karimnagar - 505469", type: "storage" },
    { name: "Patti Toopran - Medak", address: "Sy.No.117 Part, 135 Part, Main Road, Patti Toopran, Konaipalle (V), Manoharabad (M), Medak - 502334", type: "storage" },
  ];

  // Insert products
  let productsInserted = 0;
  for (const product of allProducts) {
    try {
      await db.insert(products).values({
        crop: product.crop,
        variety: product.variety,
        type: product.type,
      }).onConflictDoNothing();
      productsInserted++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`Inserted ${productsInserted} products`);

  // Insert warehouses
  let warehousesInserted = 0;
  for (const warehouse of warehouses) {
    try {
      await db.insert(locations).values({
        name: warehouse.name,
        address: warehouse.address,
        type: warehouse.type,
      }).onConflictDoNothing();
      warehousesInserted++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`Inserted ${warehousesInserted} warehouses`);

  console.log("Seeding complete!");
}
