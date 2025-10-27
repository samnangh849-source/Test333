
export interface User {
  UserName: string;
  Password?: string; // Should not be stored in client state long-term
  FullName: string;
  Role: string;
  Team: string;
  IsSystemAdmin: boolean;
  ProfilePictureURL: string;
}

export interface Product {
    id: number;
    name: string;
    quantity: number;
    originalPrice: number;
    finalPrice: number;
    total: number;
    discountPercent: number;
    colorInfo: string;
    image: string;
}

export interface Order {
    page: string | null;
    telegramValue: string | null;
    customer: {
        name: string;
        phone: string;
        province: string;
        district: string;
        sangkat: string;
        additionalLocation: string;
        shippingFee: number;
    };
    products: Product[];
    shipping: {
        method: string | null;
        details: string | null;
        cost: number;
    };
    payment: {
        status: 'Paid' | 'Unpaid';
        info: string;
    };
    telegram: {
        schedule: boolean;
        time: string | null;
    };
    subtotal: number;
    grandTotal: number;
    note: string;
}

export interface AppData {
    users: User[];
    products: any[];
    teams: any[];
    locations: any[];
    shippingMethods: any[];
    drivers: any[];
    bankAccounts: any[];
    phoneCarriers: any[];
    telegramTemplates: any[];
    pages: any[];
    colors: any[];
    admin?: any; // For admin-specific data
}