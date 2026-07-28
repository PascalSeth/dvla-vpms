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

export const VRS_INVOICES: VrsInvoice[] = [];
