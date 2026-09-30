import db from '../db/connection.js';

/**
 * Records an audit log entry for administrative events
 */
export function logAdminAction({
  adminId,
  adminName = 'Admin',
  action,
  entity,
  entityId,
  oldValue = null,
  newValue = null,
  ipAddress = '127.0.0.1'
}) {
  try {
    const oldStr = oldValue ? (typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue)) : null;
    const newStr = newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) : null;

    db.prepare(`
      INSERT INTO audit_logs (admin_id, admin_name, action, entity, entity_id, old_value, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminId || null,
      adminName,
      action,
      entity,
      String(entityId),
      oldStr,
      newStr,
      ipAddress
    );
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}
