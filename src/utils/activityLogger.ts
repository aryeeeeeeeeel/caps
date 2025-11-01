// src/utils/activityLogger.ts - Activity and System Logging Utilities
import { supabase } from './supabaseClient';

// Get client IP and user agent
const getClientInfo = () => {
  return {
    ip_address: '127.0.0.1', // In a real app, you'd get this from request headers
    user_agent: navigator.userAgent || 'Unknown'
  };
};

// Check if user exists in the users table
const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_email')
      .eq('user_email', email)
      .single();
    
    return !error && data !== null;
  } catch (error) {
    return false;
  }
};

// User Activity Logging Functions
export const logUserActivity = async (
  activityType: string,
  activityDescription: string,
  details: any = {},
  userEmail?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !userEmail) {
      console.warn('No user found for activity logging');
      return;
    }

    const email = userEmail || user?.email;
    if (!email) {
      console.warn('No email found for activity logging');
      return;
    }

    // Check if user exists in users table before logging
    const userExists = await checkUserExists(email);
    if (!userExists) {
      console.warn(`User ${email} not found in users table, skipping activity log`);
      return;
    }

    const clientInfo = getClientInfo();

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_email: email,
        activity_type: activityType,
        activity_description: activityDescription,
        details: details,
        ip_address: clientInfo.ip_address,
        user_agent: clientInfo.user_agent
      });

    if (error) {
      // More specific error handling for RLS/unauthorized errors
      const errorCode = error.code;
      const errorMessage = error.message;
      
      if (errorCode === '42501' || 
          errorMessage.includes('row-level security') || 
          errorMessage.includes('policy') ||
          errorCode === 'PGRST301' ||
          errorMessage.includes('JWT')) {
        console.debug('Activity log skipped due to RLS/unauthorized - this is expected for unauthenticated actions');
        return;
      }
      
      console.error('Error logging user activity:', error);
    }
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};

// System Logging Functions (Admin Activities)
export const logSystemActivity = async (
  activityType: string,
  activityDescription: string,
  details: any = {},
  targetUserEmail?: string,
  targetReportId?: string,
  adminEmail?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !adminEmail) {
      console.warn('No admin user found for system logging');
      return;
    }

    const email = adminEmail || user?.email;
    if (!email) {
      console.warn('No admin email found for system logging');
      return;
    }

    const clientInfo = getClientInfo();

    const { error } = await supabase
      .from('system_logs')
      .insert({
        admin_email: email,
        activity_type: activityType,
        activity_description: activityDescription,
        target_user_email: targetUserEmail,
        target_report_id: targetReportId,
        details: details,
        ip_address: clientInfo.ip_address,
        user_agent: clientInfo.user_agent
      });

    if (error) {
      console.error('Error logging system activity:', error);
    }
  } catch (error) {
    console.error('Error logging system activity:', error);
  }
};

// Update user status without activity logging
export const updateUserStatus = async (email: string, status: string, isOnline: boolean) => {
  try {
    const userExists = await checkUserExists(email);
    if (!userExists) {
      console.warn(`User ${email} not found in users table, skipping status update`);
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ 
        status: status,
        is_online: isOnline,
        last_active_at: new Date().toISOString() 
      })
      .eq('user_email', email);

    if (error) {
      console.error('Error updating user status:', error);
    }
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

// Specific User Activity Logging Functions
export const logUserLogin = async (userEmail?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = userEmail || user?.email;
    
    if (email) {
      await updateUserStatus(email, 'active', true);
      await logUserActivity(
        'login',
        'User logged in successfully',
        { timestamp: new Date().toISOString() },
        email
      );
    }
  } catch (error) {
    console.error('Error logging user login:', error);
  }
};

export const logUserLogout = async (userEmail?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = userEmail || user?.email;
    
    if (email) {
      await updateUserStatus(email, 'inactive', false);
      await logUserActivity(
        'logout',
        'User logged out',
        { timestamp: new Date().toISOString() },
        email
      );
    }
  } catch (error) {
    console.error('Error logging user logout:', error);
  }
};

export const logUserReportSubmission = async (reportId: string, reportTitle: string, userEmail?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = userEmail || user?.email;
    
    if (email) {
      const userExists = await checkUserExists(email);
      if (!userExists) {
        console.warn(`User ${email} not found in users table, skipping report submission log`);
        return;
      }

      await logUserActivity(
        'report',
        'Submitted incident report',
        { 
          report_id: reportId,
          report_title: reportTitle,
          timestamp: new Date().toISOString()
        },
        email
      );
    }
  } catch (error) {
    console.error('Error logging report submission:', error);
  }
};

export const logUserFeedbackSubmission = async (reportId: string, rating: number, userEmail?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = userEmail || user?.email;
    
    if (email) {
      const userExists = await checkUserExists(email);
      if (!userExists) {
        console.warn(`User ${email} not found in users table, skipping feedback log`);
        return;
      }

      await logUserActivity(
        'feedback',
        'Submitted feedback for report',
        { 
          report_id: reportId,
          rating: rating,
          timestamp: new Date().toISOString()
        },
        email
      );
    }
  } catch (error) {
    console.error('Error logging feedback submission:', error);
  }
};

export const logUserProfileUpdate = async (updatedFields: string[], userEmail?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = userEmail || user?.email;
    
    if (email) {
      const userExists = await checkUserExists(email);
      if (!userExists) {
        console.warn(`User ${email} not found in users table, skipping profile update log`);
        return;
      }

      await logUserActivity(
        'profile',
        'Updated profile information',
        { 
          updated_fields: updatedFields,
          timestamp: new Date().toISOString()
        },
        email
      );
    }
  } catch (error) {
    console.error('Error logging profile update:', error);
  }
};

export const logUserRegistration = async (userEmail: string, firstName: string, lastName: string) => {
  try {
    const userExists = await checkUserExists(userEmail);
    if (!userExists) {
      console.warn(`User ${userEmail} not found in users table, skipping registration log`);
      return;
    }

    await logUserActivity(
      'registration',
      'New user registered',
      { 
        first_name: firstName,
        last_name: lastName,
        timestamp: new Date().toISOString()
      },
      userEmail
    );
  } catch (error) {
    console.error('Error logging user registration:', error);
  }
};

// Specific System Activity Logging Functions
export const logAdminLogin = async (adminEmail?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = adminEmail || user?.email;
    
    if (email) {
      await logSystemActivity(
        'login',
        'Admin logged in successfully',
        { timestamp: new Date().toISOString() },
        undefined,
        undefined,
        email
      );
    }
  } catch (error) {
    console.error('Error logging admin login:', error);
  }
};

export const logAdminLogout = async (adminEmail?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = adminEmail || user?.email;
    
    if (email) {
      await logSystemActivity(
        'logout',
        'Admin logged out',
        { timestamp: new Date().toISOString() },
        undefined,
        undefined,
        email
      );
    }
  } catch (error) {
    console.error('Error logging admin logout:', error);
  }
};

export const logUserNotification = async (userEmail: string, notificationType: string, adminEmail?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = adminEmail || user?.email;
    
    if (email) {
      await logSystemActivity(
        'notify',
        `Sent ${notificationType} notification to user`,
        { 
          notification_type: notificationType,
          timestamp: new Date().toISOString()
        },
        userEmail,
        undefined,
        email
      );
    }
  } catch (error) {
    console.error('Error logging user notification:', error);
  }
};

export const logReportStatusUpdate = async (
  reportId: string, 
  oldStatus: string, 
  newStatus: string, 
  adminEmail?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = adminEmail || user?.email;
    
    if (email) {
      await logSystemActivity(
        'update_report',
        `Updated report status from ${oldStatus} to ${newStatus}`,
        { 
          old_status: oldStatus,
          new_status: newStatus,
          timestamp: new Date().toISOString()
        },
        undefined,
        reportId,
        email
      );
    }
  } catch (error) {
    console.error('Error logging report status update:', error);
  }
};

export const logUserAction = async (
  action: string,
  targetUserEmail: string,
  details: any = {},
  adminEmail?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = adminEmail || user?.email;
    
    if (email) {
      await logSystemActivity(
        'user_action',
        `Performed ${action} on user`,
        { 
          action: action,
          ...details,
          timestamp: new Date().toISOString()
        },
        targetUserEmail,
        undefined,
        email
      );
    }
  } catch (error) {
    console.error('Error logging user action:', error);
  }
};

export const logUserWarning = async (targetUserEmail: string, warningReason: string, adminEmail?: string) => {
  try {
    await logUserAction(
      'warn',
      targetUserEmail,
      { warning_reason: warningReason },
      adminEmail
    );
  } catch (error) {
    console.error('Error logging user warning:', error);
  }
};

export const logUserSuspension = async (targetUserEmail: string, suspensionReason: string, adminEmail?: string) => {
  try {
    await logUserAction(
      'suspend',
      targetUserEmail,
      { suspension_reason: suspensionReason },
      adminEmail
    );
  } catch (error) {
    console.error('Error logging user suspension:', error);
  }
};

export const logUserBan = async (targetUserEmail: string, banReason: string, adminEmail?: string) => {
  try {
    await logUserAction(
      'ban',
      targetUserEmail,
      { ban_reason: banReason },
      adminEmail
    );
  } catch (error) {
    console.error('Error logging user ban:', error);
  }
};

export const logUserActivation = async (targetUserEmail: string, adminEmail?: string) => {
  try {
    await logUserAction(
      'activate',
      targetUserEmail,
      {},
      adminEmail
    );
  } catch (error) {
    console.error('Error logging user activation:', error);
  }
};

export const logSystemEvent = async (eventType: string, description: string, details: any = {}, adminEmail?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = adminEmail || user?.email;
    
    if (email) {
      await logSystemActivity(
        'system',
        description,
        { 
          event_type: eventType,
          ...details,
          timestamp: new Date().toISOString()
        },
        undefined,
        undefined,
        email
      );
    }
  } catch (error) {
    console.error('Error logging system event:', error);
  }
};

// Safe activity logging for admin actions that might involve non-existent users
export const logAdminActivitySafely = async (
  activityType: string,
  activityDescription: string,
  details: any = {},
  userEmail?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No admin user found for activity logging');
      return;
    }

    const email = userEmail || user?.email;
    if (!email) {
      console.warn('No email found for activity logging');
      return;
    }

    // For admin actions, we can log to system_logs instead of activity_logs
    // to avoid foreign key constraints with the users table
    await logSystemActivity(
      activityType,
      activityDescription,
      details,
      userEmail,
      undefined,
      user.email
    );
  } catch (error) {
    console.error('Error logging admin activity safely:', error);
  }
};