
import { userStorage } from "@/utils/userStorage";
import { toast } from "sonner";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthChangeListener = (state: AuthState) => void;

class AuthService {
  private user: User | null = null;
  private isLoading: boolean = true;
  private listeners: AuthChangeListener[] = [];
  
  constructor() {
    // Load user from localStorage on initialization
    this.loadUser();
  }
  
  /**
   * Load user from localStorage
   */
  private loadUser(): void {
    const storedUser = userStorage.get(this.user?.id, 'currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Ensure the parsed date is a Date object
        userData.createdAt = new Date(userData.createdAt);
        this.user = userData;
        this.isLoading = false;
        this.notifyListeners();
      } catch (error) {
        console.error('Error parsing stored user data', error);
        this.clearUser();
      }
    } else {
      this.isLoading = false;
      this.notifyListeners();
    }
  }
  
  /**
   * Save user to localStorage
   */
  private saveUser(user: User): void {
    userStorage.set(this.user?.id, 'currentUser', JSON.stringify(user));
  }
  
  /**
   * Clear user from localStorage
   */
  private clearUser(): void {
    localStorage.removeItem('currentUser');
    this.user = null;
    this.notifyListeners();
  }
  
  /**
   * Notify all listeners of auth state change
   */
  private notifyListeners(): void {
    const state: AuthState = {
      user: this.user,
      isAuthenticated: !!this.user,
      isLoading: this.isLoading
    };
    
    this.listeners.forEach(listener => listener(state));
  }
  
  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(listener: AuthChangeListener): () => void {
    this.listeners.push(listener);
    
    // Immediately call the listener with the current state
    listener({
      user: this.user,
      isAuthenticated: !!this.user,
      isLoading: this.isLoading
    });
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Get current auth state
   */
  getCurrentState(): AuthState {
    return {
      user: this.user,
      isAuthenticated: !!this.user,
      isLoading: this.isLoading
    };
  }
  
  /**
   * Register a new user
   */
  async register(email: string, password: string, firstName?: string, lastName?: string): Promise<User> {
    try {
      // In a real app, this would be a call to Supabase Auth
      // Here we'll simulate the registration process with the local storage implementation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating network delay
      
      // Check if email is already in use
      const users = this.getStoredUsers();
      if (users.some(user => user.email === email)) {
        throw new Error('Email already in use');
      }
      
      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        firstName,
        lastName,
        createdAt: new Date()
      };
      
      // Store user in users collection
      users.push({
        ...newUser,
        password // In a real app, NEVER store passwords in localStorage or client
      });
      this.storeUsers(users);
      
      // Store auth credential
      this.user = newUser;
      this.saveUser(newUser);
      this.notifyListeners();
      
      toast.success('Account created successfully');
      return newUser;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
      throw error;
    }
  }
  
  /**
   * Login a user
   */
  async login(email: string, password: string): Promise<User> {
    try {
      // In a real app, this would be a call to your backend API or auth service
      // Here we'll simulate the login process
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating network delay
      
      // Find user with matching email and password
      const users = this.getStoredUsers();
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Create user without password
      const authUser: User = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: new Date(user.createdAt)
      };
      
      // Store auth credential
      this.user = authUser;
      this.saveUser(authUser);
      this.notifyListeners();
      
      toast.success('Logged in successfully');
      return authUser;
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in');
      throw error;
    }
  }
  
  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      // In a real app, this would be a call to your backend API or auth service
      // Here we'll just clear the local user state
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulating network delay
      
      this.clearUser();
      toast.info('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out');
      throw error;
    }
  }
  
  /**
   * Helper to get users from localStorage
   */
  private getStoredUsers(): any[] {
    const storedUsers = localStorage.getItem('users');
    return storedUsers ? JSON.parse(storedUsers) : [];
  }
  
  /**
   * Helper to store users in localStorage
   */
  private storeUsers(users: any[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }
}

// Create and export a singleton instance
export const authService = new AuthService();
