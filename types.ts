
export enum CourseType {
  ULT = 'ULT',
  PRE_BASIC_AVSEC = 'Pre Basic Avsec',
  SCREENER = 'Screener',
  PET = 'PET',
  BPET = 'BPET',
  PULWAMA = 'Pulwama',
  CRT = 'CRT',
  QRT = 'QRT',
  DGR = 'DGR',
  DRON = 'Dron',
  MAAN = 'MAAN',
  INDUCTION = 'Induction',
  FAMILIARISATION = 'Familiarisation',
  WT = 'WT',
  E_SCREENING = 'E-Screening',
  E_PATHSHALA = 'E-pathshala',
  IGOT = 'IGOT',
  WOMEN_LEADERSHIP = 'Women Leadership',
  BEHAVIOUR_DETECTION = 'Behaviour Detection',
  ART_OF_LEAVING = 'Art of Leaving',
  WOMEN_OUTDOOR = 'Women Outdoor Course',
  SOFT_SKILLS = 'Soft Skills',
  FINANCIAL_LITERACY = 'Financial Literacy',
  SECTOR_SPECIFIC = 'Sector Specific',
  CYBERSECURITY = 'Cybersecurity',
  OTHERS = 'Others'
}

export interface ActivityReport {
  id: string;
  courseId: CourseType;
  date: string;
  dateTo?: string;
  timeFrom: string;
  timeTo: string;
  topics: string;
  instructor: string;
  gos: number;
  sosMale: number;
  sosFemale: number;
  orsMale: number;
  orsFemale: number;
  totalMale: number;
  totalFemale: number;
  grandTotal: number;
  location: string;
  remarks: string;
  timestamp: number;
}

export type EligibilityStatus = 
  | 'BASIC ELIGIBLE' 
  | 'SCR ELIGIBLE' 
  | 'DGR ELIGIBLE'
  | 'REFRESHER DUE';

export interface StaffRecord {
  id: string;
  sNo: string;
  cisfNo: string;
  rank: string;
  name: string;
  dob: string;
  doa: string;
  qualification: string;
  // Specific Course Date Pairs
  basicFrom: string;
  basicTo: string;
  basicRefFrom: string;
  basicRefTo: string;
  scrFrom: string;
  scrTo: string;
  dgrFrom: string;
  dgrTo: string;
  // Metadata
  astiName: string;
  regNo: string;
  ebcasId: string;
  aadharNo: string;
  aepNo: string;
  idCardNo: string;
  mobileNo: string;
  emailId: string;
  status: EligibilityStatus;
  timestamp: number;
}
