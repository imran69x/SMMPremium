export class SMMSunAPI {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.SMMSUN_API_URL || 'https://my.smmsun.com/api/v2';
    this.apiKey = process.env.SMMSUN_API_KEY || '';
  }

  private async connect(postData: Record<string, any>) {
    const formData = new URLSearchParams();
    for (const key in postData) {
      formData.append(key, postData[key]);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0)'
        },
        body: formData.toString(),
      });
      return await response.json();
    } catch (error) {
      console.error('SMMSun API Error:', error);
      return null;
    }
  }

  async getServices() {
    return this.connect({
      key: this.apiKey,
      action: 'services',
    });
  }

  async getBalance() {
    return this.connect({
      key: this.apiKey,
      action: 'balance',
    });
  }

  async addOrder(data: Record<string, any>) {
    return this.connect({
      key: this.apiKey,
      action: 'add',
      ...data,
    });
  }

  async getOrderStatus(orderId: number | string) {
    return this.connect({
      key: this.apiKey,
      action: 'status',
      order: orderId,
    });
  }

  async getMultiStatus(orderIds: (number | string)[]) {
    return this.connect({
      key: this.apiKey,
      action: 'status',
      orders: orderIds.join(','),
    });
  }

  async refill(orderId: number | string) {
    return this.connect({
      key: this.apiKey,
      action: 'refill',
      order: orderId,
    });
  }
}

export const smmSun = new SMMSunAPI();
