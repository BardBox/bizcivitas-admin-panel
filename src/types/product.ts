export interface ProductFormData {
    desc?: (string | undefined)[];
    title: string;
    price: number;
    discount?: number;
    type: string;
    size: string;
    categoryId: string;
    stocks: number;
}
