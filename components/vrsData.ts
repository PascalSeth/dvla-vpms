export interface VrsInvoice {
  invoiceNo: string;
  bookingType: string;
  classification: string;
  regNo: string;
  ownerName: string;
  address: string;
  phone: string;
  make: string;
  yearModel: string;
  engineCC: string;
  cylinders: string;
  engineNo: string;
  chassisNo: string;
  bodyType: string;
  fuelType: string;
  netWeight: string;
  grossWeight: string;
  tyreFW: string;
  tyreFD: string;
  tyreMW: string;
  tyreMD: string;
  tyreRW: string;
  tyreRD: string;
}

export const VRS_INVOICES: VrsInvoice[] = [
  {
    invoiceNo: "40726012083437",
    bookingType: "REGISTRATION",
    classification: "PRIVATE",
    regNo: "AD 0891-26",
    ownerName: "Kwame Asante",
    address: "Plot 14, Adentan Frafraha, Greater Accra Region",
    phone: "+233 24 456 7890",
    make: "Toyota",
    yearModel: "Corolla 2024",
    engineCC: "1800",
    cylinders: "4",
    engineNo: "1ZR-FE-407260",
    chassisNo: "KMHDK41D7NU407260",
    bodyType: "Saloon",
    fuelType: "PETROL",
    netWeight: "1190",
    grossWeight: "1560",
    tyreFW: "195",
    tyreFD: "15",
    tyreMW: "",
    tyreMD: "",
    tyreRW: "195",
    tyreRD: "15"
  },
  {
    invoiceNo: "40726012083438",
    bookingType: "REG_SPECIAL",
    classification: "COMMERCIAL",
    regNo: "AD 1242-26",
    ownerName: "Abena Mensah",
    address: "Block B, Oyibi New Site, Dodowa Road, Accra",
    phone: "+233 50 123 4567",
    make: "Hyundai",
    yearModel: "Tucson 2.0 Active 2023",
    engineCC: "2000",
    cylinders: "4",
    engineNo: "G4NA-HT-381920",
    chassisNo: "KM8JUCAL4NU198302",
    bodyType: "SUV / Station Wagon",
    fuelType: "PETROL",
    netWeight: "1680",
    grossWeight: "2145",
    tyreFW: "225",
    tyreFD: "17",
    tyreMW: "",
    tyreMD: "",
    tyreRW: "225",
    tyreRD: "17"
  },
  {
    invoiceNo: "40726012083439",
    bookingType: "REGISTRATION",
    classification: "PRIVATE",
    regNo: "AD 0729-26",
    ownerName: "Yaw Boateng",
    address: "No. 4 Otano Lane, Madina, Greater Accra Region",
    phone: "+233 24 555 8899",
    make: "Ford",
    yearModel: "Ranger Wildtrak 2024",
    engineCC: "2000",
    cylinders: "4",
    engineNo: "BI-TURBO-492100",
    chassisNo: "1FTFW1ED4MF829103",
    bodyType: "Pickup / Truck",
    fuelType: "DIESEL",
    netWeight: "1950",
    grossWeight: "3150",
    tyreFW: "265",
    tyreFD: "17",
    tyreMW: "",
    tyreMD: "",
    tyreRW: "265",
    tyreRD: "17"
  }
];
