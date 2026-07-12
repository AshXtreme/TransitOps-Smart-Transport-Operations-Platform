import { dbGetDrivers } from '../db/db';

export interface EmailLog {
  id: string;
  driverId: string;
  driverName: string;
  subject: string;
  body: string;
  sentTo: string;
  sentDate: string;
  isRead: boolean;
}

const KEYS = {
  EMAIL_LOGS: 'transitops_email_logs'
};

const SIMULATED_TODAY = '2026-07-12';

// Periodically runs on app start to check drivers and send warnings
export function checkAndSendLicenseReminders(): EmailLog[] {
  const drivers = dbGetDrivers();
  const currentLogsRaw = localStorage.getItem(KEYS.EMAIL_LOGS);
  const currentLogs: EmailLog[] = currentLogsRaw ? JSON.parse(currentLogsRaw) : [];
  let newLogsGenerated = false;

  drivers.forEach(driver => {
    // Determine expiry status
    const todayMs = new Date(SIMULATED_TODAY).getTime();
    const expiryMs = new Date(driver.expiryDate).getTime();
    const diffDays = Math.ceil((expiryMs - todayMs) / (1000 * 60 * 60 * 24));

    let triggerEmail = false;
    let subject = '';
    let body = '';

    // Condition 1: Expired CDL
    if (driver.expiryDate < SIMULATED_TODAY) {
      triggerEmail = true;
      subject = `[URGENT] CDL License Expired: ${driver.name}`;
      body = `Safety Compliance Alert:\n\nDriver ${driver.name} is operating with an EXPIRED CDL license.\nLicense Number: ${driver.licenseNumber}\nCategory: ${driver.licenseCategory}\nExpired On: ${driver.expiryDate}\n\nPlease update driver records or suspend active dispatches immediately.`;
    } 
    // Condition 2: Expiring within 30 days
    else if (diffDays <= 30 && diffDays >= 0) {
      triggerEmail = true;
      subject = `[WARN] CDL License Expiring Soon: ${driver.name}`;
      body = `Safety Compliance Notice:\n\nDriver ${driver.name}'s CDL license will expire in ${diffDays} days.\nLicense Number: ${driver.licenseNumber}\nCategory: ${driver.licenseCategory}\nExpiry Date: ${driver.expiryDate}\n\nPlease coordinate with the driver to renew credentials.`;
    }

    if (triggerEmail) {
      // Check if an email for this driver and subject has already been sent
      const alreadySent = currentLogs.some(
        log => log.driverId === driver.id && log.subject === subject
      );

      if (!alreadySent) {
        const newEmail: EmailLog = {
          id: 'eml-' + Math.random().toString(36).substr(2, 9),
          driverId: driver.id,
          driverName: driver.name,
          subject,
          body,
          sentTo: 'safety@transitops.com',
          sentDate: SIMULATED_TODAY,
          isRead: false
        };
        currentLogs.unshift(newEmail); // Add to the top
        newLogsGenerated = true;
      }
    }
  });

  if (newLogsGenerated) {
    localStorage.setItem(KEYS.EMAIL_LOGS, JSON.stringify(currentLogs));
  }

  return currentLogs;
}

export function getEmailLogs(): EmailLog[] {
  const data = localStorage.getItem(KEYS.EMAIL_LOGS);
  return data ? JSON.parse(data) : [];
}

export function markAllEmailsAsRead() {
  const logs = getEmailLogs();
  const updated = logs.map(l => ({ ...l, isRead: true }));
  localStorage.setItem(KEYS.EMAIL_LOGS, JSON.stringify(updated));
}

export function clearEmailLogs() {
  localStorage.setItem(KEYS.EMAIL_LOGS, JSON.stringify([]));
}
