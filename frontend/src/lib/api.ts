import axios, { type AxiosInstance } from 'axios';

const BASE_URL = 'https://dmify-app.onrender.com';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    return localStorage.getItem('dmify_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('dmify_token', token);
  }

  private clearAuth(): void {
    localStorage.removeItem('dmify_token');
    localStorage.removeItem('dmify_user');
  }

  async signup(email: string, password: string, name: string) {
    const response = await this.api.post('/auth/signup', { email, password, name });
    return response.data;
  }

  async verifyEmail(email: string, code: string) {
    const response = await this.api.post('/auth/verify-email', { email, code });
    return response.data;
  }

  async resendVerification(email: string) {
    const response = await this.api.post('/auth/resend-verification', { email });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      this.setToken(response.data.access_token);
      localStorage.setItem('dmify_user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async logout() {
    await this.api.post('/auth/logout');
    this.clearAuth();
  }

  async getProjects() {
    const response = await this.api.get('/projects/');
    return response.data;
  }

  async createProject(name: string, productInfo: string, offerInfo: string) {
    const response = await this.api.post('/projects/', {
      name,
      product_info: productInfo,
      offer_info: offerInfo,
    });
    return response.data;
  }

  async getProject(id: string) {
    const response = await this.api.get(`/projects/${id}`);
    return response.data;
  }

  async updateProject(id: string, name?: string, productInfo?: string, offerInfo?: string) {
    const updates: any = {};
    if (name) updates.name = name;
    if (productInfo) updates.product_info = productInfo;
    if (offerInfo) updates.offer_info = offerInfo;

    const response = await this.api.put(`/projects/${id}`, updates);
    return response.data;
  }

  async deleteProject(id: string) {
    const response = await this.api.delete(`/projects/${id}`);
    return response.data;
  }

  async generateDM(projectId: string, username: string) {
    const response = await this.api.post(`/scrape/projects/${projectId}/generate`, {
      username: username.replace('@', ''),
    }, {
      timeout: 60000, // 60 seconds timeout for DM generation
    });
    return response.data;
  }

  async getProjectMessages(projectId: string) {
    const response = await this.api.get(`/scrape/projects/${projectId}/messages`);
    return response.data;
  }

  async getAllMessages() {
    const response = await this.api.get('/scrape/messages');
    return response.data;
  }

  async updateMessage(projectId: string, messageId: string, generatedMessage: string) {
    const response = await this.api.put(`/scrape/projects/${projectId}/messages/${messageId}`, {
      generated_message: generatedMessage,
    });
    return response.data;
  }

  // Async DM Generation methods
  async queueDMGeneration(projectId: string, username: string) {
    const response = await this.api.post(`/scrape/projects/${projectId}/queue`, {
      username: username.replace('@', ''),
    });
    return response.data;
  }

  async getDMJobStatus(jobId: string) {
    const response = await this.api.get(`/scrape/jobs/${jobId}`);
    return response.data;
  }

  async getProjectDMJobs(projectId: string) {
    const response = await this.api.get(`/scrape/projects/${projectId}/jobs`);
    return response.data;
  }

  async cancelDMJob(jobId: string) {
    const response = await this.api.delete(`/scrape/jobs/${jobId}`);
    return response.data;
  }

  // Payment methods
  async getPaymentPlans() {
    const response = await this.api.get('/payments/plans');
    return response.data;
  }

  async createCheckoutSession(planId: string) {
    const response = await this.api.post('/payments/create-checkout', {
      plan_id: planId,
    });
    return response.data;
  }

  async getUserCredits() {
    const response = await this.api.get('/payments/credits');
    return response.data;
  }

  async getPaymentHistory() {
    const response = await this.api.get('/payments/history');
    return response.data;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): any {
    const user = localStorage.getItem('dmify_user');
    return user ? JSON.parse(user) : null;
  }
}

export const apiService = new ApiService();
export default apiService;
