import { supabase } from '../lib/supabase';
import { Admin } from './adminService';

const ADMIN_SESSION_KEY = 'admin_session';
const ADMIN_SESSION_TIMEOUT = 30 * 60 * 1000;

interface AdminSession {
  userId: string;
  email: string;
  lastActivity: number;
  expiresAt: number;
}

class AdminSessionService {
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  saveSession(userId: string, email: string): void {
    const now = Date.now();
    const session: AdminSession = {
      userId,
      email,
      lastActivity: now,
      expiresAt: now + ADMIN_SESSION_TIMEOUT
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }

  getSession(): AdminSession | null {
    const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionData) return null;

    try {
      const session: AdminSession = JSON.parse(sessionData);
      return session;
    } catch {
      return null;
    }
  }

  updateActivity(): void {
    const session = this.getSession();
    if (!session) return;

    const now = Date.now();
    session.lastActivity = now;
    session.expiresAt = now + ADMIN_SESSION_TIMEOUT;
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }

  isSessionValid(): boolean {
    const session = this.getSession();
    if (!session) return false;

    const now = Date.now();
    return now < session.expiresAt;
  }

  clearSession(): void {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  startSessionMonitoring(onExpire: () => void): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(() => {
      if (!this.isSessionValid()) {
        this.clearSession();
        if (this.sessionCheckInterval) {
          clearInterval(this.sessionCheckInterval);
          this.sessionCheckInterval = null;
        }
        onExpire();
      }
    }, 10000);
  }

  stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  async signInAdmin(email: string, password: string): Promise<{ success: boolean; admin?: Admin; error?: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (authData.user && authData.session) {
        const { data: adminData, error: adminError } = await supabase
          .rpc('get_admin_by_user_id', { p_user_id: authData.user.id });

        console.log('Admin access check:', {
          adminData,
          adminError,
          userId: authData.user.id,
          type: typeof adminData,
          isArray: Array.isArray(adminData),
          length: Array.isArray(adminData) ? adminData.length : 'N/A'
        });

        if (adminError) {
          console.error('Admin query error:', adminError);
          await supabase.auth.signOut();
          return { success: false, error: 'حدث خطأ في التحقق من الصلاحيات' };
        }

        const admin = Array.isArray(adminData) && adminData.length > 0 ? adminData[0] : null;

        if (!admin) {
          console.error('No admin record found for user:', authData.user.id);
          await supabase.auth.signOut();
          return { success: false, error: 'ليس لديك صلاحيات الوصول للوحة التحكم' };
        }

        console.log('✅ Admin authenticated:', admin.email, admin.role);

        this.saveSession(authData.user.id, email);

        return { success: true, admin };
      }

      return { success: false, error: 'فشل تسجيل الدخول' };
    } catch (err: any) {
      console.error('SignIn error:', err);
      return {
        success: false,
        error: err.message === 'Invalid login credentials'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : 'حدث خطأ أثناء تسجيل الدخول'
      };
    }
  }

  async signOutAdmin(): Promise<void> {
    this.stopSessionMonitoring();
    this.clearSession();
    await supabase.auth.signOut();
  }

  async validateAdminSession(): Promise<Admin | null> {
    console.log('🔍 validateAdminSession: Starting validation');

    const localSession = this.getSession();
    console.log('🔍 validateAdminSession: Local session:', localSession ? 'exists' : 'none');

    if (!this.isSessionValid()) {
      console.log('❌ validateAdminSession: Session not valid or expired');
      this.clearSession();
      return null;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🔍 validateAdminSession: Auth user:', {
        userId: user?.id,
        error: userError
      });

      if (userError || !user) {
        console.log('❌ validateAdminSession: No user found or error');
        this.clearSession();
        return null;
      }

      const { data: adminData, error } = await supabase
        .rpc('get_admin_by_user_id', { p_user_id: user.id });

      console.log('🔍 validateAdminSession: RPC response:', {
        error,
        dataType: typeof adminData,
        isArray: Array.isArray(adminData),
        length: Array.isArray(adminData) ? adminData.length : 'N/A'
      });

      const admin = Array.isArray(adminData) && adminData.length > 0 ? adminData[0] : null;

      if (error) {
        console.log('❌ validateAdminSession: RPC error:', error);
        this.clearSession();
        return null;
      }

      if (!admin) {
        console.log('❌ validateAdminSession: No admin data found');
        this.clearSession();
        return null;
      }

      console.log('✅ validateAdminSession: Success!', {
        email: admin.email,
        role: admin.role,
        isActive: admin.is_active
      });
      this.updateActivity();
      return admin;
    } catch (err) {
      console.error('❌ validateAdminSession: Exception:', err);
      this.clearSession();
      return null;
    }
  }
}

export const adminSessionService = new AdminSessionService();
