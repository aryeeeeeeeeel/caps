// src/utils/activityLogger.ts - Activity and System Logging Utilities
import { supabase } from './supabaseClient';

// Get client IP and user agent
const getClientInfo = () => {
  return {
    ip_address: '127.0.0.1', // In a real app, you'd get this from request headers
    user_agent: navigator.userAgent || 'Unknown'
  };
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

// Specific User Activity Logging Functions
export const logUserLogin = async (userEmail?: string) => {
  await logUserActivity(
    'login',
    'User logged in successfully',
    { timestamp: new Date().toISOString() },
    userEmail
  );
  
  // Update user status to 'active' and set online status
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = userEmail || user?.email;
    
    if (email) {
      await supabase
        .from('users')
        .update({ 
          status: 'active',
          is_online: true,
          last_active_at: new Date().toISOString() 
        })
        .eq('user_email', email);
    }
  } catch (error) {
    console.error('Error updating user status on login:', error);
  }
};

export const logUserLogout = async (userEmail?: string) => {
  // Update user status to 'inactive' and set offline status
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = userEmail || user?.email;
    
    if (email) {
      await supabase
        .from('users')
        .update({ 
          status: 'inactive',
          is_online: false
        })
        .eq('user_email', email);
    }
  } catch (error) {
    console.error('Error updating user status on logout:', error);
  }
  
  await logUserActivity(
    'logout',
    'User logged out',
    { timestamp: new Date().toISOString() },
    userEmail
  );
};

export const logUserReportSubmission = async (reportId: string, reportTitle: string, userEmail?: string) => {
  await logUserActivity(
    'report',
    'Submitted incident report',
    { 
      report_id: reportId,
      report_title: reportTitle,
      timestamp: new Date().toISOString()
    },
    userEmail
  );
};

export const logUserFeedbackSubmission = async (reportId: string, rating: number, userEmail?: string) => {
  await logUserActivity(
    'feedback',
    'Submitted feedback for report',
    { 
      report_id: reportId,
      rating: rating,
      timestamp: new Date().toISOString()
    },
    userEmail
  );
};

export const logUserProfileUpdate = async (updatedFields: string[], userEmail?: string) => {
  await logUserActivity(
    'profile',
    'Updated profile information',
    { 
      updated_fields: updatedFields,
      timestamp: new Date().toISOString()
    },
    userEmail
  );
};

export const logUserRegistration = async (userEmail: string, firstName: string, lastName: string) => {
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
};

// Specific System Activity Logging Functions
export const logAdminLogin = async (adminEmail?: string) => {
  await logSystemActivity(
    'login',
    'Admin logged in successfully',
    { timestamp: new Date().toISOString() },
    undefined,
    undefined,
    adminEmail
  );
};

export const logAdminLogout = async (adminEmail?: string) => {
  await logSystemActivity(
    'logout',
    'Admin logged out',
    { timestamp: new Date().toISOString() },
    undefined,
    undefined,
    adminEmail
  );
};

export const logUserNotification = async (userEmail: string, notificationType: string, adminEmail?: string) => {
  await logSystemActivity(
    'notify',
    `Sent ${notificationType} notification to user`,
    { 
      notification_type: notificationType,
      timestamp: new Date().toISOString()
    },
    userEmail,
    undefined,
    adminEmail
  );
};

export const logReportStatusUpdate = async (
  reportId: string, 
  oldStatus: string, 
  newStatus: string, 
  adminEmail?: string
) => {
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
    adminEmail
  );
};

export const logUserAction = async (
  action: string,
  targetUserEmail: string,
  details: any = {},
  adminEmail?: string
) => {
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
    adminEmail
  );
};

export const logUserWarning = async (targetUserEmail: string, warningReason: string, adminEmail?: string) => {
  await logUserAction(
    'warn',
    targetUserEmail,
    { warning_reason: warningReason },
    adminEmail
  );
};

export const logUserSuspension = async (targetUserEmail: string, suspensionReason: string, adminEmail?: string) => {
  await logUserAction(
    'suspend',
    targetUserEmail,
    { suspension_reason: suspensionReason },
    adminEmail
  );
};

export const logUserBan = async (targetUserEmail: string, banReason: string, adminEmail?: string) => {
  await logUserAction(
    'ban',
    targetUserEmail,
    { ban_reason: banReason },
    adminEmail
  );
};

export const logUserActivation = async (targetUserEmail: string, adminEmail?: string) => {
  await logUserAction(
    'activate',
    targetUserEmail,
    {},
    adminEmail
  );
};

export const logSystemEvent = async (eventType: string, description: string, details: any = {}, adminEmail?: string) => {
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
    adminEmail
  );
};
