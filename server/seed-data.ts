import { db } from "./db";
import { products, locations, employees, roles } from "@shared/schema";
import { eq } from "drizzle-orm";

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

export async function seedEmployees() {
  const existing = await db.select({ employeeId: employees.employeeId }).from(employees);
  if (existing.length > 1) {
    console.log(`Employees already seeded (${existing.length} found), skipping.`);
    return;
  }

  if (existing.length === 1 && existing[0].employeeId === "EMP001") {
    await db.delete(employees).where(eq(employees.employeeId, "EMP001"));
  }

  const stateMap: Record<string, string> = {
    "TS": "Telangana", "Ts": "Telangana", "ts": "Telangana",
    "MP": "Madhya Pradesh", "Mp": "Madhya Pradesh",
    "UP": "Uttar Pradesh", "Up": "Uttar Pradesh",
    "CG": "Chhattisgarh", "Cg": "Chhattisgarh", "cg": "Chhattisgarh",
    "Rs": "Telangana",
  };

  const departmentMap: Record<string, string> = {
    "Managing Director": "Management",
    "Adm Plant": "Administration",
    "Plant Accounts": "Accounts",
    "Plant Quality executive": "Quality",
    "Plant SR.Production": "Production",
    "Plant SEM": "Sales",
    "Plant Sales Officer": "Sales",
    "Plant TSM": "Sales",
    "Plant RM": "Sales",
    "Plant ASM": "Sales",
    "Plant Sales": "Sales",
    "Plant So": "Sales",
    "Plant PROCESSING & PACKING INCHARGE": "Production",
    "PLANT OPERATOR": "Production",
    "Auditer": "Accounts",
    "PO(research associate)": "Research",
    "Veg Packing Incharge": "Packaging",
    "F/A": "Field",
    "F/a": "Field",
    "SO": "Sales",
    "So": "Sales",
    "Sales": "Sales",
    "Production": "Production",
    "Driver": "Operations",
    "Plant RM": "Sales",
  };

  const employeeData = [
    { employeeId: "EMP001", fullName: "V. Prathap Reddy", role: "Managing Director", department: "Management", salaryType: "monthly", basicSalary: "44568", hra: "38997", otherAllowances: "22856", workLocation: "Hyderabad", phone: "", email: "", status: "active" },
    { employeeId: "EMP002", fullName: "Avula Krupakar", role: "Adm Plant", department: "Administration", salaryType: "monthly", basicSalary: "44575", hra: "39003", otherAllowances: "22660", workLocation: "Hyderabad", phone: "", email: "", status: "active" },
    { employeeId: "EMP003", fullName: "Katta Gopi", role: "Plant Accounts", department: "Accounts", salaryType: "monthly", basicSalary: "11000", hra: "9625", otherAllowances: "2130", workLocation: "Hyderabad", phone: "9177058951", email: "kattagopi1996@gmail.com", status: "active" },
    { employeeId: "EMP004", fullName: "Siripothula Naresh", role: "Plant Quality Executive", department: "Quality", salaryType: "monthly", basicSalary: "12320", hra: "10780", otherAllowances: "3342", workLocation: "Hyderabad", phone: "8008699646", email: "nareshsiripothula9@gmail.com", status: "active" },
    { employeeId: "EMP005", fullName: "Boddu Sandeep", role: "Plant SR. Production", department: "Production", salaryType: "monthly", basicSalary: "12760", hra: "11165", otherAllowances: "3496", workLocation: "Karimnagar", phone: "9700352457", email: "boddu.sandeep143@gmail.com", status: "active" },
    { employeeId: "EMP006", fullName: "Sikke Purushotham", role: "Plant SEM", department: "Sales", salaryType: "monthly", basicSalary: "11000", hra: "9625", otherAllowances: "3188", workLocation: "Siddipet", phone: "9908140108", email: "purushotham.sikke@gmail.com", status: "active" },
    { employeeId: "EMP007", fullName: "Tekulapally Anil Reddy", role: "Plant Sales Officer", department: "Sales", salaryType: "monthly", basicSalary: "12000", hra: "10500", otherAllowances: "7500", workLocation: "Gajwel", phone: "8885726608", email: "anilreddy121212tekulapally@gmail.com", status: "active" },
    { employeeId: "EMP008", fullName: "Mahendra Kumar Baghel", role: "Plant TSM", department: "Sales", salaryType: "monthly", basicSalary: "10920", hra: "9555", otherAllowances: "6825", workLocation: "Seoni", phone: "9131056815", email: "mahendrakhusi1983@gmail.com", status: "active" },
    { employeeId: "EMP009", fullName: "Raj Kumar Singh", role: "Plant RM", department: "Sales", salaryType: "monthly", basicSalary: "22464", hra: "19656", otherAllowances: "5806", workLocation: "Shadool", phone: "9981411847", email: "rk3612@gmail.com", status: "active" },
    { employeeId: "EMP010", fullName: "Amit Singh Baghel", role: "Plant ASM", department: "Sales", salaryType: "monthly", basicSalary: "12320", hra: "10780", otherAllowances: "3650", workLocation: "Katni", phone: "9644101304", email: "amitsingh1994.baghel@gmail.com", status: "active" },
    { employeeId: "EMP011", fullName: "Dinesh Kumar Thakur", role: "Plant Sales", department: "Sales", salaryType: "monthly", basicSalary: "8800", hra: "7700", otherAllowances: "2194", workLocation: "Ramanujanagar", phone: "9753757177", email: "dineshthakur9753@gmail.com", status: "active" },
    { employeeId: "EMP012", fullName: "Dharmendra Kumar", role: "Plant SEM", department: "Sales", salaryType: "monthly", basicSalary: "6560", hra: "5740", otherAllowances: "1596", workLocation: "Bahjoi", phone: "9105942637", email: "shivafourmulation@gmail.com", status: "active" },
    { employeeId: "EMP013", fullName: "Rahul Kumar", role: "Plant SEM", department: "Sales", salaryType: "monthly", basicSalary: "7176", hra: "6279", otherAllowances: "1606", workLocation: "Auriya", phone: "9897635990", email: "9897635990r@gmail.com", status: "active" },
    { employeeId: "EMP014", fullName: "Babaloo Kumar", role: "Plant SO", department: "Sales", salaryType: "monthly", basicSalary: "6760", hra: "5915", otherAllowances: "1596", workLocation: "Lakhimpur", phone: "9889024859", email: "rahulnverma1991@gmail.com", status: "active" },
    { employeeId: "EMP015", fullName: "Shailender Singh", role: "Plant RM", department: "Sales", salaryType: "monthly", basicSalary: "24000", hra: "21000", otherAllowances: "13300", workLocation: "Agra", phone: "9719144955", email: "shailendra.rishiseeds@gmail.com", status: "active" },
    { employeeId: "EMP016", fullName: "Viswanatha Reddy", role: "Auditor", department: "Accounts", salaryType: "monthly", basicSalary: "3600", hra: "3150", otherAllowances: "2250", workLocation: "Hyderabad", phone: "", email: "", status: "active" },
    { employeeId: "EMP017", fullName: "Bolli Divya", role: "PO (Research Associate)", department: "Research", salaryType: "monthly", basicSalary: "6800", hra: "5950", otherAllowances: "4250", workLocation: "Hyderabad", phone: "9640855645", email: "bollidivya18@gmail.com", status: "active" },
    { employeeId: "EMP018", fullName: "Mudunuri Swathi", role: "Veg Packing Incharge", department: "Packaging", salaryType: "monthly", basicSalary: "6000", hra: "5250", otherAllowances: "3750", workLocation: "Hyderabad", phone: "63032361969", email: "kashukashu1111@gmail.com", status: "active" },
    { employeeId: "EMP019", fullName: "Chinthala Praveen", role: "Processing & Packing Incharge", department: "Production", salaryType: "monthly", basicSalary: "12400", hra: "10850", otherAllowances: "7750", workLocation: "Konaipally", phone: "9908036812", email: "chpraveenps143@gmail.com", status: "active" },
    { employeeId: "EMP020", fullName: "Ravelli Devender", role: "Plant Operator", department: "Production", salaryType: "monthly", basicSalary: "9600", hra: "8400", otherAllowances: "6000", workLocation: "Konaipally", phone: "9959731825", email: "ravellidevender123@gmail.com", status: "active" },
    { employeeId: "EMP021", fullName: "K Rajkumar", role: "Field Associate", department: "Field", salaryType: "monthly", basicSalary: "6000", hra: "5250", otherAllowances: "3750", workLocation: "Gopalraopet", phone: "6302587459", email: "naniprince6302@gmail.com", status: "active" },
    { employeeId: "EMP022", fullName: "Dharmani Mahesh", role: "Plant Operator", department: "Production", salaryType: "monthly", basicSalary: "6000", hra: "5250", otherAllowances: "3750", workLocation: "Hyderabad", phone: "9908008836", email: "maheshdharmani62642@gmail.com", status: "active" },
    { employeeId: "EMP023", fullName: "Birendra Kumar Tandi", role: "Sales Officer", department: "Sales", salaryType: "monthly", basicSalary: "6400", hra: "5600", otherAllowances: "4000", workLocation: "Saraipali", phone: "6265149504", email: "tandibirendra993@gmail.com", status: "active" },
    { employeeId: "EMP024", fullName: "Vikas Mishra", role: "Sales", department: "Sales", salaryType: "monthly", basicSalary: "7200", hra: "6300", otherAllowances: "4500", workLocation: "Sidhi", phone: "8090245256", email: "Mishravikas5434@gmail.com", status: "active" },
    { employeeId: "EMP025", fullName: "Suneel Sahu", role: "Field Associate", department: "Field", salaryType: "monthly", basicSalary: "7200", hra: "6300", otherAllowances: "4500", workLocation: "Gadasarai", phone: "9575235447", email: "sahuji7434@gmail.com", status: "active" },
    { employeeId: "EMP026", fullName: "Abhishek Singh Parihar", role: "Field Associate", department: "Field", salaryType: "monthly", basicSalary: "6400", hra: "5600", otherAllowances: "4000", workLocation: "Satna", phone: "8878096675", email: "abhiparihar326@gmail.com", status: "active" },
    { employeeId: "EMP027", fullName: "Anil Sharma", role: "Field Associate", department: "Field", salaryType: "monthly", basicSalary: "7200", hra: "6300", otherAllowances: "4500", workLocation: "Beohari", phone: "9826481067", email: "Sharmaa38079@gmail.com", status: "active" },
    { employeeId: "EMP028", fullName: "Guna Shekar", role: "Driver", department: "Operations", salaryType: "monthly", basicSalary: "6800", hra: "5950", otherAllowances: "4250", workLocation: "Hyderabad", phone: "8522077311", email: "gunasekhar4236@gmail.com", status: "active" },
    { employeeId: "EMP029", fullName: "Gajje Narsimha", role: "Sales Officer", department: "Sales", salaryType: "monthly", basicSalary: "8800", hra: "7700", otherAllowances: "5500", workLocation: "Amangal", phone: "9705942135", email: "narsimhagoud7748@gmail.com", status: "active" },
    { employeeId: "EMP030", fullName: "Kavuri Dinesh Babu", role: "Production", department: "Production", salaryType: "monthly", basicSalary: "16000", hra: "14000", otherAllowances: "10000", workLocation: "Hyderabad", phone: "9849581838", email: "dinukavuri@gmail.com", status: "active" },
    { employeeId: "EMP031", fullName: "Lalit Kumar Choudhary", role: "Sales Officer", department: "Sales", salaryType: "monthly", basicSalary: "7000", hra: "6125", otherAllowances: "4375", workLocation: "Balaghat", phone: "9165744720", email: "lalitchoudhary3892@gmail.com", status: "active" },
    { employeeId: "EMP032", fullName: "Vivek Singh", role: "Sales Officer", department: "Sales", salaryType: "monthly", basicSalary: "8800", hra: "7700", otherAllowances: "5500", workLocation: "Rewa", phone: "9589466784", email: "viveksingh9589466784@gmail.com", status: "active" },
    { employeeId: "EMP033", fullName: "Horil Singh", role: "Sales Officer", department: "Sales", salaryType: "monthly", basicSalary: "7600", hra: "6650", otherAllowances: "4750", workLocation: "Deosar, Singrauli", phone: "6266974681", email: "horilsingh1989@gmail.com", status: "active" },
    { employeeId: "EMP034", fullName: "Shovit Kumar Pandey", role: "Sales Officer", department: "Sales", salaryType: "monthly", basicSalary: "6400", hra: "5600", otherAllowances: "4000", workLocation: "Bareilly", phone: "8126553341", email: "shovitpandey777@gmail.com", status: "active" },
    { employeeId: "EMP035", fullName: "Krishna Kumar", role: "Sales Officer", department: "Sales", salaryType: "monthly", basicSalary: "8480", hra: "7420", otherAllowances: "5300", workLocation: "Pathalgaon", phone: "8795843192", email: "krishnakumaryadav3458@gmail.com", status: "active" },
    { employeeId: "EMP036", fullName: "Mahamad Gulsher Ansari", role: "Sales Officer", department: "Sales", salaryType: "monthly", basicSalary: "7200", hra: "6300", otherAllowances: "4500", workLocation: "Balarampur", phone: "9340644510", email: "mg6733482@gmail.com", status: "active" },
  ];

  let inserted = 0;
  for (const emp of employeeData) {
    try {
      await db.insert(employees).values({
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        role: emp.role,
        department: emp.department,
        salaryType: emp.salaryType,
        basicSalary: emp.basicSalary,
        hra: emp.hra,
        otherAllowances: emp.otherAllowances,
        workLocation: emp.workLocation,
        phone: emp.phone || undefined,
        email: emp.email || undefined,
        status: emp.status,
        password: emp.employeeId,
      }).onConflictDoNothing();
      inserted++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`Inserted ${inserted} employees`);
}

export async function seedRoles() {
  const existing = await db.select({ id: roles.id }).from(roles);
  if (existing.length > 0) {
    console.log(`Roles already seeded (${existing.length} found), skipping.`);
    return;
  }

  const viewOnly = {
    dashboard: ["view"],
    batches: ["view"],
    locations: ["view"],
    stock: ["view"],
    packaging: ["view"],
    products: ["view"],
    employees: [],
    attendance: [],
    payroll: [],
    users: [],
    reports: ["view"],
    lots: ["view"],
    processing: ["view"],
    outward: ["view"],
    packagingSizes: ["view"],
  };

  const roleData = [
    {
      name: "Managing Director",
      description: "Full access to all modules",
      permissions: {
        dashboard: ["view"], batches: ["view", "create", "edit", "delete"],
        locations: ["view", "create", "edit", "delete"], stock: ["view", "create", "edit", "delete"],
        packaging: ["view", "create", "edit", "delete"], products: ["view", "create", "edit", "delete"],
        employees: ["view", "create", "edit", "delete"], attendance: ["view", "create", "edit", "delete"],
        payroll: ["view", "create", "edit", "delete"], users: ["view", "create", "edit", "delete"],
        reports: ["view"], lots: ["view", "create", "edit", "delete"],
        processing: ["view", "create", "edit", "delete"], outward: ["view", "create", "edit", "delete"],
        packagingSizes: ["view", "create", "edit", "delete"],
      },
    },
    {
      name: "Adm Plant",
      description: "Plant administration with full operational access",
      permissions: {
        dashboard: ["view"], batches: ["view", "create", "edit"],
        locations: ["view", "create", "edit"], stock: ["view", "create", "edit"],
        packaging: ["view", "create", "edit"], products: ["view", "create", "edit"],
        employees: ["view", "create", "edit"], attendance: ["view", "create", "edit"],
        payroll: ["view"], users: [],
        reports: ["view"], lots: ["view", "create", "edit"],
        processing: ["view", "create", "edit"], outward: ["view", "create", "edit"],
        packagingSizes: ["view", "create", "edit"],
      },
    },
    {
      name: "Plant Accounts",
      description: "Plant accounts and financial operations",
      permissions: {
        dashboard: ["view"], batches: ["view"],
        locations: ["view"], stock: ["view"],
        packaging: ["view"], products: ["view"],
        employees: ["view"], attendance: ["view"],
        payroll: ["view", "create", "edit"], users: [],
        reports: ["view"], lots: ["view"],
        processing: ["view"], outward: ["view"],
        packagingSizes: ["view"],
      },
    },
    {
      name: "Auditor",
      description: "Read-only audit access to all modules",
      permissions: {
        dashboard: ["view"], batches: ["view"],
        locations: ["view"], stock: ["view"],
        packaging: ["view"], products: ["view"],
        employees: ["view"], attendance: ["view"],
        payroll: ["view"], users: [],
        reports: ["view"], lots: ["view"],
        processing: ["view"], outward: ["view"],
        packagingSizes: ["view"],
      },
    },
    {
      name: "Plant Quality Executive",
      description: "Quality control and inspection",
      permissions: {
        ...viewOnly,
        stock: ["view", "create", "edit"],
        lots: ["view", "create", "edit"],
        processing: ["view", "create", "edit"],
        packaging: ["view", "create", "edit"],
      },
    },
    {
      name: "Plant SR. Production",
      description: "Senior production management",
      permissions: {
        ...viewOnly,
        stock: ["view", "create", "edit"],
        lots: ["view", "create", "edit"],
        processing: ["view", "create", "edit"],
        packaging: ["view", "create", "edit"],
      },
    },
    {
      name: "Processing & Packing Incharge",
      description: "Processing and packing operations management",
      permissions: {
        ...viewOnly,
        stock: ["view", "create", "edit"],
        lots: ["view", "create", "edit"],
        processing: ["view", "create", "edit"],
        packaging: ["view", "create", "edit"],
        packagingSizes: ["view", "create"],
      },
    },
    {
      name: "Plant Operator",
      description: "Plant production operations",
      permissions: {
        ...viewOnly,
        stock: ["view", "create"],
        lots: ["view", "create"],
        processing: ["view", "create"],
        packaging: ["view", "create"],
      },
    },
    {
      name: "Production",
      description: "Production department operations",
      permissions: {
        ...viewOnly,
        stock: ["view", "create", "edit"],
        lots: ["view", "create", "edit"],
        processing: ["view", "create", "edit"],
        packaging: ["view", "create", "edit"],
      },
    },
    {
      name: "Veg Packing Incharge",
      description: "Vegetable seed packing operations",
      permissions: {
        ...viewOnly,
        packaging: ["view", "create", "edit"],
        packagingSizes: ["view", "create"],
        lots: ["view"],
        stock: ["view"],
      },
    },
    {
      name: "PO (Research Associate)",
      description: "Research and product development",
      permissions: {
        ...viewOnly,
        products: ["view", "create", "edit"],
        lots: ["view", "create"],
        processing: ["view", "create"],
      },
    },
    {
      name: "Plant RM",
      description: "Regional Manager - sales territory management",
      permissions: {
        ...viewOnly,
        stock: ["view"],
        lots: ["view"],
        outward: ["view", "create", "edit"],
      },
    },
    {
      name: "Plant TSM",
      description: "Territory Sales Manager",
      permissions: {
        ...viewOnly,
        outward: ["view", "create", "edit"],
      },
    },
    {
      name: "Plant ASM",
      description: "Area Sales Manager",
      permissions: {
        ...viewOnly,
        outward: ["view", "create", "edit"],
      },
    },
    {
      name: "Plant Sales Officer",
      description: "Sales operations at plant level",
      permissions: {
        ...viewOnly,
        outward: ["view", "create", "edit"],
      },
    },
    {
      name: "Plant Sales",
      description: "Sales operations",
      permissions: {
        ...viewOnly,
        outward: ["view", "create"],
      },
    },
    {
      name: "Plant SEM",
      description: "Sales Executive Manager",
      permissions: {
        ...viewOnly,
        outward: ["view", "create"],
      },
    },
    {
      name: "Plant SO",
      description: "Sales Officer",
      permissions: {
        ...viewOnly,
        outward: ["view", "create"],
      },
    },
    {
      name: "Sales Officer",
      description: "Field sales officer",
      permissions: {
        ...viewOnly,
        outward: ["view", "create", "edit"],
      },
    },
    {
      name: "Sales",
      description: "Sales team member",
      permissions: {
        ...viewOnly,
        outward: ["view", "create"],
      },
    },
    {
      name: "Field Associate",
      description: "Field operations and farmer coordination",
      permissions: {
        ...viewOnly,
        outward: ["view", "create"],
      },
    },
    {
      name: "Driver",
      description: "Transport and logistics",
      permissions: {
        dashboard: ["view"],
        batches: [], locations: ["view"],
        stock: ["view"], packaging: [],
        products: [], employees: [],
        attendance: [], payroll: [],
        users: [], reports: [],
        lots: ["view"], processing: [],
        outward: ["view"], packagingSizes: [],
      },
    },
  ];

  let inserted = 0;
  for (const role of roleData) {
    try {
      await db.insert(roles).values({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      }).onConflictDoNothing();
      inserted++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`Inserted ${inserted} roles`);
}
