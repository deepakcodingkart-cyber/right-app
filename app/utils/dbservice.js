import prisma from "../db.server.js";

/**
 * Generic create function
 * @param {string} table - Prisma model name (e.g., "order_subscription_log", "user")
 * @param {object} data - Data to insert
 */
export async function createRecord(table, data) {
  try {
    return await prisma[table].create({ data });
  } catch (err) {
    console.error(`⚠️ Failed to create record in ${table}:`, err.message);
    throw err;
  }
}

/**
 * Generic update function
 * @param {string} table - Prisma model name
 * @param {string|number} id - Record ID to update
 * @param {object} data - Fields to update
 */
export async function updateRecord(table, id, data) {
  try {
    return await prisma[table].update({
      where: { id },
      data
    });
  } catch (err) {
    console.error(`⚠️ Failed to update record in ${table}:`, err.message);
    throw err;
  }
}
